const DIGITS = "০১২৩৪৫৬৭৮৯";

/** Western digits to Bangla digits: 2027 → ২০২৭. Other characters pass through. */
export function bn(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => DIGITS[Number(d)]);
}

/** Two-digit, Bangla: 7 → ০৭. */
export function bn2(n: number): string {
  return bn(String(n).padStart(2, "0"));
}

/** Taka, in Bangla digits with Bangladeshi grouping: 11700 → ৳১১,৭০০; 100000 → ৳১,০০,০০০. */
export function taka(n: number): string {
  return `৳${bn(n.toLocaleString("en-IN"))}`;
}
