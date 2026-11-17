import "server-only";
import { cache } from "react";
import { DAY_MS, dhakaDay, shiftDay } from "@/lib/time";
import type { Category, ClassItem, RoutineItem, SyllabusPaper } from "./schemas";
import { freeLiveIds } from "@/lib/guest";
import { loadFile, type DataContext } from "./sources";
import { buildReport, periodFor, type PeriodKind } from "./report";
import { buildChapters, resumeItem } from "./syllabus";
import { pickSet, type SetQuery } from "./question-set";
import { buildSuperPrep, totalsOf } from "./superprep";
import { buildRoutine, weekStart, type RoutineQuery } from "./routine";
import { buildGarden } from "./garden";
import { buildCatalog } from "./catalog";
import { buildLibrary } from "./library";
import { WEEKLY_CLASS_MINUTES, weeklyRoutine } from "@/data/segment-home";

/*
 * Public data API for pages and server components.
 * Each getter loads one file and adds derived values (status, counts, ordering),
 * so components only render. Wrapped in React `cache` so a getter called by
 * several components in one request loads once.
 */

export { createDataContext, DataError, type DataContext, type Fixture } from "./sources";
export type * from "./schemas";
export { DEFAULT_SET_SIZE, NEGATIVE_MARK, parseSetQuery, SET_SIZES, setSearch, timeLimit, type ExamMode, type SetQuery } from "./question-set";
export {
  WEAK_BELOW_PCT,
  WEAK_MIN_ANSWERED,
  type NextStep,
  type PrepChapter,
  type PrepSubject,
  type PrepTotals,
  type SuperPrepView,
} from "./superprep";
export { STUDY_TYPES, type Period, type PeriodKind, type ReportView, type StoryFact, type SubjectRow } from "./report";
export {
  locate,
  nextClass,
  pairClasses,
  resumeItem,
  stripPrefix,
  upNextSteps,
  type ChapterView,
  type ClassNode,
  type ClassPair,
  type ItemGroup,
} from "./syllabus";
export {
  CATCH_UP_DAYS,
  SPANS,
  type DayCell,
  type Span,
  type DoneHow,
  type EntryAction,
  type EntryKind,
  type EntryState,
  type RoutineEntry,
  type RoutineQuery,
  type RoutineView,
} from "./routine";
export { nudgeFor, planFor, presetsFor, type CatalogView, type Nudge, type Plan, type StreamView } from "./catalog";
export { BADGES, HISTORY_WEEKS, type BadgeId, type DayMark, type GardenBadge, type GardenView } from "./garden";
export type { Library, LibraryShelf, ShelfBook, ShelfGroup } from "./library";

/* ---------- user ---------- */

export const getUser = cache(async (ctx: DataContext) => {
  const user = await loadFile(ctx, "user");
  const activeBatch = user.batches.find((b) => b.id === user.activeBatchId) ?? user.batches[0];
  return { ...user, activeBatch };
});
export type UserView = Awaited<ReturnType<typeof getUser>>;

/* ---------- classes ---------- */

export type ClassStatus = "live" | "open" | "upcoming" | "due" | "overdue" | "ended";
export type ClassView = ClassItem & { status: ClassStatus; sortAt: number };

function classStatus(item: ClassItem, now: number): ClassStatus {
  if (item.kind === "homework") {
    if (item.homework !== "pending") return "ended";
    return Date.parse(item.dueAt) < now ? "overdue" : "due";
  }
  const start = Date.parse(item.startsAt);
  const end = Date.parse(item.endsAt);
  if (now >= end) return "ended";
  if (now >= start) return item.kind === "exam" ? "open" : "live";
  return "upcoming";
}

const statusRank: Record<ClassStatus, number> = { live: 0, open: 1, overdue: 2, upcoming: 3, due: 4, ended: 5 };

/** The subject a class belongs to: "HSC 27 অনলাইন ব্যাচ - রসায়ন" → "রসায়ন"; a course without a " - " is its own subject. */
export const subjectOf = (course: string) => course.split(" - ").at(-1)?.trim() || course;

const toView = (item: ClassItem, now: number): ClassView => ({
  ...item,
  status: classStatus(item, now),
  sortAt: Date.parse(item.kind === "homework" ? item.dueAt : item.startsAt),
});

/** `subject` narrows both tabs to one subject; unknown names are ignored (`subject` in the result is what applied). */
export const getClasses = cache(async (ctx: DataContext, subject: string | null = null) => {
  const data = await loadFile(ctx, "classes");

  const all = data.upcoming
    .map((c) => toView(c, ctx.now))
    // The API may still return items that finished since; hide them here.
    // Pending homework never "ends" (it becomes overdue), so it stays until submitted.
    .filter((c) => c.status !== "ended")
    .sort((a, b) => statusRank[a.status] - statusRank[b.status] || a.sortAt - b.sortAt);
  const allMissed = data.missed.map((c) => toView(c, ctx.now)).sort((a, b) => b.sortAt - a.sortAt);

  const subjects = [...new Set([...all, ...allMissed].map((c) => subjectOf(c.course)))];
  const only = subject && subjects.includes(subject) ? subject : null;
  const upcoming = only ? all.filter((c) => subjectOf(c.course) === only) : all;
  const missed = only ? allMissed.filter((c) => subjectOf(c.course) === only) : allMissed;

  /** The single most important item for the hero card: a live class, else the next class. */
  const next =
    upcoming.find((c) => c.status === "live") ?? upcoming.find((c) => c.status === "upcoming" && (c.kind === "class" || c.kind === "free")) ?? null;

  return { upcoming, missed, next, liveCount: upcoming.filter((c) => c.status === "live").length, subjects, subject: only };
});
export type ClassesView = Awaited<ReturnType<typeof getClasses>>;

/* ---------- tasks (the task-based routine view) ---------- */

/** What the student can do with a task right now. `none` = just scheduled. */
export type TaskAction = "join" | "exam" | "submit" | "watch" | "none";
export type Task = ClassView & { action: TaskAction; done: boolean; missed: boolean };

function isDone(item: ClassItem, missed: boolean): boolean {
  if (missed) return item.kind !== "homework" && item.kind !== "exam" && item.watched === true;
  if (item.kind === "homework") return item.homework !== "pending";
  if (item.kind === "exam") return item.submitted === true;
  return item.attended === true;
}

function toTask(view: ClassView, missed = false): Task {
  const done = isDone(view, missed);
  let action: TaskAction = "none";
  if (!done) {
    if (missed) action = "watch";
    else if (view.status === "live") action = "join";
    else if (view.status === "open") action = "exam";
    else if (view.status === "due" || view.status === "overdue") action = "submit";
  }
  return { ...view, action, done, missed };
}

/** Overdue homework first (its deadline already passed), then live, open exam,
 *  homework due, and finally the day's schedule in time order. */
const actionRank: Record<TaskAction, number> = { join: 0, exam: 1, submit: 2, watch: 3, none: 4 };
const rank = (t: Task) => (t.status === "overdue" ? -1 : actionRank[t.action]);
const byUrgency = (a: Task, b: Task) => rank(a) - rank(b) || a.sortAt - b.sortAt;

/*
 * The backlog must never bury today's work or turn into a wall of guilt:
 *  - it renders collapsed, below today, showing BACKLOG_LIMIT items when opened;
 *  - anything older than BACKLOG_DAYS drops out (it stays on the full missed-classes page);
 *  - only the most recently overdue homework is lifted into today, because it can
 *    most likely still be submitted.
 */
export const BACKLOG_LIMIT = 3;
export const BACKLOG_DAYS = 7;

/** `subject` narrows today's work (and its progress) to one subject; unknown names are ignored. */
export const getTasks = cache(async (ctx: DataContext, subject: string | null = null) => {
  const data = await loadFile(ctx, "classes");
  const today = dhakaDay(ctx.now);
  const tomorrow = dhakaDay(ctx.now + DAY_MS);
  const dayOf = (v: ClassView) => dhakaDay(v.sortAt);

  const todays: Task[] = [];
  const backlog: Task[] = [];
  const later: Task[] = [];

  for (const view of data.upcoming.map((c) => toView(c, ctx.now))) {
    const task = toTask(view);
    const day = dayOf(view);
    if (view.kind === "homework") {
      // Pending work is due soon → today's job. Overdue → backlog.
      if (view.status === "overdue") backlog.push(task);
      else if (day <= tomorrow) todays.push(task);
      else if (!task.done) later.push(task);
    } else if (view.status === "live" || view.status === "open" || day === today) {
      const missedToday = view.status === "ended" && !task.done;
      if (!missedToday) todays.push(task);
      // A class that ended today without attendance is a miss: offer the recording.
      else if (view.kind !== "exam") backlog.push(toTask(view, true));
    } else if (day > today) {
      later.push(task);
    }
  }

  const seen = new Set(backlog.map((t) => t.id));
  for (const view of data.missed.map((c) => toView(c, ctx.now))) {
    // Missed exams have no follow-up action, so they don't become tasks.
    if (view.kind === "exam" || seen.has(view.id)) continue;
    const task = toTask(view, true);
    if (!task.done) backlog.push(task);
  }

  const recent = backlog.filter((t) => t.sortAt >= ctx.now - BACKLOG_DAYS * DAY_MS).sort((a, b) => b.sortAt - a.sortAt);
  const lifted = recent.find((t) => t.status === "overdue");
  if (lifted) todays.push(lifted);
  backlog.splice(0, backlog.length, ...recent.filter((t) => t !== lifted));

  // Every subject with anything on the card, not just today: one with nothing today still gets a filter and an empty state.
  const subjects = [...new Set([...todays, ...backlog, ...later].map((t) => subjectOf(t.course)))];
  const only = subject && subjects.includes(subject) ? subject : null;
  const inSubject = (t: Task) => !only || subjectOf(t.course) === only;
  const scoped = todays.filter(inSubject);
  const kept = backlog.filter(inSubject);

  const open = scoped.filter((t) => !t.done).sort(byUrgency);
  const done = scoped.filter((t) => t.done).sort((a, b) => a.sortAt - b.sortAt);

  /** The hero: something to act on now, else the next thing on today's schedule. */
  const hero = open.find((t) => t.action === "join" || t.action === "exam") ?? open.find((t) => t.status === "upcoming") ?? null;

  const laterDays = new Map<string, Task[]>();
  for (const task of later.filter(inSubject).sort((a, b) => a.sortAt - b.sortAt)) {
    const day = dayOf(task);
    laterDays.set(day, [...(laterDays.get(day) ?? []), task]);
  }

  return {
    hero,
    today: open.filter((t) => t !== hero),
    done,
    backlog: {
      items: kept.slice(0, BACKLOG_LIMIT),
      total: kept.length,
      recordings: kept.filter((t) => t.action === "watch").length,
      homework: kept.filter((t) => t.kind === "homework").length,
    },
    later: [...laterDays].map(([day, items]) => ({ day, items })),
    progress: { done: done.length, total: scoped.length },
    subjects,
    subject: only,
  };
});
export type TasksView = Awaited<ReturnType<typeof getTasks>>;

/** How far ahead a paper's page looks for its next class or deadline. */
export const COMING_HOURS = 48;

/**
 * What's coming for one paper, for the strip on its page: anything to act on now (live class,
 * open exam, homework due), then whatever starts within COMING_HOURS. Most urgent first, at most
 * `limit`. Overdue work stays on the dashboard's backlog. Class items have no paper id yet, so a
 * class belongs to the paper its title starts with ("রসায়ন ১ম পত্র: …").
 */
export const getPaperComing = cache(async (ctx: DataContext, paperTitle: string, limit = 2) => {
  const data = await loadFile(ctx, "classes");
  const prefix = `${paperTitle}:`;
  return data.upcoming
    .filter((c) => c.title.startsWith(prefix))
    .map((c) => toTask(toView(c, ctx.now)))
    .filter(
      (t) => !t.done && t.status !== "ended" && t.status !== "overdue" && (t.action !== "none" || t.sortAt <= ctx.now + COMING_HOURS * 3_600_000),
    )
    .sort(byUrgency)
    .slice(0, limit)
    .map((t) => ({ ...t, title: t.title.slice(prefix.length).trim() }));
});

/* ---------- routine (the full routine page) ---------- */

export const getRoutine = cache(async (ctx: DataContext, query: RoutineQuery) => {
  const [{ items }, { enrolled }] = await Promise.all([loadFile(ctx, "routine"), loadFile(ctx, "courses")]);
  return buildRoutine(items, enrolled, ctx.now, query);
});

/* ---------- subjects & courses ---------- */

export type CategoryCounts = Record<"all" | Category, number>;

const countByCategory = (items: { category: Category }[]): CategoryCounts => ({
  all: items.length,
  academic: items.filter((i) => i.category === "academic").length,
  english: items.filter((i) => i.category === "english").length,
  skills: items.filter((i) => i.category === "skills").length,
});

/** Subject groups; each paper also carries the chapter its student is in (from the syllabus, where there is one). */
export const getSubjects = cache(async (ctx: DataContext) => {
  const [{ groups }, { papers }] = await Promise.all([loadFile(ctx, "subjects"), loadFile(ctx, "syllabus")]);
  const chapterOf = (id: string) => {
    const paper = papers.find((p) => p.id === id);
    if (!paper) return null;
    const at = resumeItem(buildChapters(paper));
    const chapter = at && paper.chapters.find((c) => c.items.some((i) => i.id === at.id));
    return chapter ? { number: chapter.number, title: chapter.title } : null;
  };
  const withChapters = groups.map((g) => ({ ...g, subjects: g.subjects.map((s) => ({ ...s, chapter: chapterOf(s.id) })) }));
  return { groups: withChapters, counts: countByCategory(groups) };
});

export type SubjectCard = Awaited<ReturnType<typeof getSubjects>>["groups"][number];

/**
 * Enrolled courses, split the way a student thinks about them:
 *  - `active`: started (progress > 0), most recently used first, so "where do I go back to" is on top;
 *  - `notStarted`: everything at 0%, in enrolment order. Shown as an invitation, never as an empty bar.
 */
export const getCourses = cache(async (ctx: DataContext) => {
  const { enrolled } = await loadFile(ctx, "courses");
  const activity = (c: (typeof enrolled)[number]) => (c.lastActivityAt ? Date.parse(c.lastActivityAt) : 0);
  const active = enrolled.filter((c) => c.progress > 0).sort((a, b) => activity(b) - activity(a) || b.progress - a.progress);
  const notStarted = enrolled.filter((c) => c.progress === 0);
  return { courses: enrolled, active, notStarted, counts: countByCategory(enrolled) };
});

/* ---------- library ("কোর্স ও বইসমূহ") ---------- */

/** Every shelf of owned (and still available) papers, courses and books; paper progress from the subject cards. */
export const getLibrary = cache(async (ctx: DataContext) => {
  const [library, { groups }] = await Promise.all([loadFile(ctx, "library"), loadFile(ctx, "subjects")]);
  const progress = new Map(groups.flatMap((g) => g.subjects.map((s) => [s.id, s.progress] as const)));
  return buildLibrary(library, progress);
});

/* ---------- recommendations ---------- */

/**
 * Discovery shelves. Products the student already owns are dropped (by the API's
 * `isEnrolled`, and by title against their enrolled courses as a safety net),
 * and shelves left empty disappear.
 */
export const getRecommendations = cache(async (ctx: DataContext) => {
  const [{ shelves }, { enrolled }] = await Promise.all([loadFile(ctx, "recommendations"), loadFile(ctx, "courses")]);
  const owned = new Set(enrolled.map((c) => c.title.trim().toLowerCase()));
  return shelves
    .map((shelf) => ({
      ...shelf,
      items: shelf.items.filter((p) => !p.isEnrolled && !owned.has(p.title.trim().toLowerCase())),
    }))
    .filter((shelf) => shelf.items.length > 0);
});

/* ---------- recent content ---------- */

export const getRecent = cache(async (ctx: DataContext) => {
  const { items } = await loadFile(ctx, "recent");
  return [...items].sort((a, b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt));
});

/* ---------- notices ---------- */

export const getNotices = cache(async (ctx: DataContext) => {
  const { items } = await loadFile(ctx, "notices");
  const sorted = [...items].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  return { items: sorted, unread: sorted.filter((n) => !n.read).length };
});

/* ---------- daily brief (the rotating line under the greeting) ---------- */

/** One update for the greeting card. Text is built in the component; this only says what is true. */
export type BriefItem =
  | { kind: "live"; title: string; href: string }
  | { kind: "exam"; title: string; href: string }
  | { kind: "tasksLeft"; n: number }
  | { kind: "allDone" }
  | { kind: "streakStart" }
  | { kind: "streakAtRisk"; next: number }
  | { kind: "streakGoing"; days: number }
  | { kind: "newContent"; n: number }
  | { kind: "notices"; n: number };

/** Shown in turn, most urgent first. Kept short so the line stays a headline, not a feed. */
export const BRIEF_LIMIT = 4;

export const getBrief = cache(async (ctx: DataContext): Promise<BriefItem[]> => {
  const [tasks, streak, recent, notices] = await Promise.all([getTasks(ctx), getStreak(ctx), getRecent(ctx), getNotices(ctx)]);
  const items: BriefItem[] = [];
  const open = [tasks.hero, ...tasks.today].filter((x): x is Task => x !== null);
  const href = (x: Task) => (x.kind === "class" && x.joinUrl) || x.url || "#";

  const live = open.find((x) => x.action === "join");
  if (live) items.push({ kind: "live", title: live.title, href: href(live) });
  const exam = open.find((x) => x.action === "exam");
  if (exam) items.push({ kind: "exam", title: exam.title, href: href(exam) });

  const left = tasks.progress.total - tasks.progress.done;
  if (left > 0) items.push({ kind: "tasksLeft", n: left });
  else if (tasks.progress.total > 0) items.push({ kind: "allDone" });

  const today = streak.week.find((d) => d.status === "today" || d.status === "today-done");
  if (today?.status === "today") items.push(streak.current > 0 ? { kind: "streakAtRisk", next: streak.current + 1 } : { kind: "streakStart" });
  else if (today?.status === "today-done" && streak.current > 1) items.push({ kind: "streakGoing", days: streak.current });

  const unseen = recent.filter((r) => r.seen === false).length;
  if (unseen > 0) items.push({ kind: "newContent", n: unseen });
  if (notices.unread > 0) items.push({ kind: "notices", n: notices.unread });

  return items.slice(0, BRIEF_LIMIT);
});

/* ---------- promos ---------- */

export const getPromos = cache(async (ctx: DataContext) => (await loadFile(ctx, "promos")).slides);

/* ---------- streak ---------- */

export type StreakDayStatus = "done" | "today" | "today-done" | "missed" | "rained" | "upcoming";

export const getStreak = cache(async (ctx: DataContext) => {
  const streak = await loadFile(ctx, "streak");
  const today = dhakaDay(ctx.now);
  // Always this Saturday → Friday week around today, read by date: the stored week may start on
  // another day (and rebased fixtures shift by whole days), which put সোম first.
  const byDate = new Map(streak.week.map((d) => [d.date, d]));
  const start = weekStart(today);
  const week = Array.from({ length: 7 }, (_, k) => {
    const date = shiftDay(start, k);
    const d = byDate.get(date) ?? { date, completed: false };
    const status: StreakDayStatus =
      date === today ? (d.completed ? "today-done" : "today") : date > today ? "upcoming" : d.completed ? "done" : d.rained ? "rained" : "missed";
    return { ...d, date, status };
  });
  return { ...streak, week };
});

/* ---------- garden (the streak's orchard) ---------- */

export const getGarden = cache(async (ctx: DataContext) => {
  const [garden, streak] = await Promise.all([loadFile(ctx, "garden"), getStreak(ctx)]);
  return buildGarden(garden, streak, ctx.now);
});

/* ---------- superprep ---------- */

/** Hub, paper pages and the dashboard card share these derived numbers. */
export const getSuperPrep = cache(async (ctx: DataContext) => buildSuperPrep(await loadFile(ctx, "superprep")));

/**
 * One SuperPrep set for a paper: its questions, the chapters they come from, and the
 * student's accuracy in those chapters so far (for the result's comparison).
 * `null` when the paper isn't in the student's SuperPrep.
 */
export const getQuestionSet = cache(async (ctx: DataContext, subjectId: string, query: SetQuery) => {
  const [sp, { questions: pool }] = await Promise.all([getSuperPrep(ctx), loadFile(ctx, "questions")]);
  const subject = sp.subjects.find((s) => s.id === subjectId);
  if (!subject) return null;
  const { questions, more } = pickSet(
    pool,
    subject.chapters.map((c) => c.id),
    query,
  );
  const used = new Set(questions.map((q) => q.chapterId));
  const chapters = subject.chapters.filter((c) => used.has(c.id));
  const before = totalsOf(chapters).accuracy;
  return { subject, chapters, questions, more, before };
});

/** One paper in SuperPrep, or `null` if it isn't part of the student's SuperPrep. */
export const getSuperPrepSubject = cache(async (ctx: DataContext, id: string) => {
  const sp = await getSuperPrep(ctx);
  return sp.subjects.find((s) => s.id === id) ?? null;
});

/* ---------- syllabus (subject page) ---------- */

/** One paper's syllabus, grouped for the subject page. `null` when the paper has no syllabus yet. */
/** `guest` (CT28): a visitor without an account has watched and taken nothing, whatever the demo student has. */
export const getSyllabus = cache(async (ctx: DataContext, paperId: string, guest = false) => {
  const { papers } = await loadFile(ctx, "syllabus");
  const raw = papers.find((p) => p.id === paperId);
  if (!raw) return null;
  // Prototype: only three classes have a real video; every other class borrows one of them in turn, so every class plays.
  const demo = papers.flatMap((p) => p.chapters.flatMap((c) => c.items)).flatMap((i) => (i.kind === "video" && i.youtubeId ? [i.youtubeId] : []));
  let turn = 0;
  const found = demo.length
    ? {
        ...raw,
        chapters: raw.chapters.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.kind === "video" && !i.youtubeId ? { ...i, youtubeId: demo[turn++ % demo.length] } : i)),
        })),
      }
    : raw;
  const paper = guest
    ? {
        ...found,
        chapters: found.chapters.map((c) => ({
          ...c,
          items: c.items.map((i) => ({ ...i, status: "new" as const, watchedSec: undefined, score: undefined })),
        })),
      }
    : found;
  const chapters = buildChapters(paper);
  const done = chapters.reduce((n, c) => n + c.done, 0);
  const total = chapters.reduce((n, c) => n + c.total, 0);
  return { paper, chapters, done, total };
});

/* ---------- course home ---------- */

/** One folder label ("Weekly Exam") across the course's subjects, so it is listed once with a link per subject. */
export type FolderRow = { label: string; kind: "exam" | "resource"; links: { subject: string; url: string }[] };

/** Upcoming items shown on the course home before "ফুল রুটিন". */
export const COURSE_ROUTINE_LIMIT = 3;
export const TENTEN_PROMPT_LIMIT = 8;

/**
 * Everything scoped to one enrolled course: its subjects, its own routine, and its
 * exam and resource folders. `null` when the student isn't enrolled in it.
 */
export const getCourseHome = cache(async (ctx: DataContext, courseId: string) => {
  const [{ enrolled }, { groups: allGroups }, classes, { papers }] = await Promise.all([
    loadFile(ctx, "courses"),
    loadFile(ctx, "subjects"),
    getClasses(ctx),
    loadFile(ctx, "syllabus"),
  ]);
  const course = enrolled.find((c) => c.id === courseId);
  if (!course) return null;

  const groups = allGroups.filter((g) => g.courseId === courseId);
  const upcoming = classes.upcoming.filter((c) => c.courseId === courseId);
  const missed = classes.missed.filter((c) => c.courseId === courseId);

  const folders = new Map<string, FolderRow>();
  for (const g of groups) {
    for (const f of g.folders) {
      const key = `${f.kind}:${f.label.trim().toLowerCase()}`;
      const row = folders.get(key) ?? { label: f.label, kind: f.kind, links: [] };
      row.links.push({ subject: g.subject ?? g.title, url: f.url });
      folders.set(key, row);
    }
  }
  // Folders most subjects share first: they are the course's regular rhythm.
  const sorted = [...folders.values()].sort((a, b) => b.links.length - a.links.length);

  const resume = groups.find((g) => g.continue)?.continue ?? null;
  const communityUrl = groups.find((g) => g.communityUrl)?.communityUrl ?? null;

  // Real chapter names of this course's papers, for TenTen's "e.g. …" prompt.
  const paperIds = new Set(groups.flatMap((g) => g.subjects.map((s) => s.id)));
  const chapters = papers
    .filter((p) => paperIds.has(p.id))
    .flatMap((p) => p.chapters.map((c) => c.title))
    .slice(0, TENTEN_PROMPT_LIMIT);

  return {
    course,
    groups,
    routine: { items: upcoming.slice(0, COURSE_ROUTINE_LIMIT), more: Math.max(0, upcoming.length - COURSE_ROUTINE_LIMIT), missed: missed.length },
    exams: sorted.filter((f) => f.kind === "exam"),
    resources: sorted.filter((f) => f.kind === "resource"),
    resume,
    communityUrl,
    chapters,
  };
});

/** The course a paper (subject id) belongs to, for the subject page's way back. */
export const getPaperCourse = cache(async (ctx: DataContext, paperId: string) => {
  const [{ groups }, { enrolled }] = await Promise.all([loadFile(ctx, "subjects"), loadFile(ctx, "courses")]);
  const group = groups.find((g) => g.subjects.some((s) => s.id === paperId));
  return enrolled.find((c) => c.id === group?.courseId) ?? null;
});

/** Folder labels the subject page leaves out: archive classes already sit inside each chapter. */
const PAPER_HIDDEN_FOLDERS = new Set(["archive"]);

/**
 * The exam and resource folders of a paper's subject ("Weekly Exam", "One Shot Class"), for the
 * subject page's side links. Both papers of a subject share them.
 */
export const getPaperFolders = cache(async (ctx: DataContext, paperId: string) => {
  const { groups } = await loadFile(ctx, "subjects");
  const folders = (groups.find((g) => g.subjects.some((s) => s.id === paperId))?.folders ?? []).filter(
    (f) => !PAPER_HIDDEN_FOLDERS.has(f.label.trim().toLowerCase()),
  );
  return { exams: folders.filter((f) => f.kind === "exam"), resources: folders.filter((f) => f.kind === "resource") };
});

export type PaperFolders = Awaited<ReturnType<typeof getPaperFolders>>;

/**
 * The SuperPrep paper for a subject page's paper, matched by name ("রসায়ন ১ম পত্র") until the
 * API links the two ids. `null` when SuperPrep has no such paper.
 */
export const getPaperPrepId = cache(async (ctx: DataContext, paperTitle: string) => {
  const { subjects } = await loadFile(ctx, "superprep");
  return subjects.find((s) => s.name.trim() === paperTitle.trim())?.id ?? null;
});

/* ---------- learning report ---------- */

export type ReportScope = { courseId: string | null; kind: PeriodKind; offset: number };

/**
 * The learning report for one scope. `courseId` undefined → the active batch's course
 * (so unrelated enrolments don't drag the numbers down); `null` → all courses.
 */
export const getReport = cache(async (ctx: DataContext, courseId: string | null | undefined, kind: PeriodKind, offset: number) => {
  const [data, user, { enrolled }] = await Promise.all([loadFile(ctx, "report"), getUser(ctx), loadFile(ctx, "courses")]);
  const withData = new Set([...data.classes, ...data.study, ...data.attempts].map((e) => e.courseId));
  const courses = enrolled.filter((c) => withData.has(c.id));
  const fallback = user.activeBatch.courseId && courses.some((c) => c.id === user.activeBatch.courseId) ? user.activeBatch.courseId : null;
  const selected = courseId === undefined ? fallback : courseId && courses.some((c) => c.id === courseId) ? courseId : null;
  const period = periodFor(kind, Math.min(0, offset), dhakaDay(ctx.now));
  return { courses, courseId: selected, report: buildReport(data, selected, period, ctx.now) };
});

/* ---------- onboarding ---------- */

/**
 * The subjects of each HSC group, its own and the compulsory ones, from the catalogue (OB6). Both HSC batches list the same ones,
 * so the first page's streams stand for both. Other classes have no catalogue here yet (section 9).
 */
export const getOnboardingSubjects = cache(async (ctx: DataContext) => {
  const { pages } = await loadFile(ctx, "catalog");
  const page = pages[0];
  if (!page) return {};
  const name = new Map(page.subjects.map((s) => [s.id, s.name]));
  return Object.fromEntries(
    page.streams.map((st) => [st.id, [...st.groupSubjects, ...st.compulsorySubjects].map((id) => ({ id, name: name.get(id) ?? id }))]),
  ) as Record<string, { id: string; name: string }[]>;
});

/* ---------- catalogue (HSC 27 study-plan page) ---------- */

/** The catalogue page for one batch; null for a batch this data set doesn't hold (HSC 26 stays on the main site). */
export const getCatalog = cache(async (ctx: DataContext, batchId: string, streamId: string | null) => {
  const [{ pages }, { enrolled }] = await Promise.all([loadFile(ctx, "catalog"), loadFile(ctx, "courses")]);
  const page = pages.find((p) => p.batch.id === batchId);
  return page
    ? buildCatalog(
        page,
        enrolled,
        streamId,
        pages.map((p) => p.batch.id),
      )
    : null;
});

/**
 * The classes a guest may open without logging in (CT28): for the demo, the first three classes that have
 * a demo video (Biology 1st Paper, chapter 1). The API should mark free content itself (design-audit 9.2).
 */
export const FREE_LIMIT = 3;
const freeIds = (papers: SyllabusPaper[]) =>
  new Set(
    papers
      .flatMap((p) => p.chapters.flatMap((c) => c.items.filter((i) => i.kind === "video" && i.source === "batch" && i.youtubeId)))
      .slice(0, FREE_LIMIT)
      .map((i) => i.id),
  );

export const getFreeItemIds = cache(async (ctx: DataContext) => freeIds((await loadFile(ctx, "syllabus")).papers));

/**
 * CT104 (lab `segment-home` v13): what a free student (signed in, no courses) opens on a paper: its class materials, the
 * slides and lecture sheets, in the paper's order. The classes and exams stay with the batch.
 */
export const getMaterialItemIds = cache(async (ctx: DataContext, paperId: string) => {
  const paper = (await loadFile(ctx, "syllabus")).papers.find((p) => p.id === paperId);
  return new Set(paper ? paper.chapters.flatMap((c) => c.items.filter((i) => i.kind === "slide" || i.kind === "sheet").map((i) => i.id)) : []);
});

const shared = new WeakMap<DataContext, DataContext>();
/**
 * OB15: a batch's own content (its classes in the syllabus, its live routine) is the same whoever looks. A student
 * with no courses of their own (the `new` data, the free demo student) has none of it in their data, so they read
 * the batch's from the `snapshot`. One context per request, so the cached getters still dedupe.
 */
export function batchContext(ctx: DataContext): DataContext {
  if (ctx.fixture !== "new") return ctx;
  let c = shared.get(ctx);
  if (!c) shared.set(ctx, (c = { ...ctx, fixture: "snapshot" }));
  return c;
}

/** One class in the segment page's free course (CT23): a real recorded live class from the syllabus. */
export type FreeClass = {
  id: string;
  paperId: string;
  /** Opens without logging in (CT28). */
  free: boolean;
  /** The catalogue's subject id (physics, biology …). */
  subject: string;
  paper: string;
  chapter: number;
  title: string;
  durationSec: number | null;
  /** Only the classes with a demo video play; the rest show their place in the list. */
  youtubeId: string | null;
};

// The syllabus's papers against the catalogue's subjects (the syllabus has no subject field, section 9).
const PAPER_SUBJECT: Record<string, string> = { sub_bio: "biology", sub_ph: "physics", sub_ch: "chemistry", sub_hm: "math" };

/**
 * The segment page's free classes: this batch's recorded live classes, paper by paper, in syllabus
 * order. The live free batch's own class list isn't in the data, so the real classes stand in (CT23).
 */
export const getFreeClasses = cache(async (ctx: DataContext): Promise<FreeClass[]> => {
  const { papers } = await loadFile(ctx, "syllabus");
  const free = freeIds(papers);
  return papers.flatMap((p) => {
    const subject = PAPER_SUBJECT[p.id.replace(/\d+$/, "")];
    if (!subject) return [];
    return p.chapters.flatMap((c) =>
      c.items
        .filter((i) => i.kind === "video" && i.source === "batch")
        .map((i) => ({
          id: i.id,
          paperId: p.id,
          free: free.has(i.id),
          subject,
          paper: p.title,
          chapter: c.number,
          title: i.title,
          durationSec: i.durationSec ?? null,
          youtubeId: i.youtubeId ?? null,
        })),
    );
  });
});

/** CT120 (lab `segment-home` v27): one item in "তোমার জন্য আরও ফ্রি", filed by kind. */
export type FreeShelfItem = {
  id: string;
  kind: "video" | "quiz" | "note";
  title: string;
  paperId: string;
  paper: string;
  /** The catalogue's subject id. */
  subject: string;
  chapter: number;
  at: string | null;
};

/**
 * CT120: the batch's classes, exams and sheets from the syllabus, filed by kind (exams are the quizzes; lecture sheets
 * and slides the notes), newest first. Which of them a guest gets free isn't in the data (section 9), so the page marks
 * the section as a sample. The syllabus has no suggestions.
 */
export const getFreeShelf = cache(async (ctx: DataContext): Promise<FreeShelfItem[]> => {
  const { papers } = await loadFile(ctx, "syllabus");
  const kindOf = { video: "video", exam: "quiz", sheet: "note", slide: "note" } as const;
  const items = papers.flatMap((p) => {
    const subject = PAPER_SUBJECT[p.id.replace(/\d+$/, "")];
    if (!subject) return [];
    return p.chapters.flatMap((c) =>
      c.items
        .filter((i) => i.source === "batch")
        .map((i) => ({
          id: i.id,
          kind: kindOf[i.kind],
          title: i.title,
          paperId: p.id,
          paper: p.title,
          subject,
          chapter: c.number,
          at: i.publishedAt ?? null,
        })),
    );
  });
  // Newest first where the date is known; the rest keep the syllabus order after them.
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => (b.item.at ?? "").localeCompare(a.item.at ?? "") || a.i - b.i)
    .map(({ item }) => item);
});

/** The routine's short subject names against the catalogue's subject ids. */
const ROUTINE_SUBJECT: Record<string, string> = {
  ফিজিক্স: "physics",
  রসায়ন: "chemistry",
  ম্যাথ: "math",
  বায়োলজি: "biology",
  বাংলা: "bangla",
  // CT93: HSC 28's weekly routine has these too.
  ইংরেজি: "english",
  ICT: "ict",
};

/** A batch's live class in the coming week, for the guest's "live class tonight" card (CT54). */
export type LiveSoon = { id: string; subject: string; title: string; startsAt: string; endsAt: string };

/**
 * CT54: the batch's live classes running now or starting within a week, earliest first (CT59: a week, so an open
 * page moves on to the next class when one ends; the card itself shows only today's and tomorrow's). The free batch's own
 * live schedule isn't in the data, so the paid batch's routine (`routine.json`) stands in (open question 67);
 * only the classes of that batch's courses ("HSC 27 …") count, so a batch without a routine (HSC 28) has none.
 */
export const getLiveSoon = cache(async (ctx: DataContext, batchId: string): Promise<LiveSoon[]> => {
  const { items } = await loadFile(ctx, "routine");
  const label = batchId.replace(/^hsc-/i, "HSC ");
  return items
    .flatMap((i) => (i.kind === "class" && i.course.startsWith(label) && ROUTINE_SUBJECT[i.subject] ? [i] : []))
    .filter((i) => Date.parse(i.endsAt) > ctx.now && Date.parse(i.startsAt) < ctx.now + 7 * DAY_MS)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((i) => ({ id: i.id, subject: ROUTINE_SUBJECT[i.subject], title: i.title, startsAt: i.startsAt, endsAt: i.endsAt }));
});

/* ---------- a batch's live routine, as a guest sees it (CT74) ---------- */

/** One live class of a paid batch's routine for someone not in it: no attendance; `subject` is the catalogue's id. */
export type BatchClass = LiveSoon & {
  subjectName: string;
  course: string;
  /** CT90 (lab `segment-home`): an exam window in the routine, not a class. */
  kind?: "exam";
};

type LiveItem = Extract<RoutineItem, { kind: "class" | "free" }>;

/**
 * Every live class of the batch's paid routine (the routine's own "free" classes are classes like the rest here),
 * stripped of the demo student's attendance, earliest first. As with `getLiveSoon`, the paid batch's routine is the
 * one shown (open question 67); a batch without one (HSC 28) has none.
 */
const batchItems = cache(async (ctx: DataContext, batchId: string): Promise<LiveItem[]> => {
  const { items } = await loadFile(ctx, "routine");
  const label = batchId.replace(/^hsc-/i, "HSC ");
  const own = items
    .flatMap((i) => ((i.kind === "class" || i.kind === "free") && i.course.startsWith(label) && ROUTINE_SUBJECT[i.subject] ? [i] : []))
    .map((i) => ({ ...i, kind: "class" as const, attended: undefined, watched: undefined }));
  // CT93: a batch without a routine in the data (HSC 28) takes its weekly routine from the live product pages.
  return (own.length ? own : weeklyItems(batchId, ctx.now)).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
});

/** CT93: last week, this week and the next two from a batch's weekly routine (`data/segment-home`), as routine classes. */
function weeklyItems(batchId: string, now: number): LiveItem[] {
  const slots = weeklyRoutine[batchId] ?? [];
  const first = shiftDay(weekStart(dhakaDay(now)), -7);
  return Array.from({ length: 28 }, (_, k) => shiftDay(first, k)).flatMap((day) => {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    return slots
      .filter((s) => s.days.includes(weekday))
      .map((s) => {
        const startsAt = `${day}T${s.time}:00+06:00`;
        return {
          id: `wk_${batchId}_${ROUTINE_SUBJECT[s.subject]}_${day}`,
          kind: "class" as const,
          subject: s.subject,
          title: `${s.name} · লাইভ ক্লাস`,
          course: s.course,
          startsAt,
          endsAt: new Date(Date.parse(startsAt) + WEEKLY_CLASS_MINUTES * 60_000).toISOString(),
          url: "#",
        };
      });
  });
}

/** CT74: the batch's live classes in its stream's subjects (`subjects`: catalogue ids), for the batch page's routine card. */
export async function getBatchClasses(ctx: DataContext, batchId: string, subjects: string[]): Promise<BatchClass[]> {
  return (await batchItems(ctx, batchId)).flatMap((i) => {
    const subject = ROUTINE_SUBJECT[i.subject];
    return subjects.includes(subject)
      ? [{ id: i.id, subject, subjectName: i.subject, title: i.title, course: i.course, startsAt: i.startsAt, endsAt: i.endsAt }]
      : [];
  });
}

/** CT90 (lab `segment-home`): the batch's exams in its stream's subjects, as rows of the routine card. Same source as the classes. */
export async function getBatchExams(ctx: DataContext, batchId: string, subjects: string[]): Promise<BatchClass[]> {
  const { items } = await loadFile(ctx, "routine");
  const label = batchId.replace(/^hsc-/i, "HSC ");
  return items
    .flatMap((i) => {
      const subject = ROUTINE_SUBJECT[i.subject];
      return i.kind === "exam" && i.course.startsWith(label) && subjects.includes(subject)
        ? [
            {
              id: i.id,
              subject,
              subjectName: i.subject,
              title: i.title,
              course: i.course,
              startsAt: i.startsAt,
              endsAt: i.endsAt,
              kind: "exam" as const,
            },
          ]
        : [];
    })
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/**
 * CT74: the full routine page for a batch (`/routine?batch=`): the same planner, over the batch's live classes in the
 * stream's subjects, with no one's attendance (a past class has simply ended) and the free ones (`freeLiveIds`) as
 * "ফ্রি ক্লাস". Returns the view and the free classes, for the page's login card.
 */
/** `open` (CT104): subjects (catalogue ids) whose every live class is free, no login needed (the segment page's open subjects). */
export async function getBatchRoutine(
  ctx: DataContext,
  batchId: string,
  subjects: string[],
  hard: string[],
  query: RoutineQuery,
  open: string[] = [],
) {
  const items = (await batchItems(ctx, batchId)).filter((i) => subjects.includes(ROUTINE_SUBJECT[i.subject]));
  const freeIds = new Set(
    freeLiveIds(
      items.map((i) => ({ ...i, subject: ROUTINE_SUBJECT[i.subject] })).filter((i) => !open.includes(i.subject)),
      ctx.now,
      hard,
    ),
  );
  const marked = items.map((i) => (freeIds.has(i.id) || open.includes(ROUTINE_SUBJECT[i.subject]) ? { ...i, kind: "free" as const } : i));
  return { view: buildRoutine(marked, [], ctx.now, query, { guest: true }), free: marked.filter((i) => freeIds.has(i.id)) };
}
