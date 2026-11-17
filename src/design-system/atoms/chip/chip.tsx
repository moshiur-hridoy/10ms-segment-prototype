import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const hovers = {
  neutral: "hover:border-border-strong hover:text-text",
  highlight: "hover:border-highlight hover:text-highlight",
} as const;

/** Small pill link, e.g. one per subject that has a folder. */
export function ChipLink({
  href,
  hover = "neutral",
  className,
  children,
}: {
  href: string;
  hover?: keyof typeof hovers;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex h-8 items-center rounded-full border border-border bg-surface px-3 text-xs font-semibold text-muted transition-colors",
        hovers[hover],
        className,
      )}
    >
      {children}
    </a>
  );
}
