import { collections, servicesInCollection } from "@/lib/services";
import { ServiceCard } from "@/components/service-card";
import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";

export function ServiceMenuSection() {
  return (
    <section id="services" className="border-y border-border/70 bg-blush/50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="mb-4 text-xs tracking-[0.2em] text-magenta">THE MENU</p>
          <h2 className="max-w-xl font-display text-3xl leading-tight md:text-4xl">
            Every style, every length, priced up front.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Prices are listed by length, and by braid size where it changes the
            work. Hair is not included.
          </p>
        </Reveal>

        <div className="mt-20 flex flex-col gap-24">
          {collections.map((collection) => (
            <div key={collection.id}>
              <Reveal>
                <h3 className="font-display text-2xl md:text-3xl">
                  {collection.name}
                </h3>
                <p className="mt-3 max-w-lg text-sm text-muted-foreground">
                  {collection.blurb}
                </p>
              </Reveal>

              <RevealGroup
                y={36}
                stagger={0.12}
                className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
              >
                {servicesInCollection(collection.id).map((service) => (
                  <ServiceCard key={service.slug} service={service} />
                ))}
              </RevealGroup>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
