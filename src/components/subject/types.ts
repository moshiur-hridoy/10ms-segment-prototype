import type { ProgressStatus, SyllabusItemKind } from "@/lib/api/schemas";

/*
 * What the syllabus panel (a client component) receives: plain data with every
 * label already formatted on the server, since formatters can't cross to the client.
 */

export type PanelRow = {
  id: string;
  kind: SyllabusItemKind;
  /** Full title without the "Daily Exam:" style label. Used in flat (filtered) lists and search. */
  title: string;
  /** Kind label ("লেকচার স্লাইড"); a material under its class shows only this. */
  kindLabel: string;
  /** "১:২৭:২০ · ২ সেপ্টেম্বর", "৪২ পৃষ্ঠা", "১৭/২০ পেয়েছ" */
  meta: string;
  status: ProgressStatus;
  statusLabel: string;
  /** Watched share of a started video, 0–100. */
  progress?: number;
  archive: boolean;
  /**
   * Who may open it, for anyone outside the batch: `free` (the paper's one free class) opens for everyone and looks it;
   * `buy` (every other class) opens with the batch; `login` (every material) opens once logged in. Unset: open.
   */
  access?: "free" | "buy" | "login";
};

export type PanelClass = PanelRow & {
  /** "ক্লাস ২" */
  label: string;
  materials: PanelRow[];
};

/** One lesson: the live class, then last year's recording(s) of the same topic; each class keeps its own materials (`materials` here is all of them, for flat lists). */
export type PanelPair = { id: string; classes: PanelClass[]; materials: PanelRow[] };

export type PanelChapter = {
  id: string;
  /** "অধ্যায় ১" */
  label: string;
  title: string;
  /** "৮/৫০ সম্পন্ন" */
  doneLabel: string;
  progressLabel: string;
  pct: number;
  /** Chapter notes (this batch's, then the archive's). */
  notes: PanelRow[];
  /** Live and archive classes in one list (see `pairClasses`). */
  pairs: PanelPair[];
  /** Items that couldn't be placed under a class. */
  others: PanelRow[];
  /** This batch's classes; 0 shows "no live class yet". */
  liveCount: number;
};

/**
 * The syllabus filters. "live" and "archive" pick a source and keep the chapter layout (each class
 * with its own materials); "material" picks a kind (exams, slides, notes) and lists them flat.
 */
export type Filter = "all" | "live" | "archive" | "material";

export const materialKinds: SyllabusItemKind[] = ["exam", "sheet", "slide"];

/** Link to an item on the subject page, keeping other query params (e.g. dev fixtures). */
export function itemHref(path: string, query: string, id: string) {
  const params = new URLSearchParams(query);
  params.set("item", id);
  return `${path}?${params}#player`;
}
