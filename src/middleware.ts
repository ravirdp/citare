import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/callback", "/audit", "/about", "/contact"];
const PUBLIC_PREFIXES = ["/api/auth/", "/api/webhook/", "/presence/", "/audit/", "/api/audit/", "/auth/callback", "/api/contact/"];

// Admin-only paths (super_admin required)
const ADMIN_PATHS = ["/clients", "/agencies", "/health", "/costs"];
const ADMIN_API_PREFIX = "/api/admin/";

// Agency-only paths
const AGENCY_PREFIX = "/agency/";
const AGENCY_API_PREFIX = "/api/agency/";

// Role cookie for caching (15 min TTL)
const ROLE_COOKIE = "x-citare-role";
const ROLE_COOKIE_TTL = 15 * 60; // 15 minutes in seconds

type UserRole = "super_admin" | "agency_admin" | "agency_member" | "client";

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRoute(pathname: string): boolean {
  if (ADMIN_PATHS.includes(pathname)) return true;
  if (pathname.startsWith(ADMIN_API_PREFIX)) return true;
  return false;
}

function isAgencyRoute(pathname: string): boolean {
  if (pathname.startsWith(AGENCY_PREFIX)) return true;
  if (pathname.startsWith(AGENCY_API_PREFIX)) return true;
  return false;
}

function getDefaultPath(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "/clients";
    case "agency_admin":
    case "agency_member":
      return "/agency/clients";
    case "client":
    default:
      return "/overview";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let user = null;
  let supabaseResponse = NextResponse.next({ request });
  let supabase = null;

  try {
    const result = await updateSession(request);
    user = result.user;
    supabaseResponse = result.supabaseResponse;
    supabase = result.supabase;
  } catch {
    // If session refresh fails, treat as unauthenticated
  }

  // Public routes — allow through
  if (isPublicRoute(pathname)) {
    if ((pathname === "/login" || pathname === "/signup") && user) {
      // Redirect logged-in users to their default page
      const role = await resolveRole(request, user.id, supabase);
      const url = request.nextUrl.clone();
      url.pathname = getDefaultPath(role);
      const response = NextResponse.redirect(url);
      setRoleCookie(response, role);
      return response;
    }
    return supabaseResponse;
  }

  // Protected routes — redirect to login if not authenticated
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Resolve user role
  const role = await resolveRole(request, user.id, supabase);

  // Admin route protection
  if (isAdminRoute(pathname) && role !== "super_admin") {
    const url = request.nextUrl.clone();
    url.pathname = getDefaultPath(role);
    return NextResponse.redirect(url);
  }

  // Agency route protection
  if (isAgencyRoute(pathname) && role !== "agency_admin" && role !== "agency_member") {
    const url = request.nextUrl.clone();
    url.pathname = getDefaultPath(role);
    return NextResponse.redirect(url);
  }

  // Set role cookie on response for caching
  setRoleCookie(supabaseResponse, role);
  return supabaseResponse;
}

/**
 * Resolve user role — check cookie first, fall back to DB query.
 */
async function resolveRole(
  request: NextRequest,
  authUid: string,
  supabase: ReturnType<typeof import("@supabase/ssr").createServerClient> | null
): Promise<UserRole> {
  // Check cached role cookie first
  const cachedRole = request.cookies.get(ROLE_COOKIE)?.value;
  if (cachedRole && ["super_admin", "agency_admin", "agency_member", "client"].includes(cachedRole)) {
    return cachedRole as UserRole;
  }

  // Fall back to DB query via Supabase PostgREST (Edge Runtime compatible)
  if (supabase) {
    try {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("auth_provider_id", authUid)
        .single();

      if (data?.role) {
        return data.role as UserRole;
      }
    } catch {
      // DB query failed — default to client
    }
  }

  return "client";
}

function setRoleCookie(response: NextResponse, role: UserRole): void {
  response.cookies.set(ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ROLE_COOKIE_TTL,
    path: "/",
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
