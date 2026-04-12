import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";

function BubbleLink({
  href,
  icon,
  label,
  className
}: {
  href: `/${string}`;
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "bubble-btn glass-border group absolute flex h-12 w-12 items-center justify-center rounded-full text-[hsl(var(--bg))]",
        "hover:brightness-110 active:translate-y-px",
        className
      )}
    >
      <Icon
        name={icon}
        className="h-5 w-5 stroke-[2.2] text-[hsl(var(--bg))] opacity-95"
      />
    </Link>
  );
}

export function OrbNav() {
  return (
    <div className="relative h-[152px] w-[152px]">
      <div className="orb-shell glass-border absolute inset-0 rounded-full" />
      <div className="orb-screen glass-border absolute left-1/2 top-1/2 h-[90px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-[999px]">
        <div className="flex h-full items-center justify-center">
          <div className="text-xs font-semibold tracking-[0.35em] text-[hsl(var(--fg)/0.9)]">
            GLYPH
          </div>
        </div>
      </div>

      <BubbleLink href="/" icon="spark" label="Generate" className="left-1/2 top-[-10px] -translate-x-1/2" />
      <BubbleLink href="/receipts" icon="receipt" label="Receipts" className="right-[-10px] top-1/2 -translate-y-1/2" />
      <BubbleLink href="/rights" icon="shield" label="Rights" className="left-1/2 bottom-[-10px] -translate-x-1/2" />
      <BubbleLink href="/takedown" icon="flag" label="Takedown" className="left-[-10px] top-1/2 -translate-y-1/2" />
      <BubbleLink href="/audit" icon="terminal" label="Audit" className="right-[16px] top-[18px]" />
    </div>
  );
}

