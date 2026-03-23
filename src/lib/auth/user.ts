import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { users, agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "super_admin" | "agency_admin" | "agency_member" | "client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  agencyId: string | null;
  clientId: string | null;
  authProviderId: string;
}

export interface AuthUserWithAgency extends AuthUser {
  agency: {
    id: string;
    name: string;
    slug: string;
    branding: Record<string, unknown>;
  } | null;
}

/**
 * Get the authenticated user with their application role.
 * Bridges Supabase Auth (auth UID) → users table (role, agencyId, clientId).
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const [appUser] = await db
    .select()
    .from(users)
    .where(eq(users.authProviderId, authUser.id))
    .limit(1);

  if (!appUser) return null;

  return {
    id: appUser.id,
    email: appUser.email,
    name: appUser.name,
    role: appUser.role as UserRole,
    agencyId: appUser.agencyId,
    clientId: appUser.clientId,
    authProviderId: appUser.authProviderId ?? "",
  };
}

/**
 * Get auth user with their agency details (for branding).
 */
export async function getAuthUserWithAgency(): Promise<AuthUserWithAgency | null> {
  const user = await getAuthUser();
  if (!user) return null;

  let agency: AuthUserWithAgency["agency"] = null;

  if (user.agencyId) {
    const [agencyRow] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, user.agencyId))
      .limit(1);

    if (agencyRow) {
      agency = {
        id: agencyRow.id,
        name: agencyRow.name,
        slug: agencyRow.slug,
        branding: (agencyRow.branding ?? {}) as Record<string, unknown>,
      };
    }
  }

  return { ...user, agency };
}

/**
 * Require authentication. Returns the user or redirects.
 * For use in server components / API routes.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require specific roles. Returns the user or throws 403.
 * For use in API routes.
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return user;
}
