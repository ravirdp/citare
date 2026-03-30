"use client";

const FOOTER_LINKS = [
  { href: "/audit", label: "Free Audit" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
  { href: "/privacy", label: "Privacy" },
];

export function PublicFooter() {
  return (
    <footer
      style={{
        padding: "80px 24px",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div
        className="mx-auto flex max-w-[1200px] items-center justify-between"
      >
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
          }}
        >
          &copy; 2026 Citare
        </p>
        <div className="flex items-center gap-6">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 200ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
