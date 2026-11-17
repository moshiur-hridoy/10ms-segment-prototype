"use client";

import { Check, CircleAlert, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select } from "@/design-system/molecules/select";
import { cn } from "@/lib/cn";
import { RoutineSheet } from "./sheet";

type Option = { value: string; label: string; href: string };
type Filters = {
  label: string;
  /** CT74: a batch's routine (`?batch=`) has one course and nothing to miss, so it leaves both out. */
  course?: { label: string; value: string; options: Option[] };
  subject: { label: string; value: string; options: Option[] };
  missed?: { label: string; on: boolean; href: string };
};

/**
 * Course, subject and "missed only", for the whole planner. Every option's URL is built on the
 * server; this only navigates (replacing the history entry, like turning pages).
 */
export function RoutineFilters({ label, course, subject, missed, className }: Filters & { className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (options: Option[]) => (value: string) => {
    const next = options.find((o) => o.value === value);
    if (next) startTransition(() => router.replace(next.href, { scroll: false }));
  };

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-2", pending && "opacity-70", className)}>
      {course && <Select label={course.label} value={course.value} options={course.options} onChange={go(course.options)} className="w-64" />}
      <Select label={subject.label} value={subject.value} options={subject.options} onChange={go(subject.options)} className="w-44" />
      {missed && <MissedChip {...missed} />}
    </div>
  );
}

/** "শুধু মিসড": a toggle pill; `tall` meets the 44px touch size in the phone sheet. */
function MissedChip({ label, on, href, tall }: NonNullable<Filters["missed"]> & { tall?: boolean }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors",
        tall ? "h-11" : "h-10",
        on ? "border-danger bg-danger-soft text-danger" : "border-border-strong bg-surface text-text hover:border-danger hover:text-danger",
      )}
    >
      <CircleAlert className="size-4" aria-hidden />
      {label}
    </Link>
  );
}

/**
 * The same filters on phones: one "ফিল্টার" pill (with how many are on) opening a bottom sheet.
 * Inside, the options are laid out rather than tucked into dropdowns, so each choice is one tap
 * and nothing pops over the sheet: courses (long names) as a list with a ✓ like the Select's,
 * subjects (short) as chips, then "শুধু মিসড". The sheet stays open while choices are made (a new
 * course brings its own subjects); "ঠিক আছে" closes it.
 */
export function PhoneFilters({
  label,
  course,
  subject,
  missed,
  labels,
  active,
  clearHref,
  className,
}: Filters & {
  labels: { filter: string; clear: string; done: string; close: string };
  /** How many filters are on, as a number ("২") and spoken ("২টি চালু"); null when none. */
  active: { count: string; label: string } | null;
  /** Every filter off. */
  clearHref: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <RoutineSheet
        title={labels.filter}
        closeLabel={labels.close}
        done={labels.done}
        triggerLabel={active ? `${labels.filter}, ${active.label}` : undefined}
        triggerClassName={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
          active ? "border-brand bg-brand-soft text-brand-text" : "border-border-strong bg-surface text-text",
        )}
        trigger={
          <>
            <SlidersHorizontal className="size-4" aria-hidden />
            {labels.filter}
            {active && (
              <span aria-hidden className="grid size-5 place-items-center rounded-full bg-brand text-xs text-on-primary tabular-nums">
                {active.count}
              </span>
            )}
          </>
        }
      >
        <div role="group" aria-label={label} className="grid gap-6">
          {course && (
            <section className="grid gap-1">
              <h3 className="mb-1 text-sm font-semibold text-muted">{course.label}</h3>
              <ul className="grid">
                {course.options.map((o) => {
                  const chosen = o.value === course.value;
                  return (
                    <li key={o.value}>
                      <Link
                        href={o.href}
                        replace
                        scroll={false}
                        aria-current={chosen || undefined}
                        className={cn(
                          "flex min-h-11 items-start gap-2 rounded-md px-3 py-2.5 text-sm leading-snug transition-colors active:bg-raised",
                          chosen ? "bg-raised font-semibold text-text" : "text-muted",
                        )}
                      >
                        <Check className={cn("mt-0.5 size-4 shrink-0 text-brand", !chosen && "invisible")} aria-hidden />
                        <span className="min-w-0 flex-1">{o.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="grid gap-1">
            <h3 className="mb-1 text-sm font-semibold text-muted">{subject.label}</h3>
            <ul className="flex flex-wrap gap-2">
              {subject.options.map((o) => {
                const chosen = o.value === subject.value;
                return (
                  <li key={o.value}>
                    <Link
                      href={o.href}
                      replace
                      scroll={false}
                      aria-current={chosen || undefined}
                      className={cn(
                        "inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
                        chosen ? "border-brand bg-brand-soft text-brand-text" : "border-border-strong bg-surface text-text",
                      )}
                    >
                      {o.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {missed ? <MissedChip {...missed} tall /> : <span />}
            {active && (
              <Link href={clearHref} replace scroll={false} className="inline-flex h-11 items-center px-2 text-sm font-semibold text-brand-text">
                {labels.clear}
              </Link>
            )}
          </div>
        </div>
      </RoutineSheet>
    </div>
  );
}
