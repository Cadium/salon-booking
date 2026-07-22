import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { Ticker } from "@/components/ticker";
import { PhilosophySection } from "@/components/philosophy-section";
import { ServiceMenuSection } from "@/components/service-menu-section";
import { FounderSpotlight } from "@/components/founder-spotlight";
import { TestimonialsSection } from "@/components/testimonials-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { PoliciesSection } from "@/components/policies-section";
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
        <FounderSpotlight />
        <TestimonialsSection />
        <HowItWorksSection />
        <PoliciesSection />
        <BookSection />
      </main>
      <SiteFooter />
    </>
  );
}
