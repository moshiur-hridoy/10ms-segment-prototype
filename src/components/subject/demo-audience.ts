/*
 * Lab `class` v19 (P91): sample audience for the demo. Nothing in the data says yet whether a class is
 * live or how many are watching (design-audit 9.2), so class 1 ("কোষ, কোষ তত্ত্ব…"; class 2 until P98) plays
 * as a live class with this many watching, drifting a little while it plays. Real numbers replace these.
 */
export type Audience = { live: boolean; watching: number };

export const DEMO_AUDIENCE: Record<string, Audience> = {
  v_2: { live: true, watching: 230 },
};
