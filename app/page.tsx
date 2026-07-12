import { SiteHeader } from "@/components/site-header";
import { BraidersSection } from "@/components/braiders-section";
import { TestimonialsSection } from "@/components/testimonials-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <BraidersSection />
        <TestimonialsSection />
      </main>
      <SiteFooter />
    </>
  );
}
