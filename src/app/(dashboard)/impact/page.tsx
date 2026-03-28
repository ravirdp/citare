"use client";

import { Suspense } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SignalCard } from "@/components/dashboard/signal-card";

interface ImpactData {
  compositeScore: number;
  monthlyTouchpoints: number;
  equivalentAdSpendInr: number;
  signalBreakdown: Array<{
    signal: string;
    weight: number;
    value: number;
    available: boolean;
  }>;
  correlations: Array<{
    signalPair: string;
    correlationCoefficient: number;
    timelagDays: number;
    dataPoints: number;
    significance: string;
  }>;
  confidence: string;
  dataStatus: string;
}

function ImpactContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";

  const { data, isLoading, refetch } = useQuery<ImpactData>({
    queryKey: ["attribution", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${clientId}/attribution`);
      if (!res.ok) throw new Error("Failed to fetch attribution");
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: brandData } = useQuery<{ overallScore: number; platformBreakdown: Array<{ platform: string; mentionCount: number }> }>({
    queryKey: ["brand-mentions", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/analysis/${clientId}/brand-mentions`);
      if (!res.ok) return { overallScore: 0, platformBreakdown: [] };
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: auditTrends } = useQuery<{
    trends: Array<{ date: string; citability: number; brandAuthority: number; crawlerStatus: string }>;
    latest: { citability: number; brandAuthority: number; crawlerStatus: string } | null;
    dataPoints: number;
  }>({
    queryKey: ["audit-trends", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${clientId}/audit-trends`);
      if (!res.ok) return { trends: [], latest: null, dataPoints: 0 };
      return res.json();
    },
    enabled: !!clientId,
  });

  const computeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/dashboard/${clientId}/attribution/compute`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to compute");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  if (!clientId) {
    return (
      <p style={{ color: "var(--text-tertiary)" }}>
        Select a client to view impact score.
      </p>
    );
  }

  const hasWeakCorrelations =
    !data?.correlations?.length ||
    data.correlations.every(
      (c) => c.significance === "insufficient_data" || c.significance === "weak"
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-[length:var(--text-xl)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            AI Search Impact
          </h1>
          <p
            className="mt-1 text-[length:var(--text-sm)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {data?.dataStatus ?? "Quantified ROI of AI search visibility"}
          </p>
        </div>
        <Button
          onClick={() => computeMutation.mutate()}
          disabled={computeMutation.isPending}
          style={{ background: "var(--accent-primary)", color: "#fff" }}
        >
          {computeMutation.isPending ? "Computing..." : "Compute"}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Top metrics */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="AI Search Impact Score"
              value={`${data.compositeScore}/100`}
              trend={{ direction: data.confidence === "high" ? "up" : "flat", percent: 0 }}
            />
            <MetricCard
              label="Monthly Touchpoints"
              value={String(data.monthlyTouchpoints)}
              trend={{ direction: "flat", percent: 0 }}
            />
            <MetricCard
              label="AI Visibility Value"
              value={`₹${data.equivalentAdSpendInr.toLocaleString("en-IN")}`}
              trend={{ direction: "flat", percent: 0 }}
            />
          </div>

          {/* Signal breakdown */}
          <h2
            className="mb-4 text-[length:var(--text-md)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Attribution Signals
          </h2>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.signalBreakdown.map((s) => (
              <SignalCard
                key={s.signal}
                signal={s.signal}
                value={s.value}
                weight={s.weight}
                available={s.available}
              />
            ))}
            <SignalCard
              signal="Brand Authority"
              value={brandData?.overallScore ?? 0}
              weight={20}
              available={!!brandData && brandData.overallScore > 0}
            />
          </div>

          {/* Audit Metric Trends */}
          {auditTrends && auditTrends.dataPoints > 0 && (
            <>
              <h2
                className="mb-4 text-[length:var(--text-md)] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Audit Metric Trends
              </h2>
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Citability Trend */}
                <Card
                  className="border"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
                >
                  <CardContent className="p-4">
                    <div
                      className="mb-2 text-[length:var(--text-xs)] uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Citability Score
                    </div>
                    <div className="flex items-end gap-2">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {auditTrends.latest?.citability ?? 0}
                      </span>
                      <span
                        className="mb-1 text-[length:var(--text-xs)]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        / 100
                      </span>
                    </div>
                    {auditTrends.trends.length >= 2 && (
                      <div className="mt-3 flex items-end gap-1" style={{ height: 32 }}>
                        {auditTrends.trends.slice(-10).map((t, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: `${Math.max(4, t.citability * 0.32)}px`,
                              background: "var(--accent-primary)",
                              borderRadius: 2,
                              opacity: 0.4 + (i / Math.max(auditTrends.trends.length - 1, 1)) * 0.6,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Brand Authority Trend */}
                <Card
                  className="border"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
                >
                  <CardContent className="p-4">
                    <div
                      className="mb-2 text-[length:var(--text-xs)] uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Brand Authority
                    </div>
                    <div className="flex items-end gap-2">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {auditTrends.latest?.brandAuthority ?? 0}
                      </span>
                      <span
                        className="mb-1 text-[length:var(--text-xs)]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        / 100
                      </span>
                    </div>
                    {auditTrends.trends.length >= 2 && (
                      <div className="mt-3 flex items-end gap-1" style={{ height: 32 }}>
                        {auditTrends.trends.slice(-10).map((t, i) => (
                          <div
                            key={i}
                            style={{
                              flex: 1,
                              height: `${Math.max(4, t.brandAuthority * 0.32)}px`,
                              background: "#8b5cf6",
                              borderRadius: 2,
                              opacity: 0.4 + (i / Math.max(auditTrends.trends.length - 1, 1)) * 0.6,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Crawler Access Status */}
                <Card
                  className="border"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
                >
                  <CardContent className="p-4">
                    <div
                      className="mb-2 text-[length:var(--text-xs)] uppercase tracking-wider"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      AI Crawler Access
                    </div>
                    <div
                      className="text-2xl font-bold"
                      style={{
                        color:
                          auditTrends.latest?.crawlerStatus === "all_allowed"
                            ? "var(--status-green)"
                            : auditTrends.latest?.crawlerStatus === "some_blocked"
                              ? "var(--status-yellow)"
                              : auditTrends.latest?.crawlerStatus === "critical_blocked"
                                ? "var(--status-red)"
                                : "var(--text-tertiary)",
                      }}
                    >
                      {auditTrends.latest?.crawlerStatus === "all_allowed"
                        ? "Open"
                        : auditTrends.latest?.crawlerStatus === "some_blocked"
                          ? "Partial"
                          : auditTrends.latest?.crawlerStatus === "critical_blocked"
                            ? "Blocked"
                            : "N/A"}
                    </div>
                    <div
                      className="mt-1 text-[length:var(--text-xs)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {auditTrends.dataPoints} measurement{auditTrends.dataPoints !== 1 ? "s" : ""} recorded
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Correlations */}
          <h2
            className="mb-4 text-[length:var(--text-md)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Signal Correlations
          </h2>
          {hasWeakCorrelations ? (
            <Card
              className="border"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <CardContent className="p-6 text-center">
                <p
                  className="text-[length:var(--text-sm)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {data.dataStatus}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.correlations
                .filter((c) => c.significance !== "insufficient_data")
                .map((c) => (
                  <Card
                    key={c.signalPair}
                    className="border"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <span
                          className="text-[length:var(--text-sm)] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.signalPair.replace("-", " → ")}
                        </span>
                        <span
                          className="ml-2 text-[length:var(--text-xs)]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {c.dataPoints} data points
                          {c.timelagDays > 0 ? `, ${c.timelagDays}d lag` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-[length:var(--text-sm)] font-bold"
                          style={{
                            color:
                              c.significance === "strong"
                                ? "var(--status-green)"
                                : c.significance === "moderate"
                                  ? "var(--accent-primary)"
                                  : "var(--text-tertiary)",
                          }}
                        >
                          r={c.correlationCoefficient}
                        </span>
                        <span
                          className="rounded px-2 py-0.5 text-[length:var(--text-xs)]"
                          style={{
                            background: "var(--bg-tertiary)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {c.significance}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function ImpactPage() {
  return (
    <Suspense
      fallback={
        <div style={{ color: "var(--text-tertiary)" }}>Loading...</div>
      }
    >
      <ImpactContent />
    </Suspense>
  );
}
