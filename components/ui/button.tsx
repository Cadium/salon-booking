import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(30,18,32,0.2)] hover:shadow-[0_10px_24px_-6px_rgba(30,18,32,0.4)]",
  outline:
    "bg-transparent text-foreground border border-foreground/80 shadow-none hover:border-magenta hover:text-magenta hover:shadow-[0_10px_24px_-8px_rgba(179,18,95,0.3)]",
  inverse:
    "bg-bone text-ink-plum shadow-[0_1px_2px_rgba(30,18,32,0.25)] hover:shadow-[0_10px_24px_-6px_rgba(179,18,95,0.35)]",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;

const VARIANT_MARKER = {
  primary: "btn-primary",
  outline: "btn-outline",
  inverse: "btn-inverse",
} as const;

const baseClasses =
  "group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const arrowClasses =
  "inline-block transition-transform duration-300 ease-out group-hover:translate-x-0.5";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
};

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${baseClasses} cursor-pointer ${VARIANT_MARKER[variant]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function SubmitButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className={`${baseClasses} cursor-pointer ${VARIANT_MARKER[variant]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonArrow({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className={arrowClasses}>
      {children}
    </span>
  );
}
