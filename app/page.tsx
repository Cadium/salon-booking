import { SiteHeader } from "@/components/site-header";
import { PhilosophySection } from "@/components/philosophy-section";
import { ServiceMenuSection } from "@/components/service-menu-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <PhilosophySection />
        <ServiceMenuSection />
      </main>
      <SiteFooter />
    </>
  );
}
