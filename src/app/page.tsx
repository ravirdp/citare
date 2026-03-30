import { PublicNavbar } from "@/components/public/navbar";
import { PublicFooter } from "@/components/public/footer";
import { AnimatedSection } from "@/components/public/animated-section";
import { CountUp } from "@/components/public/count-up";
import { PremiumCard } from "@/components/ui/premium-card";
import { GlowButton } from "@/components/public/glow-button";
import { GlowSubmit } from "@/components/public/glow-submit";

function HeroFadeIn({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        animation: "fadeInUp 600ms ease-out 200ms both",
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Citare",
    url: "https://www.citare.ai",
    description:
      "AI Search Intelligence Platform — making businesses visible across AI search platforms",
    foundingDate: "2026",
    areaServed: "IN",
    sameAs: [],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Citare",
    url: "https://www.citare.ai",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.citare.ai/audit?url={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <PublicNavbar />

      {/* Hero */}
      <section style={{ padding: "160px 24px 120px" }}>
        <HeroFadeIn>
          <div className="mx-auto max-w-[1200px] text-center">
            <p
              style={{
                marginBottom: 24,
                fontSize: 13,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--accent-primary)",
              }}
            >
              AI Search Intelligence
            </p>
            <h1
              className="mx-auto max-w-[800px]"
              style={{
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1.15,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              Are your customers finding you through AI?
            </h1>
            <p
              className="mx-auto"
              style={{
                marginTop: 24,
                maxWidth: 640,
                fontSize: 20,
                lineHeight: 1.65,
                color: "var(--text-secondary)",
              }}
            >
              ChatGPT, Perplexity, and Google AI now answer questions your customers
              used to search for. If you&apos;re not showing up in these answers,
              your competitors are.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <GlowButton href="/audit">Check Your AI Visibility</GlowButton>
              <GlowButton href="#how-it-works" variant="ghost">See How It Works</GlowButton>
            </div>
          </div>
        </HeroFadeIn>
      </section>

      {/* The Shift — Stats */}
      <AnimatedSection>
        <section style={{ padding: "100px 24px" }}>
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-3">
            {[
              { stat: "527%", desc: "Growth in AI-referred traffic year over year" },
              { stat: "4.4x", desc: "Higher conversion from AI search vs traditional" },
              { stat: "50%", desc: "Of search traffic shifting to AI by 2028 — Gartner" },
            ].map((item) => (
              <div key={item.stat} className="text-center">
                <CountUp
                  value={item.stat}
                  style={{
                    fontSize: 64,
                    fontWeight: 600,
                    color: "var(--accent-primary)",
                    display: "block",
                  }}
                />
                <p
                  style={{
                    marginTop: 12,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "var(--text-tertiary)",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: "100px 24px" }}>
        <div className="mx-auto max-w-[1200px]">
          <AnimatedSection>
            <h2
              style={{
                marginBottom: 64,
                textAlign: "center",
                fontSize: 40,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              How it works
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 100}>
                <PremiumCard>
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
                      marginBottom: 16,
                    }}
                  >
                    {item.step}
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {item.desc}
                  </p>
                </PremiumCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section style={{ padding: "100px 24px" }}>
        <div className="mx-auto max-w-[1200px]">
          <AnimatedSection>
            <h2
              style={{
                marginBottom: 64,
                textAlign: "center",
                fontSize: 40,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              What you get
            </h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                title: "AI Visibility Score",
                desc: "One number that tells you how visible you are across ChatGPT, Perplexity, Google AI, Gemini, and Claude. Updated daily.",
              },
              {
                title: "Competitor Intelligence",
                desc: "See which competitors AI platforms recommend instead of you. Track their mentions, positions, and strategies.",
              },
              {
                title: "Actionable Recommendations",
                desc: "Specific actions to improve your AI visibility — not generic advice. Each recommendation explains why and what to do.",
              },
              {
                title: "ROI You Can Measure",
                desc: "We calculate the equivalent ad spend value of your AI visibility. Know exactly what your presence is worth in rupees.",
              },
            ].map((card, i) => (
              <AnimatedSection key={card.title} delay={i * 100}>
                <PremiumCard>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: 12,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {card.desc}
                  </p>
                </PremiumCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Free Audit CTA */}
      <section
        style={{
          padding: "120px 24px",
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <AnimatedSection>
          <div className="mx-auto max-w-[1200px] text-center">
            <h2
              style={{
                fontSize: 40,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              See where you stand in 60 seconds
            </h2>
            <p
              className="mx-auto"
              style={{
                marginTop: 16,
                maxWidth: 520,
                fontSize: 18,
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              Enter your website URL. No login. No credit card. Get your AI Search
              Visibility Report instantly.
            </p>
            <form
              action="/audit"
              method="GET"
              className="mx-auto mt-8 max-w-[600px]"
            >
              <div className="flex gap-3">
                <input
                  type="url"
                  name="url"
                  placeholder="https://yourwebsite.com"
                  required
                  className="flex-1"
                  style={{
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                    fontSize: 14,
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business name"
                  required
                  style={{
                    width: 180,
                    borderRadius: "var(--radius-md)",
                    padding: "14px 16px",
                    fontSize: 14,
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                />
                <GlowSubmit>Analyze</GlowSubmit>
              </div>
            </form>
            <p
              style={{
                marginTop: 24,
                fontSize: "var(--text-xs)",
                color: "var(--text-tertiary)",
              }}
            >
              Trusted by businesses across healthcare, education, e-commerce, and
              professional services
            </p>
          </div>
        </AnimatedSection>
      </section>

      <PublicFooter />
    </div>
  );
}
