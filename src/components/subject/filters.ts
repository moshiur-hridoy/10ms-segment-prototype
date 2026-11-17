import { materialKinds, type Filter, type PanelChapter, type PanelRow } from "./types";

/** Does a row belong to the chosen source? Kind filters ("material") and "all" take every source. */
export const bySource = (r: PanelRow, filter: Filter) => (filter === "live" ? !r.archive : filter === "archive" ? r.archive : true);

/** A source filter (লাইভ, আর্কাইভ) shows classes only; notes, slides and exams are under পরীক্ষা ও নোট. */
const isSource = (filter: Filter) => filter === "live" || filter === "archive";

/**
 * Lab `class` v47 (P140): under লাইভ (shown as অনলাইন) each class keeps its own slide and exam.
 * আর্কাইভ still shows classes only.
 */
const keepsMaterials = (filter: Filter, liveMaterials: boolean) => liveMaterials && filter === "live";

/** A row in a flat list (exams and notes, or a search): the source, the kind, then the query. */
export const matchesFilter = (r: PanelRow, filter: Filter, q: string, liveMaterials = false) =>
  bySource(r, filter) &&
  (!isSource(filter) || r.kind === "video" || (keepsMaterials(filter, liveMaterials) && materialKinds.includes(r.kind))) &&
  (filter !== "material" || materialKinds.includes(r.kind)) &&
  (!q || r.title.toLowerCase().includes(q));

/** A chapter with only the chosen source's classes: no notes, no leftovers, and (except under লাইভ in v47) no materials. */
export function scopeChapter(c: PanelChapter, filter: Filter, liveMaterials = false): PanelChapter {
  if (!isSource(filter)) return c;
  const keep = keepsMaterials(filter, liveMaterials);
  return {
    ...c,
    notes: [],
    others: [],
    pairs: c.pairs
      .map((p) => {
        const classes = p.classes.filter((r) => bySource(r, filter)).map((r) => (keep ? r : { ...r, materials: [] }));
        return { ...p, classes, materials: classes.flatMap((r) => r.materials) };
      })
      .filter((p) => p.classes.length > 0),
  };
}
