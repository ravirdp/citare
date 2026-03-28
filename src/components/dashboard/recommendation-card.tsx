"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface RecommendationCardProps {
  rec: Recommendation;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isActing: boolean;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--status-red)",
  high: "var(--status-orange, #f59e0b)",
  medium: "var(--accent-primary)",
  low: "var(--text-tertiary)",
};

const TYPE_LABELS: Record<string, string> = {
  accuracy_fix: "Accuracy Fix",
  gap_alert: "Visibility Gap",
  competitive_alert: "Competitor Alert",
  content_update: "Content Update",
  spend_optimization: "Spend Optimization",
};

export function RecommendationCard({
  rec,
  onApprove,
  onReject,
  isActing,
}: RecommendationCardProps) {
  const priorityColor = PRIORITY_COLORS[rec.priority] ?? "var(--text-tertiary)";

  return (
    <Card
      className="border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                style={{
                  borderColor: priorityColor,
                  color: priorityColor,
                  fontSize: "var(--text-xs)",
                }}
              >
                {rec.priority}
              </Badge>
              <Badge
                variant="secondary"
                style={{
                  fontSize: "var(--text-xs)",
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                {TYPE_LABELS[rec.type] ?? rec.type}
              </Badge>
              {rec.status !== "pending" && (
                <Badge
                  variant="secondary"
                  style={{
                    fontSize: "var(--text-xs)",
                    background:
                      rec.status === "applied"
                        ? "var(--status-green)"
                        : "var(--bg-tertiary)",
                    color:
                      rec.status === "applied"
                        ? "#fff"
                        : "var(--text-tertiary)",
                  }}
                >
                  {rec.status}
                </Badge>
              )}
            </div>
            <h3
              className="mb-1 text-[length:var(--text-sm)] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {rec.title}
            </h3>
            <p
              className="text-[length:var(--text-xs)] leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {rec.description}
            </p>
          </div>

          {rec.status === "pending" && (
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                onClick={() => onApprove(rec.id)}
                disabled={isActing}
                style={{
                  background: "var(--accent-primary)",
                  color: "#fff",
                  fontSize: "var(--text-xs)",
                }}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(rec.id)}
                disabled={isActing}
                style={{
                  fontSize: "var(--text-xs)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-secondary)",
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
