/** CT186: how many of the newest uploads the segment page's sheet lists. */
export const NEW_IN_SHEET = 12;

/**
 * A stream's new uploads, as the segment page lists them: its subjects' dated items, newest first (the free shelf comes
 * sorted), the first `NEW_IN_SHEET`. The designer's rule: outside the batch these are free to watch once logged in, so a
 * student who taps one on the segment page and logs in gets the class, not a lock.
 */
export const newUploads = <T extends { subject: string; at: string | null }>(items: T[], subjects: string[]) =>
  items.filter((i) => i.at && subjects.includes(i.subject)).slice(0, NEW_IN_SHEET);
