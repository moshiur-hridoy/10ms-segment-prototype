import type { ComponentPropsWithRef, ElementType } from "react";
import { cn } from "@/lib/cn";

/*
 * The white surface everything sits on. One component for every bordered box, so the border,
 * radius and elevation can't drift:
 *   radius "lg" for cards on the page: the live site's 8px card · "md" (10) for tiles and boxes inside a card
 *   elevation "pop" for things floating over the page: menus, dialogs, tooltips
 *   interactive: the whole box is a link (press, lift 2px, stronger border on hover; live cards cast no shadow)
 * `as` picks the element: section (default), div, li, a, Link, details …
 */
type CardProps<T extends ElementType> = {
  as?: T;
  radius?: "md" | "lg";
  elevation?: "flat" | "pop";
  interactive?: boolean;
} & Omit<ComponentPropsWithRef<T>, "as">;

export function Card<T extends ElementType = "section">({ as, radius = "lg", elevation = "flat", interactive, className, ...props }: CardProps<T>) {
  const Tag: ElementType = as ?? "section";
  return (
    <Tag
      className={cn(
        "border border-border bg-surface",
        radius === "lg" ? "rounded-card" : "rounded-md",
        elevation === "pop" && "shadow-pop",
        interactive && "press lift hover:border-border-strong hover:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("flex items-center justify-between gap-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithRef<"h2">) {
  return <h2 className={cn("type-title text-text", className)} {...props} />;
}
