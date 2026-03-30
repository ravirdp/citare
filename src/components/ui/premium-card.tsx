"use client";

import type { CSSProperties, ReactNode } from "react";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hover?: boolean;
  padding?: number;
}

export function PremiumCard({ children, className, style, hover = true, padding = 32 }: PremiumCardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding,
        transition: hover ? "border-color 200ms ease, transform 200ms ease" : undefined,
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "scale(1.01)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        e.currentTarget.style.transform = "scale(1)";
      } : undefined}
    >
      {children}
    </div>
  );
}
