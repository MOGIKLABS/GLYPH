import type React from "react";

import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "glass-border min-h-32 w-full resize-y rounded-2xl bg-[hsl(var(--panel)/0.35)] p-4 text-sm text-fg",
        "placeholder:text-muted",
        "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.12),0_18px_40px_-30px_hsl(var(--glow)/0.55)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className
      )}
      {...props}
    />
  );
}
