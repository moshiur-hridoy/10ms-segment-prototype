import type { SubjectOption } from "@/design-system/molecules/subject-filter";

export type SearchParams = Record<string, string | string[] | undefined>;

/** "All subjects" plus one option per subject; each href keeps every other query param and sets `subject`. */
export function subjectOptions(sp: SearchParams, subjects: string[], allLabel: string): SubjectOption[] {
  const hrefFor = (value: string | null) => {
    const next = new URLSearchParams();
    for (const [key, v] of Object.entries(sp)) {
      if (key === "subject" || v === undefined) continue;
      for (const item of Array.isArray(v) ? v : [v]) next.append(key, item);
    }
    if (value) next.set("subject", value);
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };
  return [{ value: "all", label: allLabel, href: hrefFor(null) }, ...subjects.map((s) => ({ value: s, label: s, href: hrefFor(s) }))];
}
