import Image from "next/image";
import { LinkButton, ButtonArrow } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";
import { StatCounter } from "@/components/motion/stat-counter";
import { ParallaxImage } from "@/components/motion/parallax-image";
import { services } from "@/lib/services";

const CREDENTIALS = [
  { value: "10+ yrs", label: "braiding in Garland" },
  { value: `${services.length}`, label: "styles on the menu" },
  { value: "Mon–Sat", label: "open six days a week" },
];

export function StudioSection() {
  return (
    <section id="studio" className="border-y border-border/70 bg-blush/50">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 py-24 md:grid-cols-2 md:gap-16 md:px-10 md:py-32">
        <ParallaxImage className="relative order-2 aspect-[4/5] w-full md:order-1">
          <Image
            src="/images/styles/senegalese-twists.jpeg"
            alt="Senegalese twists finished in the studio, beneath the HAIRBYBELLES sign"
            fill
            style={{ objectPosition: "45% 40%" }}
            className="style-photo object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </ParallaxImage>

        <div className="order-1 flex flex-col justify-center md:order-2">
          <Reveal>
            <p className="mb-4 text-xs tracking-[0.2em] text-magenta">
              THE STUDIO
            </p>
            <h2 className="max-w-lg font-display text-3xl leading-tight md:text-4xl">
              More hands, so you&apos;re
              <br />
              not in the chair all day.
            </h2>
            <p className="mt-6 max-w-lg text-muted-foreground">
              HAIRBYBELLES has been braiding in Garland for over ten years.
              Depending on the style and the length you&apos;re going for,
              more than one braider can work on your hair at once — so a full
              head that would otherwise take all day gets finished in a
              fraction of the time.
            </p>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Faster doesn&apos;t mean rushed. The parts stay clean, the
              tension stays gentle, and nobody leaves with sore edges.
            </p>
          </Reveal>

          <RevealGroup
            as="dl"
            className="mt-10 grid grid-cols-3 gap-6 border-t border-border/70 pt-8"
          >
            {CREDENTIALS.map((c) => (
              <div key={c.label}>
                <dt className="font-display text-2xl">
                  <StatCounter value={c.value} />
                </dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  {c.label}
                </dd>
              </div>
            ))}
          </RevealGroup>

          <div className="mt-10">
            <LinkButton href="#book" variant="primary">
              Book with HAIRBYBELLES
              <ButtonArrow>↗</ButtonArrow>
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
