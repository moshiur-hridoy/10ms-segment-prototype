/** Keys 1–6, Latin or Bangla digits, pick an option (0-based). Shared by practice and the exam hall. */
export const DIGITS: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5, "১": 0, "২": 1, "৩": 2, "৪": 3, "৫": 4, "৬": 5 };

/** Shortcuts stay out of the way while the student types somewhere, or holds a modifier for a browser shortcut. */
export function ignoreKey(e: KeyboardEvent): boolean {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  return Boolean(el?.closest("input, textarea, select, [contenteditable='true']"));
}
