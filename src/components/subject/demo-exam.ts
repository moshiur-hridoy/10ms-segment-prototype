/*
 * Lab `class` v39 (P132): what the exam page shows before the start, which comes from the exam's own
 * API (design-audit §9.2: time, pass mark, whether its deadline has passed). Sample values until then,
 * in the live site's shape (10 questions · 10 minutes · pass 40%); only the question count is real data.
 */

export type ExamFacts = { minutes: number; passPct: number; closed: boolean };

const SAMPLE: Record<string, Partial<ExamFacts>> = {
  // Class 1's exam (taken): its deadline has passed, so it is open for practice.
  e_3: { closed: true },
};

/** Sample facts for an exam: one minute per question, pass at 40%, open unless listed. */
export const demoExam = (id: string, questions: number | undefined): ExamFacts => ({
  minutes: questions ?? 20,
  passPct: 40,
  closed: false,
  ...SAMPLE[id],
});
