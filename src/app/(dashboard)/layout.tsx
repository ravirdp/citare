import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthUserWithAgency } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { clients, agencies } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TrialBanner } from "@/components/dashboard/trial-banner";

// Agency branding shape passed to client components
export interface ClientAgencyBranding {
  name: string;
  accent?: string;
  logo?: string;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await getAuthUserWithAgency();

  if (!authUser) redirect("/login");

  // Filter clients by role — include agencyId for branding lookup
  let clientRows: Array<{
    id: string;
    name: string;
    slug: string;
    agencyId: string | null;
  }>;

  if (authUser.role === "super_admin") {
    const allClients = await db.select().from(clients);
    clientRows = allClients.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      agencyId: c.agencyId,
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
      clientRows = agencyClients.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        agencyId: c.agencyId,
      }));
    } else {
      clientRows = [];
    }
  } else if (authUser.role === "client") {
    if (authUser.clientId) {
      const rows = await db
        .select()
        .from(clients)
        .where(eq(clients.id, authUser.clientId));
      clientRows = rows.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        agencyId: c.agencyId,
      }));
    } else {
      clientRows = [];
    }
  } else {
    clientRows = [];
  }

  const clientList = clientRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  // Build client → agency branding map by fetching unique agencies
  const clientAgencyMap: Record<string, ClientAgencyBranding> = {};
  const uniqueAgencyIds = [
    ...new Set(clientRows.map((c) => c.agencyId).filter(Boolean)),
  ] as string[];

  if (uniqueAgencyIds.length > 0) {
    const agencyRows = await db
      .select()
      .from(agencies)
      .where(inArray(agencies.id, uniqueAgencyIds));

    const agencyById = new Map(agencyRows.map((a) => [a.id, a]));

    for (const c of clientRows) {
      if (c.agencyId) {
        const agency = agencyById.get(c.agencyId);
        if (agency) {
          const branding = agency.branding as Record<string, unknown> | null;
          const accent = branding?.accent_color as string | undefined;
          clientAgencyMap[c.id] = {
            name: agency.name,
            accent:
              accent && /^#[0-9a-fA-F]{6}$/.test(accent)
                ? accent
                : undefined,
            logo: (branding?.logo_url as string) || undefined,
          };
        }
      }
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      <Sidebar
        clients={clientList}
        clientAgencyMap={clientAgencyMap}
      />
      <main style={{ flex: 1, marginLeft: 240, padding: 24 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <Suspense fallback={null}>
            <TrialBanner />
          </Suspense>
          {children}
        </div>
      </main>
    </div>
  );
}
