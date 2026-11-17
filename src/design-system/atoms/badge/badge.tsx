import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { softTones } from "@/design-system/foundations/tone";

const tones = {
  ...softTones,
  neutral: `${softTones.neutral} border border-border`,
  /** Solid: a live class is the loudest thing on the page. */
  live: "bg-live text-on-fill",
  /** Solid pink "new", for a product or feature just launched. */
  new: "bg-class-band-new text-on-fill",
  /** White with a hairline, for a count on a grey row. */
  outline: "bg-surface text-muted ring-1 ring-border ring-inset",
  /** Translucent white, on the brand hero. */
  onHero: "bg-on-hero/15 text-on-hero ring-1 ring-on-hero/15 ring-inset",
} as const;

/** md (24px) stands alone; sm (20px) sits inline with text, e.g. next to a price or a title. */
const sizes = {
  sm: "px-2 py-0.5 leading-4",
  md: "px-2.5 py-0.5 leading-5",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone; size?: keyof typeof sizes }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-xs font-semibold whitespace-nowrap",
        sizes[size],
        tones[tone],
        className,
      )}
      {...props}
    >
      {tone === "live" && (
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-on-fill motion-safe:animate-pulse"
        />
      )}
      {children}
    </span>
  );
}

/** Small numeric counter, e.g. unread notices. Pass `format` for locale digits. */
export function CountBadge({
  count,
  max = 9,
  format = String,
}: {
  count: number;
  max?: number;
  format?: (n: number) => string;
}) {
  if (count <= 0) return null;
  return (
    <span className="inline-grid h-5 min-w-5 place-items-center rounded-full bg-live px-1.5 text-xs font-bold leading-none text-on-fill tabular-nums">
      {count > max ? `${format(max)}+` : format(count)}
    </span>
  );
}
