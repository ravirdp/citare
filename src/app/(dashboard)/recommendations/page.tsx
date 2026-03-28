"use client";

import { Suspense, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";

type StatusFilter = "all" | "pending" | "applied" | "rejected";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? "";
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [actingId, setActingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<{
    recommendations: Recommendation[];
  }>({
    queryKey: ["recommendations", clientId, filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(
        `/api/dashboard/${clientId}/recommendations?${params}`
      );
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json();
    },
    enabled: !!clientId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/dashboard/${clientId}/recommendations/generate`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to generate recommendations");
      return res.json();
    },
    onSuccess: () => refetch(),
  });

  const approveMutation = useMutation({
    mutationFn: async (recId: string) => {
      setActingId(recId);
      const res = await fetch(
        `/api/dashboard/${clientId}/recommendations/${recId}/approve`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      setActingId(null);
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: () => setActingId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: async (recId: string) => {
      setActingId(recId);
      const res = await fetch(
        `/api/dashboard/${clientId}/recommendations/${recId}/reject`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      setActingId(null);
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    },
    onError: () => setActingId(null),
  });

  const recs = data?.recommendations ?? [];
  const pendingCount = recs.filter((r) => r.status === "pending").length;

  if (!clientId) {
    return (
      <p style={{ color: "var(--text-tertiary)" }}>
        Select a client to view recommendations.
      </p>
    );
  }

  const FILTERS: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Applied", value: "applied" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-[length:var(--text-xl)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Recommendations
          </h1>
          <p
            className="mt-1 text-[length:var(--text-sm)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {pendingCount > 0
              ? `${pendingCount} pending recommendation${pendingCount > 1 ? "s" : ""}`
              : "No pending recommendations"}
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          style={{
            background: "var(--accent-primary)",
            color: "#fff",
          }}
        >
          {generateMutation.isPending ? "Generating..." : "Generate"}
        </Button>
      </div>

      {/* Filter tabs */}
      <div
        className="mb-4 flex gap-1 rounded-lg p-1"
        style={{ background: "var(--bg-secondary)" }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              background:
                filter === f.value
                  ? "var(--bg-tertiary)"
                  : "transparent",
              color:
                filter === f.value
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              border: "none",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recommendation list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg"
              style={{ background: "var(--bg-secondary)" }}
            />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          No recommendations found. Click Generate to analyze your monitoring
          data.
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onApprove={(id) => approveMutation.mutate(id)}
              onReject={(id) => rejectMutation.mutate(id)}
              isActing={actingId === rec.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ color: "var(--text-tertiary)" }}>Loading...</div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
