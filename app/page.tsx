import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { Ticker } from "@/components/ticker";
import { PhilosophySection } from "@/components/philosophy-section";
import { ServiceMenuSection } from "@/components/service-menu-section";
import { BraidersSection } from "@/components/braiders-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { BookSection } from "@/components/book-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <Ticker />
        <PhilosophySection />
        <ServiceMenuSection />
        <BraidersSection />
        <TestimonialsSection />
        <BookSection />
      </main>
      <SiteFooter />
    </>
  );
}
