import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

// No red "live" button: red marks that something is live (badge, tile); Join is an action, so primary.
const variants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  // Join a live class: the primary with a ring that keeps spreading out from its edge and fading,
  // and a softly pulsing dot before the label, so the one time-critical action on a page catches
  // the eye. With reduced motion the ring holds still as a halo.
  live: "bg-primary text-on-primary shadow-live motion-safe:animate-live-ring hover:bg-primary-hover",
  // Primary with a 3px darker edge that presses down on tap. Only for the game-like moments
  // (start an exam, submit an answer, results, streak); everywhere else stays flat.
  raised:
    "bg-primary text-on-primary shadow-[0_3px_0_var(--color-primary-edge)] duration-75 hover:bg-primary-hover active:translate-y-[3px] active:shadow-none",
  secondary: "border border-border-strong bg-surface text-brand-text hover:bg-raised",
  soft: "bg-brand-soft text-brand-text hover:brightness-95 dark:hover:brightness-125",
  ghost: "text-muted hover:bg-raised hover:text-text",
} as const;

const sizes = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-11 gap-2 px-5 text-base",
  lg: "h-12 gap-2 px-6 text-base",
} as const;

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common>;

const base =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-semibold transition-[background-color,filter,color,scale,translate,box-shadow] disabled:pointer-events-none disabled:opacity-50";

export function Button({ variant = "primary", size = "md", className, children, ...props }: AsButton | AsLink) {
  // The raised button presses down instead of shrinking (`cn` can't drop a conflicting class).
  const press = variant === "raised" ? "" : "active:scale-[0.98]";
  const classes = cn(base, press, variants[variant], sizes[size], className);
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
