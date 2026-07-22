import { Reveal } from "@/components/motion/reveal";
import { RevealGroup } from "@/components/motion/reveal-group";

const STEPS = [
  {
    number: "01",
    title: "Send a request",
    description:
      "Fill out the form below with your service, location, and preferred date.",
  },
  {
    number: "02",
    title: "Hear back within a day",
    description:
      "We reply personally to confirm details and answer any questions.",
  },
  {
    number: "03",
    title: "Hold your spot",
    description:
      "A small non-refundable deposit secures your appointment and comes off your total.",
  },
  {
    number: "04",
    title: "Show up ready",
    description:
      "Arrive with clean, dry, detangled hair (unless wash is included), and settle in.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32"
    >
      <Reveal>
        <p className="mb-4 text-xs tracking-[0.2em] text-magenta">
          HOW BOOKING WORKS
        </p>
        <h2 className="max-w-xl font-display text-3xl leading-tight md:text-4xl">
          From request to reclining in the chair.
        </h2>
      </Reveal>

      <RevealGroup
        y={36}
        stagger={0.15}
        className="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
      >
        {STEPS.map((step) => (
          <div key={step.number}>
            <span className="inline-block bg-blush px-2.5 py-1 text-xs tracking-[0.2em] text-magenta">
              {step.number}
            </span>
            <h3 className="mt-4 font-display text-xl">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </RevealGroup>
    </section>
  );
}
