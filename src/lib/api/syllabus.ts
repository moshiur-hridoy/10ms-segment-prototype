import type { SyllabusItem, SyllabusPaper } from "./schemas";

/*
 * Turns a paper's flat item lists into what a student scans for:
 *  - each class video with its own slide and exam underneath;
 *  - the chapter-wide lecture sheet once, at the top ("অধ্যায়ের নোট");
 *  - anything that can't be placed under "অন্যান্য", so nothing gets lost;
 *  - last year's recordings kept as their own group per chapter, and paired by topic with
 *    this batch's classes (`pairClasses`) so the list can show each next to its live class.
 * Pure (no I/O), so it is tested directly.
 */

export type ClassNode = {
  video: SyllabusItem;
  /** 1-based position among the chapter's classes of the same source ("ক্লাস ২"). */
  number: number;
  materials: SyllabusItem[];
};

export type ItemGroup = {
  notes: SyllabusItem[];
  classes: ClassNode[];
  others: SyllabusItem[];
};

export type ChapterView = {
  id: string;
  number: number;
  title: string;
  batch: ItemGroup;
  archive: ItemGroup;
  /** Batch items only; the archive is extra material and doesn't count towards progress. */
  done: number;
  total: number;
};

/** "Daily Exam: কোষ…" → "কোষ…". Only short Latin labels count as a prefix, so "অধ্যায় ১: …" stays whole. */
const PREFIX = /^[A-Za-z][A-Za-z ]{1,24}:\s*/;
export const stripPrefix = (title: string) => title.replace(PREFIX, "");

const tokens = (title: string) =>
  new Set(
    stripPrefix(title)
      .normalize("NFC")
      .toLowerCase()
      .split(/[^\p{L}\p{M}\p{N}]+/u)
      // Single letters ("ও", "a") are connectives, not topic words. Numbers always count:
      // "পর্ব ৩" and "পর্ব ৪" are different classes.
      .filter((w) => [...w].length > 1 || /\p{N}/u.test(w)),
  );

/** Dice similarity of two titles' topic words, 0–1. */
export function titleSimilarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const w of ta) if (tb.has(w)) shared++;
  return (2 * shared) / (ta.size + tb.size);
}

/** Below this a material is not confidently about one class, so it goes to "অন্যান্য". */
export const MATCH_THRESHOLD = 0.6;

function group(items: SyllabusItem[], chapterTitle: string): ItemGroup {
  const classes: ClassNode[] = items
    .filter((i) => i.kind === "video")
    .map((video, index) => ({ video, number: index + 1, materials: [] }));
  const byId = new Map(classes.map((c) => [c.video.id, c]));
  const position = new Map(items.map((item, index) => [item.id, index]));
  const notes: SyllabusItem[] = [];
  const others: SyllabusItem[] = [];

  /** The API's link if there is one, else the most similar class title; equal scores go to the nearest class in the list. */
  const ownerOf = (item: SyllabusItem) => {
    const linked = item.classId ? byId.get(item.classId) : undefined;
    if (linked) return linked;
    let owner: ClassNode | undefined;
    let bestScore = 0;
    let bestDistance = Infinity;
    for (const c of classes) {
      const score = titleSimilarity(item.title, c.video.title);
      if (score < MATCH_THRESHOLD) continue;
      const distance = Math.abs(position.get(item.id)! - position.get(c.video.id)!);
      if (score > bestScore || (score === bestScore && distance < bestDistance)) {
        owner = c;
        bestScore = score;
        bestDistance = distance;
      }
    }
    return owner;
  };

  for (const item of items) {
    if (item.kind === "video") continue;
    // A sheet named after the chapter is the chapter's notes, even if a class shares that name.
    if (item.kind === "sheet" && !item.classId && titleSimilarity(item.title, chapterTitle) >= MATCH_THRESHOLD) {
      notes.push(item);
      continue;
    }
    const owner = ownerOf(item);
    if (owner) owner.materials.push(item);
    else if (item.kind === "sheet") notes.push(item);
    else others.push(item);
  }

  // Slide before exam: study, then test yourself.
  const order = { sheet: 0, slide: 1, exam: 2, video: 3 } as const;
  for (const c of classes) c.materials.sort((a, b) => order[a.kind] - order[b.kind]);

  return { notes, classes, others };
}

export const groupItems = (g: ItemGroup): SyllabusItem[] => [
  ...g.notes,
  ...g.classes.flatMap((c) => [c.video, ...c.materials]),
  ...g.others,
];

export function buildChapters(paper: SyllabusPaper): ChapterView[] {
  return [...paper.chapters]
    .sort((a, b) => a.number - b.number)
    .map((chapter) => {
      const batch = group(chapter.items.filter((i) => i.source === "batch"), chapter.title);
      const archive = group(chapter.items.filter((i) => i.source === "archive"), chapter.title);
      const counted = groupItems(batch);
      return {
        id: chapter.id,
        number: chapter.number,
        title: chapter.title,
        batch,
        archive,
        done: counted.filter((i) => i.status === "done").length,
        total: counted.length,
      };
    });
}

/** An archive class counts as the same lesson as a live class from this score. Looser than
 *  MATCH_THRESHOLD: last year's batch split chapters differently ("নিউক্লিয়াস, DNA ও RNA" vs
 *  "DNA, RNA ও জেনেটিক কোড" scores 0.57). */
export const PAIR_THRESHOLD = 0.4;

export type ClassPair = { live: ClassNode | null; archive: ClassNode[] };

/**
 * A chapter's classes as one list: each live class with last year's recording(s) of the same
 * topic right under it (the most similar live class wins; ties go to the earlier one). Archive
 * classes that match no live class follow at the end, in their own order.
 */
export function pairClasses(chapter: Pick<ChapterView, "batch" | "archive">): ClassPair[] {
  const pairs: ClassPair[] = chapter.batch.classes.map((live) => ({ live, archive: [] }));
  const unmatched: ClassPair[] = [];
  for (const node of chapter.archive.classes) {
    let best: ClassPair | undefined;
    let bestScore = 0;
    for (const pair of pairs) {
      const score = titleSimilarity(node.video.title, pair.live!.video.title);
      if (score >= PAIR_THRESHOLD && score > bestScore) [best, bestScore] = [pair, score];
    }
    if (best) best.archive.push(node);
    else unmatched.push({ live: null, archive: [node] });
  }
  return [...pairs, ...unmatched];
}

/** Every item in reading order: chapter by chapter, batch first, then that chapter's archive. */
export const allItems = (chapters: ChapterView[]) =>
  chapters.flatMap((c) => [...groupItems(c.batch), ...groupItems(c.archive)]);

/**
 * Where to land when no item is chosen: the class the student is part-way through,
 * else the first class not yet done, else the very first item.
 */
export function resumeItem(chapters: ChapterView[]): SyllabusItem | null {
  const videos = chapters.flatMap((c) => c.batch.classes.map((k) => k.video));
  return (
    videos.find((v) => v.status === "started") ??
    videos.find((v) => v.status !== "done") ??
    allItems(chapters)[0] ??
    null
  );
}

/** The class after the one `item` belongs to, in the same source (batch or archive), across chapters. */
export function nextClass(chapters: ChapterView[], item: SyllabusItem): { chapter: ChapterView; node: ClassNode } | null {
  const key = item.source === "archive" ? "archive" : "batch";
  const flat = chapters.flatMap((chapter) => chapter[key].classes.map((node) => ({ chapter, node })));
  const at = flat.findIndex(({ node }) => node.video.id === item.id || node.materials.some((m) => m.id === item.id));
  if (at === -1) {
    // A chapter note or unmatched item: the first class of its chapter, else of a later one.
    const chapterIndex = chapters.findIndex((c) => groupItems(c[key]).some((i) => i.id === item.id));
    return flat.find(({ chapter }) => chapters.indexOf(chapter) >= chapterIndex) ?? null;
  }
  return flat[at + 1] ?? null;
}

/**
 * What to study after `item`, in order: the rest of its class's materials (slide, then exam),
 * then the next class. A chapter note or unplaced item goes straight to the next class.
 */
export function upNextSteps(chapters: ChapterView[], item: SyllabusItem): SyllabusItem[] {
  const node = locate(chapters, item.id)?.node;
  const materials = node ? (node.video.id === item.id ? node.materials : node.materials.slice(node.materials.findIndex((m) => m.id === item.id) + 1)) : [];
  const next = nextClass(chapters, item);
  return [...materials, ...(next ? [next.node.video] : [])];
}

/** An item with its chapter and the class it is (or belongs to). */
export function locate(chapters: ChapterView[], id: string) {
  for (const chapter of chapters) {
    for (const group of [chapter.batch, chapter.archive]) {
      const item = groupItems(group).find((i) => i.id === id);
      if (!item) continue;
      const node = group.classes.find((c) => c.video.id === id || c.materials.some((m) => m.id === id)) ?? null;
      return { item, chapter, node };
    }
  }
  return null;
}
