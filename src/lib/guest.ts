/**
 * The real live classes of the paid batch a guest gets in the routine after logging in (CT24 assumed three; the designer
 * set two on 9 Nov with the batch routine, CT74; design-audit 9.1 #67).
 */
export const LIVE_PASSES = 2;

/**
 * CT74: which of the paid batch's live classes are the free ones: the next LIVE_PASSES that haven't ended, from the
 * subjects the student finds hard when we know them (the onboarding's "বস লেভেল"), else from the whole routine shown.
 * `subject` is the catalogue's subject id ("biology"). Pure, so the batch page's card and the full routine agree.
 */
export function freeLiveIds<T extends { id: string; subject: string; startsAt: string; endsAt: string }>(
  classes: T[],
  now: number,
  hard: string[] = [],
): string[] {
  const ahead = classes.filter((c) => Date.parse(c.endsAt) > now).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const theirs = ahead.filter((c) => hard.includes(c.subject));
  return (theirs.length ? theirs : ahead).slice(0, LIVE_PASSES).map((c) => c.id);
}

/**
 * CT146 (lab `segment-home` v51): after a login a guest gets some classes of every subject, not two in all: here the next
 * class of each subject that hasn't ended. How many per subject is the team's call (design-audit section 9).
 */
export function freeEachSubject<T extends { id: string; subject: string; startsAt: string; endsAt: string }>(classes: T[], now: number): string[] {
  const ahead = classes.filter((c) => Date.parse(c.endsAt) > now).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const seen = new Set<string>();
  return ahead.filter((c) => !seen.has(c.subject) && seen.add(c.subject)).map((c) => c.id);
}
