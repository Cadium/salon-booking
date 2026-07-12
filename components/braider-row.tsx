import type { Braider } from "@/lib/braiders";

export function BraiderRow({ number, name, title, years }: Braider) {
  return (
    <article className="group grid grid-cols-12 items-baseline gap-4 border-t border-border/70 py-6 md:py-8">
      <span className="col-span-2 text-xs tracking-[0.2em] text-muted-foreground md:col-span-1">
        {number}
      </span>
      <div className="col-span-10 md:col-span-7">
        <h3 className="font-display text-xl">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </div>
      <span className="col-span-6 text-sm text-muted-foreground md:col-span-2">
        {years}
      </span>
      <a
        href="#book"
        className="reserve-link col-span-6 justify-self-end border-b border-foreground/40 pb-1 text-sm transition-colors hover:border-copper hover:text-copper md:col-span-2"
      >
        Book
        <span aria-hidden> →</span>
      </a>
    </article>
  );
}
