import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * A round button with only an icon in it: close, back, flag, menu triggers, carousel arrows.
 * `label` is required: it becomes the accessible name (and, with `tooltip`, the hover title).
 * The icon is a child and sets its own size (usually size-5, size-4 in xs).
 */
const variants = {
  /** Plain: the icon in text colour, a grey disc on hover. */
  ghost: "text-text hover:bg-raised",
  /** Quieter: grey until hovered. For secondary actions next to content. */
  subtle: "text-muted hover:bg-raised hover:text-text aria-expanded:bg-raised aria-expanded:text-text",
  /** Floating over imagery (carousel arrows): translucent, with a rim and a shadow. */
  glass: "border border-border bg-overlay text-text shadow-raised backdrop-blur-md hover:scale-105",
  /** On the dark video stage: inherits the player's white, a faint white disc on hover. */
  player: "hover:bg-on-fill/15 [&>svg]:pointer-events-none",
} as const;

/** 28 · 36 · 40 · 44px. xs only inside a field (clear search); md and lg meet the 40px+ touch size. */
const sizes = {
  xs: "size-7",
  sm: "size-9",
  md: "size-10",
  lg: "size-11",
} as const;

type Common = {
  label: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  /** Also show the label as a native tooltip on hover. */
  tooltip?: boolean;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common | "aria-label"> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common | "aria-label">;

const base =
  "grid shrink-0 place-items-center rounded-full transition-[background-color,color,transform] disabled:pointer-events-none disabled:opacity-50";

export function IconButton({ label, variant = "ghost", size = "sm", tooltip, className, ...props }: AsButton | AsLink) {
  const shared = { "aria-label": label, title: tooltip ? label : undefined, className: cn(base, variants[variant], sizes[size], className) };
  if (props.href !== undefined) {
    return <Link {...(props as AsLink)} {...shared} />;
  }
  return <button type="button" {...(props as AsButton)} {...shared} />;
}
