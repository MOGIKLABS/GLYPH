import type React from "react";

import { cn } from "@/lib/cn";

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-wide transition",
        "shadow-[0_10px_28px_-16px_hsl(var(--glow)/0.65)]",
        "active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "glass-border bg-[linear-gradient(180deg,hsl(var(--chrome1)),hsl(var(--chrome2)))] text-[hsl(var(--bg))] shadow-[0_18px_40px_-22px_hsl(var(--glow)/0.9),inset_0_1px_0_hsl(0_0%_100%/0.35),inset_0_-10px_18px_hsl(0_0%_0%/0.25)] hover:brightness-110",
        variant === "outline" &&
          "glass-border bg-[linear-gradient(180deg,hsl(var(--panel)),hsl(var(--panel)/0.6))] text-fg hover:brightness-110",
        variant === "ghost" &&
          "rounded-xl bg-transparent px-3 text-fg hover:bg-[hsl(var(--panel)/0.55)]",
        className
      )}
      {...props}
    />
  );
}
