import { SectionCard } from "@/design-system/molecules/section-card";
import type { Dictionary } from "@/i18n/get-dictionary";
import { STUDY_TYPES, type ReportView } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { DayChart, type ChartDay } from "./day-chart";

/** Fixed slot order (validated palette): live class · video · exam · quiz. Colour follows the type, never its rank. */
const fills = { live: "bg-chart-cat-1", video: "bg-chart-cat-2", exam: "bg-chart-cat-3", quiz: "bg-chart-cat-4" } as const;

/** A round axis top in minutes: 30, 60, 90, 120, 180, 240, … */
function niceMax(v: number) {
  const steps = [30, 60, 90, 120, 180, 240, 360, 480, 600, 720, 960, 1200, 1440];
  return steps.find((s) => s >= v) ?? Math.ceil(v / 240) * 240;
}

/** Saturday-first weekday labels, from a known Saturday. */
const weekdayLabels = (fmt: Formatter) => Array.from({ length: 7 }, (_, i) => fmt.weekday(`2026-10-${String(24 + i).padStart(2, "0")}`));

/** The days of the period: classes and study time together, one chart. */
export function DaysSection({ report, fmt, t }: { report: ReportView; fmt: Formatter; t: Dictionary }) {
  const d = t.report.days;
  const a = t.report.attendance;
  const s = t.report.study;
  const e = t.report.exams;
  const statusLabel = { ontime: a.ontime, late: a.late, absent: a.absent };

  const days: ChartDay[] = report.days.map((x) => {
    const date = fmt.date(`${x.date}T12:00:00+06:00`);
    const time = fmt.minutes(x.total);
    return {
      date: x.date,
      tick: fmt.weekday(x.date),
      day: fmt.dayNumber(x.date),
      heading: `${fmt.weekday(x.date)}, ${date}`,
      label: x.held > 0 ? fill(d.dayLabel, { date, held: fmt.number(x.held), attended: fmt.number(x.attended), time }) : fill(d.dayNoClass, { date, time }),
      future: x.future,
      held: x.held,
      attended: x.attended,
      fraction: x.held > 0 ? `${fmt.number(x.attended)}/${fmt.number(x.held)}` : null,
      values: STUDY_TYPES.map((k) => x.byType[k]),
      texts: STUDY_TYPES.map((k) => fmt.minutes(x.byType[k])),
      total: x.total,
      totalText: time,
      classes: x.classes.map((c) => ({ id: c.id, time: fmt.time(c.startsAt), title: c.title, status: c.status, statusLabel: statusLabel[c.status] })),
      attempts: x.attempts.map((at) => ({
        id: at.id,
        title: `${e.kind[at.kind]} · ${at.subject}`,
        score: fill(e.score, { correct: fmt.number(at.correct), total: fmt.number(at.total) }),
      })),
    };
  });

  // Open on the most recent day that had anything in it.
  const initial = [...report.days].reverse().find((x) => !x.future && (x.held > 0 || x.total > 0 || x.attempts.length > 0))?.date ?? null;
  const max = niceMax(Math.max(1, ...report.days.map((x) => x.total)));
  const lead = (new Date(`${report.period.start}T00:00:00Z`).getUTCDay() + 1) % 7;

  return (
    <SectionCard density="compact" titleId="report-days" title={d.title}>
      <DayChart
        kind={report.period.kind}
        days={days}
        series={STUDY_TYPES.map((k) => ({ key: k, label: s.type[k], total: fmt.minutes(report.study.totals[k]), fill: fills[k] }))}
        weekdays={weekdayLabels(fmt)}
        lead={report.period.kind === "month" ? lead : 0}
        max={max}
        ticks={[0, 0.5, 1].map((f) => ({ value: max * f, label: fmt.minutes(max * f) }))}
        initial={initial}
        labels={{
          chart: d.chart,
          studyTotal: fill(s.total, { time: fmt.minutes(report.study.total) }),
          ontime: a.ontime,
          late: a.late,
          absent: a.absent,
          dayAll: d.dayAll,
          daySome: d.daySome,
          dayNone: d.dayNone,
          pickDay: d.pickDay,
          nothing: d.nothing,
          classes: d.classes,
          study: d.study,
          attempts: d.attempts,
          noStudy: d.noStudy,
          table: s.table,
          day: s.day,
          total: s.dayTotal,
          studyKey: d.studyKey,
        }}
      />
    </SectionCard>
  );
}
