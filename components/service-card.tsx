"use client";

import Image from "next/image";
import { fromPrice, type Service } from "@/lib/services";
import { useBookingSelection } from "@/lib/booking-selection-context";

export function ServiceCard({ service }: { service: Service }) {
  const { setSelectedService } = useBookingSelection();
  const hasTierTable = service.tiers.length > 1;

  return (
    <article className="service-card group flex flex-col">
      {/*
        The photography is phone-shot in a working studio, so each image sits
        matted inside a frame rather than running edge to edge — the mat and
        the shared grade are what make eleven photos taken on different days
        read as one collection.
      */}
      <div className="relative bg-ink-plum p-2">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={service.image}
            alt={service.alt}
            fill
            style={{ objectPosition: service.imagePosition }}
            className="style-photo object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
          {/* Warms and unifies the mixed lighting across the set. */}
          <div className="pointer-events-none absolute inset-0 bg-magenta/10 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink-plum/50 to-transparent" />
          {/* Gold hairline, inset like a picture mat. */}
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

      <a
        href="#book"
        onClick={() => setSelectedService(service.name)}
        className="reserve-link mt-6 inline-flex items-center gap-2 self-start border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-magenta hover:text-magenta"
      >
        Reserve {service.name}
        <span aria-hidden>→</span>
      </a>
    </article>
  );
}
