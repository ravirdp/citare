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
  agencyName: string | null;
  dataSources: Array<{
    id: string;
    sourceType: string;
    status: string | null;
    lastSyncAt: string | null;
  }>;
  knowledgeGraph: {
    version: number | null;
    lastStrategistRun: string | null;
  } | null;
  presenceFormats: Array<{
    format: string;
    status: string | null;
    deploymentUrl: string | null;
    lastDeployedAt: string | null;
  }>;
}

const STATUS_TABS = ["all", "onboarding", "active", "paused", "churned"] as const;
type StatusFilter = (typeof STATUS_TABS)[number];

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
  const [synthesizing, setSynthesizing] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [generatingQueries, setGeneratingQueries] = useState<string | null>(null);
  const [runningMonitoring, setRunningMonitoring] = useState<string | null>(null);
  const [computingScores, setComputingScores] = useState<string | null>(null);
  const [runningFeedback, setRunningFeedback] = useState<string | null>(null);
  const [generatingRecs, setGeneratingRecs] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  async function handleSynthesize(clientId: string) {
    setSynthesizing(clientId);
    try {
      const res = await fetch(`/api/kg/${clientId}/synthesize`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 202) {
        alert(`Awaiting simulation: ${data.promptPath}`);
      } else if (data.status === "created" || data.status === "updated") {
        window.location.reload();
      } else {
        alert(`Synthesis failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setSynthesizing(null);
    }
  }

  async function handleGenerate(clientId: string) {
    setGenerating(clientId);
    try {
      const res = await fetch(`/api/presence/${clientId}/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert(`Generated: ${data.summary.generated}, Unchanged: ${data.summary.unchanged}, Errors: ${data.summary.errors}`);
        window.location.reload();
      } else {
        alert(`Generation failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setGenerating(null);
    }
  }

  async function handleDeploy(clientId: string) {
    setDeploying(clientId);
    try {
      const res = await fetch(`/api/presence/${clientId}/deploy`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert(`Deployed: ${data.deployed.join(", ")}`);
        window.location.reload();
      } else {
        alert(`Deploy failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setDeploying(null);
    }
  }

  async function handleGenerateQueries(clientId: string) {
    setGeneratingQueries(clientId);
    try {
      const res = await fetch(`/api/monitor/queries/${clientId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Generated ${data.generated} queries`);
        window.location.reload();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setGeneratingQueries(null);
    }
  }

  async function handleRunMonitoring(clientId: string) {
    setRunningMonitoring(clientId);
    try {
      const res = await fetch(`/api/monitor/run/${clientId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(`Monitoring complete: ${data.resultsStored} results stored`);
        // Auto-compute scores
        setComputingScores(clientId);
        await fetch(`/api/monitor/scores/${clientId}`, { method: "POST" });
        setComputingScores(null);
        window.location.reload();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setRunningMonitoring(null);
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

  const filteredClients =
    statusFilter === "all"
      ? clients
      : clients.filter((c) => (c.status ?? "onboarding") === statusFilter);

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            style={{
              padding: "6px 16px",
              borderRadius: 6,
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              background: statusFilter === tab ? "var(--accent-muted)" : "transparent",
              color: statusFilter === tab ? "var(--accent-primary)" : "var(--text-tertiary)",
              textTransform: "capitalize",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {tab === "all" ? `All (${clients.length})` : `${tab} (${clients.filter((c) => (c.status ?? "onboarding") === tab).length})`}
          </button>
        ))}
      </div>

      {filteredClients.map((client) => (
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
                  {client.slug} · {client.businessType} · {client.agencyName ?? "Direct"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSynthesize(client.id)}
                  disabled={
                    synthesizing === client.id ||
                    client.dataSources.length === 0
                  }
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  {synthesizing === client.id
                    ? "Synthesizing..."
                    : "Synthesize KG"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate(client.id)}
                  disabled={
                    generating === client.id ||
                    !client.knowledgeGraph
                  }
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  {generating === client.id
                    ? "Generating..."
                    : "Generate Presence"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeploy(client.id)}
                  disabled={
                    deploying === client.id ||
                    client.presenceFormats.length === 0
                  }
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  {deploying === client.id ? "Deploying..." : "Deploy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateQueries(client.id)}
                  disabled={
                    generatingQueries === client.id ||
                    !client.knowledgeGraph
                  }
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  {generatingQueries === client.id
                    ? "Generating..."
                    : "Generate Queries"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRunMonitoring(client.id)}
                  disabled={
                    runningMonitoring === client.id ||
                    computingScores === client.id
                  }
                  className="text-[length:var(--text-sm)]"
                  style={{
                    background: "var(--accent-primary)",
                    color: "var(--text-inverse)",
                  }}
                >
                  {runningMonitoring === client.id
                    ? "Running..."
                    : computingScores === client.id
                      ? "Scoring..."
                      : "Run Monitoring"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setGeneratingRecs(client.id);
                    try {
                      const res = await fetch(
                        `/api/dashboard/${client.id}/recommendations/generate`,
                        { method: "POST" }
                      );
                      const data = await res.json();
                      if (data.error) {
                        alert(`Error: ${data.error}`);
                      } else {
                        alert(
                          `Generated ${data.generated} recommendations (${data.new} new, ${data.duplicatesSkipped} duplicates skipped)`
                        );
                      }
                    } catch (err) {
                      alert(`Error: ${err}`);
                    } finally {
                      setGeneratingRecs(null);
                    }
                  }}
                  disabled={generatingRecs === client.id}
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  {generatingRecs === client.id
                    ? "Generating..."
                    : "Generate Recs"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setRunningFeedback(client.id);
                    try {
                      const res = await fetch(
                        `/api/feedback/${client.id}/run`,
                        { method: "POST" }
                      );
                      const data = await res.json();
                      if (data.skippedDueToCooldown) {
                        alert("Feedback loop skipped — cooldown active");
                      } else {
                        alert(
                          `Feedback loop: ${data.recommendationsGenerated} recs, ${data.autoApplied} auto-applied`
                        );
                      }
                    } catch (err) {
                      alert(`Error: ${err}`);
                    } finally {
                      setRunningFeedback(null);
                    }
                  }}
                  disabled={runningFeedback === client.id}
                  className="border text-[length:var(--text-sm)]"
                  style={{
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                    background: "transparent",
                  }}
                >
                  {runningFeedback === client.id
                    ? "Running..."
                    : "Feedback Loop"}
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

            {/* KG Status */}
            {client.knowledgeGraph && (
              <div
                className="mt-3 flex items-center gap-2 text-[length:var(--text-xs)]"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "var(--status-green)" }}
                />
                KG v{client.knowledgeGraph.version}
                {client.knowledgeGraph.lastStrategistRun && (
                  <span style={{ color: "var(--text-tertiary)" }}>
                    · Last run:{" "}
                    {new Date(client.knowledgeGraph.lastStrategistRun).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Presence Status */}
            {client.presenceFormats.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {client.presenceFormats.map((pf) => (
                  <span
                    key={pf.format}
                    className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[length:var(--text-xs)]"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        background:
                          pf.status === "deployed"
                            ? "var(--status-green)"
                            : pf.status === "draft"
                              ? "var(--status-yellow)"
                              : "var(--text-tertiary)",
                      }}
                    />
                    {pf.format.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
