import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/design-system/atoms/card";
import { Skeleton } from "@/design-system/atoms/skeleton";

const densities = {
  /** Dashboard and course home: roomy cards with a 20px title. */
  default: {
    card: "gap-5 p-5 sm:p-6",
    header: "items-center gap-3",
    title: "flex items-center gap-2 type-title",
  },
  /** Learning report: denser cards with an 18px title; children can use container queries. */
  compact: {
    card: "@container gap-4 p-4 sm:p-5",
    header: "items-baseline gap-2",
    title: "type-subtitle",
  },
} as const;

/** Standard section card: title row with an optional action, then content. */
export function SectionCard({
  title,
  titleId,
  action,
  density = "default",
  children,
  className,
  titleClassName,
  style,
}: {
  title: ReactNode;
  /** Heading id; also the section's accessible name and the jump-link target. */
  titleId: string;
  action?: ReactNode;
  density?: keyof typeof densities;
  children: ReactNode;
  className?: string;
  /** Extra classes on the heading (e.g. a larger size on one page). */
  titleClassName?: string;
  style?: React.CSSProperties;
}) {
  const d = densities[density];
  return (
    <Card aria-labelledby={titleId} className={cn("grid grid-cols-1", d.card, className)} style={style}>
      <div className={cn("flex flex-wrap justify-between", d.header)}>
        <h2 id={titleId} className={cn(d.title, titleClassName)}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

/** Placeholder shown while a section's data streams in. */
export function SectionSkeleton({ rows = 3, className, label }: { rows?: number; className?: string; label: string }) {
  return (
    <Card aria-busy="true" aria-label={label} className={cn("grid gap-4 p-5 sm:p-6", className)}>
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton radius="md" className="size-12 shrink-0" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </Card>
  );
}
