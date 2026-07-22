const LINKS = [
  {
    label: "Message on WhatsApp",
    href: "https://wa.me/12145550142",
    icon: (
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 19.5l1.1-3.3A7.96 7.96 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Follow on Instagram",
    href: "https://instagram.com/hairbybelles",
    icon: (
      <>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16.2" cy="7.8" r="0.9" fill="currentColor" />
      </>
    ),
  },
  {
    label: "Call the studio",
    href: "tel:+12145550142",
    icon: (
      <path
        d="M6.5 4.5c.8-.3 1.7 0 2 .8l1 2.3c.3.6.1 1.4-.4 1.9l-1 .9c.6 1.7 1.9 3 3.6 3.6l.9-1c.5-.5 1.3-.7 1.9-.4l2.3 1c.8.3 1.1 1.2.8 2l-.5 1.2c-.3.8-1.1 1.3-2 1.2-5.3-.7-9.5-4.9-10.2-10.2-.1-.9.4-1.7 1.2-2l1.2-.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
];

type ContactIconsProps = {
  className?: string;
};

export function ContactIcons({ className = "" }: ContactIconsProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {LINKS.map((link) => {
        const isExternal = link.href.startsWith("http");
        return (
          <a
            key={link.label}
            href={link.href}
            aria-label={link.label}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-bone/40 text-bone transition-colors hover:border-rose-pop hover:text-rose-pop"
          >
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none">
              {link.icon}
            </svg>
          </a>
        );
      })}
    </div>
  );
}
