import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { ContentType } from "@/lib/api";
import { ContentIcon } from "@/design-system/atoms/content-icon";
import { cn } from "@/lib/cn";

/**
 * "Where you stopped": a capsule with a hairline stroke (S42). What it is, a small label above
 * the title, and a "continue" pill (a chevron alone on phones). The whole capsule is the link.
 * Used once per subject group, and once at the top of the dashboard for the latest one.
 */
export function ResumeStrip({
  href,
  type,
  label,
  title,
  action,
  className,
}: {
  href: string;
  type: ContentType;
  label: ReactNode;
  title: string;
  action: string;
  /** Extra classes, e.g. a tinted fill where the strip floats (lab `class` v50, P145). */
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group/cont flex min-h-11 items-center gap-3 rounded-full border border-border bg-raised py-2 pl-3 pr-4 press hover:border-brand/40 sm:pr-2",
        className,
      )}
    >
      <ContentIcon type={type} size="sm" className="ring-0" />
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-xs text-subtle">{label}</span>
        <span className="truncate text-sm font-semibold">{title}</span>
      </span>
      <span className="hidden h-9 shrink-0 items-center gap-1 rounded-full bg-brand-soft px-3 text-sm font-semibold text-brand-text sm:inline-flex">
        {action}
        <ChevronRight className="size-4 transition-transform group-hover/cont:translate-x-0.5" aria-hidden />
      </span>
      <ChevronRight className="size-4 shrink-0 text-subtle sm:hidden" aria-hidden />
    </a>
  );
}
