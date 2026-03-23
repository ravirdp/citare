"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

function AgencySettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/agency/settings");
        const data = await res.json();
        if (res.ok && data.agency) {
          setName(data.agency.name ?? "");
          setSlug(data.agency.slug ?? "");
          const branding = (data.agency.branding ?? {}) as Record<string, string>;
          setAccentColor(branding.accent_color ?? "");
          setLogoUrl(branding.logo_url ?? "");
        }
      } catch {
        setMessage({ type: "error", text: "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const branding: Record<string, string> = {};
      if (accentColor) branding.accent_color = accentColor;
      if (logoUrl) branding.logo_url = logoUrl;

      const res = await fetch("/api/agency/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, branding }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
        return;
      }
      setMessage({ type: "success", text: "Settings saved successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
        Loading settings...
      </div>
    );
  }

  return (
    <Card
      className="border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
        maxWidth: 600,
      }}
    >
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="agency-name" style={{ color: "var(--text-secondary)" }}>
              Agency Name
            </Label>
            <Input
              id="agency-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agency-slug" style={{ color: "var(--text-secondary)" }}>
              Slug (read-only)
            </Label>
            <Input
              id="agency-slug"
              value={slug}
              readOnly
              disabled
              style={{
                background: "var(--bg-tertiary)",
                borderColor: "var(--border-default)",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
              }}
            />
          </div>

          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 24,
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-base)",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Branding
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accent-color" style={{ color: "var(--text-secondary)" }}>
                  Accent Color
                </Label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Input
                    id="accent-color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="#00D4AA"
                    style={{
                      background: "var(--bg-tertiary)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-body)",
                      flex: 1,
                    }}
                  />
                  {accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor) && (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: accentColor,
                        border: "1px solid var(--border-default)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo-url" style={{ color: "var(--text-secondary)" }}>
                  Logo URL
                </Label>
                <Input
                  id="logo-url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: "var(--text-sm)",
                color: message.type === "success" ? "var(--status-green)" : "var(--status-red)",
                background:
                  message.type === "success"
                    ? "rgba(52, 211, 153, 0.1)"
                    : "rgba(248, 113, 113, 0.1)",
              }}
            >
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="text-[length:var(--text-sm)]"
            style={{
              background: "var(--accent-primary)",
              color: "var(--text-inverse)",
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AgencySettingsPage() {
  return (
    <div>
      <h1
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Agency Settings
      </h1>
      <Suspense
        fallback={
          <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            Loading...
          </div>
        }
      >
        <AgencySettingsForm />
      </Suspense>
    </div>
  );
}
