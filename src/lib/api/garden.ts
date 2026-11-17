import { SPECIES, stageOf, type TreeSpecies, type TreeStage } from "@/lib/tree";
import { dhakaDay, shiftDay } from "@/lib/time";
import { weekStart } from "./routine";
import type { DataOf } from "./schemas";

/*
 * The streak's orchard: the trees taken to fruit, the tree growing now, the badges (earned or how
 * far away), the fruit trees collected, and the last weeks of watering as a calendar. Pure (no I/O),
 * so it is tested directly.
 */

type GardenData = DataOf<"garden">;
type StreakData = { current: number; best: number; growth?: number; species?: TreeSpecies };

export type BadgeId = "sprout" | "seedling" | "sapling" | "young" | "full" | "bloom" | "fruit" | "water60" | "water100" | "water365";
type BadgeDef = { id: BadgeId; kind: "stage"; stage: TreeStage; need: number } | { id: BadgeId; kind: "total"; need: number };

/** One badge per stage the first time a tree reaches it, then milestones of days watered in all. */
export const BADGES: BadgeDef[] = [
  { id: "sprout", kind: "stage", stage: 2, need: 2 },
  { id: "seedling", kind: "stage", stage: 3, need: 3 },
  { id: "sapling", kind: "stage", stage: 4, need: 5 },
  { id: "young", kind: "stage", stage: 5, need: 7 },
  { id: "full", kind: "stage", stage: 6, need: 14 },
  { id: "bloom", kind: "stage", stage: 7, need: 21 },
  { id: "fruit", kind: "stage", stage: 8, need: 30 },
  { id: "water60", kind: "total", need: 60 },
  { id: "water100", kind: "total", need: 100 },
  { id: "water365", kind: "total", need: 365 },
];

export type GardenBadge = BadgeDef & { earnedDate: string | null; left: number };
export type DayMark = { date: string; status: GardenData["history"][number]["status"] | null; today: boolean; future: boolean };

export type GardenView = {
  trees: GardenData["trees"];
  current: { species: TreeSpecies; growth: number; stage: TreeStage };
  badges: GardenBadge[];
  collection: { species: TreeSpecies; count: number; unlocked: boolean }[];
  weeks: DayMark[][];
  totals: GardenData["totals"] & { best: number; grown: number };
};

/** How many weeks of watering the calendar shows, ending with this one. */
export const HISTORY_WEEKS = 5;

export function buildGarden(garden: GardenData, streak: StreakData, now: number): GardenView {
  const today = dhakaDay(now);
  const trees = [...garden.trees].sort((a, b) => a.fruitedDate.localeCompare(b.fruitedDate));
  const growth = streak.growth ?? streak.current;
  const species = streak.species ?? SPECIES[trees.length % SPECIES.length];
  const earned = new Map(garden.badges.map((b) => [b.id, b.earnedDate]));

  const badges = BADGES.map((b): GardenBadge => {
    const earnedDate = earned.get(b.id) ?? null;
    const progress = b.kind === "stage" ? growth : garden.totals.watered;
    return { ...b, earnedDate, left: earnedDate ? 0 : Math.max(0, b.need - progress) };
  });

  // The species already grown, and the one growing now, are unlocked; the rest wait their turn.
  const collection = SPECIES.map((sp) => {
    const count = trees.filter((t) => t.species === sp).length;
    return { species: sp, count, unlocked: count > 0 || sp === species };
  });

  const byDate = new Map(garden.history.map((h) => [h.date, h.status]));
  const first = shiftDay(weekStart(today), -7 * (HISTORY_WEEKS - 1));
  const weeks = Array.from({ length: HISTORY_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d): DayMark => {
      const date = shiftDay(first, w * 7 + d);
      return { date, status: byDate.get(date) ?? null, today: date === today, future: date > today };
    }),
  );

  return {
    trees,
    current: { species, growth, stage: stageOf(growth) },
    badges,
    collection,
    weeks,
    totals: { ...garden.totals, best: Math.max(streak.best, ...trees.map((t) => t.longest)), grown: trees.length },
  };
}
