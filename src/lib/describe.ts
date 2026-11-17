import type { ClassView } from "@/lib/api";
import type { Dictionary } from "@/i18n/get-dictionary";
import { fill, type Formatter } from "@/lib/format";

/* Sentences built from data + dictionary templates. Shared by every section. */

/** "আজ" / "today", else a date like "২৮ অক্টোবর". */
export function dayWord(iso: string, fmt: Formatter, t: Dictionary) {
  const rel = fmt.relativeDay(iso);
  return rel ? t.time[rel] : fmt.date(iso);
}

/** When a class / exam / homework happens, relative to now. */
export function describeClassTime(item: ClassView, fmt: Formatter, t: Dictionary): string {
  const c = t.classes;
  const at = (template: string, iso: string) => fill(template, { day: dayWord(iso, fmt, t), time: fmt.time(iso) });

  if (item.kind === "homework") {
    return item.status === "overdue" ? c.overdue : at(c.dueAt, item.dueAt);
  }
  switch (item.status) {
    case "live":
      return fill(c.startedAt, { time: fmt.time(item.startsAt) });
    case "open":
      return fill(c.endsAt, { time: fmt.time(item.endsAt) });
    case "ended":
      return at(c.ended, item.endsAt);
    default:
      return at(c.startsAt, item.startsAt);
  }
}

/**
 * A subject card's name without the group's subject, when the header already shows it:
 * "বায়োলজি ১ম পত্র" under "বায়োলজি" → "১ম পত্র". Returns null when nothing can be dropped
 * (names that don't start with the subject, like "Reading" or "পদার্থবিজ্ঞান ১ম পত্র" under "ফিজিক্স").
 */
export function shortSubjectName(name: string, groupSubject: string | undefined): string | null {
  if (!groupSubject || !name.startsWith(groupSubject)) return null;
  const rest = name.slice(groupSubject.length).replace(/^[\s:,–—-]+/, "");
  return rest || null;
}

/**
 * A paper's own label where only a few words fit (the course home's folder books): the trailing
 * "১ম পত্র" / "2nd Paper" when the name ends with one, even under a differently named subject
 * ("উচ্চতর গণিত ১ম পত্র" under "হায়ার ম্যাথ"); otherwise the short name, then the full name.
 */
export function paperLabel(name: string, groupSubject: string | undefined): string {
  return name.match(/\S+\s+(?:পত্র|paper)$/iu)?.[0] ?? shortSubjectName(name, groupSubject) ?? name;
}
