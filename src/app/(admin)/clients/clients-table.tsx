"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ClientWithSources {
  id: string;
  name: string;
  slug: string;
  businessType: string;
  status: string | null;
  dataSources: Array<{
    id: string;
    sourceType: string;
    status: string | null;
    lastSyncAt: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  active: "var(--status-green)",
  connected: "var(--status-blue)",
  syncing: "var(--status-yellow)",
  error: "var(--status-red)",
  pending: "var(--text-tertiary)",
  disconnected: "var(--text-tertiary)",
};

export function ClientsTable({ clients }: { clients: ClientWithSources[] }) {
  const [ingesting, setIngesting] = useState<string | null>(null);

  async function handleConnect(clientId: string) {
    window.location.href = `/api/auth/google?clientId=${clientId}`;
  }

  async function handleIngest(clientId: string) {
    setIngesting(clientId);
    try {
      const res = await fetch("/api/ingest/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(`Ingestion failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setIngesting(null);
    }
  }

  if (clients.length === 0) {
    return (
      <Card
        className="border"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <CardContent className="py-12 text-center">
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            No clients yet. Create a client in Supabase to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <Card
          key={client.id}
          className="border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-[length:var(--text-md)] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {client.name}
                </h2>
                <p
                  className="text-[length:var(--text-xs)]"
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {client.slug} · {client.businessType}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConnect(client.id)}
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  Connect Google
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleIngest(client.id)}
                  disabled={
                    ingesting === client.id ||
                    client.dataSources.length === 0
                  }
                  className="text-[length:var(--text-sm)]"
                  style={{
                    background: "var(--accent-primary)",
                    color: "var(--text-inverse)",
                  }}
                >
                  {ingesting === client.id
                    ? "Ingesting..."
                    : "Trigger Ingestion"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {client.dataSources.length === 0 ? (
              <p
                className="text-[length:var(--text-sm)]"
                style={{ color: "var(--text-tertiary)" }}
              >
                No data sources connected
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {client.dataSources.map((ds) => (
                  <div
                    key={ds.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{
                        background:
                          STATUS_COLORS[ds.status ?? "pending"] ??
                          "var(--text-tertiary)",
                      }}
                    />
                    <span
                      className="text-[length:var(--text-xs)]"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {ds.sourceType}
                    </span>
                    <span
                      className="text-[length:var(--text-xs)]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {ds.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
