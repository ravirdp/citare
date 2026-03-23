"use client";

const PLATFORM_CONFIG: Record<string, { label: string; colorVar: string }> = {
  chatgpt: { label: "ChatGPT", colorVar: "var(--platform-chatgpt)" },
  perplexity: { label: "Perplexity", colorVar: "var(--platform-perplexity)" },
  google_aio: { label: "Google AIO", colorVar: "var(--platform-google)" },
  gemini: { label: "Gemini", colorVar: "var(--platform-gemini)" },
  claude: { label: "Claude", colorVar: "var(--platform-claude)" },
};

interface PlatformBarProps {
  scores: Record<string, number>;
}

export function PlatformBar({ scores }: PlatformBarProps) {
  const entries = Object.entries(scores).filter(
    ([key]) => key in PLATFORM_CONFIG
  );
  const total = entries.reduce((sum, [, val]) => sum + val, 0);

  return (
    <div>
      {/* Stacked bar */}
      <div
        style={{
          display: "flex",
          height: 28,
          borderRadius: 6,
          overflow: "hidden",
          background: "var(--border-subtle)",
        }}
      >
        {entries.map(([platform, value]) => {
          const config = PLATFORM_CONFIG[platform];
          const widthPercent = total > 0 ? (value / total) * 100 : 0;
          return (
            <div
              key={platform}
              style={{
                width: `${widthPercent}%`,
                background: config.colorVar,
                minWidth: widthPercent > 0 ? 4 : 0,
                transition: "width 0.3s ease",
              }}
              title={`${config.label}: ${value}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 20px",
          marginTop: 16,
        }}
      >
        {entries.map(([platform, value]) => {
          const config = PLATFORM_CONFIG[platform];
          return (
            <div
              key={platform}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "var(--text-xs)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: config.colorVar,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "var(--text-secondary)" }}>
                {config.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  color: "var(--text-primary)",
                }}
              >
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
