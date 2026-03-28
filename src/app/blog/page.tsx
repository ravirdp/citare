"use client";

export default function BlogPage() {
  return (
    <div style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Navigation */}
      <nav
        className="fixed top-0 right-0 left-0 z-50"
        style={{ background: "var(--bg-primary)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <a
            href="/"
            className="text-xl font-bold tracking-[0.05em] uppercase"
            style={{ color: "var(--text-primary)" }}
          >
            C<span style={{ color: "var(--accent-primary)" }}>i</span>tare
          </a>
          <div className="flex items-center gap-8">
            <a href="/audit" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Free Audit
            </a>
            <a href="/pricing" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Pricing
            </a>
            <a href="/blog" className="text-sm" style={{ color: "var(--accent-primary)" }}>
              Blog
            </a>
            <a href="/login" className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Login
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="px-6 pt-32 pb-24">
        <div className="mx-auto max-w-[700px] text-center">
          <h1
            className="text-4xl font-semibold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Blog
          </h1>
          <p
            className="mt-4 text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Coming soon — insights on AI search visibility, GEO optimization,
            and making your business discoverable by AI platforms.
          </p>

          <div
            className="mx-auto mt-12 max-w-[440px] rounded-xl p-8"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <h2
              className="text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Get notified when we publish
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              Be the first to read our research on AI search trends in India.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                fetch("/api/contact/submit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: "Blog Subscriber", email, message: "Blog subscription request" }),
                }).then(() => {
                  form.reset();
                  alert("Subscribed! We'll notify you when we publish.");
                });
              }}
              className="mt-6 flex gap-3"
            >
              <input
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: "var(--bg-tertiary)",
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
                Subscribe
              </button>
            </form>
          </div>
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
            <a href="/audit" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Free Audit</a>
            <a href="/about" className="text-xs" style={{ color: "var(--text-tertiary)" }}>About</a>
            <a href="/contact" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Contact</a>
            <a href="/privacy" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
