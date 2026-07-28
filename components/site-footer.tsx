import { BrandWordmark } from "@/components/brand-wordmark";
import { STUDIO } from "@/lib/studio";

// Social accounts intentionally absent — the studio has none yet. Add them
// back here once real handles exist rather than linking to placeholders.
const CONTACT_LINKS = [
  ...STUDIO.phones.map((phone) => ({
    label: phone.display,
    href: `tel:+${phone.digits}`,
  })),
  { label: STUDIO.email, href: `mailto:${STUDIO.email}` },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="text-base">
            <BrandWordmark />
          </p>
          <p>Black-owned · Garland, TX</p>
          <p>© {new Date().getFullYear()} HAIRBYBELLES. All rights reserved.</p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          {CONTACT_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-magenta"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
