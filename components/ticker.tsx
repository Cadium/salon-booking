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

export function Ticker() {
  const doubled = [...TAGS, ...TAGS];

  return (
    <section className="overflow-hidden border-y border-border/70 bg-bone/60">
      <div className="marquee-track flex animate-marquee gap-16 whitespace-nowrap py-5 font-display text-2xl md:text-3xl">
        {doubled.map((tag, i) => (
          <span key={`${tag}-${i}`} className="flex items-center gap-16">
            {tag}
            <span aria-hidden className="text-copper">
              ✻
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
