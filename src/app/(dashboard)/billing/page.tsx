"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/billing/plans";

interface SubscriptionData {
  id: string;
  plan: string;
  planName: string;
  price: number;
  status: string;
  monitoringFrequency: string;
  trialEnd: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  daysRemaining: number | null;
  features: string[];
  maxServices: number;
  maxProducts: number;
}

const PAID_PLANS: PlanId[] = ["starter", "growth", "ecommerce", "enterprise"];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    fetch(`/api/billing/subscription/${clientId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setSub(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleCancel() {
    if (!clientId || !confirm("Are you sure you want to cancel your subscription?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/billing/subscription/${clientId}/cancel`, { method: "POST" });
      if (res.ok) {
        setSub((prev) => prev ? { ...prev, status: "cancelled" } : prev);
      }
    } finally {
      setCancelling(false);
    }
  }

  async function handleUpgrade(planId: PlanId) {
    if (!clientId) return;
    setUpgrading(planId);
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.short_url) {
        window.location.href = data.short_url;
      } else {
        window.location.reload();
      }
    } finally {
      setUpgrading(null);
    }
  }

  if (loading) {
    return (
      <div style={{ color: "var(--text-tertiary)", padding: 40 }}>Loading billing...</div>
    );
  }

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
        Billing
      </h1>

      {/* Current Plan Card */}
      {sub ? (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: 4 }}>
                Current Plan
              </p>
              <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--text-primary)" }}>
                {sub.planName}
              </h2>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 4 }}>
                ₹{sub.price.toLocaleString("en-IN")}/month
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  background:
                    sub.status === "active"
                      ? "rgba(34,197,94,0.15)"
                      : sub.status === "trialing"
                        ? "rgba(234,179,8,0.15)"
                        : "rgba(239,68,68,0.15)",
                  color:
                    sub.status === "active"
                      ? "var(--status-green)"
                      : sub.status === "trialing"
                        ? "#eab308"
                        : "var(--status-red)",
                }}
              >
                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
              </span>
              {sub.daysRemaining !== null && (
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 4 }}>
                  {sub.daysRemaining} day{sub.daysRemaining !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                Monitoring
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>
                {sub.monitoringFrequency === "daily" ? "Daily" : "Every 3 days"}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                Services
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>
                {sub.maxServices === -1 ? "Unlimited" : `Up to ${sub.maxServices}`}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                Products
              </p>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", fontWeight: 500 }}>
                {sub.maxProducts === -1 ? "Unlimited" : sub.maxProducts === 0 ? "N/A" : `Up to ${sub.maxProducts}`}
              </p>
            </div>
          </div>

          {sub.status !== "cancelled" && sub.status !== "expired" && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-subtle)" }}>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  background: "none",
                  border: "1px solid var(--status-red)",
                  color: "var(--status-red)",
                  padding: "6px 16px",
                  borderRadius: 6,
                  fontSize: "var(--text-xs)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            marginBottom: 32,
            color: "var(--text-tertiary)",
          }}
        >
          No subscription found. Choose a plan below.
        </div>
      )}

      {/* Plan Comparison */}
      <h2
        style={{
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 16,
        }}
      >
        {sub ? "Change Plan" : "Choose a Plan"}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {PAID_PLANS.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = sub?.plan === planId;

          return (
            <div
              key={planId}
              style={{
                background: "var(--bg-secondary)",
                border: `1px solid ${isCurrent ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                borderRadius: "var(--radius-lg)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                transition: "border-color 200ms ease, transform 200ms ease, box-shadow 200ms ease",
              }}
              onMouseEnter={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                  e.currentTarget.style.transform = "scale(1.01)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrent) {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                {plan.name}
              </h3>
              <p style={{ fontSize: "var(--text-lg)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                ₹{plan.price.toLocaleString("en-IN")}
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontWeight: 400 }}>/mo</span>
              </p>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1, marginBottom: 12 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: 3 }}>
                    + {f.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "8px",
                    fontSize: "var(--text-xs)",
                    color: "var(--accent-primary)",
                    fontWeight: 600,
                  }}
                >
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={upgrading !== null}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: planId === "growth" ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: planId === "growth" ? "#fff" : "var(--text-primary)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {upgrading === planId ? "Processing..." : isCurrent ? "Current" : "Select"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
