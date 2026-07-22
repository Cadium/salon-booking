const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "TikTok", href: "https://tiktok.com" },
  { label: "Gift cards", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
        <div>
          <p className="font-display text-base text-foreground">
            Kindred Braid Studio
          </p>
          <p>Black-owned · Garland, TX</p>
          <p>© {new Date().getFullYear()} Kindred Braid Studio. All rights reserved.</p>
        </div>
        <div className="flex gap-6">
          {SOCIAL_LINKS.map((link) => (
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
