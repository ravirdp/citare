import type { Metadata } from "next";
import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { AnimatedSection } from "@/components/public/animated-section";
import { GlowButton } from "@/components/public/glow-button";

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
          <AnimatedSection>
            <h1
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              About Citare
            </h1>
          </AnimatedSection>

          {/* The Problem */}
          <AnimatedSection delay={100}>
            <section className="mt-16">
              <h2
                style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)" }}
              >
                The Problem
              </h2>
              <p
                style={{
                  marginTop: 16,
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                AI search platforms like ChatGPT, Perplexity, and Google AI Overviews are
                replacing traditional search. Businesses optimized for Google are invisible
                to AI. We built Citare to fix that.
              </p>
            </section>
          </AnimatedSection>

          {/* What We Do */}
          <AnimatedSection delay={150}>
            <section className="mt-14">
              <h2
                style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)" }}
              >
                What We Do
              </h2>
              <p
                style={{
                  marginTop: 16,
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                Citare is an AI Search Intelligence Platform. We connect to your existing
                Google Ads data, build a knowledge graph of your business, generate
                AI-optimized content, and continuously monitor how AI platforms describe
                and recommend you.
              </p>
            </section>
          </AnimatedSection>

          {/* How It Works */}
          <AnimatedSection delay={200}>
            <section className="mt-14">
              <h2
                style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)" }}
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
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        border: "1px solid var(--accent-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--accent-primary)",
                        flexShrink: 0,
                      }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h3
                        style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          marginTop: 4,
                          fontSize: 15,
                          lineHeight: 1.65,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </AnimatedSection>

          {/* Our Approach */}
          <AnimatedSection delay={250}>
            <section className="mt-14">
              <h2
                style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)" }}
              >
                Our Approach
              </h2>
              <p
                style={{
                  marginTop: 16,
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                We believe in transparency and measurable results. Every recommendation
                comes with data. Every improvement is tracked. You see exactly what&apos;s
                working and what your AI visibility is worth in rupees.
              </p>
            </section>
          </AnimatedSection>

          {/* Built in India */}
          <AnimatedSection delay={300}>
            <section className="mt-14">
              <h2
                style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)" }}
              >
                Built in India, for India
              </h2>
              <p
                style={{
                  marginTop: 16,
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                Citare is designed for Indian businesses. We understand Hindi, Hinglish,
                and regional search patterns. We know that addresses have landmarks, not
                just pin codes. We price for Indian markets.
              </p>
            </section>
          </AnimatedSection>

          {/* CTA */}
          <AnimatedSection delay={350}>
            <section className="mt-20 text-center">
              <GlowButton href="/audit" style={{ padding: "14px 32px" }}>
                Try a Free Audit
              </GlowButton>
            </section>
          </AnimatedSection>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
