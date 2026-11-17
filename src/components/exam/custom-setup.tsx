"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { CheckboxRow } from "@/design-system/molecules/checkbox-row";
import type { Locale } from "@/i18n/config";
import type { ExamMode, SetQuery } from "@/lib/api/question-set";
import { SET_SIZES, DEFAULT_SET_SIZE, setSearch } from "@/lib/api/question-set";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import type { ExamLabels } from "./types";

type History = SetQuery["types"][number];

export type SetupChapter = {
  id: string;
  number: number;
  title: string;
  /** How many questions of each kind the chapter has for this student. */
  counts: Record<History, number>;
};

const TYPES: History[] = ["new", "wrong", "correct"];

/**
 * Custom exam setup on one page: chapters (current one preselected), question types with
 * live counts, set size capped at what's available, and practice or exam mode. The summary
 * and start button stay in view and always say what's missing; no confirm step.
 */
export function CustomSetup({
  lang,
  now,
  chapters,
  preselect,
  examPath,
  keep,
  chapterLabel,
  t,
}: {
  lang: Locale;
  /** The request's time, from the server, so formatting is the same on both sides. */
  now: number;
  chapters: SetupChapter[];
  preselect: string[];
  /** `/bn/superprep/<id>/exam` */
  examPath: string;
  /** Query to carry along (dev knobs). */
  keep: string;
  /** "অধ্যায় {n}" */
  chapterLabel: string;
  t: ExamLabels;
}) {
  const fmt = createFormatter(lang, now);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(preselect));
  const [types, setTypes] = useState<Set<History>>(() => new Set(["new"]));
  const [size, setSize] = useState<number>(DEFAULT_SET_SIZE);
  const [mode, setMode] = useState<ExamMode>("exam");
  const [timed, setTimed] = useState(true);
  const [negative, setNegative] = useState(false);
  const [strict, setStrict] = useState(false);

  const chosen = chapters.filter((c) => picked.has(c.id));
  const countOf = (h: History) => chosen.reduce((n, c) => n + c.counts[h], 0);
  const available = [...types].reduce((n, h) => n + countOf(h), 0);
  const sizes = SET_SIZES.filter((n) => n <= available);
  const options: number[] = sizes.length ? [...sizes] : available > 0 ? [available] : [];
  const count = options.includes(size) ? size : (options.filter((n) => n <= size).at(-1) ?? options[0] ?? 0);

  const missing = chosen.length === 0 ? t.needChapter : types.size === 0 ? t.needType : available === 0 ? t.noneAvailable : null;
  const query = new URLSearchParams(keep);
  setSearch({
    chapters: chosen.length === chapters.length ? [] : chosen.map((c) => c.id),
    types: TYPES.filter((h) => types.has(h)),
    count,
    mode,
    time: timed ? null : 0,
    negative,
    strict,
  }).forEach((v, k) => query.set(k, v));
  const href = `${examPath}?${query}`;

  const allState = chosen.length === 0 ? "none" : chosen.length === chapters.length ? "all" : "some";
  const toggle = <T,>(set: Set<T>, v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
  };

  const typeLabel: Record<History, [string, string]> = {
    new: [t.typeNew, t.typeNewHint],
    wrong: [t.typeWrong, t.typeWrongHint],
    correct: [t.typeCorrect, t.typeCorrectHint],
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card aria-labelledby="setup-chapters" className="grid gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 id="setup-chapters" className="type-subtitle">
              {t.chapters}
            </h2>
            <p className="text-sm text-muted tabular-nums">{fill(t.chaptersPicked, { n: fmt.number(chosen.length), total: fmt.number(chapters.length) })}</p>
          </div>
          <CheckboxRow
            variant="inline"
            align="center"
            className="text-sm font-semibold"
            checked={allState === "all"}
            indeterminate={allState === "some"}
            onChange={() => setPicked(allState === "all" ? new Set() : new Set(chapters.map((c) => c.id)))}
          >
            {t.all}
          </CheckboxRow>
        </div>
        <ul className="-mx-2 grid">
          {chapters.map((c) => {
            const on = picked.has(c.id);
            const total = c.counts.new + c.counts.wrong + c.counts.correct;
            return (
              <li key={c.id}>
                <CheckboxRow align="center" className="py-3" checked={on} onChange={() => setPicked((p) => toggle(p, c.id))}>
                  <span className="grid min-w-0 flex-1">
                    <span className="font-medium leading-snug">
                      <span className="text-muted">{fill(chapterLabel, { n: fmt.number(c.number) })}: </span>
                      {c.title}
                    </span>
                    <span className="text-xs text-subtle tabular-nums">{fill(t.questionsCount, { n: fmt.number(total) })}</span>
                  </span>
                </CheckboxRow>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 lg:sticky lg:top-24">
        <Card className="grid gap-6 p-5 sm:p-6">
          <fieldset className="grid gap-2">
            <legend className="mb-2 font-semibold">{t.types}</legend>
            {TYPES.map((h) => {
              const n = countOf(h);
              const [label, hint] = typeLabel[h];
              return (
                <CheckboxRow key={h} className="-mx-2" checked={types.has(h)} onChange={() => setTypes((s) => toggle(s, h))}>
                  <span className="grid min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">{label}</span>
                      <span className={cn("text-sm tabular-nums", n === 0 ? "text-subtle" : "font-semibold")}>{fmt.number(n)}</span>
                    </span>
                    <span className="text-xs text-subtle">{hint}</span>
                  </span>
                </CheckboxRow>
              );
            })}
          </fieldset>

          <fieldset className="grid gap-2" disabled={options.length === 0}>
            <legend className="mb-2 font-semibold">{t.size}</legend>
            <div className="flex flex-wrap gap-2">
              {(options.length ? options : [...SET_SIZES]).map((n) => (
                <label
                  key={n}
                  className={cn(
                    "inline-flex h-10 min-w-14 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors has-focus-visible:ring-3 has-focus-visible:ring-brand/30",
                    options.length === 0
                      ? "cursor-not-allowed border-border text-subtle"
                      : n === count
                        ? "border-brand bg-brand-soft text-brand-text"
                        : "border-border-strong bg-surface text-text hover:border-text",
                  )}
                >
                  <input type="radio" name="size" className="sr-only" value={n} checked={n === count} onChange={() => setSize(n)} />
                  {fill(t.sizeOption, { n: fmt.number(n) })}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="grid gap-2">
            <legend className="mb-2 font-semibold">{t.mode}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["practice", t.practice, t.practiceHint],
                  ["exam", t.examMode, t.examHint],
                ] as const
              ).map(([id, label, hint]) => (
                <label
                  key={id}
                  className={cn(
                    "grid cursor-pointer gap-0.5 rounded-md border-[1.5px] p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-brand/30",
                    mode === id ? "border-brand bg-brand-soft" : "border-border hover:border-border-strong",
                  )}
                >
                  <input type="radio" name="mode" className="sr-only" value={id} checked={mode === id} onChange={() => setMode(id)} />
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs text-muted">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {mode === "exam" && (
            <fieldset className="grid gap-1">
              <legend className="mb-2 font-semibold">{t.rulesSetup}</legend>
              {(
                [
                  [timed, () => setTimed((v) => !v), t.timePerQ, fill(t.minutes, { n: fmt.number(count) })],
                  [negative, () => setNegative((v) => !v), t.negativeLabel, t.negativeHint],
                  [strict, () => setStrict((v) => !v), t.strictLabel, t.strictHint],
                ] as const
              ).map(([on, toggleRule, label, hint]) => (
                <CheckboxRow key={label} className="-mx-2" checked={on} onChange={toggleRule}>
                  <span className="grid min-w-0 flex-1">
                    <span className="font-medium">{label}</span>
                    <span className="text-xs text-subtle">{hint}</span>
                  </span>
                </CheckboxRow>
              ))}
            </fieldset>
          )}
        </Card>

        <Card className="grid gap-3 p-5">
          <p className="font-semibold tabular-nums" aria-live="polite">
            {missing ??
              [
                fill(t.summary, { chapters: fmt.number(chosen.length), questions: fmt.number(count) }),
                TYPES.filter((h) => types.has(h))
                  .map((h) => typeLabel[h][0])
                  .join(" + "),
                mode === "practice" ? t.practice : t.examMode,
                mode === "exam" && (timed ? fill(t.minutes, { n: fmt.number(count) }) : t.timeNone),
              ]
                .filter(Boolean)
                .join(" · ")}
          </p>
          {missing ? (
            <span aria-disabled className="inline-flex h-12 items-center justify-center rounded-full bg-raised font-semibold text-subtle">
              {t.start}
            </span>
          ) : (
            <Button href={href} size="lg">
              {t.start}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
