import type React from "react";

import { cn } from "@/lib/cn";

export function Badge({
  className,
  variant = "muted",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "muted" | "solid" }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2 text-xs",
        variant === "muted" && "border border-border bg-bg text-muted",
        variant === "solid" && "bg-accent text-bg",
        className
      )}
      {...props}
    />
  );
}
