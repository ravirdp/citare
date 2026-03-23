import { getAuthUser } from "@/lib/auth/user";
import { db } from "@/lib/db/client";
import { agencies, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AgenciesTable } from "./agencies-table";

export default async function AdminAgenciesPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Fetch all agencies
  const allAgencies = await db.select().from(agencies);

  // Count clients per agency
  const agenciesWithCounts = await Promise.all(
    allAgencies.map(async (agency) => {
      const agencyClients = await db
        .select()
        .from(clients)
        .where(eq(clients.agencyId, agency.id));

      return {
        id: agency.id,
        name: agency.name,
        slug: agency.slug,
        subscriptionTier: agency.subscriptionTier ?? "free",
        clientCount: agencyClients.length,
        createdAt: agency.createdAt?.toISOString() ?? null,
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
              Agencies
            </h1>
            <p
              className="mt-1 text-[length:var(--text-sm)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Manage agency accounts
            </p>
          </div>
        </div>

        <AgenciesTable agencies={agenciesWithCounts} />
      </div>
    </div>
  );
}
