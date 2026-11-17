import type { SuperPrepChapter, SuperPrepData } from "./schemas";

/*
 * SuperPrep numbers, derived from per-chapter answers so the dashboard card, the hub
 * and a paper's page always agree. Assumptions until the API is confirmed:
 *  - syllabus % = answered / total questions;
 *  - a chapter is done when every question has been answered;
 *  - every wrong answer stays in the "redo mistakes" set.
 */

/** A chapter is flagged weak below this accuracy, once enough answers make it meaningful. */
export const WEAK_BELOW_PCT = 50;
export const WEAK_MIN_ANSWERED = 20;

export type ChapterStatus = "new" | "progress" | "done";

export type PrepChapter = SuperPrepChapter & {
  answered: number;
  remaining: number;
  /** `null` until something is answered: 0% would read as "all wrong". */
  accuracy: number | null;
  status: ChapterStatus;
  weak: boolean;
};

export type PrepTotals = {
  questions: number;
  answered: number;
  correct: number;
  wrong: number;
  chaptersDone: number;
  chaptersTotal: number;
  /** Share of questions answered (0–100). */
  pct: number;
  accuracy: number | null;
};

/** The one thing to do next in a paper. */
export type NextStep =
  | { kind: "continue"; chapter: PrepChapter }
  | { kind: "start"; chapter: PrepChapter }
  | { kind: "mistakes"; count: number }
  | { kind: "finished" };

type Subject = SuperPrepData["subjects"][number];

export type PrepSubject = Omit<Subject, "chapters"> & {
  chapters: PrepChapter[];
  totals: PrepTotals;
  weakCount: number;
  lastPracticedAt: number | null;
  next: NextStep;
};

const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
const time = (at: string | null) => (at ? Date.parse(at) : null);

export function toChapter(c: SuperPrepChapter): PrepChapter {
  const answered = Math.min(c.questions, c.correct + c.wrong);
  const remaining = c.questions - answered;
  const accuracy = answered > 0 ? pct(c.correct, answered) : null;
  const status: ChapterStatus = answered === 0 ? "new" : remaining === 0 ? "done" : "progress";
  const weak = accuracy !== null && answered >= WEAK_MIN_ANSWERED && accuracy < WEAK_BELOW_PCT;
  return { ...c, answered, remaining, accuracy, status, weak };
}

export function totalsOf(chapters: PrepChapter[]): PrepTotals {
  const sum = (f: (c: PrepChapter) => number) => chapters.reduce((n, c) => n + f(c), 0);
  const questions = sum((c) => c.questions);
  const answered = sum((c) => c.answered);
  const correct = sum((c) => c.correct);
  return {
    questions,
    answered,
    correct,
    wrong: answered - correct,
    chaptersDone: chapters.filter((c) => c.status === "done" && c.questions > 0).length,
    chaptersTotal: chapters.length,
    pct: pct(answered, questions),
    accuracy: answered > 0 ? pct(correct, answered) : null,
  };
}

/**
 * Continue the chapter practised most recently that still has questions, else start the
 * first untouched one, else redo mistakes, else the paper is finished.
 */
export function nextStep(chapters: PrepChapter[], wrong: number): NextStep {
  const open = chapters
    .filter((c) => c.status === "progress")
    .sort((a, b) => (time(b.lastPracticedAt) ?? 0) - (time(a.lastPracticedAt) ?? 0))[0];
  if (open) return { kind: "continue", chapter: open };
  const fresh = chapters.find((c) => c.status === "new" && c.questions > 0);
  if (fresh) return { kind: "start", chapter: fresh };
  if (wrong > 0) return { kind: "mistakes", count: wrong };
  return { kind: "finished" };
}

export function toSubject(s: Subject): PrepSubject {
  const chapters = s.chapters.map(toChapter);
  const totals = totalsOf(chapters);
  const times = chapters.map((c) => time(c.lastPracticedAt)).filter((t): t is number => t !== null);
  return {
    ...s,
    chapters,
    totals,
    weakCount: chapters.filter((c) => c.weak).length,
    lastPracticedAt: times.length ? Math.max(...times) : null,
    next: nextStep(chapters, totals.wrong),
  };
}

export function buildSuperPrep(data: SuperPrepData) {
  const subjects = data.subjects.map(toSubject);
  const totals = totalsOf(subjects.flatMap((s) => s.chapters));
  const last = subjects.find((s) => s.id === data.lastSubjectId) ?? null;
  const active = (s: PrepSubject) => s.next.kind === "continue" || s.next.kind === "start";
  /** Where the hub's "next step" points: the last paper unless it's finished, else the first with work left. */
  const focus = (last && active(last) ? last : subjects.find(active)) ?? last ?? subjects[0] ?? null;
  return {
    isNew: data.isNew,
    learners: data.learners,
    targetPct: data.targetPct,
    subjects,
    totals,
    last,
    focus,
    started: totals.answered > 0,
  };
}

export type SuperPrepView = ReturnType<typeof buildSuperPrep>;
