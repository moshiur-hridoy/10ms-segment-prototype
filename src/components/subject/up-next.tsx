"use client";

import { ChevronRight, ListVideo, Play, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState, useSyncExternalStore, ViewTransition, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { IconButton } from "@/design-system/atoms/icon-button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SyllabusItemKind } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { useLab } from "@/lib/lab";
import { ClassDone, planNext, type Effort, type Reward } from "./class-done";
import { ItemIcon } from "./item-icon";
import { publishPlayback, usePlayback } from "./playback";

export type UpNextStep = {
  id: string;
  kind: SyllabusItemKind;
  kindLabel: string;
  title: string;
  meta: string;
  href: string;
  /** Already done: lab `class` skips it and says so. */
  done: boolean;
  score?: { got: number; total: number };
};

/** The open video's end-of-class facts (lab `class`, P52). */
export type UpNextFinish = {
  /** Share of the class seen before this visit (1 for a class marked done). */
  seenBefore: number;
  /** Today's watering of the streak tree, before this class. */
  streak: { current: number; todayDone: boolean; todayMinutes: number; goal: number } | null;
};

/** The open exam: its own actions (start, or see the result and retake) on the card. */
export type UpNextDoc = {
  kind: SyllabusItemKind;
  kindLabel: string;
  title: string;
  meta: string;
  actions: { label: string; href: string; primary: boolean }[];
  /** Reached through the card (countdown or its button): open the card on arrival. From the list it stays a capsule. */
  openOnArrival: boolean;
};

const noSubscribe = () => () => {};

/** A secondary action on the dark card. */
const onDark =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-on-fill/10 px-5 text-base font-semibold text-on-fill transition-colors press hover:bg-on-fill/15";

/** The card opens this long before the video ends. */
const LEAD_SEC = 30;
/** Lab `class` (P108): the share of a class that counts as done (the plan's 80%), seen or reached. */
const DONE_AT = 0.8;
/** After the end, the next item opens on its own after this long. */
const COUNTDOWN_SEC = 8;
/** How far the card must be dragged down by its handle to shrink back. */
const SWIPE_CLOSE_PX = 40;

/*
 * The phone's floating capsule (playlist + next class) and its "up next" card. In a video's last
 * 30 seconds the capsule grows, like the iPhone's Dynamic Island, into a card suggesting what to
 * study next (this class's slide, its exam, then the next class), with skip and play under the
 * thumb. When the video ends it counts down 8 seconds and opens the suggestion. Swiping the card
 * down shrinks it until the video ends; বাতিল at the end stops the countdown. The playlist stays
 * one tap away on the card itself, and the countdown holds while it is open. Fullscreen video
 * gets the card inside the player. A slide's reader reaching its last page brings the card up too
 * (no countdown). An exam reached through the card opens with the card up, holding its own action
 * (start the exam) and a row to the next step. The card is a dark island; the capsule stays white.
 */
export function UpNextIsland({
  steps,
  doc,
  finish = null,
  labels: l,
  lang,
  hidden,
  sheetOpen,
  playlist,
  children,
}: {
  steps: UpNextStep[];
  doc: UpNextDoc | null;
  finish?: UpNextFinish | null;
  labels: Dictionary["syllabus"]["upNext"];
  lang: Locale;
  /** The capsule steps aside (the list itself is on screen); the card ignores this. */
  hidden: boolean;
  sheetOpen: boolean;
  /** The playlist chip on the card: the capsule's own button stays reachable. None in lab `class` v9 (P59), where the list left the page. */
  playlist?: { label: string; position: string | null; onOpen: () => void };
  /** The capsule's contents. Without them the capsule shows only for the lab's last-30-seconds hint. */
  children?: ReactNode;
}) {
  const fmt = createFormatter(lang, 0);
  const router = useRouter();
  const pb = usePlayback();
  const [skip, setSkip] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [ticks, setTicks] = useState(0);
  const [docOpen, setDocOpen] = useState(Boolean(doc?.openOnArrival));
  // A slide or exam reached through the card arrives with it open (no morph on arrival).
  const [shown, setShown] = useState(Boolean(doc?.openOnArrival));
  const [drag, setDrag] = useState<{ start: number; dy: number } | null>(null);
  const went = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Lab `class` (P52): the end of a video says what was done, the reward, and the next task with a reason.
  const lab = useLab("class") !== null && !doc && finish !== null;
  const plan = planNext(steps);
  const step = lab ? plan.main : steps[skip];
  const left = Math.max(0, pb.duration - pb.time);
  const ending = pb.phase === "ended";
  const near = (pb.phase === "playing" || pb.phase === "paused") && pb.duration > 0 && left <= LEAD_SEC;
  // Lab `class` (P108): the class counts as done at 80%, reached by watching or by dragging there, and the card comes up.
  const past = (pb.phase === "playing" || pb.phase === "paused") && pb.duration > 0 && pb.time >= pb.duration * DONE_AT;

  // The end brings a swiped-away card back; replaying from the end restarts the countdown later.
  if (ending && dismissed) setDismissed(false);
  if (!ending && ticks !== 0) setTicks(0);

  // A slide's last page plays the part of a video's last 30 seconds (no countdown follows it).
  const atEnd = near || pb.docAtEnd;
  // In the lab the card comes at 80% (swiped down, it waits for the end), and comes even with nothing left to do.
  const want = doc
    ? docOpen
    : lab
      ? !cancelled && (ending || (past && !dismissed))
      : Boolean(step) && !cancelled && (ending || (atEnd && !dismissed));
  // Holds while the playlist is open, so browsing the list after the end isn't cut short. In the lab only a next class counts down.
  const counting = shown && ending && !cancelled && Boolean(step) && !sheetOpen && (!lab || step?.kind === "video");
  const remaining = COUNTDOWN_SEC - ticks;

  // Grow and shrink inside a transition, so <ViewTransition> morphs the box between the two shapes.
  useEffect(() => {
    if (want === shown) return;
    startTransition(() => setShown(want));
    if (want) navigator.vibrate?.(10);
  }, [want, shown]);

  // The countdown holds while the page is hidden.
  useEffect(() => {
    if (!counting) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setTicks((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [counting]);

  useEffect(() => {
    if (!counting || remaining > 0 || !step || went.current) return;
    went.current = true;
    router.replace(step.href);
  }, [counting, remaining, step, router]);

  const collapse = () => (doc ? setDocOpen(false) : ending ? setCancelled(true) : setDismissed(true));

  const onDragStart = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ start: e.clientY, dy: 0 });
  };
  const onDragMove = (e: PointerEvent) => drag && setDrag({ ...drag, dy: Math.max(0, e.clientY - drag.start) });
  const onDragEnd = () => {
    if (drag && drag.dy > SWIPE_CLOSE_PX) collapse();
    setDrag(null);
  };

  // Watched 80% or more (P108), counting what was seen before this visit; jumps don't count.
  let effort: Effort = { full: false, leftPct: 100 };
  let reward: Reward | null = null;
  if (lab && finish && pb.duration > 0) {
    const covered = pb.demoFull ? 1 : Math.min(1, finish.seenBefore + pb.played / pb.duration);
    effort = covered >= DONE_AT ? { full: true, seconds: pb.duration } : { full: false, leftPct: Math.round((1 - covered) * 100) };
    const s = finish.streak;
    if (s) {
      const total = s.todayMinutes + (pb.demoFull ? pb.duration : pb.played) / 60;
      const state = s.todayDone ? "already" : total >= s.goal ? "watered" : "short";
      reward = { state, streak: state === "watered" ? s.current + 1 : s.current, minutesToday: total, minutesLeft: Math.ceil(s.goal - total) };
    }
  }
  const classDone = lab && (
    <ClassDone
      plan={plan}
      effort={effort}
      reward={reward}
      countdown={step?.kind === "video" ? { remaining, fraction: ticks / COUNTDOWN_SEC, cancelled } : null}
      labels={l.done}
      fmt={fmt}
      onCancel={() => setCancelled(true)}
    />
  );

  const video = step?.kind === "video";
  const inPlayer = Boolean(pb.fullStage);
  const card = shown && (doc || step || lab) && (
    <div className="grid grid-cols-1 gap-3 px-3 pb-3">
      <div className="relative -mb-2 flex h-11 items-center justify-end">
        {/* Handle: tap or drag down to shrink back to the capsule. */}
        <button
          type="button"
          onClick={collapse}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          aria-label={l.collapse}
          className="absolute top-0 left-1/2 grid h-11 w-24 -translate-x-1/2 touch-none place-items-center"
        >
          <span className="h-1 w-9 rounded-full bg-on-fill/30" />
        </button>
        {/* The playlist without shrinking the card (not in fullscreen, where only the player shows). */}
        {playlist && !inPlayer && (
          <button
            type="button"
            onClick={playlist.onOpen}
            aria-haspopup="dialog"
            className="-mr-1 flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold press hover:bg-on-fill/10"
          >
            <ListVideo className="size-4 text-on-fill/80" aria-hidden />
            {playlist.label}
            {playlist.position && <span className="font-medium text-on-fill/60 tabular-nums">{playlist.position}</span>}
          </button>
        )}
      </div>
      {doc ? (
        <>
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center">
              <ItemIcon kind={doc.kind} size="sm" />
            </span>
            <div className="grid min-w-0 flex-1">
              <span className="text-xs font-semibold text-on-fill/70">{[doc.kindLabel, doc.meta].filter(Boolean).join(" · ")}</span>
              <span className="line-clamp-2 text-sm font-semibold">{doc.title}</span>
            </div>
          </div>
          <div className={cn("grid gap-2", doc.actions.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {doc.actions.map((a) =>
              a.primary ? (
                <Button key={a.label} href={a.href}>
                  {a.label}
                </Button>
              ) : (
                <a key={a.label} href={a.href} className={onDark}>
                  {a.label}
                </a>
              ),
            )}
          </div>
          {step && (
            // The next step, one tap away; a slide or exam has no end to count down from.
            <Link
              href={step.href}
              replace
              className="-mx-3 -mb-3 flex min-h-12 items-center gap-2 rounded-b-xl border-t border-on-fill/10 px-4 text-sm transition-colors hover:bg-on-fill/5"
            >
              <span className="shrink-0 text-on-fill/70">{l.label}:</span>
              <span className="min-w-0 flex-1 truncate font-semibold">
                {step.kind === "video" ? step.title : [step.kindLabel, step.meta].filter(Boolean).join(" · ")}
              </span>
              <ChevronRight className="size-4 shrink-0 text-on-fill/70" aria-hidden />
            </Link>
          )}
        </>
      ) : lab ? (
        classDone
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Ring
              fraction={near && !ending ? left / LEAD_SEC : undefined}
              label={near && !ending ? fill(l.timeLeft, { n: fmt.number(Math.ceil(left)) }) : undefined}
            >
              <ItemIcon kind={step!.kind} size="sm" />
            </Ring>
            <div className="grid min-w-0 flex-1">
              <span className="text-xs font-semibold text-on-fill/70">
                {ending ? fill(l.ended, { n: fmt.number(Math.max(0, remaining)) }) : `${l.label} · ${step!.kindLabel}`}
              </span>
              <span className="line-clamp-2 text-sm font-semibold">{step!.title}</span>
            </div>
          </div>
          {ending && (
            <span className="h-1 overflow-hidden rounded-full bg-on-fill/15" aria-hidden>
              <span
                className="block h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                style={{ width: `${(ticks / COUNTDOWN_SEC) * 100}%` }}
              />
            </span>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={onDark} onClick={ending ? () => setCancelled(true) : () => setSkip((n) => n + 1)}>
              {ending ? l.cancel : l.skip}
            </button>
            <Button href={step!.href} replace>
              {video ? (ending ? l.playNow : l.play) : ending ? l.openNow : l.open}
              {video && <Play className="size-4 fill-current" aria-hidden />}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // In fullscreen only the player is visible, so the card renders inside it (phones only, like the capsule).
  if (pb.fullStage && card) {
    return createPortal(
      <div
        data-mode="dark"
        className="absolute right-4 bottom-20 z-20 w-80 max-w-[calc(100%-2rem)] rounded-xl bg-player pt-1 text-on-fill shadow-pop ring-1 ring-on-fill/10 lg:hidden"
      >
        {card}
      </div>,
      pb.fullStage,
    );
  }

  // Desktop (lab): the same card inside the player, over its end screen, with a way to watch again.
  // Over the video, so only once it has ended (P108): at 80% it would hide the rest of the class.
  const stageCard =
    lab &&
    shown &&
    ending &&
    pb.stage &&
    !pb.fullStage &&
    createPortal(
      <div className="absolute inset-0 z-10 hidden place-items-center bg-player/75 p-6 backdrop-blur-md lg:grid">
        {/* Lab `class` v12 (P63): over the dark video, a light card (phones keep the dark island). The card's
            white-on-dark ink becomes the page's text colour, so the same content reads on white. */}
        <div
          role="region"
          aria-label={l.region}
          className="grid w-full max-w-sm gap-3 rounded-xl bg-surface p-4 text-text shadow-pop [--color-on-fill:var(--color-text)]"
        >
          <button
            type="button"
            onClick={() => pb.seekTo?.(0)}
            className="-mt-1 -mr-1 flex h-9 items-center gap-1.5 justify-self-end rounded-full px-3 text-xs font-semibold transition-colors hover:bg-on-fill/10"
          >
            <RotateCcw className="size-4" aria-hidden />
            {l.done.replay}
          </button>
          {classDone}
        </div>
      </div>,
      pb.stage,
    );
  // Lab `class` v23 (P114): on wide screens the card also comes at 80%, at the top of the right column,
  // so it doesn't cover the rest of the class; at the end it moves over the video as before. × puts it
  // away until the end (the phone's card is swiped down for the same).
  const railCard =
    lab &&
    shown &&
    !ending &&
    pb.rail &&
    createPortal(
      <Card
        as="div"
        role="region"
        aria-label={l.region}
        className="grid gap-3 p-4 text-text [--color-on-fill:var(--color-text)] motion-safe:animate-rise"
      >
        <IconButton label={l.putAway} variant="subtle" size="sm" onClick={() => setDismissed(true)} className="-mt-2 -mr-2 -mb-3 justify-self-end">
          <X className="size-4" aria-hidden />
        </IconButton>
        {classDone}
      </Card>,
      pb.rail,
    );

  // The lab's last 30 seconds: a quiet hint in the capsule instead of the card.
  const hint = lab && near && !ending && (
    <span className={cn("pl-4 text-xs font-semibold text-brand-text tabular-nums", !children && "pr-4")}>
      {fill(l.endsIn, { n: fmt.number(Math.ceil(left)) })}
    </span>
  );

  const away = card ? sheetOpen : hidden;

  // How far up from the screen's bottom this bar reaches while it shows (`--up-next-h`), so the download bar can sit above it.
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const showing = !away && r.height > 0 && getComputedStyle(el).display !== "none";
      root.style.setProperty("--up-next-h", showing ? `${Math.max(0, Math.round(window.innerHeight - r.top))}px` : "0px");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      root.style.setProperty("--up-next-h", "0px");
    };
  }, [away, card, hint, children]);
  return (
    <>
      <p className="sr-only" aria-live="polite">
        {card && !doc && step ? fill(l.announce, { title: step.title }) : ""}
      </p>
      <ViewTransition name="up-next" update="up-next" default="none">
        <div
          ref={barRef}
          // The bottom nav steps aside while an item is open: this bar takes the bottom edge.
          data-no-bottom-nav
          inert={away}
          aria-hidden={away || undefined}
          role={card ? "region" : undefined}
          aria-label={card ? l.region : undefined}
          style={drag ? { translate: `0 ${drag.dy}px` } : undefined}
          // The dark card takes the dark mode's colours (P106), so greens and ambers keep their contrast on it.
          data-mode={card ? "dark" : undefined}
          className={cn(
            "fixed z-30 shadow-pop ring-1 transition-[opacity,translate] duration-(--motion-base) ease-standard lg:hidden",
            // The card is a dark island in both modes (a faint light edge keeps it off a dark page); the capsule stays white.
            // P112: the card nearly fills the phone's width, 4 px from its edges (above the home bar where there is one).
            card
              ? "inset-x-1 bottom-[max(0.25rem,env(safe-area-inset-bottom))] mx-auto max-w-md rounded-xl bg-player pt-1 text-on-fill ring-on-fill/10"
              : "right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] flex h-12 items-center rounded-full bg-surface text-text ring-border",
            away && "pointer-events-none translate-y-3 opacity-0",
            !card && !hint && !children && "hidden",
          )}
        >
          {card || (
            <>
              {hint}
              {children}
            </>
          )}
        </div>
      </ViewTransition>
      {stageCard}
      {railCard}
    </>
  );
}

/** The item's icon in a ring that empties as the video's last 30 seconds run out (no ring after a slide's last page). */
function Ring({ fraction, label, children }: { fraction?: number; label?: string; children: ReactNode }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <span role={label ? "img" : undefined} aria-label={label} className="relative grid size-11 shrink-0 place-items-center">
      {fraction !== undefined && (
        <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="22" cy="22" r={r} fill="none" strokeWidth="2.5" className="stroke-on-fill/20" />
          <circle
            cx="22"
            cy="22"
            r={r}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - Math.min(1, Math.max(0, fraction ?? 0)))}
            className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear"
          />
        </svg>
      )}
      {children}
    </span>
  );
}

/**
 * Lab `class` v23 (P114): the top of the right column, where the end-of-class card comes at 80% on wide
 * screens. Empty (and gone) the rest of the time; hidden on phones, which have their own card.
 */
export function ClassDoneSlot() {
  return (
    <div
      ref={(el) => {
        publishPlayback({ rail: el });
        return () => publishPlayback({ rail: null });
      }}
      className="empty:hidden max-lg:hidden"
    />
  );
}

/**
 * Demo only: jump to the last 35 seconds of the open class, so the card can be seen without waiting.
 * Phones only, except in lab `class`, where it also stands for having watched the whole class.
 */
export function DemoSeek({ labels, className }: { labels: Dictionary["syllabus"]["upNext"]; className?: string }) {
  const pb = usePlayback();
  const lab = useLab("class") !== null;
  // Lab `class` v13 (P64): a prototype tool, so under the video only with `?demo=1`.
  const demo = useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(location.search).get("demo") === "1",
    () => false,
  );
  if (lab && !demo) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (lab) publishPlayback({ demoFull: true });
        pb.seekFromEnd?.(35);
      }}
      disabled={!pb.seekFromEnd}
      className={cn("text-xs font-semibold text-brand-text underline-offset-2 hover:underline disabled:opacity-50", !lab && "lg:hidden", className)}
    >
      {lab ? labels.demoWatched : labels.demoSeek}
    </button>
  );
}
