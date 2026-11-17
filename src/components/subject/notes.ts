"use client";

import { useSyncExternalStore } from "react";

/*
 * Lab `class` v15 (P67): a student's marks and notes on a class video, by the video's item id. A mark
 * is a moment without words (one tap in the player); a note has text. Kept in this browser
 * (localStorage) until the backend has a notes API (design-audit §9). The player, the note composer and
 * the class card are sibling client components, so they share this small store.
 */

export type ClassNote = {
  id: string;
  /** Seconds into the video. */
  sec: number;
  /** Null for a mark. */
  text: string | null;
  /** When it was made (ms). */
  at: number;
};

const EMPTY: ClassNote[] = [];
const key = (item: string) => `class-notes:${item}`;
const cache = new Map<string, ClassNote[]>();
const listeners = new Set<() => void>();

function read(item: string): ClassNote[] {
  let list = cache.get(item);
  if (!list) {
    try {
      list = JSON.parse(localStorage.getItem(key(item)) ?? "[]") as ClassNote[];
    } catch {
      list = EMPTY;
    }
    cache.set(item, list);
  }
  return list;
}

function write(item: string, list: ClassNote[]) {
  cache.set(item, list);
  try {
    localStorage.setItem(key(item), JSON.stringify(list));
  } catch {
    // Private mode or a full store: the notes stay for this visit only.
  }
  for (const l of listeners) l();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

/** The marks and notes on this video, in time order. */
export const useNotes = (item: string | null) =>
  useSyncExternalStore(
    subscribe,
    () => (item ? read(item) : EMPTY),
    () => EMPTY,
  );

export function addNote(item: string, sec: number, text: string | null) {
  const note: ClassNote = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    sec: Math.max(0, Math.round(sec)),
    text,
    at: Date.now(),
  };
  write(
    item,
    [...read(item), note].sort((a, b) => a.sec - b.sec || a.at - b.at),
  );
}

export function removeNote(item: string, id: string) {
  write(
    item,
    read(item).filter((n) => n.id !== id),
  );
}

/** The `N` key in the player asks the note composer (under the title) to open. */
const OPEN = "class-note:open";
export const requestNote = () => window.dispatchEvent(new Event(OPEN));
export function onNoteRequest(fn: () => void) {
  window.addEventListener(OPEN, fn);
  return () => window.removeEventListener(OPEN, fn);
}
