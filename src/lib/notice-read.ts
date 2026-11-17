"use client";

import { useSyncExternalStore } from "react";

/*
 * Which notices the student has read in this browser. The server data carries a `read` flag, but
 * there is no endpoint to change it yet, so reads are kept in localStorage and laid over the
 * server's. Every place that shows a notice or a count (dashboard card, header inbox, notices
 * page) reads this one store, so they change together. When the backend has a "mark read" call,
 * only `markRead` needs to learn to send it.
 */
const KEY = "10ms-notices-read";
const NONE: ReadonlySet<string> = new Set();

let current: ReadonlySet<string> | null = null;
const listeners = new Set<() => void>();

function load(): ReadonlySet<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return NONE;
  }
}

const snapshot = () => (current ??= load());

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab marked something read.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = load();
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function markRead(ids: readonly string[]) {
  const next = new Set(snapshot());
  const before = next.size;
  for (const id of ids) next.add(id);
  if (next.size === before) return;
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify([...next]));
  } catch {}
  for (const l of listeners) l();
}

/** The read ids in this browser. Empty on the server and during hydration, so server and client markup match. */
export const useReadIds = () => useSyncExternalStore(subscribe, snapshot, () => NONE);

/** How many of the server's unread notices are still unread here. */
export function useUnreadCount(unreadIds: readonly string[]) {
  const read = useReadIds();
  return unreadIds.reduce((n, id) => n + (read.has(id) ? 0 : 1), 0);
}
