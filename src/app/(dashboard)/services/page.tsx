"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientId } from "@/components/dashboard/client-selector";
import { Badge } from "@/components/ui/badge";

interface PlatformScore {
  platform: string;
  score: number;
}

interface ServiceItem {
  id: string;
  name: string;
  type: "service" | "product";
  visibilityScore: number;
  platformScores: PlatformScore[];
}

const PLATFORM_COLORS: Record<string, string> = {
  chatgpt: "var(--platform-chatgpt, #10a37f)",
  perplexity: "var(--platform-perplexity, #6366f1)",
  gemini: "var(--platform-gemini, #4285f4)",
  claude: "var(--platform-claude, #d97706)",
  aio: "var(--platform-aio, #ea4335)",
};

function scoreColor(score: number): string {
  if (score >= 70) return "var(--score-high, var(--status-green))";
  if (score >= 40) return "var(--score-medium, var(--status-yellow))";
  return "var(--score-low, var(--status-red))";
}

function ServicesContent() {
  const clientId = useClientId();

  const { data, isLoading, error } = useQuery<ServiceItem[]>({
    queryKey: ["items", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/${clientId}/items`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Select a client to view services.
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
        Failed to load service data.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        No monitoring data yet. Run monitoring first.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {data.map((item) => (
        <div key={item.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <span style={{ color: "var(--text-primary)", fontSize: "var(--text-md)", fontWeight: 600 }}>
              {item.name}
            </span>
            <Badge variant="outline">{item.type}</Badge>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 24, fontWeight: 700, color: scoreColor(item.visibilityScore), marginBottom: 12 }}>
            {item.visibilityScore}
          </div>
          <div className="flex flex-wrap gap-2">
            {item.platformScores.map((ps) => (
              <div key={ps.platform} className="flex items-center gap-1">
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: PLATFORM_COLORS[ps.platform] ?? "var(--text-tertiary)", display: "inline-block" }} />
                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                  {ps.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div>
      <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
        Services & Products
      </h1>
      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", marginBottom: 24 }}>
        AI visibility by service and product
      </p>
      <Suspense fallback={<div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", padding: 40, textAlign: "center" }}>Loading...</div>}>
        <ServicesContent />
      </Suspense>
    </div>
  );
}
