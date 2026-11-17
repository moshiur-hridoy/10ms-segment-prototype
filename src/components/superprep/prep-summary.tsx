import { Trophy } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PrepTotals } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { SuperPrepRing } from "@/design-system/atoms/superprep-ring";

type SummaryProps = {
  totals: PrepTotals;
  /** Overall syllabus goal; the shelf only. */
  target?: number;
  /** "4 chapters · 1,168 questions", shown before the first answer. */
  contents: string;
  /** Ring size; the shelf's strip uses a smaller one. */
  size?: number;
  fmt: Formatter;
  t: Dictionary;
};

/**
 * The SuperPrep ring with what it means beside it: the same ring as the dashboard card, so
 * arriving feels like zooming in. Before the first answer the ring is grey and the facts say
 * what's inside instead of listing zeros.
 */
export function PrepSummary({ totals, target = 0, contents, size, fmt, t }: SummaryProps) {
  const p = t.superprepPage;
  const started = totals.answered > 0;
  const reached = target > 0 && totals.pct >= target;
  const label = [
    `${t.superprep.syllabus} ${fmt.percent(totals.pct)}`,
    target > 0 && fill(t.superprep.targetLine, { pct: fmt.percent(target) }),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center gap-5">
      <SuperPrepRing done={totals.pct} target={target} label={label} value={fmt.percent(totals.pct)} muted={!started} size={size} />
      <div className="grid min-w-0 gap-1">
        <p className="text-sm text-muted">{t.superprep.syllabus}</p>
        {started ? (
          <>
            <p className="font-semibold tabular-nums">{fill(p.answered, { done: fmt.number(totals.answered), total: fmt.number(totals.questions) })}</p>
            <p className="text-sm text-muted tabular-nums">
              {[
                totals.accuracy !== null && fill(p.accuracy, { pct: fmt.percent(totals.accuracy) }),
                fill(p.chaptersDone, { done: fmt.number(totals.chaptersDone), total: fmt.number(totals.chaptersTotal) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">{t.superprep.notStarted}</p>
            <p className="text-sm text-muted">{contents}</p>
          </>
        )}
        {target > 0 &&
          (reached ? (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <Trophy className="size-4 shrink-0" aria-hidden />
              {t.superprep.reached}
            </p>
          ) : (
            <p className="text-sm">
              <span className="font-semibold">{fill(t.superprep.targetLine, { pct: fmt.percent(target) })}</span>
              <span className="text-muted"> · {fill(t.superprep.left, { pct: fmt.percent(target - totals.pct) })}</span>
            </p>
          ))}
      </div>
    </div>
  );
}
