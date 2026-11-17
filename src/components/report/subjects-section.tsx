import { CircleAlert } from "lucide-react";
import { Badge } from "@/design-system/atoms/badge";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ReportView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";

/**
 * Every subject in one row: attendance, correct answers, study time and homework side by side,
 * weakest first. Bars are plain amounts (blue); only the one cell that needs attention turns
 * amber, with an icon and a sentence, so judgement never rests on colour.
 * Wide card: a table-like grid with one header row. Narrow: each subject is a block with its
 * four measures in a 2×2 grid, each labelled.
 */
export function SubjectsSection({ report, fmt, t, className }: { report: ReportView; fmt: Formatter; t: Dictionary; className?: string }) {
  const s = t.report.subjects;
  const rows = report.subjects;
  if (rows.length === 0) return null;

  const focus = report.focusSubject;
  const maxMinutes = Math.max(1, ...rows.map((r) => r.minutes));
  const cols = [s.attendance, s.accuracy, s.time, s.homework];
  const grid = "@2xl:grid-cols-[minmax(0,9rem)_repeat(4,minmax(0,1fr))]";

  return (
    <SectionCard density="compact" titleId="report-subjects" title={s.title} className={className}>
      <div className="grid gap-3">
        <div className={cn("hidden gap-4 border-b border-border pb-2 text-xs font-semibold text-muted @2xl:grid", grid)} aria-hidden>
          <span>{s.subject}</span>
          {cols.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>

        <ul className="grid divide-y divide-border">
          {rows.map((r) => {
            const flagged = focus?.subject === r.subject ? focus.metric : null;
            const cells = [
              { label: s.attendance, value: r.held > 0 ? `${fmt.number(r.attended)}/${fmt.number(r.held)}` : null, pct: r.held > 0 ? (r.attended / r.held) * 100 : null, warn: flagged === "attendance" },
              { label: s.accuracy, value: r.asked > 0 ? fmt.percent((r.correct / r.asked) * 100) : null, pct: r.asked > 0 ? (r.correct / r.asked) * 100 : null, warn: flagged === "accuracy" },
              { label: s.time, value: r.minutes > 0 ? fmt.minutes(r.minutes) : null, pct: r.minutes > 0 ? (r.minutes / maxMinutes) * 100 : null, warn: false },
              { label: s.homework, value: r.hwDue > 0 ? `${fmt.number(r.hwDone)}/${fmt.number(r.hwDue)}` : null, pct: r.hwDue > 0 ? (r.hwDone / r.hwDue) * 100 : null, warn: false },
            ];
            return (
              <li key={r.subject} className={cn("grid grid-cols-2 gap-x-4 gap-y-3 py-3 first:pt-0 last:pb-0 @2xl:items-center", grid)}>
                <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 @2xl:col-span-1">
                  <span className="max-w-full truncate font-semibold" title={r.subject}>
                    {r.subject}
                  </span>
                  {flagged && (
                    <Badge tone="warning" size="sm" className="shrink-0">
                      {s.focus}
                    </Badge>
                  )}
                </div>
                {cells.map((c) => (
                  <dl key={c.label} className="grid min-w-0 gap-1">
                    <dt className="text-xs text-muted @2xl:sr-only">{c.label}</dt>
                    <dd className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                      {c.warn && <CircleAlert className="size-4 shrink-0 text-warning" aria-hidden />}
                      {c.value ?? <span className="font-normal text-subtle">{s.noValue}</span>}
                    </dd>
                    {c.pct !== null && (
                      <dd className="h-1.5 overflow-hidden rounded-full bg-chart-seq-1" aria-hidden>
                        <span className={cn("block h-full rounded-full", c.warn ? "bg-chart-warn" : "bg-chart-seq-4")} style={{ width: `${Math.max(4, c.pct)}%` }} />
                      </dd>
                    )}
                  </dl>
                ))}
              </li>
            );
          })}
        </ul>

        {focus && (
          <p className="flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <span>{fill(s.focusNote[focus.metric], { subject: focus.subject, value: fmt.percent(focus.value), avg: fmt.percent(focus.avg) })}</span>
          </p>
        )}
      </div>
    </SectionCard>
  );
}
