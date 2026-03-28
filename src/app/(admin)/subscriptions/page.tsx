"use client";

import { useEffect, useState } from "react";

interface SubRow {
  id: string;
  clientName: string;
  plan: string;
  status: string;
  trialEnd: string | null;
  monthlyFeeInr: number;
  monitoringFrequency: string;
  razorpaySubscriptionId: string | null;
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => (r.ok ? r.json() : { subscriptions: [] }))
      .then((data) => setSubs(data.subscriptions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = subs.filter((s) => s.status === "active").length;
  const trialing = subs.filter((s) => s.status === "trialing").length;
  const expired = subs.filter((s) => s.status === "expired" || s.status === "cancelled").length;
  const mrr = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.monthlyFeeInr ?? 0), 0);

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
        Subscriptions
      </h1>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Active", value: active, color: "var(--status-green)" },
          { label: "Trialing", value: trialing, color: "#eab308" },
          { label: "Expired / Cancelled", value: expired, color: "var(--status-red)" },
          { label: "MRR", value: `₹${mrr.toLocaleString("en-IN")}`, color: "var(--accent-primary)" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: 4 }}>
              {card.label}
            </p>
            <p style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "var(--text-tertiary)" }}>Loading...</p>
      ) : (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                {["Client", "Plan", "Status", "Trial End", "Fee (₹)", "Monitoring", "Razorpay ID"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "10px 16px", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                    {s.clientName}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                    {s.plan}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background:
                          s.status === "active"
                            ? "rgba(34,197,94,0.15)"
                            : s.status === "trialing"
                              ? "rgba(234,179,8,0.15)"
                              : "rgba(239,68,68,0.15)",
                        color:
                          s.status === "active"
                            ? "var(--status-green)"
                            : s.status === "trialing"
                              ? "#eab308"
                              : "var(--status-red)",
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    {s.trialEnd ? new Date(s.trialEnd).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                    {s.monthlyFeeInr?.toLocaleString("en-IN") ?? "0"}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    {s.monitoringFrequency}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                    {s.razorpaySubscriptionId ?? "—"}
                  </td>
                </tr>
              ))}
              {subs.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{ padding: 24, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}
                  >
                    No subscriptions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
