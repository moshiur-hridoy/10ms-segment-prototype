"use client";

import { ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { CheckboxRow } from "@/design-system/molecules/checkbox-row";
import type { ExamLabels } from "@/components/exam/types";
import { Button } from "@/design-system/atoms/button";
import { IconButton } from "@/design-system/atoms/icon-button";
import type { Locale } from "@/i18n/config";
import { DEFAULT_SET_SIZE, setSearch, type SetQuery } from "@/lib/api/question-set";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";

type History = SetQuery["types"][number];

const TYPES: History[] = ["new", "wrong", "correct"];

/** The exam labels the popup uses; only these are sent to the browser. */
export type PickerLabels = Pick<
  ExamLabels,
  "types" | "typeNew" | "typeNewHint" | "typeWrong" | "typeWrongHint" | "typeCorrect" | "typeCorrectHint" | "size" | "sizeOption" | "questionsCount" | "start" | "needType" | "noneAvailable" | "close"
>;
/** Set sizes offered in the popup; a short set is an easier first step than a whole chapter. */
const SIZES = [10, 20, 30];

/**
 * Start a chapter's next set in one tap: the button names what it starts ("২০টি নতুন প্রশ্ন").
 * "বদলাও" opens a popup (a bottom sheet on phones) to pick question types and how many;
 * types with nothing in them are disabled with the reason. Both lead to the same exam URL.
 */
export function SetPicker({
  lang,
  examPath,
  keep,
  chapter,
  labels,
  t,
}: {
  lang: Locale;
  /** `/bn/superprep/<id>/exam` */
  examPath: string;
  /** Query to carry along (dev knobs). */
  keep: string;
  chapter: { id: string; label: string; title: string; counts: Record<History, number> };
  labels: {
    /** "{n}টি নতুন প্রশ্ন শুরু করো" */
    start: string;
    change: string;
    changeLabel: string;
    /** Why a type is disabled when it has no questions. */
    none: Record<History, string>;
  };
  t: PickerLabels;
}) {
  // Only numbers are formatted here, and they don't depend on the time.
  const fmt = createFormatter(lang, 0);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { counts } = chapter;

  const [types, setTypes] = useState<Set<History>>(() => new Set([TYPES.find((h) => counts[h] > 0) ?? "new"]));
  const [size, setSize] = useState(DEFAULT_SET_SIZE);

  const hrefFor = (set: Partial<SetQuery>) => {
    const query = new URLSearchParams(keep);
    setSearch({ chapters: [chapter.id], ...set }).forEach((v, k) => query.set(k, v));
    return `${examPath}?${query}`;
  };
  const quickCount = Math.min(DEFAULT_SET_SIZE, counts.new);

  const available = [...types].reduce((n, h) => n + counts[h], 0);
  const sizes = SIZES.filter((n) => n <= available);
  const options = sizes.length ? sizes : available > 0 ? [available] : [];
  const count = options.includes(size) ? size : (options.filter((n) => n <= size).at(-1) ?? options[0] ?? 0);
  const picked = TYPES.filter((h) => types.has(h));
  const missing = types.size === 0 ? t.needType : available === 0 ? t.noneAvailable : null;

  const typeLabel: Record<History, [string, string]> = {
    new: [t.typeNew, t.typeNewHint],
    wrong: [t.typeWrong, t.typeWrongHint],
    correct: [t.typeCorrect, t.typeCorrectHint],
  };
  const toggle = (h: History) =>
    setTypes((s) => {
      const next = new Set(s);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return next;
    });

  const open = () => {
    document.documentElement.style.overflow = "hidden";
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();
  // Leaving the page with the popup open (its start link) must not leave scrolling locked.
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button href={hrefFor({ types: ["new"], count: quickCount })} className="flex-1 sm:flex-none">
        {fill(labels.start, { n: fmt.number(quickCount) })}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
      <Button variant="ghost" onClick={open} aria-haspopup="dialog" aria-label={labels.changeLabel} className="px-4 text-brand-text">
        <SlidersHorizontal className="size-4" aria-hidden />
        {labels.change}
      </Button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => (document.documentElement.style.overflow = "")}
        // A click on the backdrop lands on the dialog itself; the content sits in the inner div.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/30 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
      >
        <div className="grid gap-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-0.5">
              <p className="text-sm text-muted">{chapter.label}</p>
              <h2 id={titleId} className="type-subtitle leading-snug">
                {chapter.title}
              </h2>
            </div>
            <IconButton label={t.close} size="md" onClick={close} className="-mt-1 -mr-2">
              <X className="size-5" aria-hidden />
            </IconButton>
          </div>

          <fieldset className="grid gap-1">
            <legend className="mb-2 font-semibold">{t.types}</legend>
            {TYPES.map((h) => {
              const n = counts[h];
              const empty = n === 0;
              const [label, hint] = typeLabel[h];
              return (
                <CheckboxRow key={h} className="-mx-2" checked={types.has(h)} disabled={empty} onChange={() => toggle(h)}>
                  <span className="grid min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("font-medium", empty && "text-subtle")}>{label}</span>
                      <span className={cn("text-sm tabular-nums", empty ? "text-subtle" : "font-semibold")}>{fmt.number(n)}</span>
                    </span>
                    <span className="text-xs text-subtle">{empty ? labels.none[h] : hint}</span>
                  </span>
                </CheckboxRow>
              );
            })}
          </fieldset>

          <fieldset className="grid gap-2" disabled={options.length === 0}>
            <legend className="mb-2 font-semibold">{t.size}</legend>
            <div className="flex flex-wrap gap-2">
              {(options.length ? options : SIZES).map((n) => (
                <label
                  key={n}
                  className={cn(
                    "inline-flex h-10 min-w-14 items-center justify-center rounded-full border px-4 text-sm font-semibold tabular-nums transition-colors has-focus-visible:ring-3 has-focus-visible:ring-brand/30",
                    options.length === 0
                      ? "cursor-not-allowed border-border text-subtle"
                      : n === count
                        ? "cursor-pointer border-brand bg-brand-soft text-brand-text"
                        : "cursor-pointer border-border-strong bg-surface text-text hover:border-text",
                  )}
                >
                  <input type="radio" name={`${titleId}-size`} className="sr-only" value={n} checked={n === count} onChange={() => setSize(n)} />
                  {fill(t.sizeOption, { n: fmt.number(n) })}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3">
            <p className="text-sm font-semibold tabular-nums" aria-live="polite">
              {missing ?? [fill(t.questionsCount, { n: fmt.number(count) }), picked.map((h) => typeLabel[h][0]).join(" + ")].join(" · ")}
            </p>
            {missing ? (
              <span aria-disabled className="inline-flex h-12 items-center justify-center rounded-full bg-raised font-semibold text-subtle">
                {t.start}
              </span>
            ) : (
              <Button href={hrefFor({ types: picked, count })} onClick={close} size="lg">
                {t.start}
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
