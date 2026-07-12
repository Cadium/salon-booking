import { SiteHeader } from "@/components/site-header";
import { BookSection } from "@/components/book-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <BookSection />
      </main>
      <SiteFooter />
    </>
  );
}
