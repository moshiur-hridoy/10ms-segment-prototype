import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { z } from "zod";
import { FREE_SESSION, SESSION_COOKIE } from "@/lib/session";
import { dayDiff, dhakaDay, shiftDay } from "@/lib/time";
import { liveConfigured, liveFiles } from "./live/client";
import { schemas, type DataFile, type DataOf } from "./schemas";

/* ==========================================================================
   Data sources
   Today: local JSON fixtures in src/data/<fixture>/.
   Later: replace `readRaw` with a server-side fetch to the real API and map the
   response to the schema shape here. Nothing outside this file needs to change.
   ========================================================================== */

export const fixtures = ["snapshot", "stress", "new"] as const;
export type Fixture = (typeof fixtures)[number];

/**
 * `?fixture=live` reads the real API for the files that have a live source (`live/client.ts`) and the
 * snapshot for the rest. It needs TENMS_API_TOKEN, so it is off when that is not set.
 */
export type Source = Fixture | "live";

type Loader = () => Promise<{ default: unknown }>;

const loaders: Record<Fixture, Record<DataFile, Loader>> = {
  snapshot: {
    meta: () => import("@/data/snapshot/meta.json"),
    user: () => import("@/data/snapshot/user.json"),
    classes: () => import("@/data/snapshot/classes.json"),
    subjects: () => import("@/data/snapshot/subjects.json"),
    recent: () => import("@/data/snapshot/recent.json"),
    courses: () => import("@/data/snapshot/courses.json"),
    recommendations: () => import("@/data/snapshot/recommendations.json"),
    notices: () => import("@/data/snapshot/notices.json"),
    promos: () => import("@/data/snapshot/promos.json"),
    streak: () => import("@/data/snapshot/streak.json"),
    superprep: () => import("@/data/snapshot/superprep.json"),
    questions: () => import("@/data/snapshot/questions.json"),
    syllabus: () => import("@/data/snapshot/syllabus.json"),
    report: () => import("@/data/snapshot/report.json"),
    routine: () => import("@/data/snapshot/routine.json"),
    garden: () => import("@/data/snapshot/garden.json"),
    catalog: () => import("@/data/snapshot/catalog.json"),
    library: () => import("@/data/snapshot/library.json"),
  },
  stress: {
    meta: () => import("@/data/stress/meta.json"),
    user: () => import("@/data/stress/user.json"),
    classes: () => import("@/data/stress/classes.json"),
    subjects: () => import("@/data/stress/subjects.json"),
    recent: () => import("@/data/stress/recent.json"),
    courses: () => import("@/data/stress/courses.json"),
    recommendations: () => import("@/data/stress/recommendations.json"),
    notices: () => import("@/data/stress/notices.json"),
    promos: () => import("@/data/stress/promos.json"),
    streak: () => import("@/data/stress/streak.json"),
    superprep: () => import("@/data/stress/superprep.json"),
    questions: () => import("@/data/stress/questions.json"),
    syllabus: () => import("@/data/stress/syllabus.json"),
    report: () => import("@/data/stress/report.json"),
    routine: () => import("@/data/stress/routine.json"),
    garden: () => import("@/data/stress/garden.json"),
    catalog: () => import("@/data/stress/catalog.json"),
    library: () => import("@/data/stress/library.json"),
  },
  new: {
    meta: () => import("@/data/new/meta.json"),
    user: () => import("@/data/new/user.json"),
    classes: () => import("@/data/new/classes.json"),
    subjects: () => import("@/data/new/subjects.json"),
    recent: () => import("@/data/new/recent.json"),
    courses: () => import("@/data/new/courses.json"),
    recommendations: () => import("@/data/new/recommendations.json"),
    notices: () => import("@/data/new/notices.json"),
    promos: () => import("@/data/new/promos.json"),
    streak: () => import("@/data/new/streak.json"),
    superprep: () => import("@/data/new/superprep.json"),
    questions: () => import("@/data/new/questions.json"),
    syllabus: () => import("@/data/new/syllabus.json"),
    report: () => import("@/data/new/report.json"),
    routine: () => import("@/data/new/routine.json"),
    garden: () => import("@/data/new/garden.json"),
    catalog: () => import("@/data/new/catalog.json"),
    library: () => import("@/data/new/library.json"),
  },
};

/* ---------- Request context ---------- */

export type DataContext = {
  fixture: Source;
  /** Single "now" for the whole request, so every section agrees on the time. */
  now: number;
  /** Dev knobs: artificial latency and forced failures, to test loading/error states. */
  delayMs: number;
  fail: ReadonlySet<DataFile>;
};

type SearchParams = Record<string, string | string[] | undefined>;

const devKnobsEnabled =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_DATA_FIXTURES === "1";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/**
 * Build the data context from the URL.
 *   ?fixture=stress|new|live   switch data set (live needs TENMS_API_TOKEN)
 *   ?delay=800            add latency (ms) to every file
 *   ?fail=notices,classes force those files to fail
 * Knobs work in development, or in production when ENABLE_DATA_FIXTURES=1.
 * The free demo student (LG19, a session cookie of `free`) gets the `new` data, a student with no
 * courses, on every page and in production too; `?fixture=` still overrides it.
 *
 * Without an explicit `now`, this waits for the request (`connection()`), so the
 * data is never baked into a prerendered page. Call it inside a <Suspense> boundary.
 */
export async function createDataContext(
  searchParams: SearchParams | Promise<SearchParams> = {},
  now?: number,
): Promise<DataContext> {
  // Only a real request has a session; a fixed `now` (tests, the styleguide) always reads the snapshot.
  let free = false;
  if (now === undefined) {
    await connection();
    now = Date.now();
    free = (await cookies()).get(SESSION_COOKIE)?.value === FREE_SESSION;
  }
  const sp = await searchParams;
  const ctx: DataContext = { fixture: free ? "new" : "snapshot", now, delayMs: 0, fail: new Set() };
  if (!devKnobsEnabled) return ctx;

  const fixture = first(sp.fixture);
  if (fixture && (fixtures as readonly string[]).includes(fixture)) ctx.fixture = fixture as Fixture;
  else if (fixture === "live" && liveConfigured()) ctx.fixture = "live";

  const delay = Number(first(sp.delay));
  if (Number.isFinite(delay) && delay > 0) ctx.delayMs = Math.min(delay, 10_000);

  const fail = first(sp.fail);
  if (fail) {
    ctx.fail = new Set(fail.split(",").filter((f): f is DataFile => f in schemas));
  }
  return ctx;
}

/* ---------- Errors ---------- */

export class DataError extends Error {
  constructor(
    readonly file: DataFile,
    message: string,
  ) {
    super(`[data:${file}] ${message}`);
    this.name = "DataError";
  }
}

/* ---------- Time rebasing ---------- */

/**
 * Fixtures are frozen at `snapshotAt`. Shift every timestamp (keys ending in "At")
 * by the time since then, and every calendar day (keys ending in "date"/"Date")
 * by whole days, so the data always looks current.
 */
export function rebase<T>(value: T, offsetMs: number, offsetDays: number): T {
  if (Array.isArray(value)) return value.map((v) => rebase(v, offsetMs, offsetDays)) as T;
  if (value === null || typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "string" && /At$/.test(key) && !Number.isNaN(Date.parse(v))) {
      out[key] = new Date(Date.parse(v) + offsetMs).toISOString();
    } else if (typeof v === "string" && /(^d|D)ate$/.test(key) && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      out[key] = shiftDay(v, offsetDays);
    } else {
      out[key] = rebase(v, offsetMs, offsetDays);
    }
  }
  return out as T;
}

/* ---------- Loading ---------- */

const QUARTER_HOUR = 15 * 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function readRaw(fixture: Fixture, file: DataFile): Promise<unknown> {
  return (await loaders[fixture][file]()).default;
}

const getMeta = cache(async (fixture: Fixture) => schemas.meta.parse(await readRaw(fixture, "meta")));

/** Load, rebase and validate one data file. Throws DataError on failure. */
export async function loadFile<K extends DataFile>(ctx: DataContext, file: K): Promise<DataOf<K>> {
  if (ctx.delayMs) await sleep(ctx.delayMs);
  if (ctx.fail.has(file)) throw new DataError(file, "Simulated failure (?fail=)");

  if (ctx.fixture === "live" && file in liveFiles) {
    let live: unknown;
    try {
      live = await liveFiles[file]!(ctx.now);
    } catch (err) {
      throw new DataError(file, `Live API failed: ${(err as Error).message}`);
    }
    const parsed = schemas[file].safeParse(live);
    if (!parsed.success) throw new DataError(file, `Invalid live data\n${z.prettifyError(parsed.error)}`);
    return parsed.data as DataOf<K>;
  }

  // Files without a live source fall back to the snapshot.
  const fixture: Fixture = ctx.fixture === "live" ? "snapshot" : ctx.fixture;

  let raw: unknown;
  try {
    raw = await readRaw(fixture, file);
  } catch (err) {
    throw new DataError(file, `Could not read source: ${(err as Error).message}`);
  }

  const meta = await getMeta(fixture);
  const snapshotAt = Date.parse(meta.snapshotAt);
  // Shift in whole quarter-hours so times read naturally (৭:৩০, not ৭:৩১).
  const offsetMs = Math.floor((ctx.now - snapshotAt) / QUARTER_HOUR) * QUARTER_HOUR;
  const rebased = rebase(raw, offsetMs, dayDiff(dhakaDay(ctx.now), dhakaDay(snapshotAt)));

  const result = schemas[file].safeParse(rebased);
  if (!result.success) {
    throw new DataError(file, `Invalid data\n${z.prettifyError(result.error)}`);
  }
  return result.data as DataOf<K>;
}
