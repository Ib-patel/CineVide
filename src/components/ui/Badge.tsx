import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "gold" | "hdr" | "accent" | "outline";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-white/90 border border-white/15",
  gold: "bg-gold/15 text-gold border border-gold/30",
  hdr: "bg-hdr/10 text-hdr border border-hdr/30",
  accent: "bg-accent/90 text-white border border-accent",
  outline: "bg-transparent text-muted border border-white/20",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
