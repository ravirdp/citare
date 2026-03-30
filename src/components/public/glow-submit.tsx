"use client";

import type { ReactNode } from "react";

interface GlowSubmitProps {
  children: ReactNode;
  disabled?: boolean;
}

export function GlowSubmit({ children, disabled }: GlowSubmitProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        borderRadius: "var(--radius-md)",
        padding: "14px 24px",
        fontSize: 14,
        fontWeight: 500,
        background: disabled ? "var(--border-subtle)" : "var(--accent-primary)",
        color: disabled ? "var(--text-secondary)" : "var(--bg-primary)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "box-shadow 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}
