"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { LinkButton, ButtonArrow } from "@/components/ui/button";
import { ContactIcons } from "@/components/contact-icons";
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
  const contactIconsRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const photoARef = useRef<HTMLDivElement>(null);
  const photoBRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const sideLabelRef = useRef<HTMLSpanElement>(null);

  // Entrance timeline — plays once on mount.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Establish the hidden starting state for every animated element up front.
      tl.set(eyebrowRef.current, { opacity: 0, y: 12 })
        .set([lineOneRef.current, lineTwoRef.current], { opacity: 0, y: 28 })
        .set(bodyRef.current, { opacity: 0 })
        .set(ctasRef.current, { opacity: 0 })
        .set(contactIconsRef.current, { opacity: 0 })
        .set(imageWrapRef.current, { opacity: 0, scale: 1.06 })
        .set(badgeRef.current, { opacity: 0, y: 10 })
        .set(sideLabelRef.current, { opacity: 0 })

        .to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
        .to(lineOneRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.25)
        .to(lineTwoRef.current, { opacity: 1, y: 0, duration: 0.8 }, 0.4)
        .to(bodyRef.current, { opacity: 1, duration: 0.6 }, 0.65)
        .to(ctasRef.current, { opacity: 1, duration: 0.6 }, 0.78)
        .to(contactIconsRef.current, { opacity: 1, duration: 0.6 }, 0.9)
        .to(
          imageWrapRef.current,
          { opacity: 1, scale: 1, duration: 1.2, ease: "power2.out" },
          0.2,
        )
        .to(badgeRef.current, { opacity: 1, y: 0, duration: 0.6 }, 1)
        .to(sideLabelRef.current, { opacity: 1, duration: 0.8 }, 1.2);
    }, rootRef.current ?? undefined);

    return () => ctx.revert();
  }, []);

  // Slow background-photo crossfade — a working, subtle nod to a rotating
  // hero photo, independent of the one-shot entrance timeline above.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1 });
      tl.to(photoBRef.current, { opacity: 1, duration: 2.5, ease: "power1.inOut" }, 8)
        .to(photoARef.current, { opacity: 0, duration: 2.5, ease: "power1.inOut" }, 8)
        .to(photoARef.current, { opacity: 1, duration: 2.5, ease: "power1.inOut" }, 16)
        .to(photoBRef.current, { opacity: 0, duration: 2.5, ease: "power1.inOut" }, 16);
    }, rootRef.current ?? undefined);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="top"
      ref={rootRef}
      className="relative flex min-h-screen items-center overflow-hidden bg-ink-plum"
    >
      <div ref={imageWrapRef} className="absolute inset-0">
        <div ref={photoARef} className="absolute inset-0">
          <Image
            src="/images/hero-model.jpg"
            alt="Black woman with long knotless braids in soft, warm light"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div ref={photoBRef} className="absolute inset-0 opacity-0">
          <Image
            src="/images/salon-interior.jpg"
            alt="Warm, sunlit home braiding studio interior"
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink-plum via-ink-plum/70 to-ink-plum/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-plum/70 via-transparent to-transparent" />
      </div>

      <span
        ref={sideLabelRef}
        aria-hidden
        className="absolute right-3 top-0 z-10 hidden -translate-y-1/2 rotate-180 text-xs tracking-[0.3em] text-rose-pop/60 [writing-mode:vertical-rl] md:block"
      >
        Nº 007 — BRAIDED WITH INTENTION
      </span>

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-24 md:px-10">
        <div className="flex max-w-xl flex-col">
          <p
            ref={eyebrowRef}
            className="mb-6 flex items-center gap-3 text-xs tracking-[0.2em] text-rose-pop"
          >
            <span aria-hidden className="h-px w-8 bg-rose-pop" />
            BLACK-OWNED · GARLAND, TX · EST. 2018
          </p>

          <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] text-bone md:text-7xl">
            <span ref={lineOneRef} className="inline-block">
              Your crown,
            </span>
            <br />
            <em ref={lineTwoRef} className="inline-block text-rose-pop italic">
              handled with care.
            </em>
          </h1>

          <p
            ref={bodyRef}
            className="hero-description mt-6 max-w-md text-lg text-bone/75"
          >
            HAIRBYBELLES is a home-based braiding studio in Garland — one
            guest at a time, gentle tension, and clean parts. In-studio or
            in-home appointments across the DFW metroplex.
          </p>

          <div ref={ctasRef} className="mt-8 flex flex-wrap items-center gap-6">
            <LinkButton href="#book" variant="inverse">
              Book your braids
              <ButtonArrow>↗</ButtonArrow>
            </LinkButton>
            <a
              href="#services"
              className="reserve-link border-b border-bone/40 pb-1 text-sm text-bone transition-colors hover:border-rose-pop hover:text-rose-pop"
            >
              View the menu
            </a>
          </div>

          <div ref={contactIconsRef} className="mt-6">
            <ContactIcons />
          </div>
        </div>
      </div>

      <div
        ref={badgeRef}
        className="absolute bottom-8 right-6 z-10 bg-bone px-6 py-4 md:right-10"
      >
        <p className="text-xs tracking-[0.2em] text-magenta">NOW BOOKING</p>
        <p className="font-display text-lg">Studio &amp; mobile · DFW</p>
      </div>
    </section>
  );
}
