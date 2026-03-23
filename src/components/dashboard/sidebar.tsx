"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LayoutDashboard, Layers, Users, Activity } from "lucide-react";
import { ClientSelector } from "./client-selector";

interface SidebarProps {
  clients: Array<{ id: string; name: string; slug: string }>;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Services", href: "/services", icon: Layers },
  { label: "Competitors", href: "/competitors", icon: Users },
  { label: "Monitoring", href: "/monitoring", icon: Activity },
];

export function Sidebar({ clients }: SidebarProps) {
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
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 12px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            color: "var(--accent-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Citare
        </span>
      </div>

      {/* Client selector */}
      <div style={{ padding: "12px 16px" }}>
        <Suspense
          fallback={
            <div
              style={{
                height: 36,
                background: "var(--bg-tertiary)",
                borderRadius: 6,
              }}
            />
          }
        >
          <ClientSelector clients={clients} />
        </Suspense>
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
                background: isActive ? "var(--accent-muted)" : "transparent",
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                marginBottom: 2,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin link */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <Link
          href="/clients"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textDecoration: "none",
          }}
        >
          Admin
        </Link>
      </div>
    </aside>
  );
}
