import { redirect } from "next/navigation";
import { getAuthUserWithAgency } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { clients } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AgencyClientsTable } from "./agency-clients-table";

export default async function AgencyClientsPage() {
  const user = await getAuthUserWithAgency();

  if (!user || (user.role !== "agency_admin" && user.role !== "agency_member")) {
    redirect("/overview");
  }

  if (!user.agencyId) {
    redirect("/overview");
  }

  const agencyClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      slug: clients.slug,
      businessType: clients.businessType,
      status: clients.status,
      dataSourceCount: sql<number>`(
        SELECT COUNT(*)::int FROM data_sources WHERE data_sources.client_id = ${clients.id}
      )`,
      kgVersion: sql<number | null>`(
        SELECT version FROM knowledge_graphs WHERE knowledge_graphs.client_id = ${clients.id} LIMIT 1
      )`,
      visibilityScore: sql<string | null>`(
        SELECT overall_score FROM visibility_scores WHERE visibility_scores.client_id = ${clients.id} ORDER BY date DESC LIMIT 1
      )`,
    })
    .from(clients)
    .where(eq(clients.agencyId, user.agencyId))
    .orderBy(desc(clients.createdAt));

  const clientList = agencyClients.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    businessType: c.businessType,
    status: c.status ?? "onboarding",
    dataSourceCount: c.dataSourceCount,
    kgVersion: c.kgVersion,
    visibilityScore: c.visibilityScore,
  }));

  return (
    <div>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Clients
      </h1>
      <AgencyClientsTable clients={clientList} />
    </div>
  );
}
