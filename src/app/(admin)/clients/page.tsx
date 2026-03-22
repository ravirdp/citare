import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { clients, dataSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ClientsTable } from "./clients-table";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch all clients with their data sources
  const allClients = await db.select().from(clients);

  const clientsWithSources = await Promise.all(
    allClients.map(async (client) => {
      const sources = await db
        .select()
        .from(dataSources)
        .where(eq(dataSources.clientId, client.id));

      return {
        ...client,
        dataSources: sources.map((s) => ({
          id: s.id,
          sourceType: s.sourceType,
          status: s.status,
          lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
        })),
      };
    })
  );

  return (
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

        <ClientsTable clients={clientsWithSources} />
      </div>
    </div>
  );
}
