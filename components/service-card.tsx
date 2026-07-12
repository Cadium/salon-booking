import type { Service } from "@/lib/services";

export function ServiceCard({ number, name, priceFrom, duration, description }: Service) {
  return (
    <article className="service-card group">
      <p className="text-xs tracking-[0.2em] text-muted-foreground">
        {number}
      </p>
      <h3 className="mt-3 font-display text-2xl">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {priceFrom} · {duration}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <a
        href="#book"
        className="reserve-link mt-5 inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-copper hover:text-copper"
      >
        Reserve
        <span aria-hidden>→</span>
      </a>
    </article>
  );
}
