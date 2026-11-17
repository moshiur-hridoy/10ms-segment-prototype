/*
 * Bangladeshi mobile numbers for the login form. Students type in Bangla or Latin digits, with or
 * without the +88 prefix; the form keeps what was typed and asks this file for the canonical
 * 11-digit number (01XXXXXXXXX), or null while it isn't one yet.
 */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Bangla digits to Latin; every other character stays. */
export const latinDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

/** Digits only (Latin), with a leading 880 / 88 country code dropped when the rest is a full number. */
export function phoneDigits(input: string) {
  const d = latinDigits(input).replace(/\D/g, "");
  if (d.startsWith("880") && d.length > 11) return d.slice(2);
  if (d.startsWith("88") && d.length > 11) return d.slice(2);
  return d;
}

/** 01[3-9] followed by eight digits, or null. */
export function parsePhone(input: string): string | null {
  const d = phoneDigits(input);
  return /^01[3-9]\d{8}$/.test(d) ? d : null;
}

/** "01712 345678" for display after a number is confirmed. */
export const formatPhone = (n: string) => `${n.slice(0, 5)} ${n.slice(5)}`;

/** Latin digits to the page's digits: Bangla for "bn", unchanged for "en". */
export const localDigits = (s: string | number, lang: "bn" | "en") =>
  lang === "bn" ? String(s).replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : String(s);
