import { links } from "@/data/landing/site";
import { HSC, SAMPLE_CLASS } from "../answers";
import type { ChoiceId } from "../selection";

/**
 * The desktop hero is one sentence (L8). This file holds its grammar and what the live board
 * shows for every answer. All batch links are real product pages from the live site.
 */

export type Who = "me" | "child";
export type Level = "6" | "7" | "8" | "9" | "10" | "hsc" | "admission" | "english";
export type State = {
  who: Who;
  level: Level;
  year: "27" | "28";
  group: string;
  unit: "A" | "B" | "C";
  mode: "online" | "centre";
};

export type Option = { id: string; label: string; menu?: string; tone?: Tone };
export type Tone = "junior" | "ssc" | "hsc" | "adm" | "eng";

export const WHO: Option[] = [
  { id: "me", label: "আমি", menu: "আমি নিজে" },
  { id: "child", label: "আমার সন্তান", menu: "আমার সন্তান (অভিভাবক)" },
];

export const LEVELS: Option[] = [
  { id: "6", label: "ষষ্ঠ শ্রেণিতে", menu: "ষষ্ঠ শ্রেণি", tone: "junior" },
  { id: "7", label: "সপ্তম শ্রেণিতে", menu: "সপ্তম শ্রেণি", tone: "junior" },
  { id: "8", label: "অষ্টম শ্রেণিতে", menu: "অষ্টম শ্রেণি", tone: "junior" },
  { id: "9", label: "নবম শ্রেণিতে", menu: "নবম শ্রেণি · SSC ২৮", tone: "ssc" },
  { id: "10", label: "দশম শ্রেণিতে", menu: "দশম শ্রেণি · SSC ২৭", tone: "ssc" },
  { id: "11", label: "একাদশ শ্রেণিতে", menu: "একাদশ শ্রেণি · HSC ২৮", tone: "hsc" },
  { id: "12", label: "দ্বাদশ শ্রেণিতে", menu: "দ্বাদশ শ্রেণি · HSC ২৭", tone: "hsc" },
  { id: "admission", label: "ভার্সিটি ভর্তি পরীক্ষা", menu: "ভর্তি পরীক্ষা", tone: "adm" },
  { id: "english", label: "ইংলিশ", menu: "ইংলিশ", tone: "eng" },
];

/**
 * L18: the sentence names the class, and the exam year follows from it (2026–27 session, as the
 * live site labels its batches): Class 9 sits SSC 2028, Class 10 SSC 2027, Class 11 HSC 2028,
 * Class 12 HSC 2027. So there is no separate year choice in the sentence.
 */
export const levelValue = (s: State) => (s.level === "hsc" ? (s.year === "28" ? "11" : "12") : s.level);
export const levelPatch = (id: string): Partial<State> =>
  id === "11" ? { level: "hsc", year: "28" } : id === "12" ? { level: "hsc", year: "27" } : { level: id as Level };

export const GROUPS: Partial<Record<Level, Option[]>> = {
  "9": [
    { id: "science", label: "বিজ্ঞান" },
    { id: "bh", label: "ব্যবসায় ও মানবিক" },
  ],
  "10": [
    { id: "science", label: "বিজ্ঞান" },
    { id: "business", label: "ব্যবসায় শিক্ষা" },
    { id: "humanities", label: "মানবিক" },
  ],
  hsc: [
    { id: "science", label: "বিজ্ঞান" },
    { id: "business", label: "ব্যবসায়" },
    { id: "humanities", label: "মানবিক" },
  ],
};

export const UNITS: Option[] = [
  { id: "A", label: "A ইউনিটে", menu: "A ইউনিট · বিজ্ঞান" },
  { id: "B", label: "B ইউনিটে", menu: "B ইউনিট · মানবিক" },
  { id: "C", label: "C ইউনিটে", menu: "C ইউনিট · ব্যবসায় শিক্ষা" },
];

export const MODES: Option[] = [
  { id: "online", label: "ঘরে বসে", menu: "ঘরে বসে, অনলাইনে" },
  { id: "centre", label: "সেন্টারে এসে", menu: "সেন্টারে এসে" },
];

/** Verbs agree with the subject: আমি পড়ি · আমার সন্তান পড়ে. */
export const verb = (who: Who) =>
  who === "me" ? { study: "পড়ি", sit: "দেবো", want: "শিখতে চাই" } : { study: "পড়ে", sit: "দেবে", want: "শিখতে চায়" };

export const DEFAULT: State = { who: "me", level: "hsc", year: "27", group: "science", unit: "A", mode: "online" };

/** Keep the first group valid when the level changes. */
export function normalise(s: State): State {
  const groups = GROUPS[s.level];
  if (groups && !groups.some((g) => g.id === s.group)) return { ...s, group: groups[0].id };
  return s;
}

export function toChoice(s: State): ChoiceId {
  if (s.who === "child") return "guardian";
  if (s.level === "hsc") return "hsc";
  if (s.level === "9" || s.level === "10") return "ssc";
  if (s.level === "admission" || s.level === "english") return s.level;
  return "class5to8";
}

export function fromChoice(c: ChoiceId | null): State {
  switch (c) {
    case "ssc": return { ...DEFAULT, level: "10" };
    case "class5to8": return { ...DEFAULT, level: "8" };
    case "admission": return { ...DEFAULT, level: "admission" };
    case "english": return { ...DEFAULT, level: "english" };
    case "guardian": return { ...DEFAULT, who: "child" };
    default: return DEFAULT;
  }
}

/* ───────── what the board shows ───────── */

export type Board = {
  title: string;
  tag?: string;
  /** Live class, practice and doubt solving: shown for academic answers. */
  live?: { subject: string; chapter: string };
  /** Plain list rows: shown for English (courses or centres). */
  list?: { title: string; sub?: string; href: string }[];
  batch?: { title: string; sub: string; href: string };
  price: boolean;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
};

const p = links.product;

export function boardFor(s: State): Board {
  // L19: guardians are addressed as আপনি.
  const t = (tumi: string, apni: string) => (s.who === "child" ? apni : tumi);
  const ask = { label: t("১৬৯১০-এ জিজ্ঞেস করো", "১৬৯১০-এ জিজ্ঞেস করুন"), href: links.phone };
  switch (s.level) {
    case "6":
    case "7":
    case "8": {
      const n = { "6": "ষষ্ঠ", "7": "সপ্তম", "8": "অষ্টম" }[s.level];
      return {
        title: `${n} শ্রেণি · অনলাইন ব্যাচ ২০২৬`,
        live: { subject: "গণিত", chapter: `${n} শ্রেণি` },
        batch: { title: `${n} শ্রেণি অনলাইন ব্যাচ`, sub: "অনলাইন ব্যাচ ২০২৬", href: p(`class-${s.level}-online-batch-2026`) },
        price: true,
        cta: { label: t("ব্যাচ দেখো", "ব্যাচ দেখুন"), href: p(`class-${s.level}-online-batch-2026`) },
        secondary: ask,
      };
    }
    case "9": {
      const science = s.group === "science";
      const slug = science ? "class-9-online-batch-2026-science-ssc-28" : "class-9-online-batch-2026-business-studies-and-humanities-ssc-28";
      return {
        title: `নবম শ্রেণি · SSC ২৮ · ${science ? "বিজ্ঞান" : "ব্যবসায় ও মানবিক"}`,
        live: science ? { subject: "পদার্থবিজ্ঞান", chapter: "নবম শ্রেণি" } : { subject: "হিসাববিজ্ঞান", chapter: "নবম শ্রেণি" },
        batch: { title: "নবম শ্রেণি অনলাইন ব্যাচ ২০২৬", sub: science ? "বিজ্ঞান বিভাগ" : "ব্যবসায় ও মানবিক বিভাগ", href: p(slug) },
        price: true,
        cta: { label: t("ব্যাচ দেখো", "ব্যাচ দেখুন"), href: p(slug) },
        secondary: ask,
      };
    }
    case "10": {
      const slug = {
        science: "class-10-online-batch-2026-science-ssc-27",
        business: "ssc-27-business-studies-final-preparation-course",
        humanities: "ssc-27-humanities-final-preparation-course",
      }[s.group as "science" | "business" | "humanities"];
      const label = { science: "বিজ্ঞান", business: "ব্যবসায় শিক্ষা", humanities: "মানবিক" }[s.group as "science"];
      return {
        title: `দশম শ্রেণি · SSC ২৭ · ${label}`,
        live: { subject: s.group === "science" ? "রসায়ন" : "বাংলা", chapter: "SSC ২৭" },
        batch: {
          title: s.group === "science" ? "দশম শ্রেণি অনলাইন ব্যাচ ২০২৬" : "SSC ২৭ ফাইনাল প্রস্তুতি",
          sub: s.group === "science" ? "পদার্থ, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত" : label,
          href: p(slug),
        },
        price: true,
        cta: { label: t("ব্যাচ দেখো", "ব্যাচ দেখুন"), href: p(slug) },
        secondary: ask,
      };
    }
    case "hsc": {
      const g = (s.group in HSC[s.year] ? s.group : "science") as keyof (typeof HSC)["27"];
      const yr = s.year === "27" ? "২৭" : "২৮";
      return {
        title: `HSC ${yr} · ${{ science: "বিজ্ঞান", business: "ব্যবসায়", humanities: "মানবিক", common: "" }[g]}`,
        tag: "ভর্তি চলছে",
        live: { subject: SAMPLE_CLASS[g].subject, chapter: SAMPLE_CLASS[g].chapter },
        batch: { title: `HSC ${yr} অনলাইন ব্যাচ`, sub: HSC[s.year][g].subjects, href: p(HSC[s.year][g].slug) },
        price: true,
        cta: { label: t("ফ্রি ক্লাস করো", "ফ্রি ক্লাস দেখুন"), href: links.freeClassHsc },
        secondary: { label: "ব্যাচের বিস্তারিত", href: p(HSC[s.year][g].slug) },
      };
    }
    case "admission": {
      const slug = `varsity-${s.unit.toLowerCase()}-unit-and-gst-admission-course-2026`;
      const name = UNITS.find((u) => u.id === s.unit)!.menu!;
      return {
        title: `ভার্সিটি ও GST ভর্তি · ${name}`,
        tag: "ভর্তি চলছে",
        live: { subject: s.unit === "A" ? "পদার্থবিজ্ঞান" : s.unit === "B" ? "বাংলা" : "হিসাববিজ্ঞান", chapter: "ভর্তি প্রস্তুতি" },
        batch: { title: "ভার্সিটি ও GST ভর্তি কোর্স ২০২৬", sub: name, href: p(slug) },
        price: true,
        cta: { label: t("কোর্স দেখো", "কোর্স দেখুন"), href: p(slug) },
        secondary: ask,
      };
    }
    case "english":
      return s.mode === "online"
        ? {
            title: "ইংলিশ · ঘরে বসে, অনলাইনে",
            list: [
              { title: "ঘরে বসে Spoken English", href: p("ghore-boshe-spoken-english") },
              { title: "IELTS Course", href: p("ielts-course") },
              { title: "IELTS LIVE Batch", sub: "লাইভ ক্লাসে", href: p("ielts-live-batch") },
              { title: "Complete English Grammar", href: p("english-grammar-course") },
            ],
            price: false,
            cta: { label: "সব অনলাইন কোর্স", href: links.englishOnline },
          }
        : {
            title: "ইংলিশ · সেন্টারে এসে",
            list: [
              { title: "Kids' English", sub: "KG থেকে পঞ্চম শ্রেণি", href: p("kids-english-programme") },
              { title: "Spoken English Junior", sub: "ষষ্ঠ থেকে দশম শ্রেণি", href: p("spoken-english-junior") },
              { title: "Spoken English", sub: "HSC ও তার পরে", href: p("spoken-english-senior") },
              { title: "IELTS Programme", sub: "HSC ও তার পরে", href: p("ielts-programme") },
            ],
            price: false,
            cta: { label: t("সেন্টারে ফ্রি ক্লাস বুক করো", "সেন্টারে ফ্রি ক্লাস বুক করুন"), href: links.englishCentreFreeClass },
            secondary: { label: "উত্তরা · পান্থপথ · মিরপুর · মগবাজার · চট্টগ্রাম", href: links.englishOffline },
          };
  }
}

/** The hero's sentence as plain text, e.g. "আমি দ্বাদশ শ্রেণিতে পড়ি, বিজ্ঞান বিভাগে।" */
export function sentenceOf(s: State): string {
  const v = verb(s.who);
  const who = WHO.find((w) => w.id === s.who)!.label;
  const level = LEVELS.find((l) => l.id === levelValue(s))!.label;
  if (s.level === "admission") return `${who} ${level} ${v.sit}, ${UNITS.find((u) => u.id === s.unit)!.label}।`;
  if (s.level === "english") return `${who} ${level} ${v.want}, ${MODES.find((m) => m.id === s.mode)!.label}।`;
  const group = GROUPS[s.level]?.find((g) => g.id === s.group)?.label;
  return group ? `${who} ${level} ${v.study}, ${group} বিভাগে।` : `${who} ${level} ${v.study}।`;
}
