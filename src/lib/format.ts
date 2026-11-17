import { intlLocale, type Locale } from "@/i18n/config";
import { dayDiff, dhakaDay, dhakaHour, TIME_ZONE } from "@/lib/time";

/*
 * Locale-aware formatting for both server and client.
 * Bangla mode uses Bangla digits (৪,৬০০) and Bangla time-of-day words
 * (বিকেল ৩:০০); English mode uses Latin digits and "3:00 PM".
 * All times are shown in Bangladesh time.
 */

/** Conventional Bangla time-of-day words, by starting hour.
 *  ICU's own Bangla periods differ from common usage (it calls 3 PM "দুপুর"), so we use our own. */
const BN_PERIODS: readonly [fromHour: number, word: string][] = [
  [0, "রাত"],
  [4, "ভোর"],
  [6, "সকাল"],
  [12, "দুপুর"],
  [15, "বিকেল"],
  [18, "সন্ধ্যা"],
  [20, "রাত"],
];

const bnPeriod = (hour: number) => BN_PERIODS.findLast(([from]) => hour >= from)![1];

export type Greeting = "morning" | "noon" | "afternoon" | "evening" | "night";

export function greetingFor(hour: number): Greeting {
  if (hour >= 4 && hour < 12) return "morning";
  if (hour >= 12 && hour < 15) return "noon";
  if (hour >= 15 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 20) return "evening";
  return "night";
}

export type RelativeDay = "yesterday" | "today" | "tomorrow";

type Input = string | number | Date;
const ms = (v: Input) => (typeof v === "number" ? v : typeof v === "string" ? Date.parse(v) : v.getTime());
/** "YYYY-MM-DD" is read as midday in Dhaka so it never slips to the neighbouring day. */
const dayMs = (day: string) => Date.parse(`${day}T12:00:00+06:00`);

const RELATIVE_STEPS: [limitSeconds: number, unit: Intl.RelativeTimeFormatUnit, seconds: number][] = [
  [60, "second", 1],
  [3600, "minute", 60],
  [86_400, "hour", 3600],
  [604_800, "day", 86_400],
  [2_629_800, "week", 604_800],
  [31_557_600, "month", 2_629_800],
  [Infinity, "year", 31_557_600],
];

export function createFormatter(locale: Locale, now: number) {
  const tag = intlLocale[locale];
  const number = new Intl.NumberFormat(tag);
  const twoDigits = new Intl.NumberFormat(tag, { minimumIntegerDigits: 2, useGrouping: false });
  const compact = new Intl.NumberFormat(tag, { notation: "compact", maximumFractionDigits: 1 });
  const time = new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TIME_ZONE });
  const dateFull = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });
  const dateShort = new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", timeZone: TIME_ZONE });
  // Lab `class` v25 (P118): "১২ সেপ ২৫" / "12 Sep 25", built from parts (Intl adds a comma, and en-GB says "Sept").
  const dateTiny = new Intl.DateTimeFormat(tag, { day: "numeric", month: "short", year: "2-digit", timeZone: TIME_ZONE });
  const weekday = new Intl.DateTimeFormat(tag, { weekday: "short", timeZone: TIME_ZONE });
  const dayTitle = new Intl.DateTimeFormat(tag, { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE });
  const dayOfMonth = new Intl.DateTimeFormat(tag, { day: "numeric", timeZone: TIME_ZONE });
  const relative = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
  const monthYear = new Intl.DateTimeFormat(tag, { month: "long", year: "numeric", timeZone: TIME_ZONE });
  const monthName = new Intl.DateTimeFormat(tag, { month: "short", timeZone: TIME_ZONE });
  const clock2 = new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: TIME_ZONE });
  const thisYear = dhakaDay(now).slice(0, 4);

  function timeParts(t: number) {
    const parts = time.formatToParts(t);
    const clock = parts
      .filter((p) => p.type === "hour" || p.type === "minute" || (p.type === "literal" && p.value.trim() === ":"))
      .map((p) => p.value)
      .join("");
    const period = locale === "bn" ? bnPeriod(dhakaHour(t)) : (parts.find((p) => p.type === "dayPeriod")?.value ?? "");
    return { period, clock };
  }

  return {
    locale,
    now,

    number: (n: number) => number.format(n),

    /** 1.2M / ১২ লা — for large counts like learners. */
    compact: (n: number) => compact.format(n),
    /** "ফিজিক্স, কেমিস্ট্রি ও ম্যাথ". Joined by hand: Intl.ListFormat's Bangla differs between ICU builds, so server and browser could disagree. */
    list: (items: string[]) =>
      items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")}${locale === "bn" ? " ও " : " and "}${items.at(-1)}`,

    percent: (n: number) => `${number.format(Math.round(n))}%`,

    /** Video length like a player shows it: "১:২৭:২০", or "৪৫:০৫" under an hour. */
    duration(totalSeconds: number) {
      const s = Math.max(0, Math.round(totalSeconds));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const rest = twoDigits.format(s % 60);
      return h > 0 ? `${number.format(h)}:${twoDigits.format(m)}:${rest}` : `${number.format(m)}:${rest}`;
    },

    /** bn: "বিকেল ৩:০০" · en: "3:00 PM" */
    time(v: Input) {
      const t = ms(v);
      if (locale !== "bn") return time.format(t);
      const { period, clock } = timeParts(t);
      return `${period} ${clock}`;
    },

    /** The time split for compact tiles. bn: { period: "রাত", clock: "৯:০০" } · en: { period: "PM", clock: "9:00" } */
    timeParts: (v: Input) => timeParts(ms(v)),

    /** Day, short month, two-digit year. bn: "১২ সেপ ২৫" · en: "12 Sep 25" (lab `class` v25, P118). */
    dateCompact(v: Input) {
      const p = dateTiny.formatToParts(ms(v));
      const part = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? "";
      return [part("day"), locale === "en" ? part("month").slice(0, 3) : part("month"), part("year")].join(" ");
    },

    /** "২৫ অক্টোবর" this year, "২৫ অক্টোবর, ২০২৫" otherwise. */
    date(v: Input) {
      const t = ms(v);
      return dhakaDay(t).startsWith(thisYear) ? dateShort.format(t) : dateFull.format(t);
    },

    /** When a class went up, in full (P81). bn: "০২ সেপ্টেম্বর ২০২৫, সন্ধ্যা ০৬:০৫ টা" · en: "02 September 2025, 06:05 PM" */
    dateTime(v: Input) {
      const t = ms(v);
      const d = dateFull.formatToParts(t);
      const part = (type: Intl.DateTimeFormatPartTypes) => d.find((p) => p.type === type)?.value ?? "";
      const day = twoDigits.format(Number(new Intl.DateTimeFormat("en", { day: "numeric", timeZone: TIME_ZONE }).format(t)));
      const c = clock2.formatToParts(t);
      const hm = c
        .filter((p) => p.type === "hour" || p.type === "minute" || (p.type === "literal" && p.value.trim() === ":"))
        .map((p) => p.value)
        .join("");
      // No-break spaces inside the date and inside the time (P87): on a narrow line it breaks only after the comma.
      const nb = "\u00a0";
      const date = [day, part("month"), part("year")].join(nb);
      if (locale === "bn") return `${date}, ${[bnPeriod(dhakaHour(t)), hm, "টা"].join(nb)}`;
      const period = c.find((p) => p.type === "dayPeriod")?.value;
      return `${date}, ${period ? `${hm}${nb}${period}` : hm}`;
    },

    /** Short weekday for an ISO time or a "YYYY-MM-DD" day: "শনি" / "Sat". */
    weekday: (v: Input) => weekday.format(typeof v === "string" && v.length === 10 ? dayMs(v) : ms(v)),

    /** A planner page's heading for a "YYYY-MM-DD" day: "রবিবার, ২৫ অক্টোবর" / "Sunday 25 October". */
    dayTitle: (day: string) => dayTitle.format(dayMs(day)),

    /** Day of the month in Bangladesh time: "২৫" / "25". */
    dayOfMonth: (v: Input) => dayOfMonth.format(ms(v)),

    /** Study time: bn "৩ ঘ ২০ মি" · en "3h 20m"; under an hour just minutes. */
    minutes(total: number) {
      const t = Math.max(0, Math.round(total));
      const h = Math.floor(t / 60);
      const m = t % 60;
      const [hu, mu] = locale === "bn" ? [" ঘ", " মি"] : ["h", "m"];
      if (h === 0) return `${number.format(m)}${mu}`;
      return m === 0 ? `${number.format(h)}${hu}` : `${number.format(h)}${hu} ${number.format(m)}${mu}`;
    },

    /** Two "YYYY-MM-DD" days as one range: "২৪–৩০ অক্টোবর", "২৮ সেপ্টেম্বর – ৪ অক্টোবর". */
    dayRange: (start: string, end: string) => dateShort.formatRange(dayMs(start), dayMs(end)),

    /** "অক্টোবর ২০২৬" for a "YYYY-MM-DD" day. */
    month: (day: string) => monthYear.format(dayMs(day)),

    /** The months two "YYYY-MM-DD" days fall in: "অক্টোবর ২০২৬", "অক্টোবর–নভেম্বর ২০২৬". */
    monthSpan: (start: string, end: string) => monthYear.formatRange(dayMs(start), dayMs(end)),

    /** A month's name on its own, short where the language has one: "নভেম্বর" / "Nov". */
    monthName: (day: string) => monthName.format(dayMs(day)),

    /** Day of the month for a "YYYY-MM-DD" day: "২৫". */
    dayNumber: (day: string) => dayOfMonth.format(dayMs(day)),

    /** yesterday / today / tomorrow relative to now (Bangladesh calendar), else null. */
    relativeDay(v: Input): RelativeDay | null {
      const diff = dayDiff(dhakaDay(ms(v)), dhakaDay(now));
      return diff === -1 ? "yesterday" : diff === 0 ? "today" : diff === 1 ? "tomorrow" : null;
    },

    /** "২ ঘণ্টা আগে" / "2 hours ago" / "in 3 days" */
    ago(v: Input) {
      const seconds = Math.round((ms(v) - now) / 1000);
      const abs = Math.abs(seconds);
      const [, unit, size] = RELATIVE_STEPS.find(([limit]) => abs < limit)!;
      return relative.format(Math.round(seconds / size), unit);
    },

    greeting: (): Greeting => greetingFor(dhakaHour(now)),
  };
}

export type Formatter = ReturnType<typeof createFormatter>;

/** Fill "{name}" placeholders in dictionary strings. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
