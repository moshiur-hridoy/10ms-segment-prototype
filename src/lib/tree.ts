/*
 * The streak tree's rules, shared by the art (client) and the pages that read them on the server
 * (the art review, the garden). Plain values only, so server components can import them.
 */

export type TreeStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type TreeMood = "fresh" | "thirsty" | "dead";
/** Each grown tree unlocks the next: apple first, then mango, lychee and orange, then round again. */
export type TreeSpecies = "apple" | "mango" | "lychee" | "orange";
export const SPECIES: TreeSpecies[] = ["apple", "mango", "lychee", "orange"];

/** The growth day each stage starts on. Growth is slow on purpose: fruit only after a month. */
export const STAGE_FROM: Record<TreeStage, number> = { 1: 1, 2: 2, 3: 3, 4: 5, 5: 7, 6: 14, 7: 21, 8: 30 };

const STAGES = (Object.entries(STAGE_FROM) as [string, number][]).map(([s, from]) => ({ stage: Number(s) as TreeStage, from }));

/** The stage a tree is at after `growth` days (a seed on day 0 and 1). */
export const stageOf = (growth: number): TreeStage => [...STAGES].reverse().find((s) => Math.max(1, growth) >= s.from)!.stage;

/** The stage after this one and the day it starts, or null for a fruiting tree. */
export const nextStage = (stage: TreeStage) => STAGES.find((s) => s.stage === stage + 1) ?? null;

/** How far through its stage the tree is (0–1), so it fills out day by day instead of jumping. */
export function growthIn(growth: number) {
  const stage = stageOf(growth);
  const next = nextStage(stage);
  return next ? (Math.max(1, growth) - STAGE_FROM[stage]) / (next.from - STAGE_FROM[stage]) : 1;
}

/** What the streak popup has to say: today's task, or what happened since the last visit. */
export type PopupSituation = "thirsty" | "rain" | "back" | "dead" | "grow";

/** The popup's situation today from the streak's state; null when there's nothing to say (watered, nothing new). */
export function popupSituation({ growth, today, yesterday }: { growth: number; today: string | undefined; yesterday: string | undefined }): PopupSituation | null {
  if (growth === 0) return "dead";
  if (today === "today-done") return (Object.values(STAGE_FROM) as number[]).includes(growth) ? "grow" : null;
  if (yesterday === "rained") return "rain";
  if (yesterday === "missed") return "back";
  return "thirsty";
}
