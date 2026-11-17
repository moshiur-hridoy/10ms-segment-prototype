import type { Question, QuestionHistory } from "./schemas";

/*
 * Picks the questions for one SuperPrep set. The real API will do this server-side; the
 * rules live here so the exam page, its links and the tests agree:
 *  - `ids` (redo the wrong ones from a result) wins over everything else;
 *  - otherwise filter by chapters and by how each question was answered last time,
 *    keep the source order, skip the ones already served, and take `count`.
 */

export const SET_SIZES = [10, 20, 30, 50] as const;
export const DEFAULT_SET_SIZE = 20;
export const MAX_SET_SIZE = 50;

export type ExamMode = "practice" | "exam";

/** Wrong answers cost this much when negative marking is on (admission-test rule). */
export const NEGATIVE_MARK = 0.25;

export type SetQuery = {
  chapters: string[];
  types: QuestionHistory[];
  count: number;
  skip: number;
  ids: string[];
  mode: ExamMode;
  /** Exam mode only. Minutes; `null` = one minute per question, `0` = no limit. */
  time: number | null;
  /** Exam mode only: each wrong answer costs NEGATIVE_MARK. */
  negative: boolean;
  /** Exam mode only ("OMR mode"): a filled answer can't be changed. */
  strict: boolean;
};

type Params = Record<string, string | string[] | undefined>;

const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? ""))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const int = (v: string | string[] | undefined, fallback: number, max: number) => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 0 ? Math.min(n, max) : fallback;
};

const HISTORY: readonly QuestionHistory[] = ["new", "wrong", "correct"];

/** Reads `?chapters=&types=&count=&skip=&ids=&mode=`; anything unknown falls back to a default. */
export function parseSetQuery(p: Params): SetQuery {
  const types = list(p.types).filter((t): t is QuestionHistory => (HISTORY as readonly string[]).includes(t));
  return {
    chapters: list(p.chapters),
    types: types.length ? types : ["new"],
    count: Math.max(1, int(p.count, DEFAULT_SET_SIZE, MAX_SET_SIZE)),
    skip: int(p.skip, 0, 10_000),
    ids: list(p.ids),
    mode: p.mode === "exam" ? "exam" : "practice",
    time: p.time === undefined ? null : int(p.time, 0, 300),
    negative: p.neg === "1",
    strict: p.strict === "1",
  };
}

/** The exam's time limit in minutes for `questions` questions; 0 = none. */
export const timeLimit = (q: Pick<SetQuery, "time">, questions: number) => (q.time === null ? questions : q.time);

/** The URL query for a set; defaults are left out so links stay short. */
export function setSearch(q: Partial<SetQuery>): URLSearchParams {
  const s = new URLSearchParams();
  if (q.ids?.length) s.set("ids", q.ids.join(","));
  if (q.chapters?.length) s.set("chapters", q.chapters.join(","));
  if (q.types?.length && !(q.types.length === 1 && q.types[0] === "new")) s.set("types", q.types.join(","));
  if (q.count && q.count !== DEFAULT_SET_SIZE) s.set("count", String(q.count));
  if (q.skip) s.set("skip", String(q.skip));
  if (q.mode === "exam") {
    s.set("mode", "exam");
    if (q.time !== null && q.time !== undefined) s.set("time", String(q.time));
    if (q.negative) s.set("neg", "1");
    if (q.strict) s.set("strict", "1");
  }
  return s;
}

/** Questions for the set, plus whether more match after it (for "পরের সেট"). */
export function pickSet(pool: Question[], chapterIds: string[], q: SetQuery) {
  if (q.ids.length) {
    const byId = new Map(pool.map((x) => [x.id, x]));
    return { questions: q.ids.map((id) => byId.get(id)).filter((x): x is Question => Boolean(x)), more: false };
  }
  const inPaper = new Set(chapterIds);
  const chapters = q.chapters.length ? new Set(q.chapters.filter((c) => inPaper.has(c))) : inPaper;
  const matching = pool.filter((x) => chapters.has(x.chapterId) && q.types.includes(x.previous));
  return { questions: matching.slice(q.skip, q.skip + q.count), more: matching.length > q.skip + q.count };
}
