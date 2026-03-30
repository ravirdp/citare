"use client";

import { useRef, useEffect, useState } from "react";

interface ScrollAnimationOptions {
  threshold?: number;
  delay?: number;
}

export function useScrollAnimation({ threshold = 0.1, delay = 0 }: ScrollAnimationOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setIsVisible(true), delay);
          } else {
            setIsVisible(true);
          }
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, delay]);

  const style: React.CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 500ms ease-out${delay > 0 ? ` ${delay}ms` : ""}, transform 500ms ease-out${delay > 0 ? ` ${delay}ms` : ""}`,
  };

  return { ref, style, isVisible };
}
