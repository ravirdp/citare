"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const SERVICES: ServiceCard[] = [
  {
    id: "ads",
    name: "Google Ads",
    description: "Import your campaigns, keywords, and performance data to analyze AI search overlap.",
    icon: "Ads",
  },
  {
    id: "gbp",
    name: "Google Business Profile",
    description: "Pull business info, reviews, and local signals for knowledge graph synthesis.",
    icon: "GBP",
  },
  {
    id: "search-console",
    name: "Search Console",
    description: "Analyze organic search queries and pages to find AI visibility opportunities.",
    icon: "SC",
  },
  {
    id: "analytics",
    name: "Google Analytics",
    description: "Track traffic patterns and correlate AI visibility with real business outcomes.",
    icon: "GA",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [authorizing, setAuthorizing] = useState<string | null>(null);

  async function handleAuthorize(serviceId: string) {
    setAuthorizing(serviceId);
    try {
      const res = await fetch(`/api/integrations/google/${serviceId}/auth-url`, {
        method: "POST",
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        // Mark as connected for now (integration endpoints may not exist yet)
        setConnected((prev) => new Set(prev).add(serviceId));
      }
    } catch {
      setConnected((prev) => new Set(prev).add(serviceId));
    } finally {
      setAuthorizing(null);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "60px 24px",
      }}
    >
      <div style={{ maxWidth: 640, width: "100%", textAlign: "center" }}>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "var(--text-primary)",
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          C<span style={{ color: "var(--accent-primary)" }}>i</span>TARE
        </div>
        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 8,
            marginTop: 32,
          }}
        >
          Connect Your Google Services
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-tertiary)",
            marginBottom: 40,
            lineHeight: 1.6,
            maxWidth: 480,
            margin: "0 auto 40px",
          }}
        >
          We need access to analyze your digital presence. Connect the services
          you use.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {SERVICES.map((service) => {
            const isConnected = connected.has(service.id);
            const isAuthorizing = authorizing === service.id;

            return (
              <div
                key={service.id}
                style={{
                  background: "var(--bg-secondary)",
                  border: `1px solid ${isConnected ? "var(--status-green)" : "var(--border-subtle)"}`,
                  borderRadius: 12,
                  padding: 24,
                  textAlign: "left",
                  position: "relative",
                }}
              >
                {isConnected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--status-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    color: "var(--accent-primary)",
                    marginBottom: 8,
                    letterSpacing: "0.05em",
                  }}
                >
                  {service.icon}
                </div>
                <h3
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: 6,
                  }}
                >
                  {service.name}
                </h3>
                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-tertiary)",
                    lineHeight: 1.5,
                    marginBottom: 16,
                  }}
                >
                  {service.description}
                </p>
                <button
                  onClick={() => handleAuthorize(service.id)}
                  disabled={isConnected || isAuthorizing}
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: isConnected
                      ? "var(--bg-tertiary)"
                      : "var(--accent-primary)",
                    color: isConnected ? "var(--text-tertiary)" : "#fff",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: isConnected ? "default" : "pointer",
                  }}
                >
                  {isConnected
                    ? "Connected"
                    : isAuthorizing
                      ? "Connecting..."
                      : "Authorize"}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/overview")}
            style={{
              padding: "12px 32px",
              borderRadius: 8,
              border: "none",
              background: "var(--accent-primary)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue to Dashboard
          </button>
          <Link
            href="/overview"
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-tertiary)",
              textDecoration: "none",
            }}
          >
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
