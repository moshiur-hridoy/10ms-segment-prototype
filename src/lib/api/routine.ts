import { DAY_MS, dayDiff, dhakaDay, shiftDay } from "@/lib/time";
import type { Course, RoutineItem } from "./schemas";

/*
 * The full routine page as a study planner: a month of days (with what each holds), the chosen
 * day's entries in time order with each one's state and next step, the week's load, and the
 * misses still worth catching up on. Pure (no I/O), so it is tested directly.
 */

/** `ended`: a past class seen by a guest (CT74), who neither attended nor missed it. */
export type EntryState = "upcoming" | "live" | "open" | "due" | "overdue" | "done" | "missed" | "ended";
/** What the student can do with an entry now. `practice`: a missed exam, practised on SuperPrep. */
export type EntryAction = "join" | "exam" | "submit" | "watch" | "practice" | "none";
/** How a done entry was done, for its note ("ক্লাস করেছ", "রেকর্ডিং দেখেছ", "জমা দিয়েছ"). */
export type DoneHow = "attended" | "watched" | "submitted";
export type EntryKind = "class" | "exam" | "homework";

export type RoutineEntry = RoutineItem & {
  /** Start (classes, exams) or deadline (homework), in ms. */
  at: number;
  day: string;
  state: EntryState;
  action: EntryAction;
  /** Homework due within a day: the only time a deadline turns red before it passes. */
  urgent: boolean;
  doneHow: DoneHow | null;
};

/** How many days the desktop strip shows: one week or two. */
export type Span = 7 | 14;
export const SPANS: Span[] = [7, 14];

export type RoutineQuery = { day: string | null; course: string | null; subject: string | null; missed: boolean; span: Span };

export type DayCell = { day: string; inMonth: boolean; counts: Record<EntryKind, number>; missed: number; total: number };
/** A run of whole weeks: its days and its load (`doneBy`: how many of each type are done). */
export type Stretch = { start: string; end: string; days: DayCell[]; counts: Record<EntryKind, number>; doneBy: Record<EntryKind, number>; done: number; total: number };

export type RoutineView = {
  today: string;
  /** The day on the right-hand page. */
  day: string;
  /** Saturday → Friday rows covering the chosen day's month. */
  weeks: DayCell[][];
  entries: RoutineEntry[];
  /** CT211: every entry of the chosen day's week (Saturday → Friday), filters applied, in time order (the phone's timeline). */
  weekEntries: RoutineEntry[];
  /** Where the "now" line sits among today's entries (before entries[nowIndex]); null on other days. */
  nowIndex: number | null;
  /** The chosen day's week (Saturday → Friday): its seven days (the phone's week strip) and its load. */
  week: Stretch;
  /**
   * The desktop strip: the week (span 7) or the two weeks (span 14) holding the chosen day, with
   * its load, and the same weekday a span before and after. Two-week stretches count from today's
   * week, so the one that opens is this week and the next.
   */
  range: Stretch & { span: Span; prev: string; next: string };
  catchUp: { items: RoutineEntry[]; total: number };
  courses: { value: string; label: string }[];
  subjects: { value: string; label: string }[];
  prevDay: string;
  nextDay: string;
  /** The same weekday a week before and after (the phone's week strip turns a week at a time). */
  prevWeek: string;
  nextWeek: string;
  prevMonth: string;
  nextMonth: string;
  /** When the chosen day is empty: the next day that has something. */
  nextBusyDay: string | null;
  query: RoutineQuery;
};

/** Misses older than this drop out of the catch-up list (they stay on their day). */
export const CATCH_UP_DAYS = 14;
export const CATCH_UP_LIMIT = 4;

const kindOf = (item: RoutineItem): EntryKind => (item.kind === "free" ? "class" : item.kind);
const courseKey = (item: RoutineItem) => item.courseId ?? item.course;
const emptyCounts = (): Record<EntryKind, number> => ({ class: 0, exam: 0, homework: 0 });

/** Weekday 0 = Sunday … 6 = Saturday for a "YYYY-MM-DD" day. */
const weekday = (day: string) => new Date(`${day}T00:00:00Z`).getUTCDay();
/** The Saturday a Bangladesh week (Saturday → Friday) starts on. */
export const weekStart = (day: string) => shiftDay(day, -((weekday(day) + 1) % 7));
const monthStart = (day: string) => `${day.slice(0, 8)}01`;
const monthEnd = (day: string) => shiftDay(`${shiftDay(monthStart(day), 32).slice(0, 8)}01`, -1);

/** `guest` (CT74): a batch's routine for someone not in it: nothing to join, attend or catch up on. */
export function toEntry(item: RoutineItem, now: number, guest = false): RoutineEntry {
  const base = { at: 0, day: "", state: "upcoming" as EntryState, action: "none" as EntryAction, urgent: false, doneHow: null as DoneHow | null };
  if (item.kind === "homework") {
    const at = Date.parse(item.dueAt);
    const out = { ...item, ...base, at, day: dhakaDay(at) };
    if (item.homework !== "pending") return { ...out, state: "done", doneHow: "submitted" };
    if (at < now) return { ...out, state: "overdue", action: "submit" };
    return { ...out, state: "due", action: "submit", urgent: at - now < DAY_MS };
  }
  const at = Date.parse(item.startsAt);
  const end = Date.parse(item.endsAt);
  const out = { ...item, ...base, at, day: dhakaDay(at) };
  if (item.kind === "exam") {
    if (item.submitted) return { ...out, state: "done", doneHow: "submitted" };
    if (now < at) return out;
    if (now < end) return { ...out, state: "open", action: "exam" };
    return { ...out, state: "missed", action: "practice" };
  }
  if (now < at) return out;
  if (guest) return { ...out, state: now < end ? "live" : "ended" };
  if (now < end) return { ...out, state: "live", action: "join" };
  if (item.attended) return { ...out, state: "done", doneHow: "attended" };
  if (item.watched) return { ...out, state: "done", doneHow: "watched" };
  return { ...out, state: "missed", action: "watch" };
}

const needsCatchUp = (e: RoutineEntry) => e.state === "missed" || e.state === "overdue";

export function buildRoutine(items: RoutineItem[], courses: Course[], now: number, query: RoutineQuery, opts: { guest?: boolean } = {}): RoutineView {
  const today = dhakaDay(now);
  const day = query.day && /^\d{4}-\d{2}-\d{2}$/.test(query.day) ? query.day : today;
  const all = items.map((i) => toEntry(i, now, opts.guest)).sort((a, b) => a.at - b.at);

  // Filter options: every course in the data, then the subjects of the chosen course.
  const titles = new Map(courses.map((c) => [c.id, c.title]));
  const courseOptions = new Map<string, string>();
  for (const e of all) courseOptions.set(courseKey(e), (e.courseId && titles.get(e.courseId)) || e.course);
  const course = query.course && courseOptions.has(query.course) ? query.course : null;
  const inCourse = course ? all.filter((e) => courseKey(e) === course) : all;
  const subjectOptions = [...new Set(inCourse.map((e) => e.subject))];
  const subject = query.subject && subjectOptions.includes(query.subject) ? query.subject : null;
  const scoped = subject ? inCourse.filter((e) => e.subject === subject) : inCourse;
  const shown = query.missed ? scoped.filter(needsCatchUp) : scoped;

  const byDay = new Map<string, RoutineEntry[]>();
  for (const e of shown) byDay.set(e.day, [...(byDay.get(e.day) ?? []), e]);

  const cell = (d: string): DayCell => {
    const list = byDay.get(d) ?? [];
    const counts = emptyCounts();
    for (const e of list) counts[kindOf(e)]++;
    return { day: d, inMonth: d.slice(0, 7) === day.slice(0, 7), counts, missed: list.filter(needsCatchUp).length, total: list.length };
  };

  const weeks: DayCell[][] = [];
  for (let start = weekStart(monthStart(day)); start <= monthEnd(day); start = shiftDay(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, k) => cell(shiftDay(start, k))));
  }

  const entries = byDay.get(day) ?? [];
  const upcomingAt = entries.findIndex((e) => e.at > now);
  const nowIndex = day === today ? (upcomingAt === -1 ? entries.length : upcomingAt) : null;

  const stretch = (start: string, length: number): Stretch => {
    const end = shiftDay(start, length - 1);
    const inside = shown.filter((e) => e.day >= start && e.day <= end);
    const counts = emptyCounts();
    const doneBy = emptyCounts();
    for (const e of inside) {
      counts[kindOf(e)]++;
      if (e.state === "done") doneBy[kindOf(e)]++;
    }
    const days = Array.from({ length }, (_, k) => cell(shiftDay(start, k)));
    const done = doneBy.class + doneBy.exam + doneBy.homework;
    return { start, end, days, counts, doneBy, done, total: inside.length };
  };
  const span: Span = query.span === 14 ? 14 : 7;
  const ws = weekStart(day);
  const thisWeek = weekStart(today);
  const rangeStart = span === 7 ? ws : shiftDay(thisWeek, Math.floor(dayDiff(ws, thisWeek) / 14) * 14);

  const catchUp = scoped.filter((e) => needsCatchUp(e) && e.at >= now - CATCH_UP_DAYS * DAY_MS).sort((a, b) => b.at - a.at);

  const monthOf = (d: string) => (d.slice(0, 7) === today.slice(0, 7) ? today : monthStart(d));

  return {
    today,
    day,
    weeks,
    entries,
    weekEntries: shown.filter((e) => e.day >= ws && e.day <= shiftDay(ws, 6)),
    nowIndex,
    week: stretch(ws, 7),
    range: { ...stretch(rangeStart, span), span, prev: shiftDay(day, -span), next: shiftDay(day, span) },
    catchUp: { items: catchUp.slice(0, CATCH_UP_LIMIT), total: catchUp.length },
    courses: [...courseOptions].map(([value, label]) => ({ value, label })),
    subjects: subjectOptions.map((s) => ({ value: s, label: s })),
    prevDay: shiftDay(day, -1),
    nextDay: shiftDay(day, 1),
    prevWeek: shiftDay(day, -7),
    nextWeek: shiftDay(day, 7),
    prevMonth: monthOf(shiftDay(monthStart(day), -1)),
    nextMonth: monthOf(shiftDay(monthEnd(day), 1)),
    nextBusyDay: entries.length ? null : ([...byDay.keys()].filter((d) => d > day).sort()[0] ?? null),
    query: { day, course, subject, missed: query.missed, span },
  };
}
