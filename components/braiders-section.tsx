import { braiders } from "@/lib/braiders";
import { BraiderRow } from "@/components/braider-row";

export function BraidersSection() {
  return (
    <section
      id="stylists"
      className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32"
    >
      <p className="mb-4 text-xs tracking-[0.2em] text-copper">
        THE BRAIDERS
      </p>
      <h2 className="max-w-xl font-display text-3xl leading-tight md:text-4xl">
        Three hands.
        <br />
        One studio voice.
      </h2>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Every braider trains under Dae before taking clients solo. Request
        by name — or let us match you based on the style you&apos;re after.
      </p>

      <div className="mt-8">
        {braiders.map((braider) => (
          <BraiderRow key={braider.number} {...braider} />
        ))}
      </div>
    </section>
  );
}
