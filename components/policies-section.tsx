import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";

const POLICIES = [
  {
    title: "Booking & deposits",
    description:
      "A non-refundable deposit secures certain services; balance due day-of via cash, Zelle, Cash App, or card.",
  },
  {
    title: "Cancellations",
    description:
      "24-hour notice keeps your deposit; less than that may forfeit it.",
  },
  {
    title: "Arrival",
    description:
      "Clean, dry, detangled hair unless a wash is included, and on time — more than 15 minutes late may require rescheduling.",
  },
  {
    title: "Little ones",
    description:
      "Kids are welcome if they can sit calmly for the full service.",
  },
  {
    title: "If something's off",
    description:
      "Let us know within 72 hours of your appointment so we can make it right.",
  },
];

export function PoliciesSection() {
  return (
    <section id="policies" className="border-y border-border/70 bg-blush/50">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <p className="mb-4 text-xs tracking-[0.2em] text-magenta">
            GOOD TO KNOW
          </p>
          <h2 className="max-w-xl font-display text-3xl leading-tight md:text-4xl">
            A few things before you book.
          </h2>
        </Reveal>

        <RevealGroup
          as="dl"
          y={20}
          stagger={0.1}
          className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2"
        >
          {POLICIES.map((policy) => (
            <div key={policy.title}>
              <dt className="font-display text-lg">{policy.title}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {policy.description}
              </dd>
            </div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
