"use client";

import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/audit", label: "Free Audit" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
];

export function PublicNavbar({ active }: { active?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 right-0 left-0 z-50"
      style={{
        background: scrolled ? "rgba(17, 17, 17, 0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-subtle)" : "1px solid transparent",
        transition: "background 300ms ease, border-color 300ms ease, backdrop-filter 300ms ease",
      }}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <a
          href="/"
          className="text-xl font-bold tracking-[0.05em] uppercase"
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            transition: "color 200ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
        >
          C<span style={{ color: "var(--accent-primary)" }}>i</span>tare
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 4,
          }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M3 12h18M3 6h18M3 18h18" />
            )}
          </svg>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm"
              style={{
                color: active === link.href ? "var(--accent-primary)" : "var(--text-secondary)",
                textDecoration: "none",
                transition: "color 200ms ease",
              }}
              onMouseEnter={(e) => {
                if (active !== link.href) e.currentTarget.style.color = "var(--accent-primary)";
              }}
              onMouseLeave={(e) => {
                if (active !== link.href) e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{
            background: "rgba(17, 17, 17, 0.95)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid var(--border-subtle)",
            padding: "16px 24px",
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block py-3 text-sm"
              style={{
                color: active === link.href ? "var(--accent-primary)" : "var(--text-secondary)",
                textDecoration: "none",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
