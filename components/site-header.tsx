"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkButton, ButtonArrow } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#braider", label: "Your Braider" },
  { href: "#philosophy", label: "Philosophy" },
  { href: "#book", label: "Visit" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-5 md:gap-6 md:px-10">
          <Link
            href="/"
            className="flex flex-col gap-0.5 leading-none md:flex-row md:items-baseline md:gap-2"
            onClick={() => setMenuOpen(false)}
          >
            <span className="font-display text-lg whitespace-nowrap">
              Kindred Braid Studio
            </span>
            <span className="text-xs tracking-wide whitespace-nowrap text-muted-foreground">
              GARLAND · EST. 2018
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-1 text-foreground transition-colors hover:text-magenta"
              >
                {link.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-magenta transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <LinkButton href="#book" variant="outline">
              Book a session
              <ButtonArrow>→</ButtonArrow>
            </LinkButton>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="relative z-50 flex h-10 w-10 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span
              className={`h-px w-6 bg-foreground transition-all duration-300 ease-out ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-6 bg-foreground transition-all duration-300 ease-out ${menuOpen ? "-rotate-45" : ""}`}
            />
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-30 flex flex-col justify-center bg-bone transition-opacity duration-300 ease-out md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <nav className="flex flex-col items-center gap-8 px-6">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                transitionDelay: menuOpen ? `${i * 60 + 80}ms` : "0ms",
              }}
              className={`font-display text-3xl transition-all duration-300 ease-out ${
                menuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div
            style={{
              transitionDelay: menuOpen
                ? `${NAV_LINKS.length * 60 + 80}ms`
                : "0ms",
            }}
            className={`mt-4 transition-all duration-300 ease-out ${
              menuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <LinkButton
              href="#book"
              variant="primary"
              onClick={() => setMenuOpen(false)}
            >
              Book a session
              <ButtonArrow>→</ButtonArrow>
            </LinkButton>
          </div>
        </nav>
      </div>
    </>
  );
}
