"use client";

import { Clock, Flag, ListChecks, Save } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { SuperPrepMark } from "@/design-system/atoms/superprep-mark";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import type { Locale } from "@/i18n/config";
import { NEGATIVE_MARK } from "@/lib/api/question-set";
import { cn } from "@/lib/cn";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { ExitControl, FocusBar, Sheet } from "./chrome";
import { DIGITS, ignoreKey } from "./keys";
import { ExamResult } from "./result";
import { Rich } from "./rich";
import type { Answers, ExamLabels, ExamQuestion } from "./types";

type Rules = {
  /** Minutes; 0 = no limit. */
  limit: number;
  negative: boolean;
  /** OMR mode: a filled answer can't be changed. */
  strict: boolean;
};

type Saved = { answers: Answers; flagged: boolean[]; startedAt: number };

const noSubscribe = () => () => {};

/**
 * Exam mode, made to feel like the exam hall: an instructions sheet with the paper's details
 * and rules, then the whole question paper with an OMR answer sheet beside it (a bottom
 * sheet on phones), a countdown that hands the paper in at zero, answers saved in the browser
 * as they're filled, and a marksheet at the end.
 * Keyboard: 1–4 fills the current question (the one near the top of the screen), ← → move
 * between questions, F marks it for later. Once a key is used, the current question is marked.
 */
export function ExamHall({
  lang,
  now,
  t,
  subjectName,
  title,
  questions,
  rules,
  backHref,
  nextHref,
  redoBase,
  before,
}: {
  lang: Locale;
  now: number;
  t: ExamLabels;
  subjectName: string;
  title: string;
  questions: ExamQuestion[];
  rules: Rules;
  backHref: string;
  nextHref: string | null;
  redoBase: string;
  before: number | null;
}) {
  const fmt = createFormatter(lang, now);
  const total = questions.length;
  const key = `superprep-exam:${questions.map((q) => q.id).join(",")}`;

  const [phase, setPhase] = useState<"intro" | "running" | "done">("intro");
  const [answers, setAnswers] = useState<Answers>(() => questions.map(() => null));
  const [flagged, setFlagged] = useState<boolean[]>(() => questions.map(() => false));
  const [startedAt, setStartedAt] = useState(0);
  const [clock, setClock] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [prompt, setPrompt] = useState(false);
  const [sheet, setSheet] = useState(false);
  // The question the keyboard acts on, and whether the keyboard has been used (only then is it marked).
  const [active, setActive] = useState(0);
  const [keyed, setKeyed] = useState(false);

  // A paper left unfinished in this browser (read without a hydration mismatch).
  const saved = useSyncExternalStore(noSubscribe, () => localStorage.getItem(key), () => null);

  const deadline = rules.limit > 0 ? startedAt + rules.limit * 60_000 : null;
  const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - clock) / 1000));
  const elapsed = Math.max(0, Math.floor(((deadline !== null ? Math.min(clock, deadline) : clock) - startedAt) / 1000));

  const finish = useCallback(
    (byTimer = false) => {
      setPhase("done");
      setTimeUp(byTimer);
      setPrompt(false);
      setSheet(false);
      localStorage.removeItem(key);
      window.scrollTo({ top: 0 });
    },
    [key],
  );

  const begin = (resume: Saved | null) => {
    const start = resume?.startedAt ?? Date.now();
    setAnswers(resume?.answers ?? questions.map(() => null));
    setFlagged(resume?.flagged ?? questions.map(() => false));
    setStartedAt(start);
    setClock(Date.now());
    setPhase("running");
    window.scrollTo({ top: 0 });
  };

  // The clock: ticks every second; at the deadline the paper is handed in.
  useEffect(() => {
    if (phase !== "running") return;
    const tick = () => {
      const t = Date.now();
      setClock(t);
      if (deadline !== null && t >= deadline) finish(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, finish, phase]);

  // Save as the student goes, so a refresh or a dropped connection loses nothing.
  useEffect(() => {
    if (phase !== "running") return;
    localStorage.setItem(key, JSON.stringify({ answers, flagged, startedAt } satisfies Saved));
  }, [answers, flagged, key, phase, startedAt]);

  const fillBubble = (qi: number, oi: number) => {
    if (phase !== "running") return;
    if (rules.strict && answers[qi] !== null) return;
    if (answers[qi] === oi) return;
    setAnswers((prev) => prev.map((a, k) => (k === qi ? oi : a)));
    setPrompt(false);
    navigator.vibrate?.(8);
  };

  const toggleFlag = (qi: number) => setFlagged((prev) => prev.map((f, k) => (k === qi ? !f : f)));

  const jump = (qi: number) => {
    setSheet(false);
    document.getElementById(`paper-q-${qi}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // The current question follows the scroll: whichever covers a thin band just under the sticky
  // bar, where a jumped-to question lands (scroll-mt-24 = 96px). In the gap between two questions
  // nothing matches and the previous one stays current.
  useEffect(() => {
    if (phase !== "running") return;
    let observer: IntersectionObserver | null = null;
    const watch = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          const hit = entries.find((e) => e.isIntersecting);
          if (hit) setActive(Number((hit.target as HTMLElement).dataset.qi));
        },
        { rootMargin: `-96px 0px -${Math.max(0, window.innerHeight - 136)}px 0px` },
      );
      for (const el of document.querySelectorAll("[data-qi]")) observer.observe(el);
    };
    watch();
    window.addEventListener("resize", watch);
    return () => {
      window.removeEventListener("resize", watch);
      observer?.disconnect();
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "running" || sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (ignoreKey(e)) return;
      if (e.key in DIGITS) {
        if (DIGITS[e.key] >= questions[active].options.length) return;
        e.preventDefault();
        setKeyed(true);
        fillBubble(active, DIGITS[e.key]);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = Math.min(total - 1, Math.max(0, active + (e.key === "ArrowRight" ? 1 : -1)));
        setKeyed(true);
        setActive(next);
        jump(next);
      } else if (e.code === "KeyF") {
        // By key position, so it works on a Bangla layout too.
        e.preventDefault();
        setKeyed(true);
        toggleFlag(active);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const answered = answers.filter((a) => a !== null).length;
  const unanswered = answers.flatMap((a, i) => (a === null ? [i] : []));
  const handIn = () => (unanswered.length > 0 ? setPrompt(true) : finish());

  const facts = [
    [t.questionsLabel, fmt.number(total)],
    [t.fullMarks, fmt.number(total)],
    [t.timeLabel, rules.limit > 0 ? fill(t.minutes, { n: fmt.number(rules.limit) }) : t.noLimit],
    [t.negativeLabel, rules.negative ? fill(t.negativeOn, { n: fmt.number(NEGATIVE_MARK) }) : t.negativeNone],
  ] as const;

  /* ---------- Instructions ---------- */
  if (phase === "intro") {
    let resume: Saved | null = null;
    try {
      resume = saved ? (JSON.parse(saved) as Saved) : null;
    } catch {
      resume = null;
    }
    return (
      <div className="min-h-dvh">
        <FocusBar back={<ExitControl href={backHref} warn={false} label={t.exit} t={t} />} subjectName={subjectName} title={title} />
        <main className="mx-auto max-w-reading px-4 py-8 sm:px-6">
          <Card className="grid gap-6 p-6 sm:p-8">
            <header className="grid justify-items-center gap-1 border-b-4 border-double border-border pb-6 text-center">
              <SuperPrepMark className="text-lg leading-6" />
              <h1 className="type-headline">{title}</h1>
              <p className="text-muted">{subjectName}</p>
            </header>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map(([label, value]) => (
                <div key={label} className="grid gap-0.5 rounded-md bg-raised p-3 text-center">
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <section aria-labelledby="rules-title" className="grid gap-2">
              <h2 id="rules-title" className="font-semibold">
                {t.rulesTitle}
              </h2>
              <ol className="grid list-decimal gap-1.5 pl-5 text-muted marker:text-subtle">
                <li>{t.ruleMark}</li>
                {rules.negative && <li>{fill(t.ruleNegative, { n: fmt.number(NEGATIVE_MARK) })}</li>}
                {rules.limit > 0 && <li>{t.ruleAuto}</li>}
                <li>{t.ruleFill}</li>
                <li>{rules.strict ? t.ruleStrict : t.ruleChange}</li>
                <li>{t.ruleSave}</li>
              </ol>
            </section>
            <div className="flex flex-wrap gap-2">
              {resume ? (
                <>
                  <Button size="lg" onClick={() => begin(resume)} className="flex-1">
                    <Save className="size-4" aria-hidden />
                    {t.resume}
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => begin(null)}>
                    {t.restart}
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={() => begin(null)} className="flex-1">
                  {t.startExam}
                </Button>
              )}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  /* ---------- Marksheet ---------- */
  if (phase === "done") {
    return (
      <div className="min-h-dvh">
        <FocusBar back={<ExitControl href={backHref} warn={false} label={t.backToPaper} t={t} />} subjectName={subjectName} title={title} />
        <ExamResult
          questions={questions}
          answers={answers}
          elapsed={elapsed}
          before={before}
          subjectName={subjectName}
          backHref={backHref}
          nextHref={nextHref}
          redoBase={redoBase}
          // The same set again: back to the instructions sheet, as a new paper opens.
          onRestart={() => {
            setTimeUp(false);
            setPhase("intro");
            window.scrollTo({ top: 0 });
          }}
          marking={{ negative: rules.negative, limit: rules.limit, timeUp }}
          fmt={fmt}
          t={t}
        />
      </div>
    );
  }

  /* ---------- The paper ---------- */
  const warn = remaining !== null && remaining <= 60 ? "danger" : remaining !== null && remaining <= 300 ? "warning" : null;
  const sheetProps = { questions, answers, flagged, strict: rules.strict, onFill: fillBubble, onJump: jump, fmt, t };

  return (
    <div className="min-h-dvh">
      <FocusBar back={<ExitControl href={backHref} warn={answered > 0} label={t.exit} t={t} />} subjectName={subjectName} title={title}>
        <p
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums transition-colors",
            warn === "danger" ? "bg-danger-soft text-danger" : warn === "warning" ? "bg-warning-soft text-warning" : "bg-raised text-text",
          )}
        >
          <Clock className="size-4" aria-hidden />
          {remaining !== null ? fill(t.timeLeft, { time: fmt.duration(remaining) }) : fmt.duration(elapsed)}
        </p>
        {/* Announced once as each threshold is crossed. */}
        <span className="sr-only" aria-live="assertive">
          {warn === "danger" ? t.warn1 : warn === "warning" ? t.warn5 : ""}
        </span>
        {/* Phones hand in from the bottom bar. A wrapper, as `cn` can't override the button's own display. */}
        <span className="hidden sm:block">
          <Button size="sm" variant="secondary" onClick={handIn}>
            {t.handIn}
          </Button>
        </span>
      </FocusBar>

      <main className="mx-auto grid max-w-wide grid-cols-1 items-start gap-6 px-4 pt-6 pb-32 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:pb-10">
        <Card aria-labelledby="paper-title" className="grid gap-8 p-5 sm:p-8">
          <header className="grid justify-items-center gap-1 border-b-4 border-double border-border pb-5 text-center">
            <h1 id="paper-title" className="type-title">
              {title}
            </h1>
            <p className="text-sm text-muted tabular-nums">
              {subjectName} · {facts.slice(0, 3).map(([label, value]) => `${label} ${value}`).join(" · ")}
            </p>
            <p className="mt-1 hidden text-xs text-subtle md:block">{t.keysPaper}</p>
          </header>
          <ol className="grid gap-8">
            {questions.map((q, qi) => (
              <PaperQuestion
                key={q.id}
                q={q}
                qi={qi}
                chosen={answers[qi]}
                flagged={flagged[qi]}
                current={keyed && active === qi}
                locked={rules.strict && answers[qi] !== null}
                onFill={fillBubble}
                onFlag={toggleFlag}
                fmt={fmt}
                t={t}
              />
            ))}
          </ol>
          <div className="flex justify-center border-t border-border pt-6">
            <Button size="lg" onClick={handIn}>
              {t.handIn}
            </Button>
          </div>
        </Card>

        <aside aria-label={t.answerSheet} className="hidden lg:sticky lg:top-24 lg:block">
          <Card className="grid gap-3 p-4">
            <OmrSheet {...sheetProps} className="max-h-[calc(100dvh-16rem)]" />
            <Button onClick={handIn} className="w-full">
              {t.handIn}
            </Button>
          </Card>
        </aside>
      </main>

      {/* Phones: the answer sheet lives in a bottom bar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-overlay p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-wide items-center gap-2">
          <Button variant="secondary" onClick={() => setSheet(true)} className="flex-1">
            <ListChecks className="size-4" aria-hidden />
            {t.answerSheet} · {fill(t.answeredOf, { n: fmt.number(answered), total: fmt.number(total) })}
          </Button>
          <Button onClick={handIn}>{t.handIn}</Button>
        </div>
      </div>

      {sheet && (
        <Sheet title={t.answerSheet} closeLabel={t.close} onClose={() => setSheet(false)}>
          <OmrSheet {...sheetProps} titled={false} className="max-h-[60dvh]" />
        </Sheet>
      )}

      {prompt && unanswered.length > 0 && (
        <div aria-live="polite" className="fixed inset-x-0 bottom-20 z-40 px-4 lg:bottom-6">
          <Card as="div" elevation="pop" className="mx-auto grid max-w-narrow gap-3 p-4">
            <p className="font-semibold">{fill(t.left, { n: fmt.number(unanswered.length) })}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setPrompt(false);
                  jump(unanswered[0]);
                }}
              >
                {fill(t.goTo, { n: fmt.number(unanswered[0] + 1) })}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => finish()}>
                {t.submitAnyway}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPrompt(false)}>
                {t.stay}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/** One question as printed on the paper: number, text, ক/খ/গ/ঘ options (two columns when short). */
function PaperQuestion({
  q,
  qi,
  chosen,
  flagged,
  current,
  locked,
  onFill,
  onFlag,
  fmt,
  t,
}: {
  q: ExamQuestion;
  qi: number;
  chosen: number | null;
  flagged: boolean;
  /** The question the keyboard acts on: a brand bar in the margin. */
  current: boolean;
  locked: boolean;
  onFill: (qi: number, oi: number) => void;
  onFlag: (qi: number) => void;
  fmt: Formatter;
  t: ExamLabels;
}) {
  const label = `paper-q-${qi}-text`;
  return (
    <li id={`paper-q-${qi}`} data-qi={qi} className="relative grid scroll-mt-24 gap-3">
      {current && <span aria-hidden className="absolute inset-y-0 -left-3 w-[3px] rounded-full bg-brand sm:-left-5" />}
      <div className="flex items-start gap-3">
        <span className="shrink-0 pt-0.5 font-bold tabular-nums">{fmt.number(qi + 1)}.</span>
        <Rich as="p" id={label} html={q.html} className="min-w-0 flex-1 leading-relaxed font-medium" />
        <button
          type="button"
          onClick={() => onFlag(qi)}
          aria-pressed={flagged}
          aria-label={`${t.flag}: ${fill(t.question, { n: fmt.number(qi + 1) })}`}
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-raised",
            flagged ? "text-warning" : "text-subtle",
          )}
        >
          <Flag className={cn("size-4", flagged && "fill-current")} aria-hidden />
        </button>
      </div>
      <div role="radiogroup" aria-labelledby={label} className={cn("grid gap-2 pl-7", q.short && "sm:grid-cols-2")}>
        {q.options.map((html, oi) => {
          const on = chosen === oi;
          return (
            <button
              key={oi}
              type="button"
              role="radio"
              aria-checked={on}
              aria-disabled={locked && !on ? true : undefined}
              onClick={() => onFill(qi, oi)}
              className={cn(
                "flex min-h-12 items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                on ? "border-text/40 bg-raised" : "border-transparent hover:border-border hover:bg-raised/60",
                locked && !on && "cursor-not-allowed opacity-60",
              )}
            >
              <Bubble letter={t.letters[oi]} on={on} />
              <Rich html={html} className="min-w-0 flex-1 self-center leading-relaxed" />
            </button>
          );
        })}
      </div>
    </li>
  );
}

/** An OMR bubble: the letter inside a ring, filled solid like pencil when chosen. */
function Bubble({ letter, on, size = "md" }: { letter: string; on: boolean; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border-[1.5px] font-semibold",
        size === "sm" ? "size-7 text-xs" : "size-8 text-sm",
        on ? "border-text text-surface" : "border-border-strong text-muted",
      )}
    >
      {on && <span className="absolute inset-0 rounded-full bg-text motion-safe:animate-[bubble-fill_180ms_ease-out]" />}
      <span className="relative">{letter}</span>
    </span>
  );
}

/** The answer sheet: one row of bubbles per question; the number jumps to it in the paper. */
function OmrSheet({
  questions,
  answers,
  flagged,
  strict,
  onFill,
  onJump,
  fmt,
  t,
  titled = true,
  className,
}: {
  questions: ExamQuestion[];
  answers: Answers;
  flagged: boolean[];
  strict: boolean;
  /** Off inside the bottom sheet, which has its own title. */
  titled?: boolean;
  onFill: (qi: number, oi: number) => void;
  onJump: (qi: number) => void;
  fmt: Formatter;
  t: ExamLabels;
  className?: string;
}) {
  const answered = answers.filter((a) => a !== null).length;
  const marked = flagged.filter(Boolean).length;
  return (
    <div className="grid gap-3">
      <div className="flex items-baseline justify-between gap-2">
        {titled && <h2 className="font-semibold">{t.answerSheet}</h2>}
        <p className="text-xs text-muted tabular-nums">
          {fill(t.answeredOf, { n: fmt.number(answered), total: fmt.number(questions.length) })}
          {marked > 0 && ` · ${fill(t.flaggedCount, { n: fmt.number(marked) })}`}
        </p>
      </div>
      <ol className={cn("-mx-1 grid gap-1 overflow-y-auto px-1 py-0.5", className)}>
        {questions.map((q, qi) => (
          <li key={q.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onJump(qi)}
              aria-label={fill(t.goTo, { n: fmt.number(qi + 1) })}
              className="relative w-8 shrink-0 rounded-sm py-1 text-right text-sm font-semibold text-muted tabular-nums hover:text-text"
            >
              {fmt.number(qi + 1)}
              {flagged[qi] && <span aria-hidden className="absolute top-0.5 -left-0.5 size-1.5 rounded-full bg-warning" />}
            </button>
            <div role="radiogroup" aria-label={fill(t.sheetRow, { n: fmt.number(qi + 1) })} className="flex gap-1.5">
              {q.options.map((_, oi) => {
                const on = answers[qi] === oi;
                const locked = strict && answers[qi] !== null && !on;
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-disabled={locked ? true : undefined}
                    aria-label={fill(t.bubble, { n: fmt.number(qi + 1), letter: t.letters[oi] })}
                    onClick={() => onFill(qi, oi)}
                    className={cn("rounded-full", locked && "cursor-not-allowed opacity-50")}
                  >
                    <Bubble letter={t.letters[oi]} on={on} size="sm" />
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
