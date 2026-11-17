import { latest, LABS, MAIN, PAGES, type Lab, type PageSeries } from "@/data/labs";

/*
 * Reading `?lab=` without React, so server components can ask for a lab's version too (lab `class`
 * v24 changes what the server writes in the syllabus rows). `lib/lab.ts` builds the hooks on these.
 */

/**
 * `?lab=lx_v12`, `?lab=lx@12` or `?lab=lx` → { id, v }; v is null when no version is named (the latest).
 * A merged lab's earlier id still opens it (O7); `lx` (O13) maps `class@40` to its v40 and `concept@5` to
 * its v57, and plain `class` to v53, the last version that lab had.
 */
export function readLab(search: string): { id: string; v: number | null } | null {
  // Prototype: no `?lab=` means the working versions (the segment page v7, LX at its main version).
  const raw = new URLSearchParams(search).get("lab") ?? "on";
  if (!raw) return null;
  const named = raw.match(/^(.+?)(?:_v|@)(\d+)$/);
  const name = named ? named[1] : raw;
  const owner = LABS.find((l) => l.aliases?.includes(name));
  if (!owner) return { id: name, v: named ? Number(named[2]) || null : null };
  const layer = owner.layers?.find((l) => l.id === name);
  const v = named ? Number(named[2]) + (layer?.offset ?? 0) : (layer?.to ?? null);
  return { id: owner.id, v };
}

/** What lab `lab` at version `v` means for the id the code reads: itself, or one of its layers (O13). */
function layerVersion(lab: Lab, v: number, id: string): number | null {
  if (lab.id === id) return v;
  const layer = lab.layers?.find((l) => l.id === id);
  if (!layer || v < layer.from) return null;
  return Math.min(v, layer.to ?? v) - layer.offset;
}

/**
 * The version of lab `id` a query string asks for: the latest without a version; null when it doesn't
 * ask for this lab. Without `?lab=`, or with another lab's, the page shows the main version (O13).
 */
export function versionOf(id: string, search: string): number | null {
  const asked = readLab(search);
  // CT213: a page with its own series. Any `?lab=` is design mode: this page's lock when named, else its working one.
  const series = PAGES.find((p) => p.lab === id);
  if (series && asked) return pageVersion(series, asked);
  const lab = asked && LABS.find((l) => l.id === asked.id);
  if (asked && lab && (lab.id === id || lab.layers?.some((l) => l.id === id))) return layerVersion(lab, asked.v ?? latest(lab).v, id);
  if (asked && !lab && asked.id === id) return asked.v ?? 1;
  const main = LABS.find((l) => l.id === MAIN.lab);
  return main ? layerVersion(main, MAIN.v, id) : null;
}

/** For a server component: the version of lab `id` in a page's `searchParams.lab`. */
export const labVersion = (id: string, lab: string | string[] | undefined) =>
  versionOf(id, typeof lab === "string" ? `?lab=${encodeURIComponent(lab)}` : "");

/**
 * CT213: the gates' number a page draws at. Its own id with a number: that lock. The page's old lab id (`segment-home`,
 * `segment-home@93`): as before, its latest being the working one. Anything else (`on`, another page's id): working.
 */
export function pageVersion(series: PageSeries, asked: { id: string; v: number | null }): number {
  if (asked.id === series.id && asked.v) return series.locks.find((l) => l.n === asked.v)?.at ?? series.working;
  if (asked.id === series.lab && asked.v) return asked.v;
  return series.working;
}

/** CT213: the page's series and which of its versions a query string shows (a lock's n, or the working one's). */
export function pageShown(pageId: string, search: string): { series: PageSeries; n: number; working: boolean } | null {
  const series = PAGES.find((p) => p.id === pageId);
  const asked = readLab(search);
  if (!series || !asked) return null;
  const lock = asked.id === series.id && asked.v ? series.locks.find((l) => l.n === asked.v) : undefined;
  return lock ? { series, n: lock.n, working: false } : { series, n: series.locks.length + 1, working: true };
}
