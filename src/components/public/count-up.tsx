"use client";

import { useRef, useEffect, useState } from "react";

interface CountUpProps {
  value: string; // e.g. "527%", "4.4x", "50%"
  duration?: number;
  style?: React.CSSProperties;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({ value, duration = 1500, style, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState("0");
  const [started, setStarted] = useState(false);

  // Parse numeric part and suffix
  const match = value.match(/^([\d.]+)(.*)$/);
  const numericValue = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";
  const hasDecimal = match ? match[1].includes(".") : false;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = easedProgress * numericValue;

      if (hasDecimal) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(Math.round(current).toString());
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [started, numericValue, hasDecimal, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {display}{suffix}
    </span>
  );
}
