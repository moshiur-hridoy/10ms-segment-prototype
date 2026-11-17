import { cn } from "@/lib/cn";

/**
 * One bar for coverage and accuracy together: correct, then wrong, then the unanswered
 * track. Colour is never the only carrier: the row beside it states the same numbers.
 */
export function AnswerBar({ correct, wrong, total, label, className }: { correct: number; wrong: number; total: number; label: string; className?: string }) {
  const w = (n: number) => `${total > 0 ? (n / total) * 100 : 0}%`;
  return (
    <div role="img" aria-label={label} className={cn("flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-superprep-track", className)}>
      {correct > 0 && <span className="h-full rounded-full bg-success" style={{ width: w(correct) }} />}
      {wrong > 0 && <span className="h-full rounded-full bg-danger" style={{ width: w(wrong) }} />}
    </div>
  );
}

/** Key for the bars, shown once above a list of them. */
export function AnswerLegend({ labels }: { labels: { correct: string; wrong: string; unanswered: string } }) {
  const item = (swatch: string, text: string) => (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-full", swatch)} />
      {text}
    </li>
  );
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {item("bg-success", labels.correct)}
      {item("bg-danger", labels.wrong)}
      {item("bg-superprep-track ring-1 ring-border ring-inset", labels.unanswered)}
    </ul>
  );
}
