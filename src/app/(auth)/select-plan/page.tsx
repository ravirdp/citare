"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/billing/plans";

const PAID_PLANS: { id: PlanId; highlight?: boolean }[] = [
  { id: "starter" },
  { id: "growth", highlight: true },
  { id: "ecommerce" },
  { id: "enterprise" },
];

export default function SelectPlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectPlan(planId: PlanId) {
    setLoading(planId);
    setError(null);

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create subscription");
        setLoading(null);
        return;
      }

      if (data.short_url) {
        window.location.href = data.short_url;
      } else {
        router.push("/onboarding");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  function handleSkip() {
    router.push("/onboarding");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: 960, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "var(--text-primary)",
            textTransform: "uppercase",
          }}
        >
          C<span style={{ color: "var(--accent-primary)" }}>i</span>TARE
        </div>

        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginTop: 32,
            marginBottom: 8,
          }}
        >
          Choose Your Plan
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-tertiary)",
            marginBottom: 40,
            maxWidth: 480,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          All plans include a 7-day free trial. You won&apos;t be charged until day 8.
        </p>

        {error && (
          <p
            style={{
              color: "var(--status-red)",
              fontSize: "var(--text-sm)",
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {PAID_PLANS.map(({ id, highlight }) => {
            const plan = PLANS[id];
            const isLoading = loading === id;

            return (
              <div
                key={id}
                style={{
                  background: "var(--bg-secondary)",
                  border: `1px solid ${highlight ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  borderRadius: 12,
                  padding: 24,
                  textAlign: "left",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--accent-primary)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 12px",
                      borderRadius: 10,
                      letterSpacing: "0.05em",
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <h3
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {plan.name}
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <span
                    style={{
                      fontSize: "var(--text-xl)",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    ₹{plan.price.toLocaleString("en-IN")}
                  </span>
                  <span
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    /month
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    flex: 1,
                    marginBottom: 16,
                  }}
                >
                  <li
                    style={{
                      fontSize: "var(--text-xs)",
                      color: "var(--text-secondary)",
                      marginBottom: 6,
                    }}
                  >
                    {plan.max_services === -1 ? "Unlimited" : `Up to ${plan.max_services}`} services
                  </li>
                  {plan.max_products > 0 && (
                    <li
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-secondary)",
                        marginBottom: 6,
                      }}
                    >
                      Up to {plan.max_products === -1 ? "unlimited" : plan.max_products} products
                    </li>
                  )}
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--text-tertiary)",
                        marginBottom: 4,
                      }}
                    >
                      + {f.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(id)}
                  disabled={isLoading || loading !== null}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: highlight ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: highlight ? "#fff" : "var(--text-primary)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: loading ? "wait" : "pointer",
                  }}
                >
                  {isLoading ? "Setting up..." : "Start 7-day Free Trial"}
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSkip}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-tertiary)",
            fontSize: "var(--text-sm)",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Skip — continue with basic trial
        </button>
      </div>
    </div>
  );
}
