"use client";

import { useSyncExternalStore } from "react";

/*
 * Downloads started from an open item (P51), shared by the item's download button and the bar at
 * the bottom of the screen. Module state like the playback store, so a download keeps going (and
 * can still be cancelled from the bar) when the student opens another item.
 *  - A slide or sheet downloads its PDF for real, with real progress; the run lasts at least
 *    MIN_MS so a small file doesn't just flash the bar.
 *  - A video is simulated (~6 s): in the demo its link is `#`. The real app saves videos for
 *    offline viewing inside the app rather than as a file.
 */

export type DownloadStatus = "running" | "done" | "cancelled" | "failed";
export type Download = { id: string; title: string; status: DownloadStatus; progress: number };

/** `toast`: the download the bar shows (kept while it slides away); `open`: the bar is up. */
type State = { items: Record<string, Download>; toast: string | null; open: boolean };

const MIN_MS = 1200;
const VIDEO_MS = 6000;
const TOAST_MS = 3000;

let state: State = { items: {}, toast: null, open: false };

// Lab `class` v28 (P121): finished downloads are remembered on this device, for the syllabus's
// "Downloaded" badge. On the web this can only mean "downloaded here"; the app knows what is offline.
const DONE_KEY = "10ms-downloaded";
let done: Set<string> | null = null;
function readDone(): Set<string> {
  if (!done) {
    try {
      done = new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]") as string[]);
    } catch {
      done = new Set();
    }
  }
  return done;
}
function remember(id: string) {
  const next = new Set(readDone()).add(id);
  done = next;
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...next]));
  } catch {
    // Private mode or a full store: remembered for this visit only.
  }
}
const listeners = new Set<() => void>();
const aborts = new Map<string, () => void>();
let toastTimer = 0;

function set(id: string, patch: Partial<Download>) {
  const prev = state.items[id];
  if (!prev) return;
  const next = { ...prev, ...patch };
  if (next.status === "done") remember(id);
  state = { items: { ...state.items, [id]: next }, toast: id, open: true };
  // Done, cancelled or failed: the bar says so for a moment, then slides away.
  window.clearTimeout(toastTimer);
  if (next.status !== "running") {
    toastTimer = window.setTimeout(() => {
      if (state.toast === id) {
        state = { ...state, open: false };
        emit();
      }
    }, TOAST_MS);
  }
  emit();
}

const emit = () => {
  for (const l of listeners) l();
};

/** Fill the progress to `to` over what's left of MIN_MS, then resolve. */
function settle(id: string, started: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const tick = () => {
      if (signal.aborted) return resolve();
      const t = Math.min(1, (performance.now() - started) / MIN_MS);
      set(id, { progress: Math.max(state.items[id]?.progress ?? 0, t) });
      if (t >= 1) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
}

async function fetchFile(id: string, url: string, name: string, signal: AbortSignal) {
  const started = performance.now();
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`download ${res.status}`);
  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    // Never ahead of the minimum run, so the bar fills evenly however fast the file arrives.
    if (total) set(id, { progress: Math.min(got / total, (performance.now() - started) / MIN_MS) });
  }
  await settle(id, started, signal);
  if (signal.aborted) return;
  const href = URL.createObjectURL(new Blob(chunks, { type: res.headers.get("content-type") ?? "application/pdf" }));
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function simulate(id: string, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const started = performance.now();
    const timer = window.setInterval(() => {
      if (signal.aborted) {
        window.clearInterval(timer);
        return resolve();
      }
      // Uneven steps, like a real network: a little faster at the start, slower near the end.
      const t = Math.min(1, (performance.now() - started) / VIDEO_MS);
      const eased = 1 - (1 - t) ** 1.6;
      set(id, { progress: Math.min(1, Math.max(state.items[id].progress, eased - Math.random() * 0.02)) });
      if (t >= 1) {
        window.clearInterval(timer);
        resolve();
      }
    }, 150);
  });
}

/** Start (or restart) a download. `url` is a file for slides and sheets; null for a video. */
export function startDownload({ id, title, url, fileName }: { id: string; title: string; url: string | null; fileName: string }) {
  if (state.items[id]?.status === "running") return;
  const ctrl = new AbortController();
  aborts.set(id, () => ctrl.abort());
  state = { ...state, items: { ...state.items, [id]: { id, title, status: "running", progress: 0 } } };
  set(id, {});
  const run = url ? fetchFile(id, url, fileName, ctrl.signal) : simulate(id, ctrl.signal);
  run.then(
    () => !ctrl.signal.aborted && set(id, { status: "done", progress: 1 }),
    () => !ctrl.signal.aborted && set(id, { status: "failed" }),
  );
}

/**
 * Lab `class` v35 (P128): delete a finished download. On the web this forgets it on this device (the
 * file in the student's Downloads folder is theirs); the app would remove its offline copy.
 */
export function forgetDownload(id: string) {
  const next = new Set(readDone());
  next.delete(id);
  done = next;
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...next]));
  } catch {
    // Private mode or a full store: forgotten for this visit only.
  }
  const items = { ...state.items };
  delete items[id];
  state = { ...state, items };
  emit();
}

export function cancelDownload(id: string) {
  aborts.get(id)?.();
  aborts.delete(id);
  if (state.items[id]?.status === "running") set(id, { status: "cancelled", progress: 0 });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const empty: State = { items: {}, toast: null, open: false };

export const useDownloads = () =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => empty,
  );

/** This item was downloaded on this device (lab `class` v28, P121). False while prerendered. */
export const useDownloaded = (id: string) =>
  useSyncExternalStore(
    subscribe,
    () => readDone().has(id),
    () => false,
  );
