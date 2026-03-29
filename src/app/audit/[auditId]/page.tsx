"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { AuditReport } from "@/lib/analysis/types";
import { PublicNavbar } from "@/components/public/navbar";

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "var(--status-green)" : score >= 45 ? "var(--status-yellow)" : "var(--status-red)";

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={8}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.28}
        fontWeight={700}
        fontFamily="var(--font-body)"
      >
        {score}
      </text>
    </svg>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    critical: { bg: "rgba(239,68,68,0.15)", text: "var(--status-red)" },
    high: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
    medium: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" },
    low: { bg: "rgba(107,114,128,0.15)", text: "var(--text-tertiary)" },
  };
  const c = colors[severity] ?? colors.low;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        textTransform: "uppercase",
        background: c.bg,
        color: c.text,
      }}
    >
      {severity}
    </span>
  );
}

function BreakdownBar({ label, score, weight }: { label: string; score: number; weight: string }) {
  const color =
    score >= 70 ? "var(--status-green)" : score >= 45 ? "var(--status-yellow)" : "var(--status-red)";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          {label} <span style={{ color: "var(--text-tertiary)" }}>({weight})</span>
        </span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color }}>{score}/100</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            borderRadius: 3,
            background: color,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function AuditReportPage() {
  const params = useParams();
  const auditId = params.auditId as string;
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/audit/${auditId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Audit not found");
        return res.json();
      })
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auditId]);

  if (loading) {
    return (
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
        Loading audit report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--status-red)",
          gap: 16,
        }}
      >
        <p>{error || "Report not found"}</p>
        <Link
          href="/audit"
          style={{
            color: "var(--accent-primary)",
            textDecoration: "underline",
            fontSize: "var(--text-sm)",
          }}
        >
          Run a new audit
        </Link>
      </div>
    );
  }

  const { geoScore, citability, crawlerAccess, brandAuthority, schemaDetection, actionItems } = report;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        padding: "40px 24px",
        paddingTop: 80,
      }}
    >
      <PublicNavbar active="/audit" />
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: "var(--text-xl)",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 4,
            }}
          >
            AI Search Audit Report
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
            {report.businessName} &mdash; {report.url}
          </p>
        </div>

        {/* GEO Score */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            GEO Score
          </h2>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ScoreRing score={geoScore.overall} size={140} />
          </div>
          <BreakdownBar label="Content Citability" score={geoScore.breakdown.citability} weight="25%" />
          <BreakdownBar label="Content Structure" score={geoScore.breakdown.contentStructure} weight="25%" />
          <BreakdownBar label="Brand Authority" score={geoScore.breakdown.brandAuthority} weight="20%" />
          <BreakdownBar label="AI Crawler Access" score={geoScore.breakdown.crawlerAccess} weight="15%" />
          <BreakdownBar label="Schema Completeness" score={geoScore.breakdown.schemaCompleteness} weight="15%" />
        </div>

        {/* Action Items */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-md)",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            Priority Action Items
          </h2>
          {actionItems.length === 0 ? (
            <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
              No critical issues found. Your site is well-optimized for AI search.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {actionItems.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-primary)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <SeverityBadge severity={item.severity} />
                    <span
                      style={{
                        fontSize: "var(--text-sm)",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {/* Citability */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Content Citability
            </h3>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {citability.averageScore}
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: 0 }}>
              {citability.totalBlocksAnalyzed} blocks analyzed &middot; {citability.optimalLengthPassages} optimal length
            </p>
          </div>

          {/* Crawler Access */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              AI Crawler Access
            </h3>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 4,
                color:
                  crawlerAccess.overallStatus === "all_allowed"
                    ? "var(--status-green)"
                    : crawlerAccess.overallStatus === "some_blocked"
                      ? "var(--status-yellow)"
                      : "var(--status-red)",
              }}
            >
              {crawlerAccess.overallStatus === "all_allowed"
                ? "Open"
                : crawlerAccess.overallStatus === "some_blocked"
                  ? "Partial"
                  : "Blocked"}
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: 0 }}>
              {crawlerAccess.blockedCount} blocked &middot; {crawlerAccess.criticalCount} critical
              {crawlerAccess.robotsTxtFound ? "" : " &middot; No robots.txt found"}
            </p>
          </div>

          {/* Brand Authority */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Brand Authority
            </h3>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {brandAuthority.overallScore}
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: 0 }}>
              {brandAuthority.platformBreakdown.length} platforms scanned
            </p>
          </div>

          {/* Schema */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>
              Schema.org Markup
            </h3>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
              {schemaDetection.completenessScore}%
            </div>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: 0 }}>
              {schemaDetection.schemas.length > 0
                ? schemaDetection.schemas.join(", ")
                : "No schemas detected"}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, var(--accent-primary), #0ea5e9)",
            borderRadius: 12,
            padding: 32,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            Want continuous monitoring?
          </h2>
          <p
            style={{
              fontSize: "var(--text-sm)",
              color: "rgba(255,255,255,0.85)",
              marginBottom: 20,
              lineHeight: 1.6,
            }}
          >
            Get daily visibility tracking, automated recommendations, and
            competitor analysis across 5 AI platforms.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              padding: "12px 32px",
              borderRadius: 8,
              background: "#fff",
              color: "var(--accent-primary)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              textDecoration: "none",
            }}
          >
            Sign Up Free
          </Link>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
          }}
        >
          Powered by Citare &mdash; AI Search Intelligence Platform
        </p>
      </div>
    </div>
  );
}
