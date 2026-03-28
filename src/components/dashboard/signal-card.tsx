"use client";

import { Card, CardContent } from "@/components/ui/card";

interface SignalCardProps {
  signal: string;
  value: number;
  weight: number;
  available: boolean;
}

export function SignalCard({ signal, value, weight, available }: SignalCardProps) {
  return (
    <Card
      className="border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
        opacity: available ? 1 : 0.5,
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span
            className="text-[length:var(--text-xs)] uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            {signal}
          </span>
          <span
            className="font-mono text-[length:var(--text-xs)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            {Math.round(weight * 100)}% weight
          </span>
        </div>
        <div className="mt-2">
          {available ? (
            <span
              className="font-mono text-[length:var(--text-lg)] font-bold"
              style={{ color: "var(--accent-primary)" }}
            >
              {Math.round(value)}
            </span>
          ) : (
            <span
              className="text-[length:var(--text-sm)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              No data
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
