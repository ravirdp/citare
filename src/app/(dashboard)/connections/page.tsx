"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface ServiceCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  sourceType: string;
}

const SERVICES: ServiceCard[] = [
  {
    id: "ads",
    name: "Google Ads",
    description: "Import your campaigns, keywords, and performance data to analyze AI search overlap.",
    icon: "Ads",
    sourceType: "google_ads",
  },
  {
    id: "gbp",
    name: "Google Business Profile",
    description: "Pull business info, reviews, and local signals for knowledge graph synthesis.",
    icon: "GBP",
    sourceType: "gbp",
  },
  {
    id: "search-console",
    name: "Search Console",
    description: "Analyze organic search queries and pages to find AI visibility opportunities.",
    icon: "SC",
    sourceType: "search_console",
  },
  {
    id: "analytics",
    name: "Google Analytics",
    description: "Track traffic patterns and correlate AI visibility with real business outcomes.",
    icon: "GA",
    sourceType: "analytics",
  },
];

export default function ConnectionsPage() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [authorizing, setAuthorizing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConnectedServices = useCallback(async () => {
    try {
      const res = await fetch("/api/connections/status");
      if (res.ok) {
        const data = await res.json();
        const connectedIds = new Set<string>();
        for (const source of data.sources ?? []) {
          const service = SERVICES.find((s) => s.sourceType === source.sourceType);
          if (service && (source.status === "connected" || source.status === "active")) {
            connectedIds.add(service.id);
          }
        }
        setConnected(connectedIds);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectedServices();
  }, [fetchConnectedServices]);

  // Refetch when redirected back from OAuth with ?connected=serviceId
  useEffect(() => {
    if (searchParams.get("connected")) {
      fetchConnectedServices();
    }
  }, [searchParams, fetchConnectedServices]);

  async function handleConnect(serviceId: string) {
    setAuthorizing(serviceId);
    try {
      const res = await fetch(`/api/integrations/google/${serviceId}/auth-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/connections" }),
      });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch {
      // Failed to initiate OAuth
    } finally {
      setAuthorizing(null);
    }
  }

  const connectedCount = connected.size;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Connected Services
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-tertiary)",
            lineHeight: 1.6,
          }}
        >
          Manage your Google service connections. Connect more services to improve your AI visibility analysis.
        </p>
        {connectedCount > 0 && !loading && (
          <p
            style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-tertiary)",
              marginTop: 8,
            }}
          >
            {connectedCount} of {SERVICES.length} services connected
          </p>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          opacity: loading ? 0.6 : 1,
          transition: "opacity 0.2s",
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
                borderRadius: "var(--radius-lg)",
                padding: 24,
                position: "relative",
                transition: "border-color 200ms ease, transform 200ms ease",
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
                  marginBottom: 4,
                }}
              >
                {service.name}
              </h3>
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: isConnected ? "var(--status-green)" : "var(--text-tertiary)",
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {isConnected ? "Connected" : "Not connected"}
              </p>
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
              {isConnected ? (
                <button
                  disabled
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid var(--border-subtle)",
                    background: "transparent",
                    color: "var(--text-tertiary)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: "not-allowed",
                  }}
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(service.id)}
                  disabled={isAuthorizing}
                  style={{
                    width: "100%",
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--accent-primary)",
                    color: "#fff",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    cursor: isAuthorizing ? "wait" : "pointer",
                  }}
                >
                  {isAuthorizing ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
