"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Card } from "@/design-system/atoms/card";

export type ColumnSeries = { key: string; label: string; total: string; fill: string };
export type ColumnDay = {
  date: string;
  /** Under the column: weekday (week view) or day number (month view). */
  tick: string;
  /** Only every few ticks are shown in the month view. */
  showTick: boolean;
  heading: string;
  /** Minutes per series, in series order, and their formatted text. */
  values: number[];
  texts: string[];
  total: number;
  totalText: string;
  future: boolean;
};

/**
 * Values per day, stacked by series (e.g. study time by activity). Thin columns (≤ 24px) with 4px rounded tops,
 * segments separated by a 2px surface gap; hover or focus a day for every value at once.
 * The legend carries the totals and a table view carries everything, so nothing hides
 * behind the tooltip.
 */
export function StackedColumns({
  series,
  days,
  ticks,
  max,
  labels,
}: {
  series: ColumnSeries[];
  days: ColumnDay[];
  /** Gridlines: value in minutes and its label. */
  ticks: { value: number; label: string }[];
  max: number;
  labels: { table: string; day: string; total: string; chart: string };
}) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div className="grid gap-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className={cn("size-3 rounded-xs", s.fill)} aria-hidden />
            <span className="text-muted">{s.label}</span>
            <span className="font-semibold">{s.total}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2" role="group" aria-label={labels.chart}>
        {/* y-axis labels */}
        <div className="relative h-48 w-16" aria-hidden>
          {ticks.map((t) => (
            <span key={t.value} className="absolute right-0 -translate-y-1/2 text-xs whitespace-nowrap text-subtle tabular-nums" style={{ bottom: `${(t.value / max) * 100}%` }}>
              {t.label}
            </span>
          ))}
        </div>

        <div className="relative h-48">
          {/* recessive hairline grid; the 0 line is the baseline */}
          {ticks.map((t) => (
            <span
              key={t.value}
              aria-hidden
              className={cn("absolute inset-x-0 h-px", t.value === 0 ? "bg-border-strong" : "bg-border")}
              style={{ bottom: `${(t.value / max) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex">
            {days.map((d) => {
              const open = hover === d.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  disabled={d.future}
                  aria-label={`${d.heading}: ${labels.total} ${d.totalText}`}
                  onPointerEnter={() => setHover(d.date)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(d.date)}
                  onBlur={() => setHover(null)}
                  // px-px: a 2px surface gap between neighbouring bars when the columns get narrow.
                  className={cn("group/col relative flex h-full min-w-0 flex-1 items-end justify-center rounded-sm px-px outline-offset-0", open && "bg-raised")}
                >
                  {d.total > 0 && (
                    <span className="flex w-full max-w-6 flex-col-reverse gap-0.5" style={{ height: `${(d.total / max) * 100}%` }} aria-hidden>
                      {d.values.map((v, i) =>
                        v > 0 ? (
                          <span key={series[i].key} className={cn("w-full last:rounded-t-xs", series[i].fill)} style={{ flexGrow: v }} />
                        ) : null,
                      )}
                    </span>
                  )}
                  {open && (
                    <Card as="span" radius="md" elevation="pop"
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 grid w-max min-w-40 -translate-x-1/2 gap-1 p-2.5 text-left text-xs"
                    >
                      <span className="font-semibold text-muted">{d.heading}</span>
                      {series.map((s, i) => (
                        <span key={s.key} className="flex items-center gap-2">
                          <span className={cn("h-0.5 w-3 rounded-full", s.fill)} aria-hidden />
                          <span className="font-semibold text-text">{d.texts[i]}</span>
                          <span className="text-subtle">{s.label}</span>
                        </span>
                      ))}
                      <span className="mt-0.5 border-t border-border pt-1 font-semibold text-text">
                        {labels.total}: {d.totalText}
                      </span>
                    </Card>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <span aria-hidden />
        <div className="flex pt-1.5" aria-hidden>
          {days.map((d) => (
            <span key={d.date} className="min-w-0 flex-1 text-center text-xs text-subtle">
              {d.showTick ? d.tick : ""}
            </span>
          ))}
        </div>
      </div>

      <details className="group/table">
        <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-full px-3 text-sm font-semibold text-brand-text hover:bg-brand-soft [&::-webkit-details-marker]:hidden">
          {labels.table}
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-subtle">
                <th className="py-2 pr-3 font-medium">{labels.day}</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 pr-3 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">{labels.total}</th>
              </tr>
            </thead>
            <tbody>
              {days
                .filter((d) => !d.future)
                .map((d) => (
                  <tr key={d.date} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-3">{d.heading}</td>
                    {d.texts.map((text, i) => (
                      <td key={series[i].key} className="py-1.5 pr-3 text-right tabular-nums">
                        {text}
                      </td>
                    ))}
                    <td className="py-1.5 text-right font-semibold tabular-nums">{d.totalText}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
