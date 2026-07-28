import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { Ticker } from "@/components/ticker";
import { ServiceMenuSection } from "@/components/service-menu-section";
import { StudioSection } from "@/components/studio-section";
import { HowItWorksSection } from "@/components/how-it-works-section";
import { PoliciesSection } from "@/components/policies-section";
import { BookSection } from "@/components/book-section";
import { SiteFooter } from "@/components/site-footer";
import { BookingSelectionProvider } from "@/lib/booking-selection-context";

export default function Home() {
  return (
    <BookingSelectionProvider>
      <SiteHeader />
      <main>
        <HeroSection />
        <Ticker />
        <ServiceMenuSection />
        <StudioSection />
        <HowItWorksSection />
        <PoliciesSection />
        <BookSection />
      </main>
      <SiteFooter />
    </BookingSelectionProvider>
  );
}
