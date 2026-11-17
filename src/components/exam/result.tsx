"use client";

import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, CircleDashed, Clock, Minus, RotateCcw, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnswerBar } from "@/components/superprep/answer-bar";
import { Badge } from "@/design-system/atoms/badge";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { CountUp } from "@/design-system/atoms/count-up";
import { ProgressRing } from "@/design-system/atoms/progress";
import { Segmented } from "@/design-system/molecules/segmented";
import { NEGATIVE_MARK } from "@/lib/api/question-set";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { backLink } from "@/lib/nav-history";
import { OptionBox, optionState } from "./option";
import { Rich } from "./rich";
import type { Answers, ExamLabels, ExamQuestion } from "./types";

type Status = "correct" | "wrong" | "skipped";
type Filter = Status | "all";

/**
 * The score page. Top: the score (marks in exam mode), how it compares with these chapters
 * so far, the same correct / wrong / unanswered bar as the paper page, and what to do next
 * (redo the misses first). Solutions stay closed until asked for; then every question,
 * misses first, explanations open for misses and folded for correct answers.
 */
export function ExamResult({
  questions,
  answers,
  elapsed,
  before,
  subjectName,
  backHref,
  nextHref,
  redoBase,
  onRestart,
  marking,
  fmt,
  t,
}: {
  questions: ExamQuestion[];
  answers: Answers;
  elapsed: number;
  before: number | null;
  subjectName: string;
  backHref: string;
  nextHref: string | null;
  redoBase: string;
  /**
   * Starts this set again from the top. Called when "redo" would open the very same questions:
   * the page (and its key) wouldn't change, so following the link alone would leave the result up.
   */
  onRestart: () => void;
  /** Exam mode: show marks (with negative marking), time against the limit, marks by chapter. */
  marking?: { negative: boolean; limit: number; timeUp: boolean };
  fmt: Formatter;
  t: ExamLabels;
}) {
  const status = useMemo<Status[]>(() => answers.map((a, i) => (a === null ? "skipped" : a === questions[i].answer ? "correct" : "wrong")), [answers, questions]);
  const count = (s: Status) => status.filter((x) => x === s).length;
  const correct = count("correct");
  const wrong = count("wrong");
  const skipped = count("skipped");
  const total = questions.length;
  const deduction = marking?.negative ? wrong * NEGATIVE_MARK : 0;
  const marks = correct - deduction;
  const pct = total ? (Math.max(0, marks) / total) * 100 : 0;
  const marksText = fill(t.marksOf, { marks: fmt.number(Math.round(marks * 100) / 100), total: fmt.number(total) });
  const misses = questions.filter((_, i) => status[i] !== "correct").map((q) => q.id);
  const redoHref = `${redoBase}${redoBase.includes("?") ? "&" : "?"}ids=${misses.join(",")}`;

  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  const [details, setDetails] = useState(false);
  const [filter, setFilter] = useState<Filter>(wrong > 0 ? "wrong" : skipped > 0 ? "skipped" : "all");
  const filters = (
    [
      ["wrong", t.filterWrong, wrong],
      ["skipped", t.filterSkipped, skipped],
      ["correct", t.filterCorrect, correct],
      ["all", t.filterAll, total],
    ] as const
  ).filter(([id, , n]) => id === "all" || n > 0);
  const shown = questions.map((q, i) => ({ q, i })).filter(({ i }) => filter === "all" || status[i] === filter);

  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const time = m > 0 ? fill(t.minSec, { m: fmt.number(m), s: fmt.number(s) }) : fill(t.secOnly, { s: fmt.number(s) });
  const timeLine =
    marking && marking.limit > 0
      ? fill(t.timeUsedOf, { used: time, limit: fill(t.minutes, { n: fmt.number(marking.limit) }) })
      : fill(t.timeTaken, { time });

  // Marks per chapter, only when the set spans several.
  const chapters = marking
    ? [...new Set(questions.map((q) => q.chapter))].map((chapter) => {
        const idx = questions.flatMap((q, i) => (q.chapter === chapter ? [i] : []));
        const c = idx.filter((i) => status[i] === "correct").length;
        const w = idx.filter((i) => status[i] === "wrong").length;
        return { chapter, n: idx.length, c, w, marks: c - (marking.negative ? w * NEGATIVE_MARK : 0) };
      })
    : [];

  return (
    <main className="mx-auto grid max-w-reading grid-cols-1 gap-6 px-4 py-6 sm:px-6">
      {marking?.timeUp && (
        <p role="status" className="flex items-center gap-2 rounded-md bg-warning-soft px-4 py-3 font-semibold text-warning">
          <Clock className="size-4 shrink-0" aria-hidden />
          {t.timeUp}
        </p>
      )}
      <Card className="grid gap-5 p-5 sm:p-6" style={{ backgroundImage: "var(--grad-superprep-glow)" }}>
        <div className="flex items-center gap-5">
          <ProgressRing value={pct} size={112} stroke={10} tone="superprep" label={marking ? `${t.marksLabel} ${marksText}` : fill(t.score, { correct: fmt.number(correct), total: fmt.number(total) })}>
            <span className="type-figure">
              <CountUp value={fmt.percent(pct)} />
            </span>
          </ProgressRing>
          <div className="grid min-w-0 gap-1.5">
            {marking && <p className="text-sm text-muted">{t.marksLabel}</p>}
            <h1 ref={heading} tabIndex={-1} className="type-headline tabular-nums outline-none">
              {marking ? marksText : fill(t.score, { correct: fmt.number(correct), total: fmt.number(total) })}
            </h1>
            {deduction > 0 && <p className="text-sm font-semibold text-danger tabular-nums">{fill(t.deduction, { n: fmt.number(deduction) })}</p>}
            {/* Like for like: accuracy over answered questions, as the chapters' figure is. */}
            {before !== null && correct + wrong > 0 && <Compare now={(correct / (correct + wrong)) * 100} before={before} fmt={fmt} t={t} />}
            <p className="text-sm text-muted">{timeLine}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <AnswerBar correct={correct} wrong={wrong} total={total} label={`${t.statusCorrect} ${correct}, ${t.statusWrong} ${wrong}, ${t.filterSkipped} ${skipped}`} className="h-2.5" />
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted tabular-nums">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-success" aria-hidden />
              {t.statusCorrect} {fmt.number(correct)}
            </li>
            <li className="flex items-center gap-1.5">
              <XCircle className="size-4 text-danger" aria-hidden />
              {t.statusWrong} {fmt.number(wrong)}
            </li>
            {skipped > 0 && (
              <li className="flex items-center gap-1.5">
                <CircleDashed className="size-4 text-subtle" aria-hidden />
                {t.filterSkipped} {fmt.number(skipped)}
              </li>
            )}
          </ul>
        </div>

        {chapters.length > 1 && (
          <div className="grid gap-2">
            <h2 className="text-sm font-semibold">{t.byChapter}</h2>
            <Card as="div" radius="md" className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead className="bg-raised text-left text-xs text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">{t.colChapter}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t.colQuestions}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t.colCorrect}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t.colWrong}</th>
                    <th scope="col" className="px-3 py-2 text-right font-semibold">{t.colMarks}</th>
                  </tr>
                </thead>
                <tbody>
                  {chapters.map((c) => (
                    <tr key={c.chapter} className="border-t border-border">
                      <th scope="row" className="px-3 py-2 text-left font-medium">{c.chapter}</th>
                      <td className="px-3 py-2 text-right">{fmt.number(c.n)}</td>
                      <td className="px-3 py-2 text-right">{fmt.number(c.c)}</td>
                      <td className="px-3 py-2 text-right">{fmt.number(c.w)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmt.number(Math.round(c.marks * 100) / 100)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {misses.length > 0 && (
            <Button href={redoHref} replace onClick={misses.length === total ? onRestart : undefined} className="flex-1 sm:flex-none">
              <RotateCcw className="size-4" aria-hidden />
              {fill(wrong > 0 && skipped > 0 ? t.redoBoth : wrong > 0 ? t.redo : t.redoSkipped, { n: fmt.number(misses.length) })}
            </Button>
          )}
          {nextHref && (
            <Button href={nextHref} replace variant={misses.length > 0 ? "secondary" : "primary"} className="flex-1 sm:flex-none">
              {t.nextSet}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
          <Button {...backLink(backHref)} variant="ghost">
            {fill(t.backTo, { name: subjectName })}
          </Button>
        </div>
      </Card>

      {/* Solutions on request: the score comes first, the details only if the student asks. */}
      <Card aria-labelledby="solutions-title" className="grid gap-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 id="solutions-title" className="type-title">
              {t.solutions}
            </h2>
            {!details && <p className="text-sm text-muted">{t.detailsHint}</p>}
          </div>
          {details ? (
            <Segmented
              variant="pills"
              label={t.solutions}
              value={filter}
              onChange={(id) => setFilter(id as Filter)}
              items={filters.map(([id, label, n]) => ({ id, label: `${label} ${fmt.number(n)}` }))}
            />
          ) : (
            <Button variant="secondary" onClick={() => setDetails(true)} aria-expanded={false} aria-controls="solutions-list">
              {t.seeDetails}
              <ChevronDown className="size-4" aria-hidden />
            </Button>
          )}
        </div>
        {details &&
          (shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">{t.emptyFilter}</p>
          ) : (
            <ol id="solutions-list" className="grid gap-6">
              {shown.map(({ q, i }) => (
                <Solution key={q.id} q={q} n={i + 1} chosen={answers[i]} status={status[i]} fmt={fmt} t={t} />
              ))}
            </ol>
          ))}
        {details && (
          <Button variant="ghost" onClick={() => setDetails(false)} aria-expanded aria-controls="solutions-list" className="justify-self-center">
            {t.hideDetails}
            <ChevronUp className="size-4" aria-hidden />
          </Button>
        )}
      </Card>
    </main>
  );
}

/** Score vs the chapters' accuracy before this set; direction is an icon, never colour alone. */
function Compare({ now, before, fmt, t }: { now: number; before: number; fmt: Formatter; t: ExamLabels }) {
  const diff = Math.round(now - before);
  const Icon = Math.abs(diff) < 3 ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted">
      <Icon className={cn("size-4 shrink-0", Math.abs(diff) < 3 ? "text-muted" : diff > 0 ? "text-success" : "text-danger")} aria-hidden />
      {fill(t.before, { pct: fmt.percent(before) })}
    </p>
  );
}

const statusBadge = {
  correct: { tone: "success", Icon: CheckCircle2 },
  wrong: { tone: "danger", Icon: XCircle },
  skipped: { tone: "neutral", Icon: CircleDashed },
} as const;

function Solution({ q, n, chosen, status, fmt, t }: { q: ExamQuestion; n: number; chosen: number | null; status: Status; fmt: Formatter; t: ExamLabels }) {
  const { tone, Icon } = statusBadge[status];
  const label = status === "correct" ? t.statusCorrect : status === "wrong" ? t.statusWrong : t.statusSkipped;
  return (
    <li className="grid gap-3 border-t border-border pt-6 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold tabular-nums">{fill(t.question, { n: fmt.number(n) })}</span>
        <Badge tone={tone}>
          <Icon className="size-3.5" aria-hidden />
          {label}
        </Badge>
        <span className="text-xs text-subtle">{q.chapter}</span>
      </div>
      <Rich as="p" html={q.html} className="leading-relaxed" />
      <ul className="grid gap-2">
        {q.options.map((html, i) => {
          const state = optionState(i, chosen, q.answer, true);
          const tag = i === chosen ? t.yourAnswer : i === q.answer ? t.rightAnswer : undefined;
          return (
            <li key={i}>
              {tag && <span className="sr-only">{tag}: </span>}
              <OptionBox letter={t.letters[i]} html={html} state={state} tag={tag} />
            </li>
          );
        })}
      </ul>
      {q.explanation &&
        (status === "correct" ? (
          <details className="group rounded-md bg-raised px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-brand-text">{t.showExplanation}</summary>
            <Rich as="div" html={q.explanation} className="mt-2 leading-relaxed text-text" />
          </details>
        ) : (
          <div className="grid gap-1 rounded-md bg-raised p-4">
            <p className="text-sm font-semibold">{t.explanation}</p>
            <Rich as="div" html={q.explanation} className="leading-relaxed text-text" />
          </div>
        ))}
    </li>
  );
}
