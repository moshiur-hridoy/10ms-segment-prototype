import { CircleCheck, CircleX, Clock } from "lucide-react";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ReportView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";

const SIZE = 104;
const STROKE = 12;
/** Surface gap between segments, in px along the ring. */
const GAP = 2;

/**
 * How the student attended: one donut split into on time, late and absent, the class count
 * in the middle (the rate itself is in the tile above, so it isn't repeated). The legend
 * carries every count, so colour is never the only key.
 */
export function AttendanceSection({ report, fmt, t }: { report: ReportView; fmt: Formatter; t: Dictionary }) {
  const a = t.report.attendance;
  const { held, ontime, late, absent } = report.attendance;

  if (held === 0) {
    return (
      <SectionCard density="compact" titleId="report-attendance" title={a.title}>
        <p className="rounded-md bg-raised px-3 py-3 text-sm text-muted">{a.none}</p>
      </SectionCard>
    );
  }

  const parts = [
    { key: "ontime", n: ontime, stroke: "stroke-chart-good", icon: <CircleCheck className="size-4 text-chart-good" aria-hidden /> },
    { key: "late", n: late, stroke: "stroke-chart-warn", icon: <Clock className="size-4 text-warning" aria-hidden /> },
    { key: "absent", n: absent, stroke: "stroke-chart-critical", icon: <CircleX className="size-4 text-danger" aria-hidden /> },
  ] as const;
  const label = { ontime: a.ontime, late: a.late, absent: a.absent };

  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const shown = parts.filter((p) => p.n > 0);
  const gap = shown.length > 1 ? GAP : 0;
  let offset = 0;
  const arcs = shown.map((p) => {
    const len = (p.n / held) * c;
    const arc = { key: p.key, stroke: p.stroke, dash: `${Math.max(0, len - gap)} ${c}`, offset: -offset };
    offset += len;
    return arc;
  });
  const attended = ontime + late;
  const summary = parts.map((p) => `${label[p.key]} ${fmt.number(p.n)}`).join(", ");

  return (
    <SectionCard density="compact" titleId="report-attendance" title={a.title}>
      <div className="flex items-center gap-5">
        <div className="relative grid shrink-0 place-items-center" style={{ width: SIZE, height: SIZE }} role="img" aria-label={`${fill(a.classes, { attended: fmt.number(attended), held: fmt.number(held) })}: ${summary}`}>
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden>
            {arcs.map((x) => (
              <circle key={x.key} cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" strokeWidth={STROKE} className={x.stroke} strokeDasharray={x.dash} strokeDashoffset={x.offset} />
            ))}
          </svg>
          <span className="grid text-center" aria-hidden>
            <span className="type-title tabular-nums">
              {fmt.number(attended)}/{fmt.number(held)}
            </span>
            <span className="text-xs text-subtle">{a.classesShort}</span>
          </span>
        </div>
        <ul className="grid min-w-0 flex-1 gap-2 text-sm">
          {parts.map((p) => (
            <li key={p.key} className={cn("flex items-center gap-2", p.n === 0 && "text-subtle")}>
              {p.icon}
              <span className="text-muted">{label[p.key]}</span>
              <span className="ml-auto font-semibold tabular-nums">{fmt.number(p.n)}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
