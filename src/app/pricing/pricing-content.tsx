"use client";

import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/billing/plans";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { AnimatedSection } from "@/components/public/animated-section";

const PAID_PLANS: { id: PlanId; highlight?: boolean }[] = [
  { id: "starter" },
  { id: "growth", highlight: true },
  { id: "ecommerce" },
  { id: "enterprise" },
];

function PlanCard({ id, highlight }: { id: PlanId; highlight?: boolean }) {
  const plan = PLANS[id];
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <div
      key={id}
      className="relative flex flex-col p-8"
      style={{
        background: "var(--bg-secondary)",
        border: `1px solid ${highlight ? "var(--accent-primary)" : hovered ? "var(--border-hover)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: highlight ? "0 0 30px var(--accent-glow)" : undefined,
        transition: "border-color 200ms ease, transform 200ms ease",
        transform: hovered ? "scale(1.01)" : "scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
          transition: highlight ? "box-shadow 200ms ease, transform 200ms ease" : undefined,
          boxShadow: highlight && btnHovered ? "0 0 20px var(--accent-glow)" : undefined,
          transform: highlight && btnHovered ? "translateY(-1px)" : undefined,
        }}
        onMouseEnter={highlight ? () => setBtnHovered(true) : undefined}
        onMouseLeave={highlight ? () => setBtnHovered(false) : undefined}
      >
        Start Free Trial
      </a>
    </div>
  );
}

export function PricingContent() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <PublicNavbar active="/pricing" />

      {/* Hero */}
      <section className="px-6 pt-32 pb-16 text-center">
        <AnimatedSection>
          <h1 className="font-semibold" style={{ color: "var(--text-primary)", fontSize: 48 }}>
            Simple, transparent pricing
          </h1>
        </AnimatedSection>
        <p
          className="mx-auto mt-4 max-w-[520px]"
          style={{ color: "var(--text-secondary)", fontSize: 18, lineHeight: 1.65 }}
        >
          Choose the plan that fits your business. All plans include a 7-day free trial with no charge until day 8.
        </p>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <AnimatedSection delay={100}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {PAID_PLANS.map(({ id, highlight }) => (
              <PlanCard key={id} id={id} highlight={highlight} />
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Add-on */}
      <AnimatedSection delay={200}>
        <section className="mx-auto max-w-[1200px] px-6 pb-16">
          <div
            className="p-8"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
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
      </AnimatedSection>

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

      <PublicFooter />
    </div>
  );
}
