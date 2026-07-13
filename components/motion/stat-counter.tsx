"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Animates the leading number in a stat string (e.g. "800+", "12 yrs") counting up on scroll into view. */
export function StatCounter({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = value.match(/^(\d+)(.*)$/);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (prefersReducedMotion()) return;

    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const counter = { n: 0 };

    const ctx = gsap.context(() => {
      gsap.to(counter, {
        n: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          once: true,
        },
        onUpdate: () => {
          el.textContent = `${Math.round(counter.n)}${suffix}`;
        },
      });
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
