import type { Locale } from "@/i18n/config";
import { DEFAULT_SET_SIZE, setSearch, type SetQuery } from "@/lib/api/question-set";
import type { PrepChapter, PrepSubject } from "@/lib/api/superprep";

type SearchParams = Record<string, string | string[] | undefined>;

/** Query params that aren't about the set itself (dev knobs like ?fixture=) travel along. */
const SET_KEYS = new Set(["chapters", "types", "count", "skip", "ids", "mode", "time", "neg", "strict", "chapter"]);

export function keepQuery(sp: SearchParams) {
  const keep = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) if (typeof value === "string" && !SET_KEYS.has(key)) keep.set(key, value);
  return keep;
}

const join = (path: string, ...parts: URLSearchParams[]) => {
  const q = new URLSearchParams();
  for (const p of parts) p.forEach((v, k) => q.set(k, v));
  const s = q.toString();
  return s ? `${path}?${s}` : path;
};

/** Hub, or a paper's page. */
export function prepHref(lang: Locale, sp: SearchParams, subjectId?: string) {
  return join(`/${lang}/superprep${subjectId ? `/${subjectId}` : ""}`, keepQuery(sp));
}

/** A set of questions in a paper (practice mode unless `mode: "exam"`). */
export function examHref(lang: Locale, sp: SearchParams, subjectId: string, set: Partial<SetQuery> = {}) {
  return join(`/${lang}/superprep/${subjectId}/exam`, keepQuery(sp), setSearch(set));
}

/** Custom exam setup, optionally with a chapter preselected. */
export function customHref(lang: Locale, sp: SearchParams, subjectId: string, chapterId?: string) {
  return join(`/${lang}/superprep/${subjectId}/custom`, keepQuery(sp), new URLSearchParams(chapterId ? { chapter: chapterId } : {}));
}

/**
 * What opening a chapter practises: its unanswered questions; once all are answered, the
 * wrong ones; once those are gone too, the correct ones for revision.
 */
export function chapterSet(ch: PrepChapter): Partial<SetQuery> {
  const types: SetQuery["types"] = ch.remaining > 0 ? ["new"] : ch.wrong > 0 ? ["wrong"] : ["correct"];
  return { chapters: [ch.id], types };
}

/** How many questions opening a chapter serves: a default-size set, or fewer if that's all there is. */
export function chapterSetSize(ch: PrepChapter) {
  return Math.min(DEFAULT_SET_SIZE, ch.remaining > 0 ? ch.remaining : ch.wrong > 0 ? ch.wrong : ch.correct);
}

/** Where a paper's next step leads: the chapter's set, the mistakes, or (all done) a custom exam. */
export function nextHref(lang: Locale, sp: SearchParams, subject: PrepSubject) {
  const next = subject.next;
  if (next.kind === "continue" || next.kind === "start") return examHref(lang, sp, subject.id, chapterSet(next.chapter));
  if (next.kind === "mistakes") return examHref(lang, sp, subject.id, { types: ["wrong"] });
  return customHref(lang, sp, subject.id);
}
