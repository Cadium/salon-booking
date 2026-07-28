"use client";

import { useEffect, useRef, useState } from "react";
import { STUDIO } from "@/lib/studio";

const WHATSAPP_ICON = (
  <path
    d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.3A7.96 7.96 0 0 1 4 12Z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
  />
);

const PHONE_ICON = (
  <path
    d="M6.5 4.5c.8-.3 1.7 0 2 .8l1 2.3c.3.6.1 1.4-.4 1.9l-1 .9c.6 1.7 1.9 3 3.6 3.6l.9-1c.5-.5 1.3-.7 1.9-.4l2.3 1c.8.3 1.1 1.2.8 2l-.5 1.2c-.3.8-1.1 1.3-2 1.2-5.3-.7-9.5-4.9-10.2-10.2-.1-.9.4-1.7 1.2-2l1.2-.5Z"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinejoin="round"
  />
);

const EMAIL_ICON = (
  <>
    <rect
      x="3.5"
      y="5.5"
      width="17"
      height="13"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="m4 7 8 6 8-6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </>
);

const buttonClasses =
  "flex h-10 w-10 items-center justify-center rounded-full border border-bone/40 text-bone transition-colors hover:border-rose-pop hover:text-rose-pop focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-pop focus-visible:ring-offset-2 focus-visible:ring-offset-ink-plum";

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none">
      {children}
    </svg>
  );
}

type NumberMenu = "whatsapp" | "call";

/**
 * The studio has more than one line, so tapping WhatsApp or Call opens a
 * chooser rather than silently deciding for the visitor. With a single number
 * configured there is nothing to choose, so it links straight out instead.
 */
export function ContactIcons({ className = "" }: { className?: string }) {
  const [openMenu, setOpenMenu] = useState<NumberMenu | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasChoice = STUDIO.phones.length > 1;

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const hrefFor = (menu: NumberMenu, digits: string) =>
    menu === "whatsapp" ? `https://wa.me/${digits}` : `tel:+${digits}`;

  const renderPhoneAction = (
    menu: NumberMenu,
    label: string,
    icon: React.ReactNode,
  ) => {
    if (!hasChoice) {
      const only = STUDIO.phones[0];
      return (
        <a
          href={hrefFor(menu, only.digits)}
          aria-label={label}
          target={menu === "whatsapp" ? "_blank" : undefined}
          rel={menu === "whatsapp" ? "noopener noreferrer" : undefined}
          className={buttonClasses}
        >
          <Glyph>{icon}</Glyph>
        </a>
      );
    }

    return (
      <div className="relative">
        <button
          type="button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={openMenu === menu}
          onClick={() => setOpenMenu(openMenu === menu ? null : menu)}
          className={`${buttonClasses} cursor-pointer`}
        >
          <Glyph>{icon}</Glyph>
        </button>

        <div
          role="menu"
          aria-label={label}
          className={`absolute bottom-full left-0 z-30 mb-2 w-max min-w-[190px] border border-border/70 bg-bone p-2 shadow-[0_20px_40px_-12px_rgba(30,18,32,0.35)] transition-all duration-150 ease-out ${
            openMenu === menu
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          {STUDIO.phones.map((phone) => (
            <a
              key={phone.digits}
              role="menuitem"
              href={hrefFor(menu, phone.digits)}
              target={menu === "whatsapp" ? "_blank" : undefined}
              rel={menu === "whatsapp" ? "noopener noreferrer" : undefined}
              onClick={() => setOpenMenu(null)}
              tabIndex={openMenu === menu ? 0 : -1}
              className="block px-3 py-2 text-sm whitespace-nowrap text-foreground transition-colors hover:bg-magenta/10 hover:text-magenta"
            >
              {phone.display}
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div ref={rootRef} className={`flex items-center gap-3 ${className}`}>
      {renderPhoneAction("whatsapp", "Message on WhatsApp", WHATSAPP_ICON)}
      {renderPhoneAction("call", "Call the studio", PHONE_ICON)}
      <a
        href={`mailto:${STUDIO.email}`}
        aria-label="Email the studio"
        className={buttonClasses}
      >
        <Glyph>{EMAIL_ICON}</Glyph>
      </a>
    </div>
  );
}
