"use client";

import { useState, type CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { localDigits } from "@/lib/phone";
import type { ClassId, Mood } from "./steps";

/*
 * Onboarding v3 (OB14): the answers as things to tap, not a row of text chips. The school classes are a staircase
 * the student's face hops onto; groups and units are big cards that say what is inside; subjects get a mood each.
 */

export const rise = (n: number): CSSProperties => ({ animationDelay: `${Math.min(n, 10) * 70}ms` });

const SCHOOL: ClassId[] = ["6", "7", "8", "9", "10", "11", "12"];

/** Class 6 to 12 as steps going up; the caption under them says what the step means (the exam and its year). */
export function Stairs({
  value,
  face,
  lang,
  short,
  caption,
  hint,
  label,
  onPick,
}: {
  value: ClassId | null;
  /** The student's emoji, or their initial; it stands on the chosen step. */
  face: string;
  lang: Locale;
  short: (c: ClassId) => string;
  /** "দ্বাদশ শ্রেণি · HSC ২৭ · পরীক্ষা ২০২৭" */
  caption: (c: ClassId) => string;
  hint: string;
  label: string;
  onPick: (c: ClassId) => void;
}) {
  const [peek, setPeek] = useState<ClassId | null>(null);
  const shown = peek ?? (value && SCHOOL.includes(value) ? value : null);
  return (
    <div className="grid gap-3">
      <div role="group" aria-label={label} className="flex h-44 items-end gap-1.5 pt-11 sm:h-52">
        {SCHOOL.map((c, i) => {
          const on = value === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={on}
              aria-label={caption(c)}
              onClick={() => onPick(c)}
              onMouseEnter={() => setPeek(c)}
              onMouseLeave={() => setPeek(null)}
              onFocus={() => setPeek(c)}
              onBlur={() => setPeek(null)}
              style={{ height: `${34 + i * 11}%`, ...rise(i + 1) }}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center rounded-md border pt-2 transition-[border-color,background-color,translate] motion-safe:animate-rise",
                on
                  ? "border-brand bg-brand-soft text-brand-text"
                  : "border-border-strong bg-surface text-text hover:-translate-y-0.5 hover:border-brand",
              )}
            >
              {on && (
                <span aria-hidden className="absolute -top-10 text-3xl leading-none motion-safe:animate-hop">
                  {face}
                </span>
              )}
              <span className="text-xl leading-none font-bold">{localDigits(c, lang)}</span>
              <span className="mt-1 truncate text-xs text-muted">{short(c)}</span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className={cn("min-h-6 text-center text-sm", shown ? "font-semibold text-brand-text" : "text-muted")}>
        {shown ? caption(shown) : hint}
      </p>
    </div>
  );
}

/** A big answer card: an emoji, the answer, and a line on what it means or holds. */
export function BigChoice({
  i,
  on,
  emoji,
  title,
  sub,
  stack = false,
  onClick,
}: {
  i: number;
  on: boolean;
  emoji: string;
  title: string;
  sub?: string | null;
  /** Two cards side by side on a phone: the emoji above the words there, beside them from `sm`. */
  stack?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      style={rise(i + 1)}
      className={cn(
        "flex w-full rounded-lg border p-3 text-left transition-[border-color,background-color,translate,scale] active:scale-95 motion-safe:animate-rise",
        stack ? "flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4" : "items-center gap-4",
        on ? "border-brand bg-brand-soft" : "border-border-strong bg-surface hover:-translate-y-0.5 hover:border-brand",
      )}
    >
      <span
        aria-hidden
        className={cn("grid size-12 shrink-0 place-items-center rounded-md text-3xl", on ? "bg-surface motion-safe:animate-stamp" : "bg-raised")}
      >
        {emoji}
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className={cn("text-base font-semibold", on && "text-brand-text")}>{title}</span>
        {sub && <span className="text-sm text-muted">{sub}</span>}
      </span>
    </button>
  );
}

export const MOODS: Mood[] = ["easy", "ok", "hard"];
const MOOD_EMOJI: Record<Mood, string> = { easy: "😎", ok: "🙂", hard: "😵" };

/** One subject and three faces: easy, so-so, hard. Hard is the "boss level", which the page puts first. */
export function MoodRow({
  i,
  name,
  mood,
  onMood,
  moods,
  boss,
}: {
  i: number;
  name: string;
  mood: Mood | undefined;
  onMood: (m: Mood) => void;
  moods: Record<Mood, string>;
  boss: string;
}) {
  return (
    <div
      role="group"
      aria-label={name}
      style={rise(i + 1)}
      className={cn(
        "flex items-center gap-2 rounded-lg border py-1 pr-1 pl-4 transition-colors motion-safe:animate-rise",
        mood === "hard" ? "border-danger bg-danger-soft" : mood ? "border-border-strong bg-surface" : "border-border bg-surface",
      )}
    >
      <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
      {mood === "hard" && <span className="hidden text-xs font-semibold text-danger motion-safe:animate-stamp sm:inline">{boss}</span>}
      {MOODS.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mood === m}
          aria-label={moods[m]}
          title={moods[m]}
          onClick={() => onMood(m)}
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full text-xl transition-[opacity,scale,background-color,filter] active:scale-90",
            mood === m ? "scale-110 bg-surface shadow-card" : mood ? "opacity-40 grayscale hover:opacity-100 hover:grayscale-0" : "hover:bg-raised",
          )}
        >
          {MOOD_EMOJI[m]}
        </button>
      ))}
    </div>
  );
}

/** How far along: one bar per question, filled up to this one. Decorative; TenTen's question says where they are. */
export function Path({ total, at }: { total: number; at: number }) {
  if (total < 2) return null;
  return (
    <div aria-hidden className="mx-auto mt-3 flex w-full max-w-md gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", i < at ? "bg-brand" : i === at ? "bg-brand-soft" : "bg-raised")}
        />
      ))}
    </div>
  );
}
