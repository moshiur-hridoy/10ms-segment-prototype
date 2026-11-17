"use client";

import { CircleAlert, CircleCheck, CircleX, Clock } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ClassStatus = "ontime" | "late" | "absent";

export type ChartDay = {
  date: string;
  /** Short weekday ("শনি"), under the column in the week view. */
  tick: string;
  /** Day of the month, formatted. */
  day: string;
  /** Heading for the day's details. */
  heading: string;
  /** Full sentence for screen readers and the tooltip. */
  label: string;
  future: boolean;
  held: number;
  attended: number;
  /** "২/৩", or null when no class was held. */
  fraction: string | null;
  /** Minutes per series, in series order, and their formatted text. */
  values: number[];
  texts: string[];
  total: number;
  totalText: string;
  classes: { id: string; time: string; title: string; status: ClassStatus; statusLabel: string }[];
  attempts: { id: string; title: string; score: string }[];
};

export type DaySeries = { key: string; label: string; total: string; fill: string };

const classIcon: Record<ClassStatus, (cls: string) => ReactNode> = {
  ontime: (cls) => <CircleCheck className={cn("shrink-0 text-chart-good", cls)} aria-hidden />,
  late: (cls) => <Clock className={cn("shrink-0 text-warning", cls)} aria-hidden />,
  absent: (cls) => <CircleX className={cn("shrink-0 text-danger", cls)} aria-hidden />,
};

/** A whole day's attendance, for the month cells: all, some or none of its classes. */
function dayIcon(d: ChartDay, cls: string) {
  if (d.held === 0) return null;
  if (d.attended === d.held) return <CircleCheck className={cn("shrink-0 text-chart-good", cls)} aria-hidden />;
  if (d.attended === 0) return <CircleX className={cn("shrink-0 text-danger", cls)} aria-hidden />;
  return <CircleAlert className={cn("shrink-0 text-warning", cls)} aria-hidden />;
}

/**
 * One chart for the days, so a day's classes and study time are read together.
 * Week: a column per day, study time stacked by type, the day's classes as status icons under
 * the baseline. Month: a calendar, each day with its attendance icon and a study-time bar.
 * Tap a day for its classes, study and exams; a table view carries every number.
 */
export function DayChart({
  kind,
  days,
  series,
  weekdays,
  lead,
  max,
  ticks,
  initial,
  labels,
}: {
  kind: "week" | "month";
  days: ChartDay[];
  series: DaySeries[];
  /** Saturday-first weekday labels, for the month calendar. */
  weekdays: string[];
  /** Blank cells before the first day of the month, so columns line up with weekdays. */
  lead: number;
  /** Axis top in minutes. */
  max: number;
  ticks: { value: number; label: string }[];
  initial: string | null;
  labels: {
    chart: string;
    studyTotal: string;
    ontime: string;
    late: string;
    absent: string;
    dayAll: string;
    daySome: string;
    dayNone: string;
    pickDay: string;
    nothing: string;
    classes: string;
    study: string;
    attempts: string;
    noStudy: string;
    table: string;
    day: string;
    total: string;
    studyKey: string;
  };
}) {
  const [selected, setSelected] = useState(initial);
  const day = days.find((d) => d.date === selected) ?? null;
  const week = kind === "week";

  const tooltip = (d: ChartDay) => (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden w-max max-w-56 -translate-x-1/2 rounded-md bg-text px-2.5 py-1.5 text-xs font-medium text-surface shadow-pop group-hover/day:block group-focus-visible/day:block"
    >
      {d.label}
    </span>
  );

  return (
    <div className="grid min-w-0 gap-4">
      {/* Legend: what the bars are, and what the icons mean. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {week ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {series.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span className={cn("size-3 rounded-xs", s.fill)} aria-hidden />
                <span className="text-muted">{s.label}</span>
                <span className="font-semibold">{s.total}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2">
            <span className="h-1.5 w-4 rounded-full bg-chart-seq-4" aria-hidden />
            <span className="text-muted">{labels.studyKey}</span>
            <span className="font-semibold">{labels.studyTotal}</span>
          </p>
        )}
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-muted">
          {(week
            ? [
                [classIcon.ontime("size-4"), labels.ontime],
                [classIcon.late("size-4"), labels.late],
                [classIcon.absent("size-4"), labels.absent],
              ]
            : [
                [<CircleCheck key="a" className="size-4 text-chart-good" aria-hidden />, labels.dayAll],
                [<CircleAlert key="s" className="size-4 text-warning" aria-hidden />, labels.daySome],
                [<CircleX key="n" className="size-4 text-danger" aria-hidden />, labels.dayNone],
              ]
          ).map(([icon, text], i) => (
            <li key={i} className="flex items-center gap-1.5">
              {icon}
              {text}
            </li>
          ))}
        </ul>
      </div>

      {week ? (
        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
          {/* y-axis labels, beside the bar area only */}
          <div className="relative h-40 w-14" aria-hidden>
            {ticks.map((t) => (
              <span key={t.value} className="absolute right-0 -translate-y-1/2 text-xs whitespace-nowrap text-subtle tabular-nums" style={{ bottom: `${(t.value / max) * 100}%` }}>
                {t.label}
              </span>
            ))}
          </div>
          <div className="relative min-w-0">
            {/* recessive hairline grid; the 0 line is the baseline */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40" aria-hidden>
              {ticks.map((t) => (
                <span key={t.value} className={cn("absolute inset-x-0 h-px", t.value === 0 ? "bg-border-strong" : "bg-border")} style={{ bottom: `${(t.value / max) * 100}%` }} />
              ))}
            </div>
            <div className="relative flex" role="group" aria-label={labels.chart}>
              {days.map((d) => {
                const active = d.date === selected;
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={d.future}
                    onClick={() => setSelected(d.date)}
                    aria-pressed={active}
                    aria-label={d.label}
                    className={cn(
                      "group/day relative flex min-w-0 flex-1 flex-col items-center rounded-md pb-2 transition-colors",
                      active ? "bg-raised ring-1 ring-border-strong ring-inset" : "enabled:hover:bg-raised",
                    )}
                  >
                    <span className="flex h-40 w-full items-end justify-center px-px">
                      {d.total > 0 && (
                        <span className="flex w-full max-w-7 flex-col-reverse gap-0.5" style={{ height: `${(d.total / max) * 100}%` }} aria-hidden>
                          {d.values.map((v, i) => (v > 0 ? <span key={series[i].key} className={cn("w-full last:rounded-t-xs", series[i].fill)} style={{ flexGrow: v }} /> : null))}
                        </span>
                      )}
                    </span>
                    <span className="flex min-h-9 flex-wrap content-start justify-center gap-0.5 px-0.5 pt-2" aria-hidden>
                      {d.classes.map((c) => (
                        <span key={c.id}>{classIcon[c.status]("size-3.5")}</span>
                      ))}
                    </span>
                    <span className={cn("text-xs", d.future ? "text-subtle" : "text-muted")} aria-hidden>
                      {d.tick}
                    </span>
                    <span className={cn("text-xs font-semibold tabular-nums", d.future && "font-normal text-subtle")} aria-hidden>
                      {d.day}
                    </span>
                    {!d.future && tooltip(d)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5" role="group" aria-label={labels.chart}>
          {weekdays.map((w) => (
            <span key={w} className="text-center text-xs text-subtle" aria-hidden>
              {w}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${i}`} aria-hidden />
          ))}
          {days.map((d) => {
            const active = d.date === selected;
            if (d.future) {
              return (
                <span key={d.date} className="grid h-14 place-items-center rounded-md border border-dashed border-border text-xs text-subtle sm:h-20" aria-hidden>
                  {d.day}
                </span>
              );
            }
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelected(d.date)}
                aria-pressed={active}
                aria-label={d.label}
                className={cn(
                  "group/day relative grid h-14 min-w-0 content-between rounded-md bg-raised p-1.5 text-left ring-1 ring-border ring-inset transition-shadow sm:h-20 sm:p-2",
                  active ? "ring-2 ring-text" : "hover:ring-border-strong",
                )}
              >
                <span className="flex items-start justify-between gap-1" aria-hidden>
                  <span className="text-xs leading-none font-semibold tabular-nums">{d.day}</span>
                  {dayIcon(d, "size-3.5 sm:size-4")}
                </span>
                <span className="grid gap-1" aria-hidden>
                  {d.fraction && <span className="hidden text-xs leading-none text-muted tabular-nums sm:block">{d.fraction}</span>}
                  <span className="h-1.5 w-full overflow-hidden rounded-full bg-chart-seq-1">
                    {d.total > 0 && <span className="block h-full rounded-full bg-chart-seq-4" style={{ width: `${Math.max(8, (d.total / max) * 100)}%` }} />}
                  </span>
                </span>
                {tooltip(d)}
              </button>
            );
          })}
        </div>
      )}

      {/* The chosen day, in full. */}
      <div className="min-h-24 rounded-md bg-raised p-3" aria-live="polite">
        {!day ? (
          <p className="text-sm text-subtle">{labels.pickDay}</p>
        ) : day.held === 0 && day.total === 0 && day.attempts.length === 0 ? (
          <div className="grid gap-1">
            <p className="text-sm font-semibold">{day.heading}</p>
            <p className="text-sm text-subtle">{labels.nothing}</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm font-semibold">{day.heading}</p>
            <div className="grid gap-4 @2xl:grid-cols-3">
              {day.held > 0 && (
                <DetailBlock title={`${labels.classes} · ${day.fraction}`}>
                  {day.classes.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      {classIcon[c.status]("size-4")}
                      <span className="sr-only">{c.statusLabel}:</span>
                      <span className="shrink-0 text-subtle tabular-nums">{c.time}</span>
                      <span className="min-w-0 truncate">{c.title}</span>
                    </li>
                  ))}
                </DetailBlock>
              )}
              <DetailBlock title={day.total > 0 ? `${labels.study} · ${day.totalText}` : labels.study}>
                {day.total > 0 ? (
                  series.map((s, i) =>
                    day.values[i] > 0 ? (
                      <li key={s.key} className="flex items-center gap-2">
                        <span className={cn("size-2.5 shrink-0 rounded-xs", s.fill)} aria-hidden />
                        <span className="text-muted">{s.label}</span>
                        <span className="ml-auto font-semibold tabular-nums">{day.texts[i]}</span>
                      </li>
                    ) : null,
                  )
                ) : (
                  <li className="text-subtle">{labels.noStudy}</li>
                )}
              </DetailBlock>
              {day.attempts.length > 0 && (
                <DetailBlock title={labels.attempts}>
                  {day.attempts.map((a) => (
                    <li key={a.id} className="flex items-center gap-2">
                      <span className="min-w-0 truncate">{a.title}</span>
                      <span className="ml-auto font-semibold tabular-nums">{a.score}</span>
                    </li>
                  ))}
                </DetailBlock>
              )}
            </div>
          </div>
        )}
      </div>

      <details className="group/table">
        <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-full px-3 text-sm font-semibold text-brand-text hover:bg-brand-soft [&::-webkit-details-marker]:hidden">
          {labels.table}
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-subtle">
                <th className="py-2 pr-3 font-medium">{labels.day}</th>
                <th className="py-2 pr-3 text-right font-medium">{labels.classes}</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 pr-3 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                <th className="py-2 pr-3 text-right font-medium">{labels.total}</th>
                <th className="py-2 text-right font-medium">{labels.attempts}</th>
              </tr>
            </thead>
            <tbody>
              {days
                .filter((d) => !d.future)
                .map((d) => (
                  <tr key={d.date} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3">{d.heading}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{d.fraction ?? "–"}</td>
                    {d.texts.map((text, i) => (
                      <td key={series[i].key} className="py-2 pr-3 text-right tabular-nums">
                        {d.values[i] > 0 ? text : "–"}
                      </td>
                    ))}
                    <td className="py-2 pr-3 text-right font-semibold tabular-nums">{d.total > 0 ? d.totalText : "–"}</td>
                    <td className="py-2 text-right tabular-nums">{d.attempts.map((a) => a.score).join(", ") || "–"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ul className="grid gap-1.5 text-sm">{children}</ul>
    </div>
  );
}
