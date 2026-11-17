import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import type { Answers, ExamLabels, ExamQuestion } from "./types";

/**
 * Every question as a numbered square: answered, unanswered, marked for later, and (in
 * practice mode, where answers are revealed) right or wrong. Each number jumps to its question.
 */
export function Navigator({
  questions,
  answers,
  flagged,
  current,
  reveal,
  onGo,
  fmt,
  t,
}: {
  questions: ExamQuestion[];
  answers: Answers;
  flagged: boolean[];
  current: number;
  reveal: boolean;
  onGo: (i: number) => void;
  fmt: Formatter;
  t: ExamLabels;
}) {
  return (
    <div className="grid gap-3">
      <ol className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-5">
        {questions.map((q, i) => {
          const a = answers[i];
          const state = a === null ? t.unanswered : reveal ? (a === q.answer ? t.statusCorrect : t.statusWrong) : t.answered;
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onGo(i)}
                aria-current={i === current ? "step" : undefined}
                aria-label={[fill(t.question, { n: fmt.number(i + 1) }), state, flagged[i] && t.flagged].filter(Boolean).join(", ")}
                className={cn(
                  "relative grid h-10 w-full place-items-center rounded-sm border text-sm font-semibold tabular-nums transition-colors",
                  a === null
                    ? "border-border bg-surface text-muted hover:border-border-strong"
                    : reveal
                      ? a === q.answer
                        ? "border-transparent bg-success-soft text-success"
                        : "border-transparent bg-danger-soft text-danger"
                      : "border-transparent bg-text text-surface",
                  i === current && "ring-2 ring-text ring-offset-1 ring-offset-surface",
                )}
              >
                {fmt.number(i + 1)}
                {flagged[i] && <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-warning" />}
              </button>
            </li>
          );
        })}
      </ol>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-xs bg-text" />
          {t.answered}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-xs border border-border-strong" />
          {t.unanswered}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-warning" />
          {t.flagged}
        </li>
      </ul>
    </div>
  );
}
