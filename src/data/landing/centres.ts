import { englishCentres, links } from "./site";

/**
 * The offline English centres (L23), as the live Bangla home page lists them (captured 1 Nov 2026):
 * the five centres with their addresses and landmarks, the six courses with the ages they're for,
 * and the three things the page says about learning offline.
 */

const map = (name: string) => englishCentres.find((c) => c.name === name)!.map;

export const centres = [
  { name: "উত্তরা", address: "লিফট: ৮, হাউজ: ২, রোড: ৭, সেক্টর: ৩, উত্তরা, ঢাকা", landmark: "রাজলক্ষ্মী কমপ্লেক্সের পেছনে", map: map("উত্তরা") },
  { name: "মিরপুর", address: "লিফট: ৭, প্লট: ১১৪, সেনপাড়া পর্বতা, মিরপুর-১০, ঢাকা", landmark: "মেট্রোরেল পিলার: ২৫৬", map: map("মিরপুর") },
  { name: "পান্থপথ", address: "লিফট: ২, হাউজ: ১৪৭/এ/২, গ্রীন রোড, পান্থপথ, ঢাকা", landmark: "পান্থপথ সিগন্যালের উত্তরে", map: map("পান্থপথ") },
  { name: "মগবাজার", address: "লিফট: ৩, প্লট: ২০৬, আউটার সার্কুলার রোড, মগবাজার, ঢাকা", landmark: "ওয়ারলেস সার্কেল", map: map("মগবাজার") },
  { name: "চট্টগ্রাম", address: "লিফট: ৪, প্লট: ১৫৩, কাপাসগোলা রোড, চকবাজার, চট্টগ্রাম", landmark: "অলি খাঁ মসজিদের পূর্বে", map: map("চট্টগ্রাম") },
];

export type Age = "kids" | "junior" | "senior";

export const offlineCourses: { id: string; title: string; age: Age; ageLabel: string; img: string; href: string; contain?: boolean }[] = [
  { id: "kids", title: "Kids' English", age: "kids", ageLabel: "KG থেকে পঞ্চম শ্রেণি", img: "/img/centre/kids.jpg", href: links.product("kids-english-programme") },
  { id: "junior", title: "Spoken English Junior", age: "junior", ageLabel: "ষষ্ঠ থেকে দশম শ্রেণি", img: "/img/centre/junior.jpg", href: links.product("spoken-english-junior") },
  { id: "spoken", title: "Spoken English", age: "senior", ageLabel: "অফলাইন কোর্স", img: "/img/centre/spoken-offline.jpg", href: links.product("spoken-english-senior") },
  { id: "grammar", title: "English Grammar & Writing", age: "senior", ageLabel: "HSC ও তার পরে", img: "/img/centre/grammar-writing.jpg", href: "https://10minuteschool.com/en/product/english-grammar-and-writing/" },
  { id: "ielts", title: "IELTS Programme", age: "senior", ageLabel: "HSC ও তার পরে", img: "/img/centre/ielts-programme.jpg", href: links.product("ielts-programme") },
  { id: "abroad", title: "Study Abroad", age: "senior", ageLabel: "HSC ও তার পরে", img: "/img/products/study-abroad.jpg", href: links.studyAbroad, contain: true },
];

/** From the live page's "Learning offline, more interactively!" section. */
export const offlineBenefits = ["দেশসেরা শিক্ষকদের প্যানেল", "১-১ কাউন্সেলিং", "হাতে-কলমে শেখা"];

export const centreHeadline = "ক্লাসরুমে ইংরেজি শেখার নতুন আনন্দ";
