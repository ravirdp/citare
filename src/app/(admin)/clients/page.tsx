import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { clients, dataSources, knowledgeGraphs, presenceDeployments, agencies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ClientsTable } from "./clients-table";
import { Suspense } from "react";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all agencies for name lookup
  const allAgencies = await db.select({ id: agencies.id, name: agencies.name }).from(agencies);
  const agencyMap: Record<string, string> = {};
  for (const a of allAgencies) {
    agencyMap[a.id] = a.name;
  }

  // Fetch all clients with their data sources, KG status, and presence status
  const allClients = await db.select().from(clients);

  const clientsWithSources = await Promise.all(
    allClients.map(async (client) => {
      const [sources, kgRows, presenceRows] = await Promise.all([
        db.select().from(dataSources).where(eq(dataSources.clientId, client.id)),
        db.select().from(knowledgeGraphs).where(eq(knowledgeGraphs.clientId, client.id)).limit(1),
        db.select().from(presenceDeployments).where(eq(presenceDeployments.clientId, client.id)),
      ]);

      const kg = kgRows[0] ?? null;

      return {
        ...client,
        agencyName: client.agencyId ? (agencyMap[client.agencyId] ?? "Unknown") : null,
        dataSources: sources.map((s) => ({
          id: s.id,
          sourceType: s.sourceType,
          status: s.status,
          lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
        })),
        knowledgeGraph: kg
          ? {
              version: kg.version,
              lastStrategistRun: kg.lastStrategistRun?.toISOString() ?? null,
            }
          : null,
        presenceFormats: presenceRows.map((p) => ({
          format: p.format,
          status: p.status,
          deploymentUrl: p.deploymentUrl,
          lastDeployedAt: p.lastDeployedAt?.toISOString() ?? null,
        })),
      };
    })
  );

  // Status counts
  const statusCounts = {
    onboarding: 0,
    active: 0,
    paused: 0,
    churned: 0,
  };
  for (const c of allClients) {
    const s = (c.status ?? "onboarding") as keyof typeof statusCounts;
    if (s in statusCounts) {
      statusCounts[s]++;
    }
  }

  return (
    <Suspense fallback={<div style={{ color: "var(--text-tertiary)", padding: 24 }}>Loading...</div>}>
      <div
        className="min-h-screen p-6"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1
                className="text-[length:var(--text-xl)] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Clients
              </h1>
              <p
                className="mt-1 text-[length:var(--text-sm)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Manage clients and their data source connections
              </p>
            </div>
          </div>

          {/* Status Summary Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                { label: "Onboarding", key: "onboarding" as const, color: "var(--status-blue)" },
                { label: "Active", key: "active" as const, color: "var(--status-green)" },
                { label: "Paused", key: "paused" as const, color: "var(--status-yellow)" },
                { label: "Churned", key: "churned" as const, color: "var(--status-red)" },
              ]
            ).map(({ label, key, color }) => (
              <div
                key={key}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    color: "var(--text-tertiary)",
                    fontSize: "var(--text-xs)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 28,
                    fontWeight: 700,
                    color,
                    lineHeight: 1.2,
                  }}
                >
                  {statusCounts[key]}
                </div>
              </div>
            ))}
          </div>

          <ClientsTable clients={clientsWithSources} />
        </div>
      </div>
    </Suspense>
  );
}
