"use client";

import type { CSSProperties, ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export function AnimatedSection({ children, delay = 0, className, style }: AnimatedSectionProps) {
  const { ref, style: animStyle } = useScrollAnimation({ delay });

  return (
    <div ref={ref} className={className} style={{ ...animStyle, ...style }}>
      {children}
    </div>
  );
}
