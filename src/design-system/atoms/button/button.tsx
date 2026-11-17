import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

// No red "live" button: red marks that something is live (badge, tile); Join is an action, so primary.
// Colours only; the shape (and the filled buttons' bottom edge) comes from `shapes` below.
const variants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  // Join a live class: the primary with a ring that keeps spreading out from its edge and fading,
  // and a softly pulsing dot before the label, so the one time-critical action on a page catches
  // the eye. With reduced motion the ring holds still as a halo.
  live: "bg-primary text-on-primary shadow-live motion-safe:animate-live-ring hover:bg-primary-hover",
  // Kept for the game-like moments (start an exam, submit an answer); the live edge now gives every
  // filled button the raised look, so it is the primary.
  raised: "bg-primary text-on-primary hover:bg-primary-hover",
  // Live secondary: white, the card stroke, dark text.
  secondary: "border border-border bg-surface text-text hover:bg-raised",
  soft: "bg-brand-soft text-brand-text hover:brightness-95 dark:hover:brightness-125",
  ghost: "text-muted hover:bg-raised hover:text-text",
} as const;

/*
 * The live site's two button shapes (docs/live-alignment.md §3.4):
 *   button: 6px, and on a filled button a 4px darker bottom edge inside the height, weight 400
 *           (the academic page's "বিস্তারিত দেখো" and login)
 *   pill:   full round, no edge, weight 600 (the product page's buy and join buttons)
 * Default: pill for the 48px `lg` (buy, enroll, plan actions), button for everything smaller.
 */
const shapes = {
  button: "rounded-button font-normal",
  pill: "rounded-full font-semibold",
} as const;
const filled = new Set<keyof typeof variants>(["primary", "live", "raised"]);

const sizes = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-5 text-base",
  lg: "h-12 gap-2 px-6 text-base",
} as const;

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  shape?: keyof typeof shapes;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common>;

const base =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap active:scale-[0.98] transition-[background-color,border-color,filter,color,scale,translate,box-shadow] disabled:pointer-events-none disabled:opacity-50";

export function Button({ variant = "primary", size = "md", shape, className, children, ...props }: AsButton | AsLink) {
  const form = shape ?? (size === "lg" ? "pill" : "button");
  const edged = form === "button" && filled.has(variant);
  const classes = cn(base, shapes[form], edged && "border-b-4 border-b-primary-edge", variants[variant], sizes[size], className);
  const content =
    variant === "live" ? (
      <>
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-on-primary motion-safe:animate-pulse" />
        {children}
      </>
    ) : (
      children
    );
  if (props.href !== undefined) {
    return (
      <Link {...(props as Omit<AsLink, "children">)} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" {...(props as Omit<AsButton, "children">)} className={classes}>
      {content}
    </button>
  );
}
