import Image from "next/image";
import type { Service } from "@/lib/services";

export function ServiceCard({
  number,
  name,
  priceFrom,
  duration,
  description,
  image,
  imageAlt,
}: Service) {
  return (
    <article className="service-card group">
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(min-width: 768px) 33vw, 100vw"
        />
        <span className="absolute top-4 left-4 bg-bone/90 px-2.5 py-1 text-xs tracking-[0.2em] text-magenta">
          {number}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {priceFrom} · {duration}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <a
        href="#book"
        className="reserve-link mt-5 inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-magenta hover:text-magenta"
      >
        Reserve
        <span aria-hidden>→</span>
      </a>
    </article>
  );
}
