import { redirect } from "next/navigation";
import { getAuthUserWithAgency } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUserWithAgency();

  if (!authUser) redirect("/login");

  // Filter clients by role
  let clientList: Array<{ id: string; name: string; slug: string }>;

  if (authUser.role === "super_admin") {
    const allClients = await db.select().from(clients);
    clientList = allClients.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
  } else if (
    authUser.role === "agency_admin" ||
    authUser.role === "agency_member"
  ) {
    if (authUser.agencyId) {
      const agencyClients = await db
        .select()
        .from(clients)
        .where(eq(clients.agencyId, authUser.agencyId));
      clientList = agencyClients.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));
    } else {
      clientList = [];
    }
  } else if (authUser.role === "client") {
    if (authUser.clientId) {
      const clientRows = await db
        .select()
        .from(clients)
        .where(eq(clients.id, authUser.clientId));
      clientList = clientRows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }));
    } else {
      clientList = [];
    }
  } else {
    clientList = [];
  }

  // Extract agency branding
  const agencyName = authUser.agency?.name;
  const agencyBranding = authUser.agency?.branding as Record<string, unknown> | undefined;
  const accentColor = agencyBranding?.accent_color as string | undefined;
  const agencyLogoUrl = agencyBranding?.logo_url as string | undefined;

  // Validate accent color format
  const validAccentColor =
    accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor)
      ? accentColor
      : undefined;

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {validAccentColor && (
        <style>{`:root { --accent-primary: ${validAccentColor}; --accent-hover: ${validAccentColor}; }`}</style>
      )}
      <Sidebar
        clients={clientList}
        agencyName={agencyName}
        agencyLogoUrl={agencyLogoUrl}
      />
      <main style={{ flex: 1, marginLeft: 240, padding: 24 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
