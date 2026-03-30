"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, CreditCard } from "lucide-react";

interface AgencySidebarProps {
  agencyName: string;
  agencyLogoUrl?: string | null;
}

const NAV_ITEMS = [
  { label: "Clients", href: "/agency/clients", icon: Users },
  { label: "Settings", href: "/agency/settings", icon: Settings },
  { label: "Billing", href: "/agency/billing", icon: CreditCard },
];

export function AgencySidebar({ agencyName, agencyLogoUrl }: AgencySidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 240,
        height: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {agencyLogoUrl ? (
          <img
            src={agencyLogoUrl}
            alt={agencyName}
            style={{
              maxHeight: 32,
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <span
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "var(--accent-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {agencyName}
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "8px 8px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: isActive
                  ? "var(--accent-primary)"
                  : "var(--text-secondary)",
                background: isActive ? "var(--accent-subtle)" : "transparent",
                textDecoration: "none",
                transition: "background 200ms ease, color 200ms ease",
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <Link
          href="/overview"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textDecoration: "none",
          }}
        >
          Dashboard
        </Link>
      </div>
    </aside>
  );
}
