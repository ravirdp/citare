"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";

interface ReportData {
  clientName: string;
  month: string;
  generatedAt: string;
  summary: {
    averageVisibility: number;
    peakVisibility: number;
    totalQueries: number;
    adEquivalentValueInr: number;
  };
  trend: Array<{ date: string; score: number }>;
  topCompetitors: Array<{ name: string; totalMentions: number; avgPosition: number }>;
  recommendationsSummary: {
    total: number;
    applied: number;
    pending: number;
    rejected: number;
  };
  highlights: string[];
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(currentMonth);

  const { data: report, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ["report", clientId, month],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${clientId}/${month}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <p style={{ color: "var(--text-tertiary)" }}>
        Select a client to view reports.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-[length:var(--text-xl)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Monthly Report
          </h1>
          <p
            className="mt-1 text-[length:var(--text-sm)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {report?.clientName ?? "Loading..."} — {month}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border px-3 py-1.5 text-[length:var(--text-sm)]"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
          <Button
            onClick={() => refetch()}
            style={{ background: "var(--accent-primary)", color: "#fff" }}
          >
            Generate
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            />
          ))}
        </div>
      ) : report ? (
        <>
          {/* Summary metrics */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <MetricCard
              label="Avg Visibility"
              value={`${report.summary.averageVisibility}/100`}
            />
            <MetricCard
              label="Peak Score"
              value={`${report.summary.peakVisibility}/100`}
            />
            <MetricCard
              label="Queries Run"
              value={String(report.summary.totalQueries)}
            />
            <MetricCard
              label="Ad Value"
              value={`₹${report.summary.adEquivalentValueInr.toLocaleString("en-IN")}`}
            />
          </div>

          {/* Highlights */}
          {report.highlights.length > 0 && (
            <Card
              className="mb-6 border"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <CardHeader>
                <h2
                  className="text-[length:var(--text-md)] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Highlights
                </h2>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="text-[length:var(--text-sm)]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations summary */}
          <Card
            className="mb-6 border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <CardHeader>
              <h2
                className="text-[length:var(--text-md)] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Recommendations
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                {(
                  [
                    ["Total", report.recommendationsSummary.total],
                    ["Applied", report.recommendationsSummary.applied],
                    ["Pending", report.recommendationsSummary.pending],
                    ["Rejected", report.recommendationsSummary.rejected],
                  ] as const
                ).map(([label, val]) => (
                  <div key={label}>
                    <div
                      className="font-mono text-[length:var(--text-lg)] font-bold"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {val}
                    </div>
                    <div
                      className="text-[length:var(--text-xs)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitors */}
          {report.topCompetitors.length > 0 && (
            <Card
              className="border"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <CardHeader>
                <h2
                  className="text-[length:var(--text-md)] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Top Competitors
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.topCompetitors.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between rounded-lg p-3"
                      style={{ background: "var(--bg-tertiary)" }}
                    >
                      <span
                        className="text-[length:var(--text-sm)] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.name}
                      </span>
                      <span
                        className="font-mono text-[length:var(--text-sm)]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {c.totalMentions} mentions · avg pos {c.avgPosition}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ color: "var(--text-tertiary)" }}>Loading...</div>
      }
    >
      <ReportsContent />
    </Suspense>
  );
}
