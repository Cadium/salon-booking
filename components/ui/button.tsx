import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(48,38,32,0.15)] hover:shadow-[0_10px_24px_-6px_rgba(48,38,32,0.35)]",
  outline:
    "bg-transparent text-foreground border border-foreground/80 shadow-none hover:border-copper hover:text-copper hover:shadow-[0_10px_24px_-8px_rgba(176,106,58,0.3)]",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;

const VARIANT_MARKER = {
  primary: "btn-primary",
  outline: "btn-outline",
} as const;

const baseClasses =
  "group inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper focus-visible:ring-offset-2 focus-visible:ring-offset-background";

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
