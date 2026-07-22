import { RevealGroup } from "@/components/motion/reveal-group";

const TESTIMONIALS = [
  {
    number: "Nº 01",
    quote:
      "Dae took her time, my parts were perfection, and my scalp didn't hurt once. I've never had braids feel this light.",
    attribution: "Aaliyah T., Oak Cliff",
  },
  {
    number: "Nº 02",
    quote:
      "She came to my house the morning of my wedding and did my bridal party. Calm, on time, and every braid was flawless.",
    attribution: "Bri M., Plano",
  },
];

export function TestimonialsSection() {
  return (
    <section className="testimonials bg-ink-plum text-bone">
      <RevealGroup
        y={20}
        stagger={0.2}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-2 md:px-10"
      >
        {TESTIMONIALS.map((t) => (
          <div key={t.number}>
            <p className="text-xs tracking-[0.2em] text-bone/60">
              {t.number}
            </p>
            <p className="mt-4 font-display text-xl leading-relaxed italic">
              “{t.quote}”
            </p>
            <p className="mt-4 text-sm text-bone/70">— {t.attribution}</p>
          </div>
        ))}
      </RevealGroup>
    </section>
  );
}
