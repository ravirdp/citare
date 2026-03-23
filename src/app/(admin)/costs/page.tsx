"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent } from "@/components/ui/card";

interface CostsData {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  byClient: Array<{
    clientId: string | null;
    clientName: string | null;
    provider: string;
    total: string;
    count: number;
  }>;
}

function formatInr(amount: number): string {
  if (amount === 0) return "\u20B90.00";
  return `\u20B9${amount.toFixed(2)}`;
}

function CostsContent() {
  const { data, isLoading } = useQuery<CostsData>({
    queryKey: ["admin-costs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/costs");
      if (!res.ok) throw new Error("Failed to fetch costs");
      return res.json();
    },
  });

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1
            className="text-[length:var(--text-xl)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            API Costs
          </h1>
          <p
            className="mt-1 text-[length:var(--text-sm)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            AI and external API usage costs across all clients
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            label="Today"
            value={isLoading ? "..." : formatInr(data?.totalToday ?? 0)}
          />
          <MetricCard
            label="This Week"
            value={isLoading ? "..." : formatInr(data?.totalWeek ?? 0)}
          />
          <MetricCard
            label="This Month"
            value={isLoading ? "..." : formatInr(data?.totalMonth ?? 0)}
          />
        </div>

        {/* Per-Client Breakdown */}
        <Card
          className="border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <span style={{ color: "var(--text-tertiary)" }}>
                  Loading...
                </span>
              </div>
            ) : !data?.byClient || data.byClient.length === 0 ? (
              <div className="p-8 text-center">
                <p
                  className="text-[length:var(--text-sm)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No cost data yet. Costs will appear here once AI operations
                  are run.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <th
                      className="px-4 py-3 text-left text-[length:var(--text-xs)] font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Client
                    </th>
                    <th
                      className="px-4 py-3 text-left text-[length:var(--text-xs)] font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Provider
                    </th>
                    <th
                      className="px-4 py-3 text-right text-[length:var(--text-xs)] font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Calls
                    </th>
                    <th
                      className="px-4 py-3 text-right text-[length:var(--text-xs)] font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.byClient.map((row, i) => (
                    <tr
                      key={`${row.clientId}-${row.provider}-${i}`}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <td
                        className="px-4 py-3 text-[length:var(--text-sm)]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {row.clientName ?? "System"}
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-[length:var(--text-sm)]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {row.provider}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono text-[length:var(--text-sm)]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {row.count}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-mono text-[length:var(--text-sm)]"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatInr(parseFloat(row.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CostsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "var(--bg-primary)" }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>Loading...</span>
        </div>
      }
    >
      <CostsContent />
    </Suspense>
  );
}
