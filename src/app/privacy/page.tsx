import type { Metadata } from "next";
import { PublicNavbar } from "@/components/public/navbar";

export const metadata: Metadata = {
  title: "Privacy Policy — Citare",
  description: "How Citare collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <PublicNavbar />

      {/* Content */}
      <main className="mx-auto max-w-[800px] px-6 pt-32 pb-24">
        <h1
          className="mb-4 text-3xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Privacy Policy
        </h1>
        <p className="mb-12 text-sm" style={{ color: "var(--text-tertiary)" }}>
          Last updated: 28 March 2026
        </p>

        <div className="space-y-10">
          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              What Data We Collect
            </h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p><strong style={{ color: "var(--text-primary)" }}>Account information:</strong> Name, email address, and Google account details when you sign up or log in.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Google Ads data:</strong> Campaign names, keywords, performance metrics, and cost data — accessed read-only via the Google Ads API with your explicit consent.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Google Business Profile data:</strong> Business information, reviews, and local signals — accessed read-only via the Google Business Profile API.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Search Console and Analytics data:</strong> Search queries, page performance, and traffic patterns — accessed read-only via Google APIs.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Website URL:</strong> The URL you provide for free audit analysis.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Contact information:</strong> Name, email, phone, and city when you submit forms on our site.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              How We Use Your Data
            </h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p><strong style={{ color: "var(--text-primary)" }}>AI visibility analysis:</strong> We analyse your business data to understand how AI search platforms (ChatGPT, Perplexity, Google AI Overviews, Gemini, Claude) represent your business.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Monitoring:</strong> We query AI platforms daily to track your visibility, accuracy, and competitive positioning.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Recommendations:</strong> We generate actionable recommendations to improve how AI platforms describe and recommend your business.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Reports:</strong> We create monthly reports summarising your AI search performance and trends.</p>
              <p>We never sell your data. We never use your data to train AI models.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              Data Retention
            </h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p>We retain your data for as long as your account is active. If you cancel your account, we delete your data within 30 days.</p>
              <p>Free audit data is retained for 90 days, then automatically deleted.</p>
              <p>Contact form submissions are retained for 12 months.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              Third-Party Services
            </h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p><strong style={{ color: "var(--text-primary)" }}>Supabase:</strong> Database hosting and authentication. Your data is stored in Supabase-managed PostgreSQL with row-level security. Supabase is SOC 2 Type II compliant.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Google APIs:</strong> We access your Google Ads, Business Profile, Search Console, and Analytics data through official Google APIs using OAuth 2.0. You can revoke access at any time via your Google Account settings.</p>
              <p><strong style={{ color: "var(--text-primary)" }}>Vercel:</strong> Application hosting. No personal data is stored on Vercel beyond standard request logs (retained 30 days).</p>
              <p><strong style={{ color: "var(--text-primary)" }}>AI providers:</strong> We send anonymised queries to AI platforms (OpenAI, Anthropic, Google, Perplexity) for monitoring. These queries do not contain your personal data.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              Your Rights
            </h2>
            <div className="space-y-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <p>You can request a copy of your data, request deletion of your data, or revoke Google API access at any time.</p>
              <p>To exercise any of these rights, email us at the address below.</p>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-medium" style={{ color: "var(--text-primary)" }}>
              Contact
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              For privacy concerns, data requests, or questions about this policy, contact us at{" "}
              <a href="mailto:ravi@citare.ai" style={{ color: "var(--accent-primary)" }}>ravi@citare.ai</a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-6 py-8"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
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
