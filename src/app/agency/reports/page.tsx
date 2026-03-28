"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

function AgencyReportsContent() {
  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-[1400px]">
        <h1
          className="mb-2 text-[length:var(--text-xl)] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Client Reports
        </h1>
        <p
          className="mb-6 text-[length:var(--text-sm)]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Monthly visibility reports for all your clients
        </p>

        <Card
          className="border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <CardHeader>
            <h2
              className="text-[length:var(--text-md)] font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Reports
            </h2>
          </CardHeader>
          <CardContent>
            <p
              className="text-[length:var(--text-sm)]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Select a client from the dashboard to generate and view their
              monthly report. Reports include visibility scores, competitor
              analysis, and equivalent ad spend value.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AgencyReportsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "var(--bg-primary)" }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>Loading...</span>
        </div>
      }
    >
      <AgencyReportsContent />
    </Suspense>
  );
}
