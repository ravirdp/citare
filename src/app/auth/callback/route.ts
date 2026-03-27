import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
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

  // New user — create users row and redirect to onboarding
  const fullName =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.email?.split("@")[0] ||
    "User";

  await db.insert(users).values({
    email: authUser.email!,
    name: fullName,
    role: "client",
    authProviderId: authUser.id,
  });

  const onboardingUrl = redirect === "/overview" ? "/onboarding" : redirect;
  const redirectResponse = NextResponse.redirect(`${origin}${onboardingUrl}`);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}
