const NAV_LINKS = [
  { href: "/audit", label: "Free Audit" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
];

export function PublicNavbar({ active }: { active?: string }) {
  return (
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
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm"
              style={{
                color: active === link.href ? "var(--accent-primary)" : "var(--text-secondary)",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
