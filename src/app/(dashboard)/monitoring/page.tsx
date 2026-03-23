"use client";

import { Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientId } from "@/components/dashboard/client-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MonitorResult {
  id: string;
  platform: string;
  query: string;
  mentioned: boolean;
  position: number | null;
  accurate: boolean | null;
  queriedAt: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  chatgpt: "var(--platform-chatgpt, #10a37f)",
  perplexity: "var(--platform-perplexity, #6366f1)",
  gemini: "var(--platform-gemini, #4285f4)",
  claude: "var(--platform-claude, #d97706)",
  aio: "var(--platform-aio, #ea4335)",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MonitoringContent() {
  const clientId = useClientId();
  const [platform, setPlatform] = useState("all");

  const { data, isLoading, error } = useQuery<MonitorResult[]>({
    queryKey: ["monitoring", clientId],
    queryFn: async () => {
      const res = await fetch(`/api/monitor/results/${clientId}?limit=100`);
      if (!res.ok) throw new Error("Failed to fetch results");
      const json = await res.json();
      const raw = json.results ?? json;
      if (!Array.isArray(raw)) return [];
      return raw.map((r: Record<string, unknown>) => {
        const result = (r.result ?? r) as Record<string, unknown>;
        return {
          id: result.id as string,
          platform: result.platform as string,
          query: (r.queryText ?? "") as string,
          mentioned: (result.clientMentioned ?? false) as boolean,
          position: (result.clientPosition ?? null) as number | null,
          accurate: (result.informationAccurate ?? null) as boolean | null,
          queriedAt: (result.queriedAt ?? "") as string,
        };
      });
    },
    enabled: !!clientId,
  });

  if (!clientId) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Select a client to view monitoring results.
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
        Failed to load monitoring results.
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        No monitoring results yet.
      </div>
    );
  }

  const platforms = Array.from(new Set(data.map((r) => r.platform)));
  const filtered = platform === "all" ? data : data.filter((r) => r.platform === platform);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger style={{ width: 180, background: "var(--bg-tertiary)", borderColor: "var(--border-default)", color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
            <SelectValue placeholder="Filter platform" />
          </SelectTrigger>
          <SelectContent style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-default)" }}>
            <SelectItem value="all" style={{ color: "var(--text-primary)" }}>All Platforms</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p} style={{ color: "var(--text-primary)" }}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", borderRadius: 12, overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: "var(--border-subtle)" }}>
              {["Platform", "Query", "Mentioned", "Position", "Accuracy", "Time"].map((h) => (
                <TableHead key={h} style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} style={{ borderColor: "var(--border-subtle)" }}>
                <TableCell>
                  <span style={{ background: PLATFORM_COLORS[r.platform] ?? "var(--text-tertiary)", color: "#fff", padding: "2px 8px", borderRadius: 9999, fontSize: "var(--text-xs)", fontWeight: 500 }}>
                    {r.platform}
                  </span>
                </TableCell>
                <TableCell style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.query}
                </TableCell>
                <TableCell>
                  <span style={{ color: r.mentioned ? "var(--status-green)" : "var(--status-red)", fontSize: "var(--text-sm)" }}>
                    {r.mentioned ? "\u2713" : "\u2717"}
                  </span>
                </TableCell>
                <TableCell style={{ fontFamily: "var(--font-body)", color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                  {r.position != null ? r.position : "\u2014"}
                </TableCell>
                <TableCell>
                  {r.accurate != null ? (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.accurate ? "var(--status-green)" : "var(--status-red)", display: "inline-block" }} />
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>{"\u2014"}</span>
                  )}
                </TableCell>
                <TableCell style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "var(--text-xs)" }}>
                  {r.queriedAt ? timeAgo(r.queriedAt) : "\u2014"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <div>
      <h1 style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
        Monitoring
      </h1>
      <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", marginBottom: 24 }}>
        Recent AI platform monitoring results
      </p>
      <Suspense fallback={<div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", padding: 40, textAlign: "center" }}>Loading...</div>}>
        <MonitoringContent />
      </Suspense>
    </div>
  );
}
