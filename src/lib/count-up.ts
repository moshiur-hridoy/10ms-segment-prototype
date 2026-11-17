/*
 * The maths behind CountUp: find the number inside an already formatted string ("৭৮%",
 * "12 days", "১,২৫০ মিনিট") and rewrite the string with a smaller number in the same style.
 * Pure, so it can be tested without a browser.
 */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const NUMBER = /[0-9০-৯](?:[0-9০-৯,]*[0-9০-৯])?(?:\.[0-9০-৯]+)?/g;

export type NumberParts = {
  before: string;
  after: string;
  value: number;
  decimals: number;
  grouped: boolean;
  bangla: boolean;
};

const toLatin = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
const toBangla = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);

/**
 * The single number in `text`, with what surrounds it. `null` when there is no number or more
 * than one ("২ ঘণ্টা ৩০ মিনিট", "৩/৫"): counting only one part of those would read wrong.
 */
export function splitNumber(text: string): NumberParts | null {
  const matches = [...text.matchAll(NUMBER)];
  if (matches.length !== 1) return null;
  const [m] = matches;
  const raw = m[0];
  const latin = toLatin(raw).replace(/,/g, "");
  return {
    before: text.slice(0, m.index),
    after: text.slice(m.index + raw.length),
    value: Number(latin),
    decimals: latin.includes(".") ? latin.split(".")[1].length : 0,
    grouped: raw.includes(","),
    bangla: /[০-৯]/.test(raw),
  };
}

/** `parts` with `n` in place of its number, in the same digits, decimals and grouping (South Asian, as bn-BD and en-IN use). */
export function withNumber(parts: NumberParts, n: number): string {
  const s = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: parts.decimals,
    maximumFractionDigits: parts.decimals,
    useGrouping: parts.grouped,
  }).format(n);
  return parts.before + (parts.bangla ? toBangla(s) : s) + parts.after;
}

/** Fast start, gentle landing: the number slows as it reaches its value. */
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
