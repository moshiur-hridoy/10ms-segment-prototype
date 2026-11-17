import type { Locale } from "@/i18n/config";
import type { RoutineQuery } from "@/lib/api";

type SearchParams = Record<string, string | string[] | undefined>;
const OWN = new Set(["day", "course", "subject", "missed", "span"]);

/**
 * A link to the full routine with the current choices, changing only what's asked. Keeps the
 * dev knobs (?fixture=…). Today, no course, no subject and one week are left out, so the plain page is `/routine`.
 */
export function routineHref(lang: Locale, sp: SearchParams, current: RoutineQuery & { today: string }, change: Partial<RoutineQuery> = {}) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) if (!OWN.has(key) && typeof value === "string") q.set(key, value);
  const next = { ...current, ...change };
  // A new course resets the subject: its list of subjects is different.
  if (change.course !== undefined && change.subject === undefined) next.subject = null;
  if (next.day && next.day !== current.today) q.set("day", next.day);
  if (next.course) q.set("course", next.course);
  if (next.subject) q.set("subject", next.subject);
  if (next.missed) q.set("missed", "1");
  if (next.span !== 7) q.set("span", String(next.span));
  const s = q.toString();
  return `/${lang}/routine${s ? `?${s}` : ""}`;
}
