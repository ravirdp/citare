import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db/client";
import { users, clients, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/overview";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Create Supabase client with cookie handling
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange the code for a session
  const { data: sessionData, error: sessionError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const authUser = sessionData.user;

  // Check if user exists in our users table
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.authProviderId, authUser.id))
    .limit(1);

  if (existingUser) {
    // Existing user — redirect based on role
    let destination = "/overview";
    switch (existingUser.role) {
      case "super_admin":
        destination = "/clients";
        break;
      case "agency_admin":
      case "agency_member":
        destination = "/agency/clients";
        break;
      case "client":
      default:
        destination = "/overview";
    }

    // Build redirect response preserving cookies
    const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // New user — create users row + client record, then redirect to onboarding
  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  // Generate a unique slug from the name
  const baseSlug = (fullName as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  // Create the client record first
  const [newClient] = await db
    .insert(clients)
    .values({
      name: fullName as string,
      slug,
      businessType: "physical",
      status: "onboarding",
    })
    .returning({ id: clients.id });

  // Create the user row linked to the new client
  await db.insert(users).values({
    email: authUser.email!,
    name: fullName,
    role: "client",
    authProviderId: authUser.id,
    clientId: newClient.id,
  });

  // Create trial subscription
  await db.insert(subscriptions).values({
    clientId: newClient.id,
    plan: "trial",
    status: "trialing",
    monitoringFrequency: "every_3_days",
    monthlyFeeInr: 0,
    trialEnd: new Date(Date.now() + 7 * 86400 * 1000),
  });

  const onboardingUrl = redirect === "/overview" ? "/select-plan" : redirect;
  const redirectResponse = NextResponse.redirect(`${origin}${onboardingUrl}`);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}
