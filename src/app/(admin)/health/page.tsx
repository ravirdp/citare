"use client";

import { Suspense, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceCheck {
  name: string;
  status: "healthy" | "error";
  responseTimeMs: number;
  error?: string;
}

interface HealthData {
  services: ServiceCheck[];
  checkedAt: string;
}

interface ModelRouting {
  tier_one: string;
  tier_two: string;
  tier_three: string;
}

interface FailoverConfig {
  ai_primary: string;
  ai_backup: string;
}

const MODEL_OPTIONS = [
  { value: "claude-opus-4-0-20250514", label: "Claude Opus 4" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

function HealthContent() {
  const queryClient = useQueryClient();

  const { data: healthData, isLoading: healthLoading } = useQuery<HealthData>({
    queryKey: ["admin-health"],
    queryFn: async () => {
      const res = await fetch("/api/admin/health");
      if (!res.ok) throw new Error("Failed to fetch health");
      return res.json();
    },
    // FIX: Removed refetchInterval: 30000 — was causing ~8,640 Redis commands/day
    // per open browser tab (health check pings Redis every 30s, plus model-routing
    // and failover queries). Use manual refresh instead to stay within Upstash budget.
    refetchOnWindowFocus: false,
  });

  const { data: routingData } = useQuery<{ config: ModelRouting }>({
    queryKey: ["admin-model-routing"],
    queryFn: async () => {
      const res = await fetch("/api/admin/model-routing");
      if (!res.ok) throw new Error("Failed to fetch routing");
      return res.json();
    },
  });

  const { data: failoverData } = useQuery<{ config: FailoverConfig }>({
    queryKey: ["admin-failover"],
    queryFn: async () => {
      const res = await fetch("/api/admin/failover");
      if (!res.ok) throw new Error("Failed to fetch failover");
      return res.json();
    },
  });

  const routingMutation = useMutation({
    mutationFn: async (update: Partial<ModelRouting>) => {
      const res = await fetch("/api/admin/model-routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update routing");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-model-routing"] });
    },
  });

  const failoverMutation = useMutation({
    mutationFn: async (update: Partial<FailoverConfig>) => {
      const res = await fetch("/api/admin/failover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed to update failover");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-failover"] });
    },
  });

  const routing = routingData?.config ?? {
    tier_one: "claude-opus-4-0-20250514",
    tier_two: "claude-sonnet-4-20250514",
    tier_three: "claude-haiku-4-5-20251001",
  };

  const failover = failoverData?.config ?? {
    ai_primary: "anthropic",
    ai_backup: "openai",
  };

  const healthyCount =
    healthData?.services.filter((s) => s.status === "healthy").length ?? 0;
  const totalCount = healthData?.services.length ?? 0;

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6">
          <h1
            className="text-[length:var(--text-xl)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            System Health
          </h1>
          <p
            className="mt-1 text-[length:var(--text-sm)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Service status, model routing, and failover configuration
          </p>
        </div>

        {/* Service Status Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {healthLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card
                  key={i}
                  className="border"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <CardContent className="p-5">
                    <div
                      className="h-4 w-24 animate-pulse rounded"
                      style={{ background: "var(--bg-tertiary)" }}
                    />
                    <div
                      className="mt-3 h-6 w-16 animate-pulse rounded"
                      style={{ background: "var(--bg-tertiary)" }}
                    />
                  </CardContent>
                </Card>
              ))
            : healthData?.services.map((service) => (
                <Card
                  key={service.name}
                  className="border"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[length:var(--text-sm)] font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {service.name}
                      </span>
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{
                          background:
                            service.status === "healthy"
                              ? "var(--status-green)"
                              : "var(--status-red)",
                          boxShadow:
                            service.status === "healthy"
                              ? "0 0 8px var(--status-green)"
                              : "0 0 8px var(--status-red)",
                        }}
                      />
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span
                        className="font-mono text-[length:var(--text-lg)] font-bold"
                        style={{
                          color:
                            service.status === "healthy"
                              ? "var(--status-green)"
                              : "var(--status-red)",
                        }}
                      >
                        {service.status === "healthy" ? "Healthy" : "Error"}
                      </span>
                      {service.responseTimeMs > 0 && (
                        <span
                          className="font-mono text-[length:var(--text-xs)]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {service.responseTimeMs}ms
                        </span>
                      )}
                    </div>
                    {service.error && (
                      <p
                        className="mt-2 text-[length:var(--text-xs)]"
                        style={{ color: "var(--status-red)" }}
                      >
                        {service.error}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        {healthData && (
          <p
            className="mb-8 text-[length:var(--text-xs)]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Last checked: {new Date(healthData.checkedAt).toLocaleString()} --{" "}
            {healthyCount}/{totalCount} services healthy
          </p>
        )}

        {/* Model Routing */}
        <div className="mb-8">
          <h2
            className="mb-4 text-[length:var(--text-md)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Model Routing
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(
              [
                {
                  key: "tier_one" as const,
                  label: "Tier One (Strategist)",
                },
                { key: "tier_two" as const, label: "Tier Two (Worker)" },
                { key: "tier_three" as const, label: "Tier Three (Scout)" },
              ] as const
            ).map(({ key, label }) => (
              <Card
                key={key}
                className="border"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <CardContent className="p-5">
                  <label
                    className="mb-2 block text-[length:var(--text-xs)] uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {label}
                  </label>
                  <Select
                    value={routing[key]}
                    onValueChange={(value) =>
                      routingMutation.mutate({ [key]: value })
                    }
                  >
                    <SelectTrigger
                      className="border font-mono text-[length:var(--text-sm)]"
                      style={{
                        background: "var(--bg-tertiary)",
                        borderColor: "var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-default)",
                      }}
                    >
                      {MODEL_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="font-mono text-[length:var(--text-sm)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Failover Config */}
        <div>
          <h2
            className="mb-4 text-[length:var(--text-md)] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Failover Configuration
          </h2>
          <Card
            className="border"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                <div className="flex items-center gap-3">
                  <label
                    className="text-[length:var(--text-sm)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Primary AI Provider
                  </label>
                  <Select
                    value={failover.ai_primary}
                    onValueChange={(value) =>
                      failoverMutation.mutate({ ai_primary: value })
                    }
                  >
                    <SelectTrigger
                      className="w-[160px] border font-mono text-[length:var(--text-sm)]"
                      style={{
                        background: "var(--bg-tertiary)",
                        borderColor: "var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-default)",
                      }}
                    >
                      <SelectItem
                        value="anthropic"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Anthropic
                      </SelectItem>
                      <SelectItem
                        value="openai"
                        style={{ color: "var(--text-primary)" }}
                      >
                        OpenAI
                      </SelectItem>
                      <SelectItem
                        value="google"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Google
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <label
                    className="text-[length:var(--text-sm)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Backup AI Provider
                  </label>
                  <Select
                    value={failover.ai_backup}
                    onValueChange={(value) =>
                      failoverMutation.mutate({ ai_backup: value })
                    }
                  >
                    <SelectTrigger
                      className="w-[160px] border font-mono text-[length:var(--text-sm)]"
                      style={{
                        background: "var(--bg-tertiary)",
                        borderColor: "var(--border-default)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "var(--bg-secondary)",
                        borderColor: "var(--border-default)",
                      }}
                    >
                      <SelectItem
                        value="anthropic"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Anthropic
                      </SelectItem>
                      <SelectItem
                        value="openai"
                        style={{ color: "var(--text-primary)" }}
                      >
                        OpenAI
                      </SelectItem>
                      <SelectItem
                        value="google"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Google
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={failover.ai_backup !== "none"}
                    onCheckedChange={(checked) =>
                      failoverMutation.mutate({
                        ai_backup: checked ? "openai" : "none",
                      })
                    }
                  />
                  <label
                    className="text-[length:var(--text-sm)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Failover Enabled
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function HealthPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "var(--bg-primary)" }}
        >
          <span style={{ color: "var(--text-tertiary)" }}>Loading...</span>
        </div>
      }
    >
      <HealthContent />
    </Suspense>
  );
}
