"use client";

interface VisibilityRingProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score <= 30) return "var(--score-low)";
  if (score <= 60) return "var(--score-mid)";
  if (score <= 80) return "var(--score-high)";
  return "var(--score-excellent)";
}

export function VisibilityRing({ score, size = 120 }: VisibilityRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getScoreColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: size * 0.28,
            fontWeight: 700,
            fill: "var(--text-primary)",
          }}
        >
          {score}
        </text>
      </svg>
      <div
        style={{
          color: "var(--text-tertiary)",
          fontSize: "var(--text-xs)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Visibility
      </div>
    </div>
  );
}
