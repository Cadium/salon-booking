"use client";

import Image from "next/image";
import { fromPrice, type Service } from "@/lib/services";
import { useBookingSelection } from "@/lib/booking-selection-context";

export function ServiceCard({ service }: { service: Service }) {
  const { setSelectedService } = useBookingSelection();
  const hasTierTable = service.tiers.length > 1;

  return (
    <a
      href="#book"
      onClick={() => setSelectedService(service.name)}
      aria-label={`Reserve ${service.name}`}
      className="service-card group flex cursor-pointer flex-col rounded-sm transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-4"
    >
      <div className="relative bg-ink-plum p-2">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {service.image ? (
            <>
              <Image
                src={service.image}
                alt={service.alt ?? service.name}
                fill
                style={{ objectPosition: service.imagePosition }}
                className="style-photo object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <div className="pointer-events-none absolute inset-0 bg-magenta/10 mix-blend-multiply" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-plum/50 to-transparent" />
            </>
          ) : (
            <div className="relative flex h-full flex-col justify-between bg-[linear-gradient(145deg,#391d36_0%,#1e1220_70%)] p-7 text-bone">
              {/* Outer layer takes the hover scale; inner layer drifts on its
                  own loop. Splitting them keeps the two transforms from
                  fighting over the same element. */}
              <div className="pointer-events-none absolute -top-12 right-[-3rem] h-64 w-64 transition-transform duration-[900ms] ease-out group-hover:scale-110">
                <div className="h-full w-full rounded-full bg-rose-pop/30 blur-3xl motion-safe:animate-[orb-float_9s_ease-in-out_infinite]" />
              </div>
              <p className="relative text-xs tracking-[0.22em] text-rose-pop">RESET & CARE</p>
              <div className="relative">
                <p className="font-display text-5xl leading-none italic text-rose-pop">Takedown</p>
                <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-bone/70">
                  Remove, wash, detangle.
                </p>
              </div>
              <span className="relative h-px w-12 bg-gold/70" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-2 border border-gold/30" />
        </div>

        <p className="absolute top-5 left-5 bg-bone px-2.5 py-1 font-display font-semibold text-sm text-ink-plum">
          from ${fromPrice(service)}
        </p>
      </div>

      <h3 className="mt-5 font-display font-semibold text-2xl">{service.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {service.description}
      </p>

      {hasTierTable ? (
        <dl className="mt-5 flex flex-col gap-1.5 border-t border-border/70 pt-4 text-sm">
          {service.tiers.map((tier) => (
            <div key={tier.label} className="flex items-baseline gap-3">
              <dt className="text-muted-foreground">{tier.label}</dt>
              <span
                aria-hidden
                className="min-w-4 flex-1 translate-y-[-0.2em] border-b border-dotted border-border"
              />
              <dd className="tabular-nums">${tier.price}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-5 border-t border-border/70 pt-4 text-sm">
          {service.tiers[0].label ? (
            <span className="text-muted-foreground">
              {service.tiers[0].label}{" "}
            </span>
          ) : null}
          <span className="tabular-nums">${service.tiers[0].price}</span>
        </p>
      )}

      <span className="reserve-link mt-6 inline-flex items-center gap-2 self-start border-b border-foreground/40 pb-1 text-sm transition-colors group-hover:border-magenta group-hover:text-magenta">
        Reserve {service.name}
        <span aria-hidden>→</span>
      </span>
    </a>
  );
}
