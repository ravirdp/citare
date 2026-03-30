"use client";

import type { CSSProperties, ReactNode } from "react";

interface GlowButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  style?: CSSProperties;
  className?: string;
}

export function GlowButton({ href, children, variant = "primary", style, className }: GlowButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <a
      href={href}
      className={className}
      style={{
        display: "inline-block",
        borderRadius: "var(--radius-md)",
        padding: "14px 28px",
        fontSize: 14,
        fontWeight: 500,
        textDecoration: "none",
        transition: "box-shadow 200ms ease, transform 200ms ease, border-color 200ms ease, color 200ms ease",
        ...(isPrimary
          ? {
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
            }
          : {
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              background: "transparent",
            }),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (isPrimary) {
          e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
          e.currentTarget.style.transform = "translateY(-1px)";
        } else {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (isPrimary) {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        } else {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      {children}
    </a>
  );
}
