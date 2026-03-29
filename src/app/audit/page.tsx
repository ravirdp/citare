"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PublicNavbar } from "@/components/public/navbar";

function AuditForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") ?? "");
  const [businessName, setBusinessName] = useState(searchParams.get("businessName") ?? "");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCity, setContactCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !businessName.trim() || !contactName.trim() || !contactEmail.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/audit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          businessName: businessName.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
          contactCity: contactCity.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Audit failed");
      }

      const report = await res.json();
      router.push(`/audit/${report.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid var(--border-subtle)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "var(--text-sm)",
    outline: "none",
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: "var(--text-sm)",
    color: "var(--text-secondary)",
    marginBottom: 6,
    fontWeight: 500,
  } as const;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <PublicNavbar active="/audit" />
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Free AI Search Audit
        </h1>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--text-tertiary)",
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          See how visible your business is to AI search platforms like ChatGPT,
          Perplexity, and Google AI Overviews. Get a GEO Score with actionable
          recommendations.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: 32,
            textAlign: "left",
          }}
        >
          {/* Business details */}
          <label style={labelStyle}>Website URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            required
            style={{ ...inputStyle, marginBottom: 16 }}
          />

          <label style={labelStyle}>Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Acme Corp"
            required
            style={{ ...inputStyle, marginBottom: 24 }}
          />

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              marginBottom: 20,
            }}
          />

          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            Where should we send your report?
          </p>

          {/* Contact fields — name and email side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Your Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="john@example.com"
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* Optional fields — phone and city side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ ...labelStyle, color: "var(--text-tertiary)" }}>
                Phone <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98765 43210"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "var(--text-tertiary)" }}>
                City <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={contactCity}
                onChange={(e) => setContactCity(e.target.value)}
                placeholder="Mumbai"
                style={inputStyle}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                color: "var(--status-red)",
                fontSize: "var(--text-sm)",
                marginBottom: 16,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.1)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: loading ? "var(--border-subtle)" : "var(--accent-primary)",
              color: "#fff",
              fontSize: "var(--text-sm)",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Analyzing... (this may take 30-60 seconds)" : "Analyze My AI Visibility"}
          </button>
        </form>

        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            marginTop: 24,
          }}
        >
          No login required. Your report will be shareable via a unique link.
        </p>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-tertiary)",
          }}
        >
          Loading...
        </div>
      }
    >
      <AuditForm />
    </Suspense>
  );
}
