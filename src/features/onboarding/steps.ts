import { GROUPS, levelPatch, normalise, DEFAULT, levelValue, type State as LandingState } from "@/components/landing/desktop/model";

/*
 * Onboarding (OB1–OB2): TenTen asks one question at a time and each answer lands on the student's
 * card. The classes, groups and units are the landing hero's (`landing/desktop/model.ts`), so the
 * landing page and the app ask the same thing; only their words come from the dictionaries.
 */

export type ClassId = "6" | "7" | "8" | "9" | "10" | "11" | "12" | "admission" | "english";
export type UnitId = "A" | "B" | "C";
/** OB14: how a subject feels; `hard` is the "boss level". */
export type Mood = "easy" | "ok" | "hard";

export const CLASSES: ClassId[] = ["6", "7", "8", "9", "10", "11", "12", "admission", "english"];
export const UNITS: UnitId[] = ["A", "B", "C"];
export const AVATARS = ["😎", "🤓", "🦁", "🐼", "🚀", "🌸", "⚡", "🎧"];

export type Answers = {
  name: string;
  avatar: string | null;
  cls: ClassId | null;
  group: string | null;
  unit: UnitId | null;
  /** Subject ids from the catalogue the student finds hard; null until asked or skipped. */
  hard: string[] | null;
  /** OB14: each subject's mood (easy, so-so, hard); `hard` above is the subjects marked hard, in the stream's order. */
  moods: Record<string, Mood>;
};

export const EMPTY: Answers = { name: "", avatar: null, cls: null, group: null, unit: null, hard: null, moods: {} };

export type StepId = "hello" | "name" | "class" | "group" | "unit" | "subjects" | "done";

/** Group ids per class: Class 9 has science / business-and-humanities, 10–12 the three groups. */
export function groupsFor(cls: ClassId | null): string[] {
  if (!cls) return [];
  const level = levelPatch(cls).level ?? cls;
  return (GROUPS[level as keyof typeof GROUPS] ?? []).map((g) => g.id);
}

/** The landing's group ids against the catalogue's stream ids (HSC only has a catalogue). */
const STREAM: Record<string, string> = { science: "science", business: "business-studies", humanities: "humanities" };
export const streamOf = (group: string | null) => (group ? (STREAM[group] ?? null) : null);

export type SubjectOption = { id: string; name: string };
/** Real subjects per catalogue stream; only HSC has them so far (section 9). */
export type SubjectsByStream = Record<string, SubjectOption[]>;

/**
 * The steps this student sees, in order. Group only where the class has groups, unit only for the
 * admission test, subjects only where the catalogue has that group's real subject list.
 */
export function stepsFor(a: Answers, subjects: SubjectsByStream): StepId[] {
  const steps: StepId[] = ["hello", "name", "class"];
  if (groupsFor(a.cls).length) steps.push("group");
  if (a.cls === "admission") steps.push("unit");
  if (a.cls === "11" || a.cls === "12") {
    const stream = streamOf(a.group);
    if (!a.group || (stream && subjects[stream]?.length)) steps.push("subjects");
  }
  steps.push("done");
  return steps;
}

/** L18: the exam year follows from the class (2026–27 session): 9 → SSC 28, 10 → SSC 27, 11 → HSC 28, 12 → HSC 27. */
export function examOf(cls: ClassId | null): { exam: "SSC" | "HSC"; year: string } | null {
  if (cls === "9") return { exam: "SSC", year: "28" };
  if (cls === "10") return { exam: "SSC", year: "27" };
  if (cls === "11") return { exam: "HSC", year: "28" };
  if (cls === "12") return { exam: "HSC", year: "27" };
  return null;
}

/** The card's colour family for a class, like the landing's tones. */
export function toneOf(cls: ClassId | null): "junior" | "ssc" | "hsc" | "adm" | "eng" | null {
  if (!cls) return null;
  if (cls === "6" || cls === "7" || cls === "8") return "junior";
  if (cls === "9" || cls === "10") return "ssc";
  if (cls === "11" || cls === "12") return "hsc";
  return cls === "admission" ? "adm" : "eng";
}

/** Changing the class drops answers that no longer fit it. */
export function withClass(a: Answers, cls: ClassId): Answers {
  if (a.cls === cls) return a;
  const groups = groupsFor(cls);
  return {
    ...a,
    cls,
    group: a.group && groups.includes(a.group) ? a.group : null,
    unit: cls === "admission" ? a.unit : null,
    hard: null,
    moods: {},
  };
}

/**
 * What the landing page already knows (`10ms-landing-answer`, saved by its hero), as answers.
 * Only a student's own answer counts; a guardian's is about their child.
 */
export const LANDING_KEY = "10ms-landing-answer";
export function fromLanding(raw: string | null): Pick<Answers, "cls" | "group" | "unit"> | null {
  try {
    const saved = JSON.parse(raw ?? "null") as Partial<LandingState> | null;
    if (!saved || saved.who !== "me" || !saved.level) return null;
    const s = normalise({ ...DEFAULT, ...saved });
    const cls = levelValue(s) as ClassId;
    if (!CLASSES.includes(cls)) return null;
    return {
      cls,
      group: groupsFor(cls).length ? s.group : null,
      unit: cls === "admission" ? s.unit : null,
    };
  } catch {
    return null;
  }
}
