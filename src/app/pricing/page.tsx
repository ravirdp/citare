import type { Metadata } from "next";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "Pricing — Citare",
  description: "AI Search Intelligence plans starting at ₹6,000/month. 7-day free trial on all plans.",
};

const PAID_PLANS: { id: PlanId; highlight?: boolean }[] = [
  { id: "starter" },
  { id: "growth", highlight: true },
  { id: "ecommerce" },
  { id: "enterprise" },
];

export default function PricingPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <PublicNavbar active="/pricing" />

      {/* Hero */}
      <section className="px-6 pt-32 pb-16 text-center">
        <h1 className="text-4xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Choose the plan that fits your business. All plans include a 7-day free trial with no charge until day 8.
        </p>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {PAID_PLANS.map(({ id, highlight }) => {
            const plan = PLANS[id];
            return (
              <div
                key={id}
                className="relative flex flex-col rounded-lg p-8"
                style={{
                  background: "var(--bg-secondary)",
                  border: `1px solid ${highlight ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                }}
              >
                {highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold"
                    style={{ background: "var(--accent-primary)", color: "#fff" }}
                  >
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {plan.name}
                </h3>

                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    ₹{plan.price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/month</span>
                </div>

                <ul className="mb-8 flex-1 space-y-2">
                  <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {plan.max_services === -1 ? "Unlimited" : `Up to ${plan.max_services}`} services
                  </li>
                  {plan.max_products > 0 && (
                    <li className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {plan.max_products === -1 ? "Unlimited" : `Up to ${plan.max_products}`} products
                    </li>
                  )}
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      + {f.replace(/_/g, " ")}
                    </li>
                  ))}
                </ul>

                <a
                  href="/signup"
                  className="block rounded-lg py-3 text-center text-sm font-medium"
                  style={{
                    background: highlight ? "var(--accent-primary)" : "var(--bg-tertiary)",
                    color: highlight ? "var(--bg-primary)" : "var(--text-primary)",
                  }}
                >
                  Start Free Trial
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add-on */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <div
          className="rounded-lg p-8"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                Daily Monitoring Add-on
              </h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Upgrade from every-3-days to daily monitoring across all 5 AI platforms.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>+₹1,500</span>
              <span className="text-sm" style={{ color: "var(--text-tertiary)" }}>/month</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom text */}
      <section className="mx-auto max-w-[1200px] px-6 pb-24 text-center">
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          All plans include a 7-day free trial. No charge until day 8.
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
          For agencies managing multiple clients,{" "}
          <a href="/contact" style={{ color: "var(--accent-primary)" }}>contact us</a>{" "}
          for volume pricing.
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>&copy; 2026 Citare</p>
          <div className="flex items-center gap-6">
            <a href="/audit" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Free Audit</a>
            <a href="/about" className="text-xs" style={{ color: "var(--text-tertiary)" }}>About</a>
            <a href="/contact" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Contact</a>
            <a href="/login" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Login</a>
            <a href="/privacy" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
