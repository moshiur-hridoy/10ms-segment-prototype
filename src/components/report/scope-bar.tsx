import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Course, Period, PeriodKind } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { CourseSelect } from "./course-select";
import { IconButton } from "@/design-system/atoms/icon-button";

export type ReportLink = (change: { course?: string; period?: PeriodKind; offset?: number }) => string;

/** "এই সপ্তাহ · ২৪–৩০ অক্টোবর", "১৭–২৩ অক্টোবর", "এই মাস · অক্টোবর ২০২৬" */
export function periodLabel(p: Period, fmt: Formatter, t: Dictionary) {
  const r = t.report;
  const span = p.kind === "week" ? fmt.dayRange(p.start, p.end) : fmt.month(p.start);
  if (p.offset !== 0) return span;
  return `${p.kind === "week" ? r.thisWeek : r.thisMonth} · ${span}`;
}

/**
 * The one control row for the whole report: course, week/month, and ‹ period ›.
 * Every section below reads the same scope, so the numbers always agree.
 */
export function ScopeBar({
  courses,
  courseValue,
  period,
  link,
  fmt,
  t,
}: {
  courses: Course[];
  /** "all" or a course id. */
  courseValue: string;
  period: Period;
  link: ReportLink;
  fmt: Formatter;
  t: Dictionary;
}) {
  const r = t.report;
  const noun = r.periodKind[period.kind];
  // Same footprint as the IconButton arrows (sm), for the empty "next" slot.
  const arrow = "grid size-9 shrink-0 place-items-center rounded-full text-muted";

  return (
    <nav
      aria-label={r.scope}
      className="sticky top-16 z-30 -mx-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6"
    >
      <div className="min-w-0 flex-1 basis-60">
        <CourseSelect
          label={r.course}
          value={courseValue}
          options={[
            { value: "all", label: r.allCourses, href: link({ course: "all" }) },
            ...courses.map((c) => ({ value: c.id, label: c.title, href: link({ course: c.id }) })),
          ]}
        />
      </div>

      <div className="flex items-center gap-2">
        <div role="group" aria-label={r.periodLabel} className="inline-flex rounded-full bg-raised p-1 ring-1 ring-border ring-inset">
          {(["week", "month"] as const).map((k) => (
            <Link
              key={k}
              href={link({ period: k, offset: 0 })}
              scroll={false}
              aria-current={period.kind === k ? "true" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full px-3.5 text-sm font-semibold transition-colors",
                period.kind === k ? "bg-surface text-text shadow-card" : "text-muted hover:text-text",
              )}
            >
              {r.periodKind[k]}
            </Link>
          ))}
        </div>

        <div className="flex items-center">
          <IconButton href={link({ offset: period.offset - 1 })} scroll={false} label={fill(r.prev, { period: noun })} variant="subtle">
            <ChevronLeft className="size-5" aria-hidden />
          </IconButton>
          <span className="min-w-36 text-center text-sm font-semibold" aria-live="polite">
            {periodLabel(period, fmt, t)}
          </span>
          {period.offset < 0 ? (
            <IconButton href={link({ offset: period.offset + 1 })} scroll={false} label={fill(r.next, { period: noun })} variant="subtle">
              <ChevronRight className="size-5" aria-hidden />
            </IconButton>
          ) : (
            // The future has no data: keep the slot so the label doesn't shift.
            <span className={cn(arrow, "pointer-events-none opacity-30")} aria-hidden>
              <ChevronRight className="size-5" />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
