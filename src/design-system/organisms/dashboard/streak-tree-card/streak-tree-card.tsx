"use client";

import { ChevronRight, CloudRain, Droplet, Pause, Play, RotateCcw, Sprout, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { dhakaMinutes, skyAt, SUNRISE } from "@/lib/sky";
import { growthIn, nextStage as nextOf, stageOf, type PopupSituation, type TreeMood, type TreeSpecies, type TreeStage } from "@/lib/tree";
import { TreeSceneStack, type TreeAction } from "@/design-system/atoms/tree-art";
import { Odometer } from "@/design-system/atoms/odometer";
import { openStreakPopup } from "@/design-system/organisms/dashboard/streak-popup";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { intlLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { StreakDayStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";

type Labels = Dictionary["streak"] & { seeDetails: string; trees: Dictionary["trees"] };

/** What the card shows at one moment. `g` is the tree's growth in days (it sets the stage). */
type Step = {
  at: number;
  g: number;
  days: number;
  mood: TreeMood;
  action: TreeAction;
  week: StreakDayStatus[];
  rain: number;
  note: string;
  plus?: boolean;
};
type StoryId = keyof Labels["scene"];
type Story = { id: StoryId; ms: number; steps: Step[] };


/** Which popup goes with each moment of the demo story (the card's "পপআপ দেখো"). */
const POPUP_FOR: Record<keyof Dictionary["streak"]["scene"], PopupSituation> = {
  start: "thirsty",
  thirsty: "thirsty",
  water: "grow",
  fruit: "grow",
  rain: "rain",
  back: "back",
  dead: "dead",
  plant: "thirsty",
};

/** The demo's day: about 40 seconds for 24 hours, stepped 10 times a second. */
const DEMO_TICK = 100;
const DEMO_STEP = (24 * 60) / 400;

const noSubscribe = () => () => {};
const subscribeReduce = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const prefersReduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The streak as an apple tree that every day's study waters. The scene is the card's landscape;
 * a white panel slides up over the grass with the day count, the stage and the way to the next
 * one, and the week as water drops. Two modes:
 *  - demo (default for now): the whole story on a loop, so everyone sees each moment, with a dot
 *    per moment and a pause button; no autoplay with reduced motion.
 *  - live (`?streak=live`): the real state; watering plays once a day.
 */
export function StreakTreeCard({
  lang,
  today,
  current,
  best,
  growth,
  week,
  rain,
  hoursLeft,
  minutes: startMinutes,
  name,
  weekdays,
  species,
  gardenHref,
  t,
}: {
  lang: Locale;
  /** The fruit tree growing now (the demo story is always the first tree, an apple). */
  species: TreeSpecies;
  /** "বিস্তারিত দেখো": the orchard. */
  gardenHref: string;
  today: string;
  current: number;
  best: number;
  growth: number;
  week: { date: string; status: StreakDayStatus }[];
  rain: { left: number; max: number } | null;
  hoursLeft: number;
  /** The request's time of day (minutes after midnight, Bangladesh), so the sky matches on the server and in the browser. */
  minutes: number;
  name: string | null;
  weekdays: string[];
  t: Labels;
}) {
  const nf = new Intl.NumberFormat(intlLocale[lang]);
  const n = (v: number) => nf.format(v);
  const demo = useSearchParams().get("streak") !== "live";
  const reduce = useSyncExternalStore(subscribeReduce, prefersReduce, () => false);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !reduce;
  const [story, setStory] = useState(0);
  const [step, setStep] = useState(0);

  // The sky's clock: the real time in live mode (checked each minute); in the demo a whole day runs in about 40 seconds.
  const [clock, setClock] = useState(demo && !reduce ? SUNRISE - 45 : startMinutes);
  useEffect(() => {
    if (demo && !reduce) {
      const id = window.setInterval(() => setClock((m) => (m + DEMO_STEP) % (24 * 60)), DEMO_TICK);
      return () => window.clearInterval(id);
    }
    const sync = () => setClock(dhakaMinutes(Date.now()));
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, [demo, reduce]);
  const phase = skyAt(clock).phase;
  // Live, the hours to midnight come from the server; in the demo, from the running clock.
  const hours = demo ? Math.max(1, Math.ceil((24 * 60 - clock) / 60)) : hoursLeft;
  const thirstyNote = fill(phase === "night" && clock >= 12 * 60 ? t.thirstyNight : phase === "golden" || phase === "dusk" ? t.thirstyEvening : t.thirsty, { h: n(hours) });
  const sp: TreeSpecies = demo ? "apple" : species;
  const nameOf = (stage: TreeStage) => fill(t.stage[String(stage) as keyof Labels["stage"]], { of: t.trees.of[sp], fruit: t.trees.name[sp] });
  const stageName = (g: number) => nameOf(stageOf(g));

  // Live: the real tree. Watering plays the first time today's study is seen.
  const wateredKey = `streak-watered-${today}`;
  const firstToday = useSyncExternalStore(noSubscribe, () => localStorage.getItem(wateredKey) === null, () => false);
  const todayStatus = week.find((d) => d.date === today)?.status;
  useEffect(() => {
    if (!demo && todayStatus === "today-done") localStorage.setItem(wateredKey, "1");
  }, [demo, todayStatus, wateredKey]);
  const liveDead = growth === 0;
  const live: Step = {
    at: 0,
    g: growth,
    days: current,
    mood: liveDead ? "dead" : todayStatus === "today" ? "thirsty" : "fresh",
    action: !liveDead && todayStatus === "today-done" && firstToday ? "water" : "none",
    week: week.map((d) => d.status),
    rain: rain?.left ?? 0,
    note: liveDead ? t.dead : current === 0 ? t.start : todayStatus === "today" ? thirstyNote : name ? fill(t.encourage, { name }) : t.encourageAnon,
  };

  // The demo story, on this week's dates (today third): a young tree a day before its next stage.
  const W: StreakDayStatus = "upcoming";
  const stories: Story[] = [
    // A student with no streak yet: the demo (and its restart) begins here, at day 0, not at day 13.
    {
      id: "start",
      ms: 4600,
      steps: [
        { at: 0, g: 0, days: 0, mood: "thirsty", action: "none", week: [W, W, "today", W, W, W, W], rain: 0, note: t.start },
        { at: 1800, g: 1, days: 1, mood: "fresh", action: "water", week: [W, W, "today-done", W, W, W, W], rain: 0, note: t.watered, plus: true },
      ],
    },
    { id: "thirsty", ms: 3800, steps: [{ at: 0, g: 13, days: 13, mood: "thirsty", action: "none", week: ["done", "done", "today", W, W, W, W], rain: 1, note: thirstyNote }] },
    {
      id: "water",
      ms: 5400,
      steps: [
        { at: 0, g: 13, days: 13, mood: "thirsty", action: "water", week: ["done", "done", "today", W, W, W, W], rain: 1, note: t.watered },
        { at: 2200, g: 14, days: 14, mood: "fresh", action: "grow", week: ["done", "done", "today-done", W, W, W, W], rain: 1, note: fill(t.stageUp, { stage: stageName(14) }), plus: true },
      ],
    },
    { id: "fruit", ms: 4600, steps: [{ at: 0, g: 32, days: 32, mood: "fresh", action: "grow", week: ["done", "done", "today-done", W, W, W, W], rain: 1, note: fill(t.fruit, { n: n(30), fruit: t.trees.name.apple }) }] },
    { id: "rain", ms: 4400, steps: [{ at: 0, g: 33, days: 33, mood: "fresh", action: "rain", week: ["done", "done", "done", "rained", W, W, W], rain: 0, note: t.rainSaved }] },
    {
      id: "back",
      ms: 4600,
      steps: [
        { at: 0, g: 33, days: 0, mood: "thirsty", action: "wilt", week: ["done", "done", "done", "rained", "missed", W, W], rain: 0, note: t.steppedBack },
        { at: 1400, g: 27, days: 0, mood: "thirsty", action: "none", week: ["done", "done", "done", "rained", "missed", W, W], rain: 0, note: t.steppedBack },
      ],
    },
    {
      id: "dead",
      ms: 4800,
      steps: [
        { at: 0, g: 17, days: 0, mood: "thirsty", action: "wilt", week: ["done", "rained", "missed", "missed", "missed", W, W], rain: 0, note: t.dead },
        { at: 1400, g: 0, days: 0, mood: "dead", action: "none", week: ["done", "rained", "missed", "missed", "missed", W, W], rain: 0, note: t.dead },
      ],
    },
    {
      id: "plant",
      ms: 4000,
      steps: [
        { at: 0, g: 0, days: 0, mood: "dead", action: "none", week: ["missed", "missed", "missed", "today", W, W, W], rain: 0, note: t.planted },
        { at: 500, g: 1, days: 1, mood: "fresh", action: "plant", week: ["missed", "missed", "missed", "today-done", W, W, W], rain: 0, note: t.planted, plus: true },
      ],
    },
  ];

  const s = demo ? stories[story].steps[step] : live;
  const dead = s.mood === "dead";
  const stage = stageOf(s.g);
  const next = dead ? null : nextOf(stage);
  const rainMax = rain?.max ?? 3;

  // The story's clock: the next step inside a moment, then the next moment.
  const current_ = stories[story];
  const nextStepAt = current_.steps[step + 1]?.at;
  const wait = nextStepAt !== undefined ? nextStepAt - current_.steps[step].at : current_.ms - current_.steps[step].at;
  const count = stories.length;
  useEffect(() => {
    if (!demo || !playing) return;
    const id = window.setTimeout(() => {
      if (nextStepAt !== undefined) setStep((i) => i + 1);
      else {
        setStory((i) => (i + 1) % count);
        setStep(0);
      }
    }, wait);
    return () => window.clearTimeout(id);
  }, [count, demo, nextStepAt, playing, story, step, wait]);

  const goTo = (i: number) => {
    setStory(i);
    setStep(0);
  };
  // Back to the first moment and the start of the day, playing.
  const restart = () => {
    goTo(0);
    setClock(SUNRISE - 45);
    setUserPlaying(true);
  };
  const [before, after] = t.days.split("{n}");
  const toNext = next ? Math.max(0, next.from - Math.max(1, s.g)) : 0;
  const pct = dead ? 0 : Math.round(growthIn(s.g) * 100);

  return (
    <Card aria-labelledby="streak-title" className="overflow-hidden p-0">
      {/* The world: the tree's landscape fills the card's top. */}
      <div className="relative h-52">
        <TreeSceneStack
          className="absolute inset-0"
          sceneKey={`${demo ? story : "live"}-${step}`}
          stage={stage}
          mood={s.mood}
          action={s.action}
          growth={growthIn(s.g)}
          ripe={stage === 8 ? Math.min(1, (s.g - 30) / 6 + 0.35) : 1}
          species={sp}
          minutes={clock}
          fireflies={s.week.includes("today-done")}
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-text shadow-raised backdrop-blur">
          <Sprout className={cn("size-3.5", dead ? "text-subtle" : "text-success")} aria-hidden />
          <span className="sr-only">{t.stageLabel}: </span>
          {dead ? t.stage.dead : stageName(s.g)}
        </span>
        <span title={t.rainHint} className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-surface/85 px-2.5 py-1 text-xs font-semibold text-text shadow-raised backdrop-blur">
          <CloudRain className="size-3.5 text-[var(--tree-can)]" aria-hidden />
          {fill(t.rain, { left: n(s.rain), max: n(rainMax) })}
          <span className="sr-only">. {t.rainHint}</span>
        </span>
        {s.plus && (
          <span key={`plus-${story}-${step}`} aria-hidden className="absolute top-16 left-[66%] rounded-full bg-success px-2.5 py-1 text-sm font-bold text-on-fill shadow-raised motion-safe:animate-[float-up_1.8s_ease-out_both] motion-reduce:hidden">
            {t.plusOne}
          </span>
        )}
      </div>

      {/* The panel, sliding up over the grass. */}
      <div className="relative -mt-5 grid gap-4 rounded-t-xl bg-surface px-5 pt-5 pb-4" style={{ boxShadow: "var(--tree-sheet-shadow)" }}>
        <div className="grid justify-items-center gap-1 text-center">
          <h2 id="streak-title" className="type-figure">
            {before}
            <Odometer value={s.days} format={n} />
            {after}
          </h2>
          <p key={s.note} className={cn("text-sm motion-safe:animate-[fade-in_300ms_ease-out]", dead || s.mood === "thirsty" ? "text-muted" : "text-text")}>
            {s.note}
          </p>
          {dead && (
            <Button variant="raised" size="sm" className="mt-2" onClick={demo ? () => goTo(stories.length - 1) : undefined}>
              <Sprout className="size-4" aria-hidden />
              {t.replant}
            </Button>
          )}
        </div>

        {!dead && (
          <div className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-text">{stageName(s.g)}</span>
              <span className="text-muted">{next ? fill(t.nextStage, { stage: nameOf(next.stage), n: n(toNext) }) : t.ripening}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-raised" role="progressbar" aria-label={t.stageLabel} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-success transition-[width] duration-700 ease-emphasis" style={{ width: `${Math.max(6, pct)}%` }} />
            </div>
          </div>
        )}

        <Week statuses={s.week} weekdays={weekdays} labels={t.day} />

        <p className="text-center text-xs text-subtle">{fill(t.best, { n: n(Math.max(best, s.days)) })}</p>

        {demo && (
          <div role="group" aria-label={t.demoLabel} className="flex items-center gap-2 rounded-full bg-raised py-1 pr-1 pl-3">
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-muted">
              {t.demo} · {t.scene[stories[story].id]}
            </span>
            <div className="flex items-center gap-1">
              {stories.map((st, i) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t.scene[st.id]}
                  aria-pressed={i === story}
                  className={cn("relative h-2 overflow-hidden rounded-full transition-all", i === story ? "w-6 bg-border-strong" : "w-2 bg-border-strong/60 hover:bg-border-strong")}
                >
                  {i === story && playing && (
                    <span key={`${story}-${playing}`} aria-hidden className="absolute inset-0 origin-left bg-success" style={{ animation: `demo-progress ${st.ms}ms linear both` }} />
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={restart}
              aria-label={t.restart}
              title={t.restart}
              className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-text"
            >
              <RotateCcw className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setUserPlaying(!playing)}
              aria-label={playing ? t.pause : t.play}
              className="grid size-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-text"
            >
              {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
            </button>
          </div>
        )}
        {demo && (
          <button type="button" onClick={() => openStreakPopup(POPUP_FOR[stories[story].id])} className="-mt-2 justify-self-center text-xs font-semibold text-brand-text hover:underline">
            {t.popup.show}
          </button>
        )}

        <Link href={gardenHref} className="inline-flex w-full items-center justify-center gap-0.5 border-t border-border pt-3 text-sm font-semibold hover:underline">
          {t.seeDetails}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}

/** The week, Saturday first: a water drop for each watered day, joined by a line while the run holds. */
function Week({ statuses, weekdays, labels }: { statuses: StreakDayStatus[]; weekdays: string[]; labels: Labels["day"] }) {
  const kept = (s: StreakDayStatus | undefined) => s === "done" || s === "today-done" || s === "rained";
  return (
    <ol className="grid w-full grid-cols-7">
      {statuses.map((s, i) => (
        <li key={i} aria-label={`${weekdays[i]}: ${labels[s]}`} className="relative grid justify-items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden className="absolute top-3.5 right-1/2 left-0 h-0.5 bg-border">
              {kept(statuses[i - 1]) && kept(s) && <span className="block h-full origin-left bg-[var(--tree-water)] motion-safe:animate-[line-run_400ms_ease-out_both]" />}
            </span>
          )}
          {i < statuses.length - 1 && (
            <span aria-hidden className="absolute top-3.5 right-0 left-1/2 h-0.5 bg-border">
              {kept(s) && kept(statuses[i + 1]) && <span className="block h-full origin-left bg-[var(--tree-water)] motion-safe:animate-[line-run_400ms_ease-out_both]" />}
            </span>
          )}
          <DayMark key={s} status={s} />
          <span aria-hidden className={cn("text-xs", s.startsWith("today") ? "font-semibold text-text" : "text-subtle")}>
            {weekdays[i]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function DayMark({ status }: { status: StreakDayStatus }) {
  const ring = "relative z-10 grid size-7 place-items-center rounded-full bg-surface";
  const drop = "fill-[var(--tree-water)] text-[var(--tree-water)]";
  switch (status) {
    case "done":
      return (
        <span className={cn(ring, "ring-2 ring-[var(--tree-water)]/35")}>
          <Droplet className={cn("size-3.5", drop)} aria-hidden />
        </span>
      );
    case "today-done":
      return (
        <span className={cn(ring, "shadow-[0_0_0_4px_var(--tree-water-soft)] ring-2 ring-[var(--tree-water)] motion-safe:animate-[day-fill_600ms_var(--ease-emphasis)_both]")}>
          <Droplet className={cn("size-4", drop)} aria-hidden />
        </span>
      );
    case "today":
      return (
        <span className={cn(ring, "border-2 border-dashed border-[var(--tree-water)] motion-safe:animate-[ring-breathe_2s_ease-in-out_infinite]")}>
          <Droplet className="size-3.5 text-[var(--tree-water)]" aria-hidden />
        </span>
      );
    case "rained":
      return (
        <span className={cn(ring, "ring-2 ring-[var(--tree-can)]/40 motion-safe:animate-[day-fill_600ms_var(--ease-emphasis)_both]")}>
          <CloudRain className="size-3.5 text-[var(--tree-can)]" aria-hidden />
        </span>
      );
    case "missed":
      return (
        <span className={cn(ring, "bg-raised ring-1 ring-border-strong")}>
          <X className="size-3 text-subtle" aria-hidden />
        </span>
      );
    default:
      return <span className={cn(ring, "border-2 border-border-strong")} />;
  }
}
