"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientId } from "@/components/dashboard/client-selector";
import { CompetitorTable } from "@/components/dashboard/competitor-table";

interface Competitor {
  name: string;
  totalMentions: number;
  avgPosition: number;
  platformBreakdown: Record<string, number>;
}

function CompetitorsContent() {
  const clientId = useClientId();

  const { data, isLoading, error } = useQuery<Competitor[]>({
    queryKey: ["competitors", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${clientId}/competitors`);
      if (!res.ok) throw new Error("Failed to fetch competitors");
      return res.json();
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Select a client to view competitors.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "var(--status-red)", fontSize: "var(--text-sm)", padding: 40 }}>
        Failed to load competitor data.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        No competitor data yet.
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 24 }}>
      <CompetitorTable competitors={data} />
    </div>
  );
}

export default function CompetitorsPage() {
  return (
    <div>
      <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
        Competitors
      </h1>
      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", marginBottom: 24 }}>
        AI platform competitor analysis
      </p>
      <Suspense fallback={<div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", padding: 40, textAlign: "center" }}>Loading...</div>}>
        <CompetitorsContent />
      </Suspense>
    </div>
  );
}
