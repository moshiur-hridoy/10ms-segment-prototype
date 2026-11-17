import { dayDiff, dhakaDay, shiftDay } from "@/lib/time";
import type { ReportData, StudyType } from "./schemas";

/*
 * The learning report, computed from raw events for one scope (a course, or all) and
 * one period. Every section reads the same `ReportView`, so the numbers always agree.
 * Pure (no I/O), so it is tested directly.
 */

export type PeriodKind = "week" | "month";
export type Period = {
  kind: PeriodKind;
  /** 0 = the current week/month, -1 = the one before, … */
  offset: number;
  /** Inclusive "YYYY-MM-DD" days, Bangladesh calendar. */
  start: string;
  end: string;
  days: string[];
};

export const STUDY_TYPES: StudyType[] = ["live", "video", "exam", "quiz"];
/** How many periods the KPI sparklines show (ending with the selected one). */
export const TREND_LENGTH = 8;

/** Weekday 0 = Sunday … 6 = Saturday for a "YYYY-MM-DD" day. */
const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();

const range = (start: string, end: string) => {
  const days: string[] = [];
  for (let d = start; d <= end; d = shiftDay(d, 1)) days.push(d);
  return days;
};

/** Weeks run Saturday → Friday, as in Bangladesh (and the streak card). */
export function periodFor(kind: PeriodKind, offset: number, today: string): Period {
  if (kind === "week") {
    const back = (weekday(today) + 1) % 7; // days since Saturday
    const start = shiftDay(today, -back + offset * 7);
    const end = shiftDay(start, 6);
    return { kind, offset, start, end, days: range(start, end) };
  }
  const [y, m] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1 + offset, 1));
  const start = first.toISOString().slice(0, 10);
  const end = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
  return { kind, offset, start, end, days: range(start, end) };
}

const ratio = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : null);

type Scoped = ReportData;

function scope(data: ReportData, courseId: string | null): Scoped {
  if (!courseId) return data;
  const mine = <T extends { courseId: string }>(items: T[]) => items.filter((i) => i.courseId === courseId);
  return { classes: mine(data.classes), study: mine(data.study), homework: mine(data.homework), attempts: mine(data.attempts) };
}

/** Headline numbers for one period. `null` rates mean "nothing to measure", not 0%. */
function measure(data: Scoped, p: Period) {
  const inP = (day: string) => day >= p.start && day <= p.end;
  const classes = data.classes.filter((c) => inP(dhakaDay(Date.parse(c.startsAt))));
  const attended = classes.filter((c) => c.status !== "absent").length;
  const minutes = data.study.filter((s) => inP(s.date)).reduce((n, s) => n + s.minutes, 0);
  const attempts = data.attempts.filter((a) => inP(dhakaDay(Date.parse(a.takenAt))));
  const correct = attempts.reduce((n, a) => n + a.correct, 0);
  const asked = attempts.reduce((n, a) => n + a.total, 0);
  return { classes, attended, attendance: ratio(attended, classes.length), minutes, attempts, accuracy: ratio(correct, asked) };
}

export function buildReport(data: ReportData, courseId: string | null, period: Period, now: number) {
  const scoped = scope(data, courseId);
  const today = dhakaDay(now);
  const cur = measure(scoped, period);
  const prev = measure(scoped, periodFor(period.kind, period.offset - 1, today));

  // Average per day over the days that have happened, so a half-finished week compares fairly.
  const elapsed = (p: Period) => Math.max(1, Math.min(p.days.length, dayDiff(today, p.start) + 1));
  const prevPeriod = periodFor(period.kind, period.offset - 1, today);
  const perDay = cur.minutes / elapsed(period);
  const prevPerDay = prev.minutes / elapsed(prevPeriod);

  const trendPeriods = Array.from({ length: TREND_LENGTH }, (_, i) => periodFor(period.kind, period.offset - (TREND_LENGTH - 1 - i), today));
  const trends = trendPeriods.map((p) => measure(scoped, p));
  // Homework submitted out of what was due by now, so a deadline still ahead doesn't count against the period.
  const homeworkRate = (p: Period) => {
    const due = scoped.homework.filter((h) => {
      const d = dhakaDay(Date.parse(h.dueAt));
      return d >= p.start && d <= p.end && (h.submitted || Date.parse(h.dueAt) < now);
    });
    return ratio(due.filter((h) => h.submitted).length, due.length);
  };

  /* one row per day: study time by type, the classes held and the attempts taken */
  const days = period.days.map((date) => {
    const classes = cur.classes.filter((c) => dhakaDay(Date.parse(c.startsAt)) === date).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    const byType = Object.fromEntries(STUDY_TYPES.map((t) => [t, 0])) as Record<StudyType, number>;
    for (const s of scoped.study) if (s.date === date) byType[s.type] += s.minutes;
    return {
      date,
      future: date > today,
      held: classes.length,
      attended: classes.filter((c) => c.status !== "absent").length,
      classes,
      byType,
      total: STUDY_TYPES.reduce((n, t) => n + byType[t], 0),
      attempts: cur.attempts.filter((a) => dhakaDay(Date.parse(a.takenAt)) === date).sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt)),
    };
  });
  const studyTotals = Object.fromEntries(STUDY_TYPES.map((t) => [t, days.reduce((n, d) => n + d.byType[t], 0)])) as Record<StudyType, number>;

  /* homework due in the period */
  const dueInPeriod = scoped.homework.filter((h) => {
    const d = dhakaDay(Date.parse(h.dueAt));
    return d >= period.start && d <= period.end;
  });
  const submitted = dueInPeriod.filter((h) => h.submitted).length;
  const overdue = dueInPeriod.filter((h) => !h.submitted && Date.parse(h.dueAt) < now).length;

  const subjects = subjectRows(scoped, cur, dueInPeriod, period);
  const attendance = { value: cur.attendance, prev: prev.attendance, trend: trends.map((m) => m.attendance) };
  const accuracy = { value: cur.accuracy, prev: prev.accuracy, trend: trends.map((m) => m.accuracy) };
  const absent = cur.classes.filter((c) => c.status === "absent").length;

  return {
    period,
    kpis: {
      attendance: { ...attendance, avg: ownAverage(attendance.trend) },
      study: {
        total: cur.minutes,
        perDay,
        prevPerDay: prev.minutes > 0 ? prevPerDay : null,
        trend: trends.map((m) => m.minutes),
        /** Minutes a day per period, over the days that have happened (comparable across periods). */
        perDayTrend: trends.map((m, i) => (m.minutes > 0 ? m.minutes / elapsed(trendPeriods[i]) : null)),
      },
      homework: { submitted, due: dueInPeriod.length, overdue, trend: trendPeriods.map(homeworkRate) },
      accuracy: { ...accuracy, avg: ownAverage(accuracy.trend) },
    },
    /** The period in one line: its biggest win and the one thing to look at. */
    story: story({
      held: cur.classes.length,
      absent,
      attendance,
      accuracy,
      perDay,
      prevPerDay: prev.minutes > 0 ? prevPerDay : null,
      homework: { submitted, due: dueInPeriod.length, overdue },
    }),
    attendance: {
      held: cur.classes.length,
      ontime: cur.classes.filter((c) => c.status === "ontime").length,
      late: cur.classes.filter((c) => c.status === "late").length,
      absent,
    },
    days,
    study: { totals: studyTotals, total: cur.minutes },
    subjects,
    /** The subject furthest below the student's own rate this period, if one clearly is. */
    focusSubject: focusSubject(subjects, cur.attendance, cur.accuracy),
    exams: {
      recent: [...cur.attempts].sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt)).slice(0, 5),
    },
    /** Homework still open now (any period), soonest first: the "what to do next" list uses it. */
    pendingHomework: scoped.homework
      .filter((h) => !h.submitted && Date.parse(h.dueAt) >= now)
      .sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt)),
    /** Nothing at all happened in the period. */
    empty: cur.classes.length === 0 && cur.minutes === 0 && cur.attempts.length === 0,
  };
}

/** Mean of the earlier periods that had something to measure (the selected one is left out). */
function ownAverage(trend: (number | null)[]) {
  const earlier = trend.slice(0, -1).filter((v): v is number => v !== null);
  return earlier.length > 0 ? earlier.reduce((n, v) => n + v, 0) / earlier.length : null;
}

export type SubjectRow = {
  subject: string;
  attended: number;
  held: number;
  correct: number;
  asked: number;
  minutes: number;
  hwDone: number;
  hwDue: number;
};

/** Every measure per subject, side by side. Weakest rate first; subjects with no rate go last, by time spent. */
function subjectRows(scoped: Scoped, cur: ReturnType<typeof measure>, dueInPeriod: Scoped["homework"], period: Period): SubjectRow[] {
  const rows = new Map<string, SubjectRow>();
  const row = (subject: string) => {
    let r = rows.get(subject);
    if (!r) rows.set(subject, (r = { subject, attended: 0, held: 0, correct: 0, asked: 0, minutes: 0, hwDone: 0, hwDue: 0 }));
    return r;
  };
  for (const c of cur.classes) {
    const r = row(c.subject);
    r.held++;
    if (c.status !== "absent") r.attended++;
  }
  for (const a of cur.attempts) {
    const r = row(a.subject);
    r.correct += a.correct;
    r.asked += a.total;
  }
  for (const s of scoped.study) if (s.date >= period.start && s.date <= period.end) row(s.subject).minutes += s.minutes;
  for (const h of dueInPeriod) {
    const r = row(h.subject);
    r.hwDue++;
    if (h.submitted) r.hwDone++;
  }
  const weakest = (r: SubjectRow) => Math.min(ratio(r.attended, r.held) ?? Infinity, ratio(r.correct, r.asked) ?? Infinity);
  return [...rows.values()].filter((r) => r.held + r.asked + r.minutes + r.hwDue > 0).sort((a, b) => weakest(a) - weakest(b) || b.minutes - a.minutes);
}

/** Below this many points under the student's own rate, a subject isn't singled out. */
const FOCUS_GAP = 5;

function focusSubject(rows: SubjectRow[], attendance: number | null, accuracy: number | null) {
  let best: { subject: string; metric: "attendance" | "accuracy"; value: number; avg: number; gap: number } | null = null;
  for (const r of rows) {
    const candidates = [
      // Enough to judge: at least two classes, or ten questions.
      { metric: "attendance" as const, value: r.held >= 2 ? ratio(r.attended, r.held) : null, avg: attendance },
      { metric: "accuracy" as const, value: r.asked >= 10 ? ratio(r.correct, r.asked) : null, avg: accuracy },
    ];
    for (const c of candidates) {
      if (c.value === null || c.avg === null) continue;
      const gap = c.avg - c.value;
      if (gap >= FOCUS_GAP && (!best || gap > best.gap)) best = { subject: r.subject, metric: c.metric, value: c.value, avg: c.avg, gap };
    }
  }
  return best && { subject: best.subject, metric: best.metric, value: best.value, avg: best.avg };
}

/** A change smaller than this (points, or minutes a day) is "about the same". */
const SAME_POINTS = 3;
const SAME_MINUTES = 10;

export type StoryFact =
  | { kind: "attendanceAll"; held: number }
  | { kind: "homeworkAll"; due: number }
  | { kind: "attendanceUp" | "attendanceDown"; by: number; value: number }
  | { kind: "accuracyUp" | "accuracyDown"; by: number; value: number }
  | { kind: "studyUp" | "studyDown"; by: number; value: number }
  | { kind: "homeworkOverdue"; n: number; submitted: number; due: number }
  | { kind: "missedClasses"; n: number; held: number };

type StoryInput = {
  held: number;
  absent: number;
  attendance: { value: number | null; prev: number | null };
  accuracy: { value: number | null; prev: number | null };
  perDay: number;
  prevPerDay: number | null;
  homework: { submitted: number; due: number; overdue: number };
};

/**
 * Picks the biggest win and the biggest worry by a rough weight (points of change,
 * or a fixed weight for "all done" and "left undone"). Either can be null.
 */
function story(s: StoryInput) {
  const wins: [number, StoryFact][] = [];
  const worries: [number, StoryFact][] = [];
  const change = (a: { value: number | null; prev: number | null }) => (a.value === null || a.prev === null ? null : a.value - a.prev);

  if (s.held >= 2 && s.absent === 0) wins.push([30, { kind: "attendanceAll", held: s.held }]);
  if (s.homework.due > 0 && s.homework.submitted === s.homework.due) wins.push([20 + s.homework.due, { kind: "homeworkAll", due: s.homework.due }]);

  const att = change(s.attendance);
  if (att !== null && s.attendance.value !== null && Math.abs(att) >= SAME_POINTS) {
    const fact = { by: Math.abs(att), value: s.attendance.value };
    if (att > 0) {
      if (s.absent > 0) wins.push([att, { kind: "attendanceUp", ...fact }]);
    } else worries.push([-att, { kind: "attendanceDown", ...fact }]);
  } else if (att === null && s.held >= 2 && s.absent * 2 > s.held) {
    worries.push([s.absent * 5, { kind: "missedClasses", n: s.absent, held: s.held }]);
  }

  const acc = change(s.accuracy);
  if (acc !== null && s.accuracy.value !== null && Math.abs(acc) >= SAME_POINTS) {
    (acc > 0 ? wins : worries).push([Math.abs(acc), { kind: acc > 0 ? "accuracyUp" : "accuracyDown", by: Math.abs(acc), value: s.accuracy.value }]);
  }

  if (s.prevPerDay !== null) {
    const d = s.perDay - s.prevPerDay;
    if (Math.abs(d) >= SAME_MINUTES) {
      const weight = (Math.abs(d) / Math.max(s.prevPerDay, 1)) * 20;
      (d > 0 ? wins : worries).push([weight, { kind: d > 0 ? "studyUp" : "studyDown", by: Math.abs(d), value: s.perDay }]);
    }
  }

  if (s.homework.overdue > 0) {
    worries.push([15 * s.homework.overdue, { kind: "homeworkOverdue", n: s.homework.overdue, submitted: s.homework.submitted, due: s.homework.due }]);
  }

  const top = (list: [number, StoryFact][]) => list.sort((a, b) => b[0] - a[0])[0]?.[1] ?? null;
  return { win: top(wins), focus: top(worries) };
}

export type ReportView = ReturnType<typeof buildReport>;
