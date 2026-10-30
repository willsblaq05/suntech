import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface RevealProps {
  className?: string;
  /** Stagger in steps grids, in milliseconds. */
  delay?: number;
  children: ReactNode;
}

/**
 * Fade-up on first scroll into view. Respects prefers-reduced-motion
 * by stopping content in its fully-visible state immediately.
 */
function prefersReducedMotion(): boolean {
  return (
    typeof window === "undefined" ||
    (typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) ||
    !("IntersectionObserver" in window)
  );
}

export function Reveal({ className = "", delay = 0, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(prefersReducedMotion);

  useEffect(() => {
    if (revealed) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out motion-reduce:transition-none ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
