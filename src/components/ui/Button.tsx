"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "light" | "glass" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

// Tailwind v4 already scopes `hover:` to `@media (hover: hover)`, so taps on
// touch screens never leave a "stuck" hover colour behind.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "btn-sheen bg-accent text-night shadow-[0_10px_30px_-12px_rgb(242_181_68/0.55)] hover:bg-accent-hover focus-visible:ring-accent",
  light:
    "btn-sheen bg-white text-night shadow-[0_8px_24px_-10px_rgb(0_0_0/0.8)] hover:bg-white/85 focus-visible:ring-white",
  glass:
    "bg-white/10 text-white backdrop-blur-md border border-white/15 hover:bg-white/20 focus-visible:ring-white/40",
  ghost: "bg-transparent text-white hover:bg-white/10 focus-visible:ring-white/40",
  outline:
    "bg-transparent text-white border border-white/30 hover:border-white/60 hover:bg-white/10 focus-visible:ring-white/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-7 text-base",
  icon: "size-10",
  "icon-sm": "size-8",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "pressable inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold tracking-[-0.01em] select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-night disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
