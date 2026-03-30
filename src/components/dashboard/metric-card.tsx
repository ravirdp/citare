"use client";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: "up" | "down" | "flat";
    percent: number;
  };
  valueColor?: string;
}

export function MetricCard({ label, value, trend, valueColor }: MetricCardProps) {
  const trendArrow = trend
    ? trend.direction === "up"
      ? "\u25B2"
      : trend.direction === "down"
        ? "\u25BC"
        : "\u2014"
    : null;

  const trendColor = trend
    ? trend.direction === "up"
      ? "var(--status-green)"
      : trend.direction === "down"
        ? "var(--status-red)"
        : "var(--text-tertiary)"
    : undefined;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        transition: "border-color 200ms ease, transform 200ms ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "scale(1.01)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div
        style={{
          color: "var(--text-tertiary)",
          fontSize: "var(--text-xs)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 28,
          fontWeight: 700,
          color: valueColor ?? "var(--text-primary)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {trend && (
        <div
          style={{
            marginTop: 8,
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-body)",
            color: trendColor,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>{trendArrow}</span>
          <span>{trend.percent}%</span>
        </div>
      )}
    </div>
  );
}
