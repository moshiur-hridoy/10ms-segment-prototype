/*
 * Lab `class` (P108): how the class did in a class's exam, to give the student someone to measure against.
 * Nothing in the data carries this yet (design-audit 9.2), so the two demo classes' exams have sample
 * numbers: how many took it, the average and the top score, and for a student who took it, the share of
 * takers they scored above. Real numbers replace these.
 */
export type ExamPeers = { takers: number; avg: number; top: number; total: number; ahead?: number };

export const DEMO_EXAM_PEERS: Record<string, ExamPeers> = {
  // Class 1's exam, taken (17/20): ahead of 78% of the 312 who took it.
  e_3: { takers: 312, avg: 14, top: 19, total: 20, ahead: 78 },
  // Class 2's exam, not taken yet.
  e_6: { takers: 287, avg: 13, top: 20, total: 20 },
};
