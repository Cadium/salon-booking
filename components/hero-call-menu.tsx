"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonArrow } from "@/components/ui/button";
import { STUDIO } from "@/lib/studio";

export function HeroCallMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePress);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-bone/60 bg-transparent px-6 py-3.5 text-sm font-medium text-bone transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-rose-pop hover:text-rose-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-pop focus-visible:ring-offset-2 focus-visible:ring-offset-ink-plum"
      >
        Call the studio
        <ButtonArrow>{open ? "↑" : "↓"}</ButtonArrow>
      </button>

      <div
        role="menu"
        aria-label="Call the studio"
        className={`absolute left-0 top-full z-20 mt-3 w-max min-w-[220px] border border-bone/30 bg-bone p-2 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] transition-all duration-150 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <p className="px-3 pt-2 pb-1 text-xs tracking-[0.16em] text-muted-foreground">
          CHOOSE A NUMBER
        </p>
        {STUDIO.phones.map((phone) => (
          <a
            key={phone.digits}
            role="menuitem"
            href={`tel:+${phone.digits}`}
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="block px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-magenta/10 hover:text-magenta focus-visible:bg-magenta/10 focus-visible:text-magenta focus-visible:outline-none"
          >
            {phone.display}
          </a>
        ))}
      </div>
    </div>
  );
}
