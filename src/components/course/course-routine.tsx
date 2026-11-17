import { CalendarCheck, CalendarDays, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ClassRow } from "@/design-system/molecules/class-row";
import { Button } from "@/design-system/atoms/button";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ClassView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { jumpTarget } from "./anchor";

/**
 * Only this course's classes. When there are none, one quiet line instead of an
 * illustration: an empty routine is normal between classes, not an error.
 */
export function CourseRoutine({
  items,
  more,
  missed,
  routineHref,
  fmt,
  t,
}: {
  items: ClassView[];
  more: number;
  missed: number;
  /** The full routine, filtered to this course. */
  routineHref: string;
  fmt: Formatter;
  t: Dictionary;
}) {
  const c = t.courseHome;
  return (
    <SectionCard
      title={c.routine}
      titleId="course-routine"
      className={jumpTarget}
      action={
        <Button variant="ghost" size="sm" href={routineHref} className="text-brand-text">
          <CalendarDays className="size-4" aria-hidden />
          {c.fullRoutine}
        </Button>
      }
    >
      {items.length > 0 ? (
        <ul className="grid gap-1">
          {items.map((item) => (
            <ClassRow key={item.id} item={item} fmt={fmt} t={t} />
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-3 rounded-md bg-raised px-3 py-3 text-sm text-muted">
          <CalendarCheck className="size-5 shrink-0 text-subtle" aria-hidden />
          {c.routineEmpty}
        </p>
      )}
      {(more > 0 || missed > 0) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
          {more > 0 && <InlineLink href={routineHref}>{fill(c.routineMore, { n: fmt.number(more) })}</InlineLink>}
          {missed > 0 && (
            <InlineLink href={`${routineHref}&missed=1`} className="text-danger">
              {fill(c.missed, { n: fmt.number(missed) })}
            </InlineLink>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function InlineLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-9 items-center gap-0.5 font-semibold text-brand-text hover:underline", className)}>
      {children}
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  );
}
