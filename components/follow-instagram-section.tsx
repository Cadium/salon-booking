import { Reveal } from "@/components/motion/reveal";
import { LinkButton, ButtonArrow } from "@/components/ui/button";

export function FollowInstagramSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 text-center md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-xl">
        <p className="mb-4 text-xs tracking-[0.2em] text-magenta">
          MORE ON INSTAGRAM
        </p>
        <h2 className="font-display text-2xl leading-tight md:text-3xl">
          Fresh sets, styling tips, and behind-the-scenes — posted first on
          Instagram.
        </h2>
        <div className="mt-8 flex justify-center">
          <LinkButton
            href="https://instagram.com/hairbybelles"
            variant="outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow @hairbybelles
            <ButtonArrow>↗</ButtonArrow>
          </LinkButton>
        </div>
      </Reveal>
    </section>
  );
}
