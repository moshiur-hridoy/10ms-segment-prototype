/** All dates are shown in Bangladesh time, regardless of the server's or browser's timezone. */
export const TIME_ZONE = "Asia/Dhaka";
export const DAY_MS = 86_400_000;

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });
const hourFormat = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" });

/** Calendar day in Bangladesh, "YYYY-MM-DD". */
export const dhakaDay = (ms: number) => dayFormat.format(ms);

/** Hour of day 0–23 in Bangladesh. */
export const dhakaHour = (ms: number) => Number(hourFormat.format(ms));

/** Whole days from day `b` to day `a` ("YYYY-MM-DD"). */
export const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / DAY_MS);

export const shiftDay = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
