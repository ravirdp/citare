"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientId } from "@/components/dashboard/client-selector";
import { VisibilityRing } from "@/components/dashboard/visibility-ring";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PlatformBar } from "@/components/dashboard/platform-bar";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CompetitorTable } from "@/components/dashboard/competitor-table";

interface OverviewData {
  visibilityScore: number;
  queriesMonitored: number;
  aiSearchValueInr: number;
  competitorsTracked: number;
  platformBreakdown: Record<string, number>;
  trendData: Array<{ date: string; score: number }>;
  competitors: Array<{
    name: string;
    totalMentions: number;
    avgPosition: number;
    platformBreakdown: Record<string, number>;
  }>;
}

function formatIndianNumber(num: number | null | undefined): string {
  if (num == null || isNaN(num)) return "0";
  const str = num.toString();
  if (str.length <= 3) return str;
  let lastThree = str.slice(-3);
  const rest = str.slice(0, -3);
  if (rest.length > 0) {
    lastThree = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }
  return lastThree;
}

function OverviewContent() {
  const clientId = useClientId();

  const { data, isLoading, error } = useQuery<OverviewData>({
    queryKey: ["overview", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/dashboard/${clientId}/overview`);
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: citabilityData } = useQuery<{ overallCitabilityScore: number }>({
    queryKey: ["citability", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/presence/${clientId}/citability`);
      if (!res.ok) return { overallCitabilityScore: 0 };
      return res.json();
    },
    enabled: !!clientId,
  });

  const { data: crawlerData } = useQuery<{ overallStatus: string }>({
    queryKey: ["crawler-access", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const res = await fetch(`/api/analysis/${clientId}/crawler-access`);
      if (!res.ok) return { overallStatus: "unknown" };
      return res.json();
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Select a client to view the overview.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        style={{
          color: "var(--text-tertiary)",
          fontSize: "var(--text-sm)",
          padding: 40,
          textAlign: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          color: "var(--status-red)",
          fontSize: "var(--text-sm)",
          padding: 40,
        }}
      >
        Failed to load overview data.
      </div>
    );
  }

  const isEmpty =
    !data ||
    ((data.visibilityScore ?? 0) === 0 &&
      (data.queriesMonitored ?? 0) === 0 &&
      (data.aiSearchValueInr ?? 0) === 0);

  if (isEmpty) {
    return (
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: 40,
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: "var(--text-sm)",
        }}
      >
        No data yet. Connect data sources and run monitoring to see results.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top row: 4 metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <VisibilityRing score={data.visibilityScore ?? 0} />
        </div>
        <MetricCard label="Queries Monitored" value={data.queriesMonitored ?? 0} />
        <MetricCard
          label="AI Search Value"
          value={`\u20B9${formatIndianNumber(data.aiSearchValueInr)}`}
          valueColor="var(--accent-primary)"
        />
        <MetricCard
          label="Competitors Tracked"
          value={data.competitorsTracked ?? 0}
        />
        <MetricCard
          label="Citability Score"
          value={citabilityData?.overallCitabilityScore ?? 0}
          valueColor={
            (citabilityData?.overallCitabilityScore ?? 0) >= 65
              ? "var(--status-green)"
              : (citabilityData?.overallCitabilityScore ?? 0) >= 50
                ? "var(--status-yellow)"
                : "var(--status-red)"
          }
        />
        <MetricCard
          label="AI Crawler Access"
          value={
            crawlerData?.overallStatus === "all_allowed"
              ? "Open"
              : crawlerData?.overallStatus === "some_blocked"
                ? "Partial"
                : crawlerData?.overallStatus === "critical_blocked"
                  ? "Blocked"
                  : "N/A"
          }
          valueColor={
            crawlerData?.overallStatus === "all_allowed"
              ? "var(--status-green)"
              : crawlerData?.overallStatus === "some_blocked"
                ? "var(--status-yellow)"
                : crawlerData?.overallStatus === "critical_blocked"
                  ? "var(--status-red)"
                  : "var(--text-tertiary)"
          }
        />
      </div>

      {/* Middle row: 2 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <h3
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            Platform Breakdown
          </h3>
          <PlatformBar scores={data.platformBreakdown ?? {}} />
        </div>
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
          }}
        >
          <h3
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              marginBottom: 16,
            }}
          >
            Visibility Trend
          </h3>
          <TrendChart data={data.trendData ?? []} />
        </div>
      </div>

      {/* Bottom: Competitor table */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
        }}
      >
        <h3
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-sm)",
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          Competitor Comparison
        </h3>
        <CompetitorTable competitors={data.competitors ?? []} />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <div>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Overview
      </h1>
      <Suspense
        fallback={
          <div
            style={{
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
              padding: 40,
              textAlign: "center",
            }}
          >
            Loading...
          </div>
        }
      >
        <OverviewContent />
      </Suspense>
    </div>
  );
}
