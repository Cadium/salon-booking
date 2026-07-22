"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

const TAGS = [
  "Knotless braids",
  "Boho curls",
  "Stitch feed-ins",
  "Fulani braids",
  "Goddess locs",
  "Kids' styles",
  "Bridal braiding",
  "In-home service",
];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Ticker() {
  const doubled = [...TAGS, ...TAGS];
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      tweenRef.current = gsap.to(el, {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      className="overflow-hidden border-y border-border/70 bg-blush/60"
      onMouseEnter={() => tweenRef.current?.timeScale(0.15)}
      onMouseLeave={() => tweenRef.current?.timeScale(1)}
    >
      <div
        ref={trackRef}
        className="marquee-track flex gap-16 whitespace-nowrap py-5 font-display text-2xl md:text-3xl"
      >
        {doubled.map((tag, i) => (
          <span key={`${tag}-${i}`} className="flex items-center gap-16">
            {tag}
            <span aria-hidden className="text-magenta">
              ✻
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
