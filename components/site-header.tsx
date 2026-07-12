import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#braider", label: "Your Braider" },
  { href: "#philosophy", label: "Philosophy" },
  { href: "#book", label: "Visit" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-5 md:px-10">
        <Link href="/" className="flex items-baseline gap-2 text-base">
          <span className="font-display text-lg">Kindred Braid Studio</span>
          <span className="text-xs tracking-wide text-muted-foreground">
            GARLAND · EST. 2018
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground transition-colors hover:text-copper"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <LinkButton href="#book" variant="outline">
          Book a session
          <span aria-hidden>→</span>
        </LinkButton>
      </div>
    </header>
  );
}
