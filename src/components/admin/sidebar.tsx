"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Building2, Activity, DollarSign, CreditCard, FileText, LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const NAV_ITEMS = [
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Agencies", href: "/agencies", icon: Building2 },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Health", href: "/health", icon: Activity },
  { label: "Costs", href: "/costs", icon: DollarSign },
  { label: "Blog", href: "/manage-blog", icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
        <span
          style={{
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            color: "var(--accent-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Super Admin
        </span>
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
          Back to Dashboard
        </Link>
        <button
          onClick={async () => {
            const supabase = createBrowserClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            await supabase.auth.signOut();
            router.push("/");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </aside>
  );
}
