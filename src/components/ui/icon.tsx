import type React from "react";

import { cn } from "@/lib/cn";

type IconName =
  | "spark"
  | "receipt"
  | "shield"
  | "flag"
  | "terminal"
  | "download"
  | "play";

export function Icon({
  name,
  className
}: {
  name: IconName;
  className?: string;
}) {
  const common = "fill-none stroke-current";
  const props = { className: cn("h-4 w-4", common, className) };
  switch (name) {
    case "spark":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2Z" strokeWidth="1.6" />
        </svg>
      );
    case "receipt":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" strokeWidth="1.6" />
          <path d="M9 7h6M9 11h6M9 15h5" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z" strokeWidth="1.6" />
        </svg>
      );
    case "flag":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M6 3v18" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M6 4h11l-2 4 2 4H6" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    case "terminal":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M4 6h16v12H4V6Z" strokeWidth="1.6" />
          <path d="M7 10l3 2-3 2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 14h5" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "download":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M12 3v10" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 11l4 4 4-4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "play":
      return (
        <svg viewBox="0 0 24 24" {...props}>
          <path d="M9 7l10 5-10 5V7Z" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null as never;
  }
}

