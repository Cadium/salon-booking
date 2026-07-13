import { services } from "@/lib/services";
import { ServiceCard } from "@/components/service-card";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";

export function ServiceMenuSection() {
  return (
    <section id="services" className="border-y border-border/70 bg-bone/50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="mb-4 text-xs tracking-[0.2em] text-copper">
            THE MENU
          </p>
          <h2 className="max-w-xl font-display text-3xl leading-tight md:text-4xl">
            A short braid menu, done exceptionally.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Prices start as listed and adjust for length, size, and hair
            added. Every service includes consultation, a gentle wash, and
            take-down guidance. Hair not included.
          </p>
        </Reveal>

        <RevealGroup
          y={36}
          stagger={0.15}
          className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-3"
        >
          {services.map((service) => (
            <ServiceCard key={service.number} {...service} />
          ))}
        </RevealGroup>

        <p className="mt-16 text-sm text-muted-foreground">
          Also available: kids&apos; styles (10 &amp; under), take-downs
          &amp; wash, and bridal packages for your wedding party. Just
          mention it in your request.
        </p>
      </div>
    </section>
  );
}
