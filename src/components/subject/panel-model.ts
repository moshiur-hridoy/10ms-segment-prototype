import type { Dictionary } from "@/i18n/get-dictionary";
import { pairClasses, stripPrefix, type ChapterView, type ClassNode, type SyllabusItem } from "@/lib/api";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import type { PanelChapter, PanelClass, PanelPair, PanelRow } from "./types";

/**
 * The short facts for an item: length and date for a class, pages for notes, questions or score for an exam.
 * `v` is lab `class`'s version (0 without it). From v24 (P117) a class gets only its date, in English on both
 * pages, "12 Sep 25" (P118, P119), since the API has no video length; from v29 (P122) notes and slides lose
 * their page count and a taken exam its score ("১৭/২০ পেয়েছ"), which the API doesn't give either.
 */
export function itemMeta(item: SyllabusItem, fmt: Formatter, t: Dictionary, v = 0): string {
  const light = v >= 24;
  const s = t.syllabus;
  const parts: string[] = [];
  if (item.kind === "video") {
    if (item.durationSec && !light) parts.push(fmt.duration(item.durationSec));
    if (item.publishedAt) parts.push(light ? createFormatter("en", fmt.now).dateCompact(item.publishedAt) : fmt.date(item.publishedAt));
  } else if (item.kind === "exam") {
    if (item.score && v < 29) parts.push(fill(s.score, { got: fmt.number(item.score.got), total: fmt.number(item.score.total) }));
    else if (item.questions) parts.push(fill(s.questions, { n: fmt.number(item.questions) }));
  } else if (item.pages && v < 29) {
    parts.push(fill(s.pages, { n: fmt.number(item.pages) }));
  }
  return parts.join(" · ");
}

export const watchedPct = (item: SyllabusItem) =>
  item.durationSec && item.watchedSec ? Math.min(100, (item.watchedSec / item.durationSec) * 100) : 0;

function toRow(item: SyllabusItem, fmt: Formatter, t: Dictionary, v = 0): PanelRow {
  return {
    id: item.id,
    kind: item.kind,
    title: stripPrefix(item.title),
    kindLabel: t.syllabus.kind[item.kind],
    meta: itemMeta(item, fmt, t, v),
    status: item.status,
    statusLabel: t.syllabus.status[item.status],
    progress: item.status === "started" ? watchedPct(item) : undefined,
    archive: item.source === "archive",
  };
}

/** `number` is the lesson's: an archive class paired with a live one shares its number. */
function toClass(node: ClassNode, number: number, fmt: Formatter, t: Dictionary, v: number): PanelClass {
  return {
    ...toRow(node.video, fmt, t, v),
    label: fill(t.syllabus.classN, { n: fmt.number(number) }),
    materials: node.materials.map((m) => toRow(m, fmt, t, v)),
  };
}

/** Live and archive classes as one list. Unpaired archive classes are numbered on after the live ones. */
function toPairs(c: ChapterView, fmt: Formatter, t: Dictionary, v: number): PanelPair[] {
  let next = c.batch.classes.length;
  return pairClasses(c).map(({ live, archive }) => {
    const number = live ? live.number : ++next;
    const classes = [...(live ? [live] : []), ...archive].map((node) => toClass(node, number, fmt, t, v));
    return { id: classes[0].id, classes, materials: classes.flatMap((k) => k.materials) };
  });
}

export const chapterLabel = (c: ChapterView, fmt: Formatter, t: Dictionary) => fill(t.syllabus.chapter, { n: fmt.number(c.number) });

/** `v`: lab `class`'s version, for its lighter rows (P117, P122); see `itemMeta`. */
export function toPanelChapters(chapters: ChapterView[], fmt: Formatter, t: Dictionary, v = 0): PanelChapter[] {
  return chapters.map((c) => {
    const label = chapterLabel(c, fmt, t);
    const done = fmt.number(c.done);
    const total = fmt.number(c.total);
    return {
      id: c.id,
      label,
      title: c.title,
      doneLabel: fill(t.syllabus.chapterDone, { done, total }),
      progressLabel: fill(t.syllabus.chapterProgress, { chapter: `${label}: ${c.title}`, done, total }),
      pct: c.total ? (c.done / c.total) * 100 : 0,
      notes: [...c.batch.notes, ...c.archive.notes].map((i) => toRow(i, fmt, t, v)),
      pairs: toPairs(c, fmt, t, v),
      others: [...c.batch.others, ...c.archive.others].map((i) => toRow(i, fmt, t, v)),
      liveCount: c.batch.classes.length,
    };
  });
}

/** A guest's list (CT28): the free classes marked free, every other row locked. */
export function withAccess(chapters: PanelChapter[], free: Set<string>): PanelChapter[] {
  const mark = <T extends PanelRow>(r: T): T => ({ ...r, access: free.has(r.id) ? "free" : "locked" });
  return chapters.map((c) => ({
    ...c,
    notes: c.notes.map(mark),
    others: c.others.map(mark),
    pairs: c.pairs.map((p) => {
      const classes = p.classes.map((k) => ({ ...mark(k), materials: k.materials.map(mark) }));
      return { ...p, classes, materials: classes.flatMap((k) => k.materials) };
    }),
  }));
}
