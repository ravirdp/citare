"use client";

export function CtaCard() {
  return (
    <div
      className="mt-16 p-8 text-center"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        transition: "border-color 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "scale(1.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <h3
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Want to check your AI visibility?
      </h3>
      <p className="mt-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
        Get a free, instant analysis of how AI search platforms see your business.
      </p>
      <a
        href="/audit"
        className="mt-4 inline-block rounded-lg px-8 py-3 text-sm font-medium"
        style={{
          background: "var(--accent-primary)",
          color: "var(--bg-primary)",
          textDecoration: "none",
          transition: "box-shadow 200ms ease, transform 200ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Try our free audit
      </a>
    </div>
  );
}
