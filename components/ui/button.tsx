import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  outline:
    "bg-transparent text-foreground border border-foreground/80 hover:bg-foreground/5",
} as const;

type ButtonVariant = keyof typeof VARIANT_CLASSES;

const VARIANT_MARKER = {
  primary: "btn-primary",
  outline: "btn-outline",
} as const;

const baseClasses =
  "inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-normal transition-colors";

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
      className={`${baseClasses} ${VARIANT_MARKER[variant]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
