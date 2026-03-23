"use client";

interface Competitor {
  name: string;
  totalMentions: number;
  avgPosition: number;
  platformBreakdown: Record<string, number>;
}

interface CompetitorTableProps {
  competitors: Competitor[];
}

export function CompetitorTable({ competitors }: CompetitorTableProps) {
  if (competitors.length === 0) {
    return (
      <div
        style={{
          color: "var(--text-tertiary)",
          fontSize: "var(--text-sm)",
          padding: 16,
        }}
      >
        No competitor data yet
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr
          style={{
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {["Rank", "Name", "Mentions", "Avg Position"].map((header) => (
            <th
              key={header}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                color: "var(--text-tertiary)",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {competitors.map((comp, idx) => (
          <tr
            key={comp.name}
            style={{
              background: "var(--bg-secondary)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--bg-secondary)")
            }
          >
            <td
              style={{
                padding: "10px 12px",
                fontFamily: "var(--font-body)",
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
              }}
            >
              {idx + 1}
            </td>
            <td
              style={{
                padding: "10px 12px",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
              }}
            >
              {comp.name}
            </td>
            <td
              style={{
                padding: "10px 12px",
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
              }}
            >
              {comp.totalMentions}
            </td>
            <td
              style={{
                padding: "10px 12px",
                fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
              }}
            >
              {comp.avgPosition.toFixed(1)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
