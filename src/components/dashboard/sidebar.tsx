"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LayoutDashboard, Layers, Users, Activity, Lightbulb, TrendingUp, FileText, CreditCard, Plug, LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { ClientSelector } from "./client-selector";

interface ClientAgencyBranding {
  name: string;
  accent?: string;
  logo?: string;
}

interface SidebarProps {
  clients: Array<{ id: string; name: string; slug: string }>;
  clientAgencyMap: Record<string, ClientAgencyBranding>;
}

const NAV_ITEMS = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
  { label: "Services", href: "/services", icon: Layers },
  { label: "Competitors", href: "/competitors", icon: Users },
  { label: "Monitoring", href: "/monitoring", icon: Activity },
  { label: "Recommendations", href: "/recommendations", icon: Lightbulb },
  { label: "Impact", href: "/impact", icon: TrendingUp },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Connections", href: "/connections", icon: Plug },
];

export function Sidebar({ clients, clientAgencyMap }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get("clientId") ?? clients[0]?.id ?? "";
  const queryString = clientIdParam ? `?clientId=${clientIdParam}` : "";

  // Resolve branding from the selected client's agency
  const branding = clientIdParam ? clientAgencyMap[clientIdParam] : undefined;
  const [currentBranding, setCurrentBranding] = useState(branding);

  // Dynamically inject accent color CSS variable when client selection changes
  useEffect(() => {
    const b = clientIdParam ? clientAgencyMap[clientIdParam] : undefined;
    setCurrentBranding(b);

    if (b?.accent) {
      document.documentElement.style.setProperty("--accent-primary", b.accent);
      document.documentElement.style.setProperty("--accent-hover", b.accent);
    } else {
      // Revert to default Citare teal
      document.documentElement.style.removeProperty("--accent-primary");
      document.documentElement.style.removeProperty("--accent-hover");
    }
  }, [clientIdParam, clientAgencyMap]);

  const displayName = currentBranding?.name ?? "Citare";
  const logoUrl = currentBranding?.logo;

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
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={displayName}
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
            {displayName}
          </span>
        )}
        {currentBranding && (
          <span
            style={{
              display: "block",
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
              marginTop: 4,
            }}
          >
            Powered by Citare
          </span>
        )}
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
              href={`${item.href}${queryString}`}
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
          href="/clients"
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textDecoration: "none",
          }}
        >
          Admin
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
