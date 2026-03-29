import { PublicNavbar } from "@/components/public/navbar";

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
      <section className="px-6 pt-40 pb-24">
        <div className="mx-auto max-w-[1200px] text-center">
          <p
            className="mb-6 text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: "var(--accent-primary)" }}
          >
            AI Search Intelligence
          </p>
          <h1
            className="mx-auto max-w-[800px] text-5xl leading-[1.15] font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Are your customers finding you through AI?
          </h1>
          <p
            className="mx-auto mt-6 max-w-[640px] text-xl leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            ChatGPT, Perplexity, and Google AI now answer questions your customers
            used to search for. If you&apos;re not showing up in these answers,
            your competitors are.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a
              href="/audit"
              className="rounded-lg px-6 py-3 text-sm font-medium"
              style={{
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
              }}
            >
              Check Your AI Visibility
            </a>
            <a
              href="#how-it-works"
              className="rounded-lg px-6 py-3 text-sm font-medium"
              style={{
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* The Shift — Stats */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-3">
          {[
            { stat: "527%", desc: "Growth in AI-referred traffic year over year" },
            { stat: "4.4x", desc: "Higher conversion from AI search vs traditional" },
            { stat: "50%", desc: "Of search traffic shifting to AI by 2028 — Gartner" },
          ].map((item) => (
            <div key={item.stat} className="text-center">
              <p
                className="text-5xl font-bold"
                style={{ color: "var(--accent-primary)" }}
              >
                {item.stat}
              </p>
              <p
                className="mt-3 text-sm leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-16 text-center text-3xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
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
              <div key={item.step}>
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    border: "1px solid var(--accent-primary)",
                    color: "var(--accent-primary)",
                  }}
                >
                  {item.step}
                </div>
                <h3
                  className="mb-3 text-lg font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <h2
            className="mb-16 text-center text-3xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            What you get
          </h2>
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
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg p-8"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <h3
                  className="mb-3 text-lg font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Audit CTA */}
      <section
        className="px-6 py-24"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="mx-auto max-w-[1200px] text-center">
          <h2
            className="text-3xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            See where you stand in 60 seconds
          </h2>
          <p
            className="mx-auto mt-4 max-w-[520px] text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
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
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                type="text"
                name="businessName"
                placeholder="Business name"
                required
                className="w-[180px] rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                className="rounded-lg px-6 py-3 text-sm font-medium"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-primary)",
                }}
              >
                Analyze
              </button>
            </div>
          </form>
          <p
            className="mt-6 text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Trusted by businesses across healthcare, education, e-commerce, and
            professional services
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <p
            className="text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            &copy; 2026 Citare
          </p>
          <div className="flex items-center gap-6">
            <a
              href="/audit"
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Free Audit
            </a>
            <a
              href="/about"
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              About
            </a>
            <a
              href="/contact"
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Contact
            </a>
            <a
              href="/login"
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Login
            </a>
            <a
              href="/privacy"
              className="text-xs"
              style={{ color: "var(--text-tertiary)" }}
            >
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
