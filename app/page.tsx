import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { Ticker } from "@/components/ticker";
import { PhilosophySection } from "@/components/philosophy-section";
import { ServiceMenuSection } from "@/components/service-menu-section";
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
      </main>
      <SiteFooter />
    </>
  );
}
