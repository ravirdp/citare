"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientId } from "@/components/dashboard/client-selector";
import { CompetitorTable } from "@/components/dashboard/competitor-table";
import { Badge } from "@/components/ui/badge";

interface Competitor {
  name: string;
  totalMentions: number;
  avgPosition: number;
  platformBreakdown: Record<string, number>;
}

interface KGCompetitor {
  name: string;
  source: string;
  services: string[];
  products: string[];
  strengths: string[];
  weaknesses: string[];
}

function KGBanner() {
  return (
    <div style={{
      background: "var(--bg-tertiary, var(--bg-secondary))",
      border: "1px solid var(--accent-primary)",
      borderRadius: "var(--radius-lg)",
      padding: "12px 16px",
      marginBottom: 16,
      color: "var(--text-secondary)",
      fontSize: "var(--text-sm)",
    }}>
      Monitoring has not run yet. Competitors below are from your knowledge graph. Run monitoring to see AI platform mention data.
    </div>
  );
}

function CompetitorsContent() {
  const clientId = useClientId();

  const { data, isLoading, error } = useQuery<Competitor[]>({
    queryKey: ["competitors", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${clientId}/competitors`);
      if (!res.ok) throw new Error("Failed to fetch competitors");
      const json = await res.json();
      const competitors = json.competitors ?? json;
      return Array.isArray(competitors) ? competitors : [];
    },
    enabled: !!clientId,
  });

  const { data: kgCompetitors, isLoading: kgLoading } = useQuery<KGCompetitor[]>({
    queryKey: ["kg-competitors", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/kg/${clientId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.competitors) ? json.competitors : [];
    },
    enabled: !!clientId && !isLoading && (!data || data.length === 0),
  });

  if (!clientId) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Select a client to view competitors.
      </div>
    );
  }

  if (isLoading || kgLoading) {
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

  const hasMonitoringData = data && data.length > 0;
  const kgList = kgCompetitors ?? [];
  const hasKgData = kgList.length > 0;

  if (!hasMonitoringData && !hasKgData) {
    return (
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        No competitor data yet.
      </div>
    );
  }

  if (!hasMonitoringData && hasKgData) {
    return (
      <>
        <KGBanner />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {kgList.map((comp) => (
            <div
              key={comp.name}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                transition: "border-color 200ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ color: "var(--text-primary)", fontSize: "var(--text-md)", fontWeight: 600 }}>
                  {comp.name}
                </span>
                <Badge variant="outline">{comp.source || "competitor"}</Badge>
              </div>
              {comp.services.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>Services: </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                    {comp.services.join(", ")}
                  </span>
                </div>
              )}
              {comp.strengths.length > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>Strengths: </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                    {comp.strengths.join(", ")}
                  </span>
                </div>
              )}
              {comp.weaknesses.length > 0 && (
                <div>
                  <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>Weaknesses: </span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
                    {comp.weaknesses.join(", ")}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 24 }}>
      <CompetitorTable competitors={data!} />
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
