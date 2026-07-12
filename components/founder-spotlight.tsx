import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

const CREDENTIALS = [
  { value: "12 yrs", label: "braiding, hands-on" },
  { value: "800+", label: "heads braided" },
  { value: "1", label: "braider — always her" },
];

export function FounderSpotlight() {
  return (
    <section id="braider" className="border-y border-border/70 bg-bone/50">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 py-24 md:grid-cols-2 md:gap-16 md:px-10 md:py-32">
        <div className="relative aspect-[4/5] w-full order-2 md:order-1">
          <Image
            src="/images/salon-interior.jpg"
            alt="Warm home braiding studio in Garland with a styling chair, mirror, plants, and soft window light"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>

        <div className="order-1 flex flex-col justify-center md:order-2">
          <p className="mb-4 text-xs tracking-[0.2em] text-copper">
            YOUR BRAIDER
          </p>
          <h2 className="max-w-lg font-display text-3xl leading-tight md:text-4xl">
            One pair of hands.
            <br />
            Every single appointment.
          </h2>
          <p className="mt-6 max-w-lg text-muted-foreground">
            Dominique &ldquo;Dae&rdquo; Ellis has spent twelve years training
            in knotless, boho, and protective styles gentle enough for a
            two-hour nap in the chair. There&apos;s no team, no apprentices,
            no hand-offs — every booking on this site is with her,
            personally.
          </p>
          <p className="mt-6 max-w-lg font-display text-xl italic text-copper">
            &ldquo;I only book one client a day, so I can actually be
            present for yours.&rdquo;
          </p>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border/70 pt-8">
            {CREDENTIALS.map((c) => (
              <div key={c.label}>
                <dt className="font-display text-2xl">{c.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {c.label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <LinkButton href="#book" variant="primary">
              Book with Dae
              <span aria-hidden>↗</span>
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
