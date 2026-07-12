import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden">
      <span
        aria-hidden
        className="absolute right-3 top-0 hidden -translate-y-1/2 rotate-180 text-xs tracking-[0.3em] text-muted-foreground [writing-mode:vertical-rl] md:block"
      >
        Nº 007 — BRAIDED WITH INTENTION
      </span>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 pb-16 pt-10 md:grid-cols-2 md:gap-16 md:px-10 md:pb-24 md:pt-16">
        <div className="flex flex-col justify-center">
          <p className="mb-6 flex items-center gap-3 text-xs tracking-[0.2em] text-copper">
            <span aria-hidden className="h-px w-8 bg-copper" />
            BLACK-OWNED · DALLAS, TX · EST. 2018
          </p>

          <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Your crown,
            <br />
            <em className="text-copper italic">handled with care.</em>
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
            Kindred is a home-based braiding studio in South Dallas — one
            guest at a time, gentle tension, and clean parts. In-studio or
            in-home appointments across the DFW metroplex.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <LinkButton href="#book" variant="primary">
              Book your braids
              <span aria-hidden>↗</span>
            </LinkButton>
            <a
              href="#services"
              className="reserve-link border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-copper hover:text-copper"
            >
              View the menu
            </a>
          </div>
        </div>

        <div className="relative aspect-[3/4] w-full">
          <Image
            src="/images/hero-model.jpg"
            alt="Black woman with long knotless braids in soft, warm light"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute bottom-6 left-6 bg-cream px-6 py-4">
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
