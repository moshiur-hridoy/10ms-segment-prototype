"use client";

import clsx from "clsx";
import Image from "next/image";
import { useState } from "react";
import { benefits, englishCentres, links } from "@/data/landing/site";
import { LiveClassCard } from "./live";
import type { ChoiceId } from "./selection";
import { AddressProvider, useT } from "./address";
import { useSelection } from "./selection";
import { Arrow, Check, Phone, Sample } from "./ui";

/* What the page shows after a tap. Every batch link is a real product page on the live site;
   prices and class times are marked <Sample> until the teams send them. */

const p = links.product;

/* ───────── shared pieces ───────── */

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-md bg-border/60 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={clsx(
            "flex-1 rounded-md px-2 py-2 text-sm font-medium transition-all duration-150",
            value === o.id ? "bg-surface text-text shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BatchRow({ title, sub, href, tag }: { title: string; sub?: string; href: string; tag?: string }) {
  return (
    <a href={href} className="group flex items-center gap-3 rounded-md border border-border bg-surface px-3.5 py-3 active:bg-raised">
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug">{title}</span>
        {sub && <span className="block text-sm text-muted">{sub}</span>}
      </span>
      {tag && <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-text">{tag}</span>}
      <Arrow className="shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}

function Benefits() {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-2">
      {benefits.map((b) => (
        <li key={b} className="flex items-start gap-1.5 text-sm leading-snug text-muted">
          <Check className="mt-px size-3.5 shrink-0 text-brand" />
          {b}
        </li>
      ))}
    </ul>
  );
}

function Price() {
  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-border-strong px-3.5 py-3">
      <span className="text-sm text-muted">দাম</span>
      <span className="flex items-center gap-2 text-sm font-semibold">
        ৳ — <Sample>টিম থেকে আসবে</Sample>
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-medium text-subtle">{children}</p>;
}

/* ───────── HSC ───────── */

export type Group = "science" | "business" | "humanities" | "common";

export const HSC: Record<"27" | "28", Record<Group, { slug: string; subjects: string }>> = {
  "27": {
    science: { slug: "hsc-27-science-group-online-batch", subjects: "পদার্থ, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত" },
    business: { slug: "hsc-27-finance-and-accounting-online-batch", subjects: "ফিন্যান্স ও হিসাববিজ্ঞান" },
    humanities: { slug: "hsc-27-geography-and-economics-online-batch", subjects: "ভূগোল ও অর্থনীতি" },
    common: { slug: "hsc-27-online-batch-2-bangla-english-ict", subjects: "বাংলা, ইংরেজি, ICT" },
  },
  "28": {
    science: { slug: "hsc-28-online-batch-physics-chemistry-biology-higher-math", subjects: "পদার্থ, রসায়ন, জীববিজ্ঞান, উচ্চতর গণিত" },
    business: { slug: "hsc-28-online-batch-finance-accounting-management-marketing", subjects: "ফিন্যান্স, হিসাববিজ্ঞান, ব্যবস্থাপনা, মার্কেটিং" },
    humanities: { slug: "hsc-28-online-batch-geography-economics-civics", subjects: "ভূগোল, অর্থনীতি, পৌরনীতি" },
    common: { slug: "hsc-28-online-batch-bangla-english-ict", subjects: "বাংলা, ইংরেজি, ICT" },
  },
};

export const SAMPLE_CLASS: Record<Group, { subject: string; chapter: string }> = {
  science: { subject: "পদার্থবিজ্ঞান", chapter: "ভেক্টর" },
  business: { subject: "হিসাববিজ্ঞান", chapter: "দুতরফা দাখিলা পদ্ধতি" },
  humanities: { subject: "অর্থনীতি", chapter: "চাহিদা ও যোগান" },
  common: { subject: "ICT", chapter: "প্রোগ্রামিং ভাষা" },
};

export function HscAnswer() {
  const { choose } = useSelection();
  const t = useT();
  const [year, setYear] = useState<"27" | "28">("27");
  const [group, setGroup] = useState<Group>("science");
  const batch = HSC[year][group];

  return (
    <div className="space-y-4">
      <div>
        <Label>কোন সালে পরীক্ষা?</Label>
        <Segmented
          label="পরীক্ষার সাল"
          value={year}
          onChange={setYear}
          options={[
            { id: "27", label: "HSC ২৭" },
            { id: "28", label: "HSC ২৮" },
          ]}
        />
        <button onClick={() => choose("admission")} className="mt-2 text-sm text-brand-text underline decoration-border-strong underline-offset-4">
          {t("HSC ২৬ দিয়েছো? তোমার জন্য ভর্তি প্রস্তুতি →", "সন্তান HSC ২৬ দিয়েছে? তার জন্য ভর্তি প্রস্তুতি →")}
        </button>
      </div>
      <div>
        <Label>বিভাগ</Label>
        <Segmented
          label="বিভাগ"
          value={group}
          onChange={setGroup}
          options={[
            { id: "science", label: "বিজ্ঞান" },
            { id: "business", label: "ব্যবসায়" },
            { id: "humanities", label: "মানবিক" },
          ]}
        />
      </div>

      <div className="rise" key={`${year}-${group}`}>
        <LiveClassCard compact subject={SAMPLE_CLASS[group].subject} chapter={`HSC ${year === "27" ? "২৭" : "২৮"} · ${SAMPLE_CLASS[group].chapter}`} />
      </div>

      <div className="space-y-2">
        <BatchRow title={`HSC ${year === "27" ? "২৭" : "২৮"} অনলাইন ব্যাচ`} sub={batch.subjects} href={p(batch.slug)} tag="ভর্তি চলছে" />
        <BatchRow title={t("সাথে নিতে পারো", "সাথে নিতে পারেন")} sub={HSC[year].common.subjects} href={p(HSC[year].common.slug)} />
      </div>

      <Benefits />
      <Price />

      <div className="flex flex-col gap-2 pt-1">
        <a href={links.freeClassHsc} className="btn-primary flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-base font-semibold">
          {t("ফ্রি ক্লাস করো", "ফ্রি ক্লাস দেখুন")} <Arrow />
        </a>
        <p className="text-center text-xs text-subtle">ফ্রি ক্লাসে কোনো টাকা লাগে না</p>
      </div>
    </div>
  );
}

/* ───────── SSC ───────── */

export function SscAnswer() {
  const [cls, setCls] = useState<"9" | "10">("10");
  return (
    <div className="space-y-4">
      <Segmented
        label="শ্রেণি"
        value={cls}
        onChange={setCls}
        options={[
          { id: "9", label: "৯ম · SSC ২৮" },
          { id: "10", label: "১০ম · SSC ২৭" },
        ]}
      />
      <div className="rise space-y-2" key={cls}>
        {cls === "9" ? (
          <>
            <BatchRow title="৯ম শ্রেণি · বিজ্ঞান" sub="অনলাইন ব্যাচ ২০২৬" href={p("class-9-online-batch-2026-science-ssc-28")} />
            <BatchRow title="৯ম শ্রেণি · ব্যবসায় ও মানবিক" sub="অনলাইন ব্যাচ ২০২৬" href={p("class-9-online-batch-2026-business-studies-and-humanities-ssc-28")} />
            <BatchRow title="৯ম শ্রেণি · বাংলা, ইংরেজি, ICT" sub="সব বিভাগের জন্য" href={p("class-9-online-batch-2026-bangla-english-ict-ssc-28")} />
          </>
        ) : (
          <>
            <BatchRow title="১০ম শ্রেণি · বিজ্ঞান" sub="অনলাইন ব্যাচ ২০২৬" href={p("class-10-online-batch-2026-science-ssc-27")} />
            <BatchRow title="১০ম শ্রেণি · বাংলা, ইংরেজি, ICT" sub="সব বিভাগের জন্য" href={p("class-10-online-batch-2026-bangla-english-ict-ssc-27")} />
            <BatchRow title="SSC ২৭ ফাইনাল প্রস্তুতি · ব্যবসায় শিক্ষা" href={p("ssc-27-business-studies-final-preparation-course")} />
            <BatchRow title="SSC ২৭ ফাইনাল প্রস্তুতি · মানবিক" href={p("ssc-27-humanities-final-preparation-course")} />
          </>
        )}
      </div>
      <Benefits />
      <Price />
    </div>
  );
}

/* ───────── Class 5–8 ───────── */

export function JuniorAnswer() {
  const t = useT();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <BatchRow title="৬ষ্ঠ শ্রেণি" sub="অনলাইন ব্যাচ ২০২৬" href={p("class-6-online-batch-2026")} />
        <BatchRow title="৭ম শ্রেণি" sub="অনলাইন ব্যাচ ২০২৬" href={p("class-7-online-batch-2026")} />
        <BatchRow title="৮ম শ্রেণি" sub="অনলাইন ব্যাচ ২০২৬" href={p("class-8-online-batch-2026")} />
      </div>
      <p className="flex items-center gap-2 text-sm text-muted">
        {t("৫ম শ্রেণিতে পড়ো?", "সন্তান ৫ম শ্রেণিতে পড়ে?")} <a href={links.phone} className="font-semibold text-brand-text">{t("১৬৯১০-এ জিজ্ঞেস করো", "১৬৯১০-এ জিজ্ঞেস করুন")}</a>
        <Sample>নিশ্চিত হবে</Sample>
      </p>
      <Benefits />
      <Price />
    </div>
  );
}

/* ───────── University admission ───────── */

export function AdmissionAnswer() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">ভার্সিটি ভর্তি আর GST, ইউনিট ধরে পুরো প্রস্তুতি।</p>
      <div className="space-y-2">
        <BatchRow title="A ইউনিট · বিজ্ঞান" sub="ভার্সিটি ও GST ভর্তি কোর্স ২০২৬" href={p("varsity-a-unit-and-gst-admission-course-2026")} tag="ভর্তি চলছে" />
        <BatchRow title="B ইউনিট · মানবিক" sub="ভার্সিটি ও GST ভর্তি কোর্স ২০২৬" href={p("varsity-b-unit-and-gst-admission-course-2026")} />
        <BatchRow title="C ইউনিট · ব্যবসায় শিক্ষা" sub="ভার্সিটি ও GST ভর্তি কোর্স ২০২৬" href={p("varsity-c-unit-and-gst-admission-course-2026")} />
      </div>
      <Price />
    </div>
  );
}

/* ───────── English (online and the five centres) ───────── */

export function EnglishAnswer() {
  const t = useT();
  const [mode, setMode] = useState<"online" | "centre">("online");
  return (
    <div className="space-y-4">
      <Segmented
        label="কীভাবে শিখবে"
        value={mode}
        onChange={setMode}
        options={[
          { id: "online", label: "ঘরে বসে, অনলাইনে" },
          { id: "centre", label: "সেন্টারে এসে" },
        ]}
      />
      <figure className="overflow-hidden rounded-lg border border-border bg-surface">
        <Image src="/img/british-council-teachers.jpg" alt="British Council সার্টিফায়েড শিক্ষকেরা" width={1200} height={736} sizes="(max-width: 480px) 100vw, 448px" className="h-auto w-full" />
      </figure>
      {mode === "online" ? (
        <div className="rise space-y-2" key="online">
          <BatchRow title="ঘরে বসে Spoken English" href={p("ghore-boshe-spoken-english")} />
          <BatchRow title="IELTS Course" href={p("ielts-course")} />
          <BatchRow title="IELTS LIVE Batch" sub="লাইভ ক্লাসে" href={p("ielts-live-batch")} />
          <BatchRow title="Complete English Grammar" href={p("english-grammar-course")} />
          <BatchRow title="English for Professionals" sub="চাকরিজীবীদের জন্য" href={p("english-for-professionals-course")} />
          <a href={links.englishOnline} className="flex items-center gap-1 pt-1 text-sm font-semibold text-brand-text">
            সব অনলাইন কোর্স <Arrow />
          </a>
        </div>
      ) : (
        <div className="rise space-y-4" key="centre">
          <div className="space-y-2">
            <BatchRow title="Kids' English" sub="KG থেকে ৫ম শ্রেণি" href={p("kids-english-programme")} />
            <BatchRow title="Spoken English Junior" sub="৬ষ্ঠ থেকে ১০ম শ্রেণি" href={p("spoken-english-junior")} />
            <BatchRow title="Spoken English" sub="HSC ও তার পরে" href={p("spoken-english-senior")} />
            <BatchRow title="IELTS Programme" sub="HSC ও তার পরে" href={p("ielts-programme")} />
          </div>
          <div>
            <Label>{t("তোমার কাছের সেন্টার", "আপনার কাছের সেন্টার")}</Label>
            <div className="flex flex-wrap gap-1.5">
              {englishCentres.map((c) => (
                <a key={c.name} href={c.map} className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm">
                  {c.name}
                </a>
              ))}
            </div>
          </div>
          <a href={links.englishCentreFreeClass} className="btn-primary flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-base font-semibold">
            {t("সেন্টারে ফ্রি ক্লাস বুক করো", "সেন্টারে ফ্রি ক্লাস বুক করুন")} <Arrow />
          </a>
        </div>
      )}
    </div>
  );
}

/* ───────── Guardian ───────── */

const CHILD_CLASSES: { id: Exclude<ChoiceId, "english" | "guardian">; label: string }[] = [
  { id: "class5to8", label: "৫ম–৮ম" },
  { id: "ssc", label: "৯ম–১০ম" },
  { id: "hsc", label: "একাদশ–দ্বাদশ" },
  { id: "admission", label: "ভর্তি" },
];

export function GuardianAnswer() {
  const [child, setChild] = useState<(typeof CHILD_CLASSES)[number]["id"] | null>(null);
  return (
    <div className="space-y-4">
      <a href={links.phone} className="flex items-center gap-3 rounded-lg bg-ink p-4 text-on-fill">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-on-fill/10">
          <Phone className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block font-mono text-2xl font-medium tracking-tight">১৬৯১০</span>
          <span className="block text-sm text-on-fill/70">২৪ ঘণ্টা খোলা · কোর্স, দাম, ক্লাসের সময়, যা জানতে চান</span>
        </span>
        <Arrow className="text-on-fill/60" />
      </a>

      <div>
        <Label>সন্তান কোন ক্লাসে পড়ে?</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {CHILD_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setChild(c.id)}
              aria-pressed={child === c.id}
              className={clsx(
                "rounded-md border px-1 py-2.5 text-sm font-medium transition-colors",
                child === c.id ? "border-brand bg-brand-soft text-brand-text" : "border-border bg-surface",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {child ? (
        <div className="rise" key={child}>
          <AddressProvider formal>
            <Answer id={child} />
          </AddressProvider>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <p className="text-base font-semibold">প্রতি সপ্তাহে সন্তান যা পাবে</p>
          <Benefits />
        </div>
      )}
    </div>
  );
}

export function Answer({ id }: { id: ChoiceId }) {
  switch (id) {
    case "hsc": return <HscAnswer />;
    case "ssc": return <SscAnswer />;
    case "class5to8": return <JuniorAnswer />;
    case "admission": return <AdmissionAnswer />;
    case "english": return <EnglishAnswer />;
    case "guardian": return <GuardianAnswer />;
  }
}
