"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Wraps an image; the image drifts vertically slower than scroll for subtle depth. */
export function ParallaxImage({
  children,
  className,
  strength = 60,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: -strength / 10 },
        {
          yPercent: strength / 10,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    return () => ctx.revert();
  }, [strength]);

  return (
    <div ref={wrapperRef} className={`overflow-hidden ${className ?? ""}`}>
      <div ref={innerRef} className="relative h-[120%] w-full -translate-y-[10%]">
        {children}
      </div>
    </div>
  );
}
