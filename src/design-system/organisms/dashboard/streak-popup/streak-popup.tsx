"use client";

import { CloudRain, Sprout, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TreeScene, type TreeAction } from "@/design-system/atoms/tree-art";
import { Button } from "@/design-system/atoms/button";
import { intlLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill } from "@/lib/format";
import { growthIn, nextStage, stageOf, type PopupSituation, type TreeMood, type TreeSpecies, type TreeStage } from "@/lib/tree";


type Labels = Dictionary["streak"] & { trees: Dictionary["trees"] };
type Scene = { g: number; mood: TreeMood; action: TreeAction };

/** The tree for each situation (the demo uses these with a young tree's numbers). */
const SCENE: Record<PopupSituation, (g: number) => Scene> = {
  thirsty: (g) => ({ g, mood: "thirsty", action: "none" }),
  rain: (g) => ({ g, mood: "fresh", action: "rain" }),
  back: (g) => ({ g, mood: "thirsty", action: "wilt" }),
  dead: () => ({ g: 0, mood: "dead", action: "none" }),
  grow: (g) => ({ g, mood: "fresh", action: "grow" }),
};

/** Ask the popup to open (the streak card's demo does this), showing this situation. */
export const OPEN_STREAK_POPUP = "streak-popup:open";
export const openStreakPopup = (situation: PopupSituation) => window.dispatchEvent(new CustomEvent(OPEN_STREAK_POPUP, { detail: situation }));
const DEMO_G: Record<PopupSituation, number> = { thirsty: 13, rain: 13, back: 9, dead: 0, grow: 14 };

/**
 * The streak popup, on the first dashboard visit of the day, when there's something to say: today's
 * task with its progress, or what happened since (rain saved it, it went back a stage, it died, it
 * reached a new stage). The tree's world on top, in the real time of day; a white panel below.
 * Live (`?streak=live`): once a day and only with a `situation`. Demo (default for now): only when the
 * streak card's "পপআপ দেখো" asks, in the situation of the moment the card is showing.
 */
export function StreakPopup({
  lang,
  today,
  situation,
  days,
  growth,
  species,
  minutes,
  hoursLeft,
  progress,
  rain,
  waterHref,
  gardenHref,
  t,
}: {
  lang: Locale;
  today: string;
  /** Live: what to say, or null for nothing (watered and nothing new). */
  situation: PopupSituation | null;
  days: number;
  growth: number;
  species: TreeSpecies;
  /** The time of day for the sky (minutes after midnight, Bangladesh). */
  minutes: number;
  hoursLeft: number;
  /** Today's watering so far against the goal. */
  progress: { minutes: number; quizzes: number; goal: number };
  rain: { left: number; max: number } | null;
  /** "এখনই পানি দাও": the video left off or the next class. */
  waterHref: string;
  gardenHref: string;
  t: Labels;
}) {
  const p = t.popup;
  const nf = new Intl.NumberFormat(intlLocale[lang]);
  const n = (v: number) => nf.format(v);
  const demo = useSearchParams().get("streak") !== "live";
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<PopupSituation>(situation ?? "thirsty");

  // Live: open shortly after the page settles, once a day and only with something to say.
  useEffect(() => {
    const key = `streak-popup-${today}`;
    if (demo || !situation || localStorage.getItem(key)) return;
    const id = window.setTimeout(() => {
      dialog.current?.showModal();
      localStorage.setItem(key, "1");
    }, 600);
    return () => window.clearTimeout(id);
  }, [demo, situation, today]);

  // On request (the card's demo button): open with the situation asked for.
  useEffect(() => {
    const open = (e: Event) => {
      setShown((e as CustomEvent<PopupSituation>).detail);
      dialog.current?.showModal();
    };
    window.addEventListener(OPEN_STREAK_POPUP, open);
    return () => window.removeEventListener(OPEN_STREAK_POPUP, open);
  }, []);

  const close = () => dialog.current?.close();
  const s = shown;
  const scene = SCENE[s](demo ? DEMO_G[s] : growth);
  const stage: TreeStage = stageOf(scene.g);
  const name = (st: TreeStage) => fill(t.stage[String(st) as keyof Labels["stage"]], { of: t.trees.of[species], fruit: t.trees.name[species] });
  const next = nextStage(stage);
  const dayCount = demo ? (s === "dead" || s === "back" ? 0 : DEMO_G[s]) : days;
  const done = demo ? 4 : progress.minutes;
  const pct = Math.min(100, Math.round((done / progress.goal) * 100));
  const [before, after] = t.days.split("{n}");

  const cta =
    s === "dead" ? (
      <Button variant="raised" onClick={close} className="w-full">
        <Sprout className="size-4" aria-hidden />
        {p.cta.replant}
      </Button>
    ) : s === "grow" ? (
      <Button variant="raised" href={gardenHref} className="w-full">
        {p.cta.garden}
      </Button>
    ) : (
      <Button variant="raised" href={waterHref} className="w-full">
        {p.cta.water}
      </Button>
    );

  return (
    <dialog
      ref={dialog}
      aria-labelledby="streak-pop-title"
      onClick={(e) => e.target === e.currentTarget && close()}
      className="streak-pop sheet m-auto w-[min(26rem,calc(100%-2rem))] overflow-hidden rounded-xl border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/40 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
    >
      <div className="relative h-48">
        <TreeScene
          key={s}
          frame="landscape"
          stage={stage}
          mood={scene.mood}
          action={scene.action}
          growth={growthIn(scene.g)}
          species={species}
          minutes={minutes}
          className="absolute inset-0 size-full"
        />
        <span className="absolute top-3 left-3 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold shadow-raised backdrop-blur">
          {before}
          {n(dayCount)}
          {after}
        </span>
        <button type="button" onClick={close} aria-label={p.close} className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-surface/85 shadow-raised backdrop-blur hover:bg-surface">
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Focus starts on the message (not the ×), so opening doesn't draw a focus ring on the close button. */}
      <div tabIndex={-1} autoFocus className="relative -mt-5 grid gap-4 rounded-t-xl bg-surface px-6 pt-6 pb-5 text-center outline-none" style={{ boxShadow: "var(--tree-sheet-shadow)" }}>
        <div className="grid gap-1.5">
          <h2 id="streak-pop-title" className="type-title">
            {fill(p.title[s], { stage: name(stage) })}
          </h2>
          <p className="text-muted">
            {s === "rain"
              ? fill(p.body.rain, { left: n(rain?.left ?? 0), max: n(rain?.max ?? 3) })
              : s === "grow"
                ? fill(p.body.grow, { next: next ? name(next.stage) : name(stage), n: n(next ? next.from - Math.max(1, scene.g) : 0) })
                : p.body[s]}
          </p>
        </div>

        {/* Today's task and how far along it is (every situation but a dead tree or a new stage). */}
        {(s === "thirsty" || s === "rain" || s === "back") && (
          <div className="grid gap-2 rounded-md bg-raised p-3 text-left">
            <p className="text-sm font-semibold">{fill(p.task, { goal: n(progress.goal) })}</p>
            <div className="h-2 overflow-hidden rounded-full bg-border" role="progressbar" aria-label={p.task} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[var(--tree-water)]" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            <p className="flex justify-between gap-2 text-xs text-muted">
              <span>{fill(p.progress, { done: n(done), goal: n(progress.goal) })}</span>
              <span>{fill(p.hoursLeft, { h: n(hoursLeft) })}</span>
            </p>
          </div>
        )}
        {s === "rain" && rain && (
          <p className="-mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
            <CloudRain className="size-3.5 text-[var(--tree-can)]" aria-hidden />
            {fill(t.rain, { left: n(rain.left), max: n(rain.max) })}
          </p>
        )}

        <div className="grid gap-1">
          {cta}
          <button type="button" onClick={close} className="h-10 text-sm font-semibold text-muted hover:text-text">
            {p.later}
          </button>
        </div>

      </div>
    </dialog>
  );
}
