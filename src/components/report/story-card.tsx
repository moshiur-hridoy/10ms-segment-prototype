import { CircleAlert, CircleCheck } from "lucide-react";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ReportView, StoryFact } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";

type Metric = "attendance" | "accuracy" | "study" | "homework";

const metricOf: Record<StoryFact["kind"], Metric> = {
  attendanceAll: "attendance",
  attendanceUp: "attendance",
  attendanceDown: "attendance",
  missedClasses: "attendance",
  accuracyUp: "accuracy",
  accuracyDown: "accuracy",
  studyUp: "study",
  studyDown: "study",
  homeworkAll: "homework",
  homeworkOverdue: "homework",
};

/** "you missed…" opens the English sentence when there is no win before it. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * The period in one sentence: the biggest win and the one thing to look at, each with its
 * number as a chip. The numbers come from the same report as the tiles, so they always agree.
 */
export function StoryCard({ report, fmt, t, className }: { report: ReportView; fmt: Formatter; t: Dictionary; className?: string }) {
  const s = t.report.story;
  const noun = t.report.periodKind[report.period.kind];
  const { win, focus } = report.story;

  const clause = (f: StoryFact) => {
    const text = (f.kind in s.win ? s.win : s.focus) as Record<string, string>;
    switch (f.kind) {
      case "attendanceAll":
        return fill(text[f.kind], { held: fmt.number(f.held) });
      case "homeworkAll":
        return text[f.kind];
      case "studyUp":
      case "studyDown":
        return fill(text[f.kind], { by: fmt.minutes(f.by) });
      case "homeworkOverdue":
        return fill(text[f.kind], { n: fmt.number(f.n) });
      case "missedClasses":
        return fill(text[f.kind], { n: fmt.number(f.n), held: fmt.number(f.held) });
      default:
        return fill(text[f.kind], { by: fmt.percent(f.by) });
    }
  };

  const sentence =
    win && focus
      ? fill(s.both, { win: clause(win), focus: clause(focus) })
      : win
        ? fill(s.winOnly, { win: clause(win) })
        : focus
          ? fill(s.focusOnly, { focus: cap(clause(focus)) })
          : fill(s.steady, { period: noun });

  const { attendance, accuracy, homework } = report.kpis;
  const avg = (v: number | null) => (v === null ? null : fill(s.avg, { value: fmt.percent(v) }));
  /** The number behind a fact; the student's own average where it helps judge it. */
  const chip = (f: StoryFact): [string, string | null] => {
    switch (f.kind) {
      case "attendanceAll":
      case "attendanceUp":
      case "attendanceDown":
        return [fill(s.chip.attendance, { value: fmt.percent(attendance.value ?? 0) }), f.kind === "attendanceDown" ? avg(attendance.avg) : null];
      case "missedClasses":
        return [fill(s.chip.classes, { done: fmt.number(f.held - f.n), total: fmt.number(f.held) }), null];
      case "accuracyUp":
      case "accuracyDown":
        return [fill(s.chip.accuracy, { value: fmt.percent(f.value) }), f.kind === "accuracyDown" ? avg(accuracy.avg) : null];
      case "studyUp":
      case "studyDown":
        return [fill(s.chip.study, { value: fmt.minutes(f.value) }), null];
      default:
        return [fill(s.chip.homework, { done: fmt.number(homework.submitted), total: fmt.number(homework.due) }), null];
    }
  };

  const chips = [
    win && { key: "win", label: s.winLabel, fact: win, tone: "bg-success-soft text-success", Icon: CircleCheck },
    focus && { key: "focus", label: s.focusLabel, fact: focus, tone: "bg-warning-soft text-warning", Icon: CircleAlert },
  ].filter((c) => !!c);

  // The chart shows the measure the sentence is about: the worry first, else the win.
  const fact = focus ?? win;
  const metric: Metric = fact ? metricOf[fact.kind] : attendance.value !== null ? "attendance" : "study";
  const series = {
    attendance: attendance.trend,
    accuracy: accuracy.trend,
    study: report.kpis.study.perDayTrend,
    homework: homework.trend,
  }[metric];
  const valueText = (v: number) => (metric === "study" ? fmt.minutes(v) : fmt.percent(v));
  // Start at the first period with data, so a new student's few bars fill the width.
  const first = Math.max(0, series.findIndex((v) => v !== null));
  const shown = series.slice(first);
  const n = series.length;
  const kind = t.report.periodKind[report.period.kind].toLowerCase();
  const when = (i: number) =>
    i === n - 1
      ? report.period.offset === 0
        ? report.period.kind === "week"
          ? t.report.thisWeek
          : t.report.thisMonth
        : fill(s.selected, { period: kind })
      : fill(s.ago, { n: fmt.number(n - 1 - i), period: kind });

  return (
    <Card aria-labelledby="story-title" className={cn("@container grid content-center gap-5 p-5 sm:p-6", className)}>
      <div className="grid gap-5 @2xl:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] @2xl:items-center @2xl:gap-8">
        <div className="grid gap-4">
          <h2 id="story-title" className="text-sm font-semibold text-muted">
            {fill(s.title, { period: noun })}
          </h2>
          <p className="type-title text-balance sm:text-2xl sm:leading-snug">{sentence}</p>
          {chips.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {chips.map(({ key, label, fact, tone, Icon }) => {
                const [value, note] = chip(fact);
                return (
                  <li key={key} className={cn("inline-flex min-h-9 flex-wrap items-center gap-x-1.5 rounded-full px-3 py-1 text-sm", tone)}>
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="font-semibold">{label}:</span>
                    <span className="font-semibold text-text tabular-nums">{value}</span>
                    {note && <span className="text-muted">· {note}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <TrendBars
          values={shown}
          tone={focus ? "bg-chart-warn" : win ? "bg-chart-good" : "bg-chart-seq-4"}
          percent={metric !== "study"}
          title={fill(s.trendTitle, { metric: s.metric[metric], n: fmt.number(shown.length), period: kind })}
          valueText={valueText}
          when={(i) => when(i + first)}
          labels={{ avg: s.avgShort, bar: s.bar, noValue: s.noValue }}
        />
      </div>
    </Card>
  );
}

/**
 * The measure over the last periods: history in grey, the selected period in the story's colour
 * (amber for a worry, green for a win) with its value printed, and the student's own average
 * as a dashed line. Hover a bar for its value; the same values are listed for screen readers.
 */
function TrendBars({
  values,
  tone,
  percent,
  title,
  valueText,
  when,
  labels,
}: {
  values: (number | null)[];
  tone: string;
  percent: boolean;
  title: string;
  valueText: (v: number) => string;
  when: (i: number) => string;
  labels: { avg: string; bar: string; noValue: string };
}) {
  const known = values.filter((v): v is number => v !== null);
  if (known.length < 2) return null;
  const earlier = values.slice(0, -1).filter((v): v is number => v !== null);
  const avg = earlier.length > 0 ? earlier.reduce((a, v) => a + v, 0) / earlier.length : null;
  const max = percent ? 100 : Math.max(...known, avg ?? 0) * 1.15;
  const y = (v: number) => `${(v / max) * 100}%`;
  const last = values.length - 1;

  return (
    <figure className="grid min-w-0 gap-2">
      <figcaption className="text-xs font-semibold text-muted">{title}</figcaption>
      <div className="relative mt-5 h-24" aria-hidden>
        <div className="absolute inset-0 flex items-end gap-1.5 border-b border-border-strong">
          {values.map((v, i) => (
            <span key={i} className="group/bar relative flex h-full min-w-0 flex-1 items-end justify-center">
              {v !== null && <span className={cn("w-full max-w-6 rounded-t-xs", i === last ? tone : "bg-chart-muted")} style={{ height: y(Math.max(v, max * 0.02)) }} />}
              {i === last && v !== null && (
                <span className="absolute z-10 rounded-xs bg-surface px-0.5 text-xs font-bold whitespace-nowrap tabular-nums" style={{ bottom: `calc(${y(v)} + 4px)` }}>
                  {valueText(v)}
                </span>
              )}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden w-max -translate-x-1/2 rounded-md bg-text px-2 py-1 text-xs font-medium text-surface shadow-pop group-hover/bar:block">
                {fill(labels.bar, { when: when(i), value: v === null ? labels.noValue : valueText(v) })}
              </span>
            </span>
          ))}
        </div>
        {avg !== null && (
          <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-text/40" style={{ bottom: y(avg) }}>
            <span className="absolute -top-5 left-0 rounded-xs bg-surface/90 px-1 text-xs font-semibold text-muted tabular-nums">{fill(labels.avg, { value: valueText(avg) })}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between gap-2 text-xs text-subtle" aria-hidden>
        <span>{when(0)}</span>
        <span className="font-semibold text-text">{when(last)}</span>
      </div>
      <ul className="sr-only">
        {values.map((v, i) => (
          <li key={i}>{fill(labels.bar, { when: when(i), value: v === null ? labels.noValue : valueText(v) })}</li>
        ))}
        {avg !== null && <li>{fill(labels.avg, { value: valueText(avg) })}</li>}
      </ul>
    </figure>
  );
}
