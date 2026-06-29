"use client";

import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-charcoal hover:bg-charcoal hover:text-off-white transition-all duration-300",
  outline:
    "border border-charcoal text-charcoal hover:bg-charcoal hover:text-off-white transition-all duration-300",
  ghost:
    "text-stone hover:text-charcoal transition-colors duration-300",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center px-10 py-4 text-[13px] font-medium uppercase tracking-[0.1em] cursor-pointer";

  if (href) {
    return (
      <a href={href} className={`${base} ${variants[variant]} ${className}`}>
        <span className="relative z-10">{children}</span>
      </a>
    );
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}

