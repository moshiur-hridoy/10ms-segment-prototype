"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fromLanding, LANDING_KEY, streamOf, type ClassId } from "@/features/onboarding/steps";

/*
 * What the segment page knows about its visitor (CT21–CT22), all in the browser, since a guest has no
 * profile yet: the onboarding answers (`10ms-onboarding`, OB1), else the landing hero's answer
 * (OB4), and a choice made on this page's own filter, which wins as the newest.
 */

const ONBOARDING_KEY = "10ms-onboarding";
const PICK_KEY = "10ms-segment-pick";

export type Known = { cls: ClassId; group: string | null; hard: string[] };

/**
 * `?as=` (CT26): `new` forgets the filter's answer once on arrival; `onboarded` uses the onboarding answers saved
 * in this browser (CT29), or a sample student who answered every question when there are none.
 */
export type Preset = "new" | "onboarded" | null;
const SAMPLE: Known = { cls: "11", group: "science", hard: ["biology"] };

type Snapshot = { pick: Known | null; onboarding: Known | null };

let cache: Snapshot | null = null;
const listeners = new Set<() => void>();

function parse<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

function fromOnboarding(): Known | null {
  const saved = parse<{ answers?: { cls: ClassId | null; group: string | null; hard: string[] | null } }>(ONBOARDING_KEY);
  if (saved?.answers?.cls) return { cls: saved.answers.cls, group: saved.answers.group, hard: saved.answers.hard ?? [] };
  const landing = fromLanding(localStorage.getItem(LANDING_KEY));
  return landing?.cls ? { cls: landing.cls, group: landing.group, hard: [] } : null;
}

function read(): Snapshot {
  if (cache) return cache;
  cache = { pick: parse<Known>(PICK_KEY), onboarding: fromOnboarding() };
  return cache;
}

function save(patch: Partial<Snapshot>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(PICK_KEY, JSON.stringify(cache.pick));
  } catch {
    // Private mode or a full store: kept for this visit only.
  }
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

let resetDone = false;

/** Null until localStorage is read (and while prerendered), so nothing flashes the wrong state. */
export function useVisitor(preset: Preset) {
  const snap = useSyncExternalStore(subscribe, read, () => null);

  useEffect(() => {
    // `?as=new` and `?as=onboarded`: an earlier filter answer is forgotten on arrival, so the filter can be shown
    // again and fresh onboarding answers aren't hidden behind an old one.
    if (preset && !resetDone) {
      resetDone = true;
      save({ pick: null });
    }
  }, [preset]);

  if (!snap) return null;
  const fresh = preset !== null && !resetDone;
  const pick = fresh ? null : snap.pick;
  const known = pick ?? (preset === "onboarded" ? (snap.onboarding ?? SAMPLE) : preset === "new" ? null : snap.onboarding);
  return {
    known,
    /** Answered on this page's filter rather than in onboarding. */
    picked: pick !== null,
    pick: (k: Known) => save({ pick: k }),
  };
}

/** The segment page a known visitor belongs on, or null for a class this app has no page for yet. */
export function pageFor(k: Known): { batch: string; stream: string | null } | null {
  const batch = k.cls === "11" ? "hsc-28" : k.cls === "12" ? "hsc-27" : null;
  return batch ? { batch, stream: streamOf(k.group) } : null;
}
