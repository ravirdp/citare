import type { Metadata } from "next";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "About Citare — AI Search Intelligence Platform",
  description:
    "Citare makes businesses visible across AI search platforms like ChatGPT, Perplexity, and Google AI. Built in India, for India.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Citare",
    url: "https://www.citare.ai/about",
    mainEntity: {
      "@type": "Organization",
      name: "Citare",
      url: "https://www.citare.ai",
      description:
        "AI Search Intelligence Platform — making businesses visible across AI search platforms",
      foundingDate: "2026",
      areaServed: "IN",
    },
  };

  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <PublicNavbar active="/about" />

      {/* Content */}
      <main className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-[720px]">
          <h1
            className="text-4xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            About Citare
          </h1>

          {/* The Problem */}
          <section className="mt-16">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              The Problem
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              AI search platforms like ChatGPT, Perplexity, and Google AI Overviews are
              replacing traditional search. Businesses optimized for Google are invisible
              to AI. We built Citare to fix that.
            </p>
          </section>

          {/* What We Do */}
          <section className="mt-14">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              What We Do
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Citare is an AI Search Intelligence Platform. We connect to your existing
              Google Ads data, build a knowledge graph of your business, generate
              AI-optimized content, and continuously monitor how AI platforms describe
              and recommend you.
            </p>
          </section>

          {/* How It Works */}
          <section className="mt-14">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              How It Works
            </h2>
            <div className="mt-6 space-y-6">
              {[
                {
                  step: "1",
                  title: "We analyze your digital presence",
                  desc: "Connect your Google Ads account. We map your services, locations, competitors, and customer search patterns in minutes.",
                },
                {
                  step: "2",
                  title: "We make you visible to AI",
                  desc: "We generate the structured data, content, and signals that AI platforms need to understand and recommend your business.",
                },
                {
                  step: "3",
                  title: "We track and improve continuously",
                  desc: "Daily monitoring across 5 AI platforms. You see exactly how AI describes your business and where you stand vs competitors.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      border: "1px solid var(--accent-primary)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3
                      className="text-base font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.title}
                    </h3>
                    <p
                      className="mt-1 text-sm leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Approach */}
          <section className="mt-14">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Our Approach
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              We believe in transparency and measurable results. Every recommendation
              comes with data. Every improvement is tracked. You see exactly what&apos;s
              working and what your AI visibility is worth in rupees.
            </p>
          </section>

          {/* Built in India */}
          <section className="mt-14">
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Built in India, for India
            </h2>
            <p
              className="mt-4 text-base leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Citare is designed for Indian businesses. We understand Hindi, Hinglish,
              and regional search patterns. We know that addresses have landmarks, not
              just pin codes. We price for Indian markets.
            </p>
          </section>

          {/* CTA */}
          <section className="mt-20 text-center">
            <a
              href="/audit"
              className="inline-block rounded-lg px-8 py-3 text-sm font-medium"
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
              }}
            >
              Try a Free Audit
            </a>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-8"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            &copy; 2026 Citare
          </p>
          <div className="flex items-center gap-6">
            <a href="/audit" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Free Audit
            </a>
            <a href="/about" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              About
            </a>
            <a href="/contact" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Contact
            </a>
            <a href="/login" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Login
            </a>
            <a href="/privacy" className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
