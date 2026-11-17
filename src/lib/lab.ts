"use client";

import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from "react";
import { versionOf } from "./lab-version";

const noSubscribe = () => () => {};

export { readLab } from "./lab-version";

/**
 * The page's `?lab=` as the server read it, so the server draws the lab version too and nothing jumps
 * when the browser takes over (lab `class`: the video moved from the middle to the left on load).
 * Pages with labs wrap their content in it; without it the server draws the page without labs.
 */
const LabContext = createContext<string | null>(null);

export function LabProvider({ lab, children }: { lab: string | string[] | undefined; children: ReactNode }) {
  return createElement(LabContext, { value: typeof lab === "string" ? lab : null }, children);
}

/**
 * The version of lab `id` the URL asks for: `?lab=<id>` is the latest (data/labs.ts), `?lab=<id>@<v>`
 * a named one. Null when the URL doesn't ask for this lab. While prerendered, what `LabProvider` says.
 */
export function useLab(id: string): number | null {
  const server = useContext(LabContext);
  return useSyncExternalStore(
    noSubscribe,
    () => versionOf(id, location.search),
    () => versionOf(id, server ? `?lab=${encodeURIComponent(server)}` : ""),
  );
}

/** Lab `id` is open at version `v` or later (lab `class` v24 builds on v23, which stays live at `@23`). */
export const useLabAt = (id: string, v: number) => (useLab(id) ?? 0) >= v;
