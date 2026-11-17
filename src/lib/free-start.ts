/*
 * OB15: "ফ্রি ক্লাসগুলো ড্যাশবোর্ডে রাখো" on the segment page. There is no backend for it yet (section 9), so the
 * choice is one cookie the dashboard reads on the server: the batch, the stream and the student's hard subjects.
 * Plain values only, so both the browser and the server can import it. Logging out clears it (lib/session.ts).
 */

export const FREE_START_COOKIE = "free_start";
const MAX_AGE = 60 * 60 * 24 * 30;

export type FreeStart = { batch: string; stream: string; hard: string[] };

const SAFE = /^[a-z0-9-]+$/;

/** "hsc-27.science.physics,biology" → the choice, or null if it isn't one. */
export function parseFreeStart(raw: string | undefined | null): FreeStart | null {
  if (!raw) return null;
  let text: string;
  try {
    text = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const [batch, stream, hard = ""] = text.split(".");
  if (!batch || !stream || !SAFE.test(batch) || !SAFE.test(stream)) return null;
  return { batch, stream, hard: hard.split(",").filter((h) => SAFE.test(h)) };
}

/** Browser only: keep the free classes of this batch and stream on the dashboard. */
export function saveFreeStart(f: FreeStart) {
  const value = encodeURIComponent([f.batch, f.stream, f.hard.join(",")].join("."));
  document.cookie = `${FREE_START_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

/** Browser only: forget it (on logout). */
export function clearFreeStart() {
  document.cookie = `${FREE_START_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
