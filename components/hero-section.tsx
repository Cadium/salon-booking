"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { LinkButton, ButtonArrow } from "@/components/ui/button";
import { gsap } from "@/lib/gsap";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function HeroSection() {
  const rootRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const lineOneRef = useRef<HTMLSpanElement>(null);
  const lineTwoRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const sideLabelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Establish the hidden starting state for every animated element up front.
      tl.set(eyebrowRef.current, { opacity: 0, y: 12 })
        .set([lineOneRef.current, lineTwoRef.current], { opacity: 0, y: 28 })
        .set(bodyRef.current, { opacity: 0 })
        .set(ctasRef.current, { opacity: 0 })
        .set(imageRef.current, { opacity: 0, scale: 1.06 })
        .set(badgeRef.current, { opacity: 0, y: 10 })
        .set(sideLabelRef.current, { opacity: 0 })

        .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
        .to(lineOneRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.25)
        .to(lineTwoRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.4)
        .to(bodyRef.current, { opacity: 1, duration: 0.6 }, 0.65)
        .to(ctasRef.current, { opacity: 1, duration: 0.6 }, 0.78)
        .to(
          imageRef.current,
          { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
          0.2,
        )
        .to(badgeRef.current, { opacity: 1, y: 0, duration: 0.6 }, 1)
        .to(sideLabelRef.current, { opacity: 1, duration: 0.8 }, 1.2);
    }, rootRef.current ?? undefined);

    return () => ctx.revert();
  }, []);

  return (
    <section id="top" ref={rootRef} className="relative overflow-hidden">
      <span
        ref={sideLabelRef}
        aria-hidden
        className="absolute right-3 top-0 hidden -translate-y-1/2 rotate-180 text-xs tracking-[0.3em] text-muted-foreground [writing-mode:vertical-rl] md:block"
      >
        Nº 007 — BRAIDED WITH INTENTION
      </span>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 pb-16 pt-10 md:grid-cols-2 md:gap-16 md:px-10 md:pb-24 md:pt-16">
        <div className="flex flex-col justify-center">
          <p
            ref={eyebrowRef}
            className="mb-6 flex items-center gap-3 text-xs tracking-[0.2em] text-copper"
          >
            <span aria-hidden className="h-px w-8 bg-copper" />
            BLACK-OWNED · GARLAND, TX · EST. 2018
          </p>

          <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] md:text-7xl">
            <span ref={lineOneRef} className="inline-block">
              Your crown,
            </span>
            <br />
            <em ref={lineTwoRef} className="inline-block text-copper italic">
              handled with care.
            </em>
          </h1>

          <p
            ref={bodyRef}
            className="hero-description mt-6 max-w-md text-lg text-muted-foreground"
          >
            Kindred is a home-based braiding studio in Garland — one guest
            at a time, gentle tension, and clean parts. In-studio or
            in-home appointments across the DFW metroplex.
          </p>

          <div ref={ctasRef} className="mt-8 flex flex-wrap items-center gap-6">
            <LinkButton href="#book" variant="primary">
              Book your braids
              <ButtonArrow>↗</ButtonArrow>
            </LinkButton>
            <a
              href="#services"
              className="reserve-link border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-copper hover:text-copper"
            >
              View the menu
            </a>
          </div>
        </div>

        <div ref={imageRef} className="relative aspect-[3/4] w-full">
          <Image
            src="/images/hero-model.jpg"
            alt="Black woman with long knotless braids in soft, warm light"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div
            ref={badgeRef}
            className="absolute bottom-6 left-6 bg-cream px-6 py-4"
          >
            <p className="text-xs tracking-[0.2em] text-copper">
              NOW BOOKING
            </p>
            <p className="font-display text-lg">Studio &amp; mobile · DFW</p>
          </div>
        </div>
      </div>
    </section>
  );
}
