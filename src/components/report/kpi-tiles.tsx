import { Sparkline } from "@/components/charts/sparkline";
import { Delta, StatTile } from "@/design-system/molecules/stat-tile";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ReportView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";

/**
 * Four stat tiles: value, change against the previous period, and a sparkline of the
 * last periods (history in grey, the selected period in the accent). Two across on phones.
 */
export function KpiTiles({ report, fmt, t }: { report: ReportView; fmt: Formatter; t: Dictionary }) {
  const k = t.report.kpi;
  const { attendance, study, homework, accuracy } = report.kpis;
  const noun = t.report.periodKind[report.period.kind];
  const vs = fill(k.vsPrev, { period: noun });
  const trendLabel = fill(k.trend, { n: fmt.number(attendance.trend.length), period: noun });

  return (
    <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile label={k.attendance} value={attendance.value === null ? null : fmt.percent(attendance.value)} empty={k.noData}>
        <Delta diff={diff(attendance.value, attendance.prev)} text={(d) => fmt.percent(Math.abs(d))} vs={vs} />
        <Sparkline values={attendance.trend} max={100} label={trendLabel} />
      </StatTile>

      <StatTile label={k.study} value={study.total > 0 ? fmt.minutes(study.total) : null} empty={k.noData}>
        <p className="text-sm text-muted">{fill(k.perDay, { time: fmt.minutes(study.perDay) })}</p>
        <Delta diff={diff(study.perDay, study.prevPerDay)} text={(d) => fmt.minutes(Math.abs(d))} vs={vs} />
        <Sparkline values={study.trend} label={trendLabel} />
      </StatTile>

      <StatTile
        label={k.homework}
        value={homework.due > 0 ? fill(k.homeworkValue, { done: fmt.number(homework.submitted), total: fmt.number(homework.due) }) : null}
        empty={k.noHomework}
      >
        <p className="text-sm text-muted">{fill(k.homeworkHint, { period: noun })}</p>
        {homework.due > 0 && (
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: Math.min(homework.due, 12) }, (_, i) => (
              <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < homework.submitted ? "bg-chart-cat-1" : "bg-chart-muted")} />
            ))}
          </div>
        )}
      </StatTile>

      <StatTile label={k.accuracy} value={accuracy.value === null ? null : fmt.percent(accuracy.value)} empty={k.noData}>
        <Delta diff={diff(accuracy.value, accuracy.prev)} text={(d) => fmt.percent(Math.abs(d))} vs={vs} />
        <Sparkline values={accuracy.trend} max={100} label={trendLabel} />
      </StatTile>
    </ul>
  );
}

const diff = (value: number | null, prev: number | null) => (value === null || prev === null ? null : value - prev);

