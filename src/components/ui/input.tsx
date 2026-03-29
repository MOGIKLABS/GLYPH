import type React from "react";

import { cn } from "@/lib/cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "glass-border h-11 w-full rounded-2xl bg-[hsl(var(--panel)/0.35)] px-4 text-sm text-fg",
        "placeholder:text-muted",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12),0_18px_40px_-30px_hsl(var(--glow)/0.55)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
      {...props}
    />
  );
}
