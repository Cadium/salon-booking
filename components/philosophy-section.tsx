const STATS = [
  { value: "800+", label: "heads braided since 2018" },
  { value: "1", label: "guest at a time" },
  { value: "DFW", label: "in-home service area" },
];

export function PhilosophySection() {
  return (
    <section
      id="philosophy"
      className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32"
    >
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="mb-4 text-xs tracking-[0.2em] text-copper">
            OUR PHILOSOPHY
          </p>
          <h2 className="font-display text-3xl leading-tight md:text-4xl">
            One guest.
            <br />
            One braider.
            <br />
            One unhurried afternoon.
          </h2>
        </div>

        <div className="flex flex-col justify-center gap-6">
          <p className="text-muted-foreground">
            Kindred started at Dae&apos;s kitchen table in 2018 and grew into
            a warm home studio in Garland. We book one client at a time so
            the parts are precise, the tension is gentle, and you can
            actually rest while you&apos;re in the chair.
          </p>
          <p className="text-muted-foreground">
            Everything is scalp-first: we cleanse before we braid, we
            don&apos;t braid soaking wet, and we won&apos;t take you down
            with a rushed hand. Snacks, wifi, and good playlists included.
          </p>
        </div>
      </div>

      <dl className="mt-16 grid grid-cols-1 gap-8 border-t border-border/70 pt-10 sm:grid-cols-3">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <dt className="font-display text-4xl text-copper">
              {stat.value}
            </dt>
            <dd className="mt-1 text-sm text-muted-foreground">
              {stat.label}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
