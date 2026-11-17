"use client";

import { ArrowLeft, ArrowRight, Clock, ListOrdered } from "lucide-react";
import { addTransitionType, startTransition, useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { Button } from "@/design-system/atoms/button";
import type { Locale } from "@/i18n/config";
import { createFormatter, fill } from "@/lib/format";
import { ExitControl, Sheet } from "./chrome";
import { Clipboard } from "./clipboard";
import { DIGITS, ignoreKey } from "./keys";
import { Navigator } from "./navigator";
import { OptionBox, optionState } from "./option";
import { ExamResult } from "./result";
import { Rich } from "./rich";
import type { Answers, ExamLabels, ExamQuestion } from "./types";

/**
 * A practice set, in focus mode: a slim bar (paper · set, progress, elapsed time, exit), one
 * question at a time, and a navigator. Nothing is marked right or wrong while answering;
 * answers can be changed until the set is submitted, then the score page shows the result
 * (solutions on request). The exam hall is `ExamHall`.
 * Submitting with questions left shows an inline prompt, never a modal.
 * The question is a sheet on a clipboard in the paper's cover colour; moving between questions
 * turns the sheet (forward flips it up over the clip, back flips the earlier one down).
 */
export function PracticeRunner({
  lang,
  accent,
  now,
  t,
  subjectName,
  title,
  questions,
  backHref,
  nextHref,
  redoBase,
  before,
}: {
  lang: Locale;
  /** The paper's cover colour (`BOOK_COLOR`), for the clipboard's board. */
  accent: string;
  /** The request's time, from the server, so formatting is the same on both sides. */
  now: number;
  t: ExamLabels;
  subjectName: string;
  title: string;
  questions: ExamQuestion[];
  /** The paper's page. */
  backHref: string;
  /** The following set with the same choices, if more questions match. */
  nextHref: string | null;
  /** This set's URL without a selection; the result adds `ids=` to redo the misses. */
  redoBase: string;
  /** Accuracy in these chapters before this set. */
  before: number | null;
}) {
  const fmt = createFormatter(lang, now);
  const total = questions.length;

  const [answers, setAnswers] = useState<Answers>(() => questions.map(() => null));
  const flagged = questions.map(() => false);
  const [current, setCurrent] = useState(0);
  const [prompt, setPrompt] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [done, setDone] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);

  // Elapsed time only: a quiet clock, not a countdown.
  useEffect(() => {
    if (done) return;
    if (!startedAt.current) startedAt.current = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [done]);

  const answered = answers.filter((a) => a !== null).length;
  const unanswered = answers.flatMap((a, i) => (a === null ? [i] : []));
  const q = questions[current];
  const chosen = answers[current];
  const last = current === total - 1;

  const go = useCallback(
    (i: number) => {
      const next = Math.min(total - 1, Math.max(0, i));
      if (next === current) return setSheet(false);
      // A transition typed by direction, so the clipboard turns the sheet the right way.
      startTransition(() => {
        addTransitionType(next > current ? "sheet-next" : "sheet-prev");
        setCurrent(next);
        setSheet(false);
      });
    },
    [current, total],
  );

  const choose = useCallback(
    (i: number) => {
      if (done || i >= questions[current].options.length) return;
      setAnswers((prev) => prev.map((a, k) => (k === current ? i : a)));
      setPrompt(false);
    },
    [current, done, questions],
  );

  const finish = useCallback(() => {
    setDone(true);
    setPrompt(false);
    window.scrollTo({ top: 0 });
  }, []);

  // Redo with every question missed: the same set, so start it over here.
  const restart = useCallback(() => {
    setAnswers(questions.map(() => null));
    setCurrent(0);
    setPrompt(false);
    setElapsed(0);
    startedAt.current = 0;
    setDone(false);
    window.scrollTo({ top: 0 });
  }, [questions]);

  const submit = () => (unanswered.length > 0 ? setPrompt(true) : finish());

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      if (e.key in DIGITS) {
        e.preventDefault();
        choose(DIGITS[e.key]);
      } else if (e.key === "ArrowRight") go(current + 1);
      else if (e.key === "ArrowLeft") go(current - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [choose, current, done, go]);

  const progressLabel = fill(t.progressLabel, { done: fmt.number(answered), total: fmt.number(total) });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-overlay backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-wide items-center gap-3 px-4 sm:px-6">
          <ExitControl href={backHref} warn={!done && answered > 0} t={t} label={done ? t.backToPaper : t.exit} />
          <div className="grid min-w-0 flex-1">
            <p className="truncate text-xs text-subtle">{subjectName}</p>
            <p className="truncate font-semibold">{title}</p>
          </div>
          {!done && (
            <>
              <p className="flex shrink-0 items-center gap-1.5 text-sm text-muted tabular-nums" aria-label={`${t.time} ${fmt.duration(elapsed)}`}>
                <Clock className="size-4" aria-hidden />
                <span aria-hidden>{fmt.duration(elapsed)}</span>
              </p>
              <button
                type="button"
                onClick={() => setSheet(true)}
                aria-label={`${t.navigator}: ${progressLabel}`}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-semibold tabular-nums hover:border-border-strong lg:pointer-events-none lg:border-transparent"
              >
                <ListOrdered className="size-4 text-muted lg:hidden" aria-hidden />
                {fmt.number(answered)}/{fmt.number(total)}
              </button>
            </>
          )}
        </div>
        {!done && (
          <div role="progressbar" aria-label={progressLabel} aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total} className="h-0.5 bg-transparent">
            <div className="h-full bg-brand transition-[width] duration-300" style={{ width: `${(answered / total) * 100}%` }} />
          </div>
        )}
      </header>

      {done ? (
        <ExamResult
          questions={questions}
          answers={answers}
          elapsed={elapsed}
          before={before}
          subjectName={subjectName}
          backHref={backHref}
          nextHref={nextHref}
          redoBase={redoBase}
          onRestart={restart}
          fmt={fmt}
          t={t}
        />
      ) : (
        <main className="mx-auto grid max-w-wide grid-cols-1 items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <Clipboard accent={accent}>
            <ViewTransition update={SHEET_TURN} default="none">
              <section aria-labelledby={`q-${q.id}`} className="grid gap-5 rounded-b-xs bg-paper px-5 pt-1 pb-5 sm:px-6 sm:pb-6">
                {/* Just under the clip's jaw. */}
                <p className="text-center text-sm text-muted tabular-nums">
                  {fill(t.questionOf, { n: fmt.number(current + 1), total: fmt.number(total) })} · {q.chapter}
                </p>

                <Rich as="h2" id={`q-${q.id}`} html={q.html} className="text-lg leading-relaxed font-semibold" />

                <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="grid gap-2.5">
                  {q.options.map((html, i) => (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={chosen === i}
                      onClick={() => choose(i)}
                      className="cursor-pointer rounded-md text-left active:scale-[0.995]"
                    >
                      <span className="sr-only">{t.letters[i]}. </span>
                      <OptionBox letter={t.letters[i]} html={html} state={optionState(i, chosen, q.answer, false)} />
                    </button>
                  ))}
                </div>

                {prompt && unanswered.length > 0 && (
                  <div aria-live="polite" className="grid gap-3 rounded-md bg-warning-soft p-4">
                    <p className="font-semibold">{fill(t.left, { n: fmt.number(unanswered.length) })}</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {unanswered.slice(0, 20).map((i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => go(i)}
                            aria-label={fill(t.goTo, { n: fmt.number(i + 1) })}
                            className="grid h-8 min-w-8 place-items-center rounded-sm border border-border-strong bg-surface px-2 text-sm font-semibold tabular-nums hover:border-text"
                          >
                            {fmt.number(i + 1)}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => go(unanswered[0])}>
                        {fill(t.goTo, { n: fmt.number(unanswered[0] + 1) })}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={finish}>
                        {t.submitAnyway}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <Button variant="ghost" onClick={() => go(current - 1)} disabled={current === 0}>
                    <ArrowLeft className="size-4" aria-hidden />
                    {t.prev}
                  </Button>
                  <p className="hidden text-xs text-subtle md:block">{t.keys}</p>
                  {last ? (
                    <Button onClick={submit}>{t.submit}</Button>
                  ) : (
                    <Button variant={chosen !== null ? "primary" : "secondary"} onClick={() => go(current + 1)}>
                      {t.next}
                      <ArrowRight className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </section>
            </ViewTransition>
          </Clipboard>

          <aside aria-label={t.navigator} className="hidden content-start gap-4 lg:sticky lg:top-24 lg:grid">
            {/* The answer slip, lying beside the clipboard on the desk. */}
            <div className="grid -rotate-[0.6deg] gap-4 rounded-xs bg-paper p-4 shadow-book">
              <h2 className="text-sm font-semibold text-muted">{t.navigator}</h2>
              <Navigator questions={questions} answers={answers} flagged={flagged} current={current} reveal={false} onGo={go} fmt={fmt} t={t} />
              <Button variant="secondary" onClick={submit} className="w-full">
                {t.submit}
              </Button>
            </div>
          </aside>

          {sheet && (
            <Sheet onClose={() => setSheet(false)} title={t.navigator} closeLabel={t.close}>
              <Navigator questions={questions} answers={answers} flagged={flagged} current={current} reveal={false} onGo={go} fmt={fmt} t={t} />
              <Button
                variant="secondary"
                onClick={() => {
                  setSheet(false);
                  submit();
                }}
                className="w-full"
              >
                {t.submit}
              </Button>
            </Sheet>
          )}
        </main>
      )}
    </div>
  );
}

/** Which way the clipboard turns the sheet, by the transition's type (set in `go`). */
const SHEET_TURN = { "sheet-next": "sheet-next", "sheet-prev": "sheet-prev", default: "none" };
