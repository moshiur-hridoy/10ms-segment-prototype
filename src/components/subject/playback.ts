"use client";

import { useSyncExternalStore } from "react";

/*
 * What the video player (or a slide's reader) is doing, for the parts of the page that react to
 * it (the phone's "up next" card). The player and the playlist are sibling client components under a server
 * page, so they share this tiny store instead of a context provider.
 */

export type PlaybackPhase = "idle" | "loading" | "playing" | "paused" | "ended";

export type Playback = {
  phase: PlaybackPhase;
  /** Seconds. */
  time: number;
  duration: number;
  /** The player's stage while it is fullscreen, so overlays can render inside it. */
  fullStage: HTMLElement | null;
  /** The player's stage, always (lab `class`: the desktop's end-of-class card renders inside it). */
  stage: HTMLElement | null;
  /** The top of the right column on wide screens (lab `class` v23: the end-of-class card at 80%, P114). */
  rail: HTMLElement | null;
  /** Seconds actually played this visit (normal playback only; seeks don't count). */
  played: number;
  /** Demo: the "go to the end" link stands for having watched the whole class. */
  demoFull: boolean;
  /** Demo only: jump to `secondsLeft` before the end, starting the video if needed. */
  seekFromEnd: ((secondsLeft: number) => void) | null;
  /** Jump to `sec`, starting the video if needed (a part chosen under the video, P49). */
  seekTo: ((sec: number) => void) | null;
  /** A slide's reader has reached its last page (the slide's version of "the video is ending"). */
  docAtEnd: boolean;
  /** Pause and play again (lab `class` v15: the video holds while a note is written, P67). */
  pause: (() => void) | null;
  play: (() => void) | null;
};

const idle: Playback = {
  phase: "idle",
  time: 0,
  duration: 0,
  fullStage: null,
  stage: null,
  rail: null,
  played: 0,
  demoFull: false,
  seekFromEnd: null,
  seekTo: null,
  docAtEnd: false,
  pause: null,
  play: null,
};
let state = idle;
const listeners = new Set<() => void>();

export function publishPlayback(patch: Partial<Playback>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

/** The player unmounted (another item opened): nothing is playing. The right column's slot stays. */
export const resetPlayback = () => publishPlayback({ ...idle, rail: state.rail });

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

export const usePlayback = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => idle,
  );
