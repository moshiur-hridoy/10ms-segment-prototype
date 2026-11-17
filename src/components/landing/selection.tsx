"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { links } from "@/data/landing/site";

export type ChoiceId = "class5to8" | "ssc" | "hsc" | "admission" | "english" | "guardian";

export type Choice = {
  id: ChoiceId;
  /** The tile in the hero. */
  label: string;
  sub: string;
  /** The tile turns into this sentence once picked: the page "answers back". */
  sentence: string;
  /** The one main action for this visitor (sticky bar and the end of the page). */
  cta: { label: string; href: string };
};

export const CHOICES: Choice[] = [
  { id: "class5to8", label: "৫ম–৮ম", sub: "শ্রেণি", sentence: "আমি ৫ম–৮ম শ্রেণিতে পড়ি", cta: { label: "তোমার ক্লাসের ব্যাচ দেখো", href: "#answer" } },
  { id: "ssc", label: "৯ম–১০ম", sub: "SSC", sentence: "আমি ৯ম–১০ম শ্রেণিতে পড়ি", cta: { label: "তোমার SSC ব্যাচ দেখো", href: "#answer" } },
  { id: "hsc", label: "একাদশ–দ্বাদশ", sub: "HSC", sentence: "আমি একাদশ–দ্বাদশে পড়ি", cta: { label: "HSC ফ্রি ক্লাস করো", href: links.freeClassHsc } },
  { id: "admission", label: "ভর্তি পরীক্ষা", sub: "ভার্সিটি", sentence: "আমি ভর্তি পরীক্ষা দেবো", cta: { label: "তোমার ইউনিট বেছে নাও", href: "#answer" } },
  { id: "english", label: "ইংলিশ", sub: "সব বয়স", sentence: "আমি ইংলিশ শিখতে চাই", cta: { label: "সেন্টারে ফ্রি ক্লাস বুক করো", href: links.englishCentreFreeClass } },
  { id: "guardian", label: "আমি অভিভাবক", sub: "সন্তানের জন্য", sentence: "আমি একজন অভিভাবক", cta: { label: "১৬৯১০-এ কল করুন, ২৪ ঘণ্টা", href: links.phone } },
];

export const choiceById = (id: ChoiceId | null) => CHOICES.find((c) => c.id === id) ?? null;

const STORAGE_KEY = "10ms-landing-choice";

type Ctx = { choice: ChoiceId | null; choose: (id: ChoiceId | null) => void };
const SelectionContext = createContext<Ctx>({ choice: null, choose: () => {} });

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoice] = useState<ChoiceId | null>(null);

  // The page remembers the visitor's answer, so the next visit opens on their class.
  // `?choice=hsc` opens a given answer directly (for reviews and screenshots); `?choice=none` clears it.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("choice");
    if (param === "none") return window.localStorage.removeItem(STORAGE_KEY);
    const saved = (param ?? window.localStorage.getItem(STORAGE_KEY)) as ChoiceId | null;
    if (saved && CHOICES.some((c) => c.id === saved)) setChoice(saved);
  }, []);

  const choose = useCallback((id: ChoiceId | null) => {
    setChoice(id);
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return <SelectionContext.Provider value={{ choice, choose }}>{children}</SelectionContext.Provider>;
}

export const useSelection = () => useContext(SelectionContext);
