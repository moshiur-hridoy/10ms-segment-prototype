"use client";

import { ChartColumn, Play } from "lucide-react";
import { useState, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import type { Formatter } from "@/lib/format";

/*
 * Pieces of the YouTube-style player (lab `class`, P48): the draggable seek bar, cut into the
 * video's parts when it has them, and the ripple a double tap leaves on either side.
 */

/** A part of the video (a chapter, YouTube calls it): where it starts and what it covers. */
export type VideoPart = { startSec: number; title: string };

type Span = { start: number; end: number; title: string };

/** The parts as [start, end) spans of the video; the first always starts at 0. One span when there are none. */
export function spans(parts: VideoPart[] | undefined, duration: number): Span[] {
  const inside = (parts ?? []).filter((p) => p.startSec < duration).sort((a, b) => a.startSec - b.startSec);
  if (!inside.length) return [{ start: 0, end: duration, title: "" }];
  return inside.map((p, i) => ({
    start: i === 0 ? 0 : p.startSec,
    end: inside[i + 1]?.startSec ?? duration,
    title: p.title,
  }));
}

/** The part playing at `sec`. */
export function partAt(parts: VideoPart[] | undefined, sec: number) {
  let found: VideoPart | undefined;
  for (const p of parts ?? []) if (p.startSec <= sec && (!found || p.startSec >= found.startSec)) found = p;
  return found ?? parts?.[0];
}

const share = (sec: number, s: Span) => Math.max(0, Math.min(1, (sec - s.start) / (s.end - s.start || 1))) * 100;

/**
 * The seek bar: press anywhere and drag; the video jumps when the finger lifts. A bubble above the
 * finger (or the mouse) shows the time and the part. Taller on phones so a thumb can catch it.
 */
export function Scrubber({
  time,
  duration,
  loaded,
  parts,
  playing,
  label,
  fmt,
  onSeek,
  onScrub,
  marks,
  pin,
}: {
  time: number;
  duration: number;
  /** Fraction of the video already loaded. */
  loaded: number;
  parts?: VideoPart[];
  playing: boolean;
  label: string;
  fmt: Formatter;
  onSeek: (sec: number) => void;
  onScrub: (dragging: boolean) => void;
  /** Lab `class` v15 (P67): the student's marks and notes, as small dots above the bar. */
  marks?: number[];
  /** Lab `class` v49 (P143): where the teacher's poll comes up, as a small pointer standing on the bar. */
  pin?: { sec: number; label: string };
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const at = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
  };
  const now = drag ?? time;
  const peek = drag ?? hover;
  const pct = (sec: number) => (duration ? (sec / duration) * 100 : 0);
  const list = spans(parts, duration);
  const peekPart = peek !== null && parts?.length ? partAt(parts, peek) : undefined;
  // While playing, the fill glides between the clock's quarter-second ticks instead of stepping.
  const glide = playing && drag === null;

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(now)}
      aria-valuetext={[peekPart?.title, `${fmt.duration(now)} / ${fmt.duration(duration)}`].filter(Boolean).join(", ")}
      onPointerDown={(e) => {
        if (!duration) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(at(e));
        onScrub(true);
      }}
      onPointerMove={(e) => {
        if (drag !== null) setDrag(at(e));
        else if (e.pointerType === "mouse") setHover(at(e));
      }}
      onPointerUp={(e) => {
        if (drag === null) return;
        onSeek(at(e));
        setDrag(null);
        onScrub(false);
      }}
      onPointerCancel={() => {
        setDrag(null);
        onScrub(false);
      }}
      onPointerLeave={() => setHover(null)}
      className="relative flex h-6 cursor-pointer touch-none items-center sm:h-4 compact:h-11"
    >
      <div className="flex w-full items-center gap-0.5">
        {list.map((s, i) => {
          const active = peek !== null && peek >= s.start && (peek < s.end || i === list.length - 1);
          return (
            <div
              key={s.start}
              className={cn("relative h-1 overflow-hidden rounded-full bg-on-fill/25 transition-[height] compact:h-1.5", active && "h-2 compact:h-2")}
              style={{ flex: `${s.end - s.start} 1 0` }}
            >
              <div className="absolute inset-y-0 left-0 bg-on-fill/35" style={{ width: `${share(loaded * duration, s)}%` }} />
              <div
                // Red, as in the current app (P75).
                className={cn("absolute inset-y-0 left-0 bg-live", glide && "transition-[width] duration-250 ease-linear")}
                style={{ width: `${share(now, s)}%` }}
              />
            </div>
          );
        })}
      </div>
      {duration > 0 &&
        marks?.map((m, i) => (
          <span
            key={`${m}-${i}`}
            aria-hidden
            // On the bar itself (P86), amber with a dark ring so it reads on the red and the grey; the knob passes over it.
            className="pointer-events-none absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning ring-2 ring-player/70 compact:size-2"
            style={{ left: `${pct(m)}%` }}
          />
        ))}
      {duration > 0 && pin && pin.sec < duration && (
        <span
          aria-hidden
          title={pin.label}
          // A white chip with the poll's chart icon on a short stem, its tip on the bar; the knob passes over it.
          className="pointer-events-none absolute bottom-1/2 grid -translate-x-1/2 justify-items-center"
          style={{ left: `${pct(pin.sec)}%` }}
        >
          <span className="grid size-5 place-items-center rounded-full bg-on-fill text-player shadow-pop">
            <ChartColumn className="size-3" strokeWidth={2.5} />
          </span>
          <span className="h-1.5 w-0.5 bg-on-fill" />
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          // A finger or a narrow screen (P73, P74): a bigger knob, as in the current app, easy to grab.
          "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-live transition-[scale] compact:size-[1.125rem] compact:ring-[3px] compact:ring-on-fill",
          drag !== null && "scale-150 compact:scale-125",
          glide && "transition-[left,scale] duration-250 ease-linear",
        )}
        style={{ left: `${pct(now)}%` }}
      />
      {peek !== null && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-full mb-2 grid -translate-x-1/2 justify-items-center rounded-md bg-player/90 px-2.5 py-1 whitespace-nowrap"
          style={{ left: `clamp(3.5rem, ${pct(peek)}%, calc(100% - 3.5rem))` }}
        >
          {peekPart && <span className="max-w-44 truncate text-xs text-on-fill/80">{peekPart.title}</span>}
          <span className="text-sm font-semibold tabular-nums">{fmt.duration(peek)}</span>
        </span>
      )}
    </div>
  );
}

/** What a double tap leaves on its side: a soft half-circle, running arrows and the seconds skipped so far. */
export function SkipRipple({ side, label }: { side: -1 | 1; label: string }) {
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute inset-y-0 grid w-2/5 place-items-center bg-player/45",
        side < 0 ? "left-0 rounded-r-full" : "right-0 rounded-l-full",
      )}
    >
      <span className="grid justify-items-center gap-1.5 text-sm font-semibold">
        <span className={cn("flex", side < 0 && "flex-row-reverse")} aria-hidden>
          {[0, 1, 2].map((i) => (
            <Play
              key={i}
              className={cn("size-4 animate-skip-arrow fill-current", side < 0 && "rotate-180")}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </span>
        {label}
      </span>
    </div>
  );
}
