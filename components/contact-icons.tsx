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

type NumberMenu = "whatsapp";

/**
 * The studio has more than one line, so tapping WhatsApp opens a chooser
 * rather than silently deciding for the visitor.
 */
export function ContactIcons({ className = "" }: { className?: string }) {
  const [openMenu, setOpenMenu] = useState<NumberMenu | null>(null);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChoice = STUDIO.phones.length > 1;

  useEffect(
    () => () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    },
    [],
  );

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(STUDIO.email);
      setCopied(true);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access needs a secure context and permission. Where it is
      // refused, opening the mail app still gets the visitor where they were
      // going, rather than the button appearing to do nothing.
      window.location.href = `mailto:${STUDIO.email}`;
    }
  };

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
      <div className="relative">
        <button
          type="button"
          onClick={copyEmail}
          aria-label={`Copy email address, ${STUDIO.email}`}
          className={`${buttonClasses} cursor-pointer`}
        >
          <Glyph>{EMAIL_ICON}</Glyph>
        </button>

        <span
          aria-hidden
          className={`pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full bg-bone px-3 py-1 text-xs whitespace-nowrap text-ink-plum shadow-[0_8px_20px_-6px_rgba(30,18,32,0.4)] transition-all duration-150 ease-out ${
            copied ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          Email copied
        </span>
      </div>

      {/* Announced to screen readers, which get nothing from the visual pill. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `Email address copied: ${STUDIO.email}` : ""}
      </span>
    </div>
  );
}
