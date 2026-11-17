"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { bn, bn2 } from "@/lib/bn";
import { Check, Sample } from "./ui";

/* The product as the illustration (cofounder.co's approach): small pieces of the real product,
   moving on their own. Each one starts when it scrolls into view and settles; nothing loops
   except the live dot and the countdown. */

function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ───────── Live class: counts down to the next class ───────── */

/** Sample time until the teams send the real routine (content/site.ts → PENDING). */
const SAMPLE_CLASS_HOUR = 20;

function untilNextClass(now: Date) {
  const next = new Date(now);
  next.setHours(SAMPLE_CLASS_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const s = Math.floor((next.getTime() - now.getTime()) / 1000);
  return { h: Math.floor(s / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function LiveClassCard({ subject, chapter, compact }: { subject: string; chapter: string; compact?: boolean }) {
  const [left, setLeft] = useState<ReturnType<typeof untilNextClass> | null>(null);
  useEffect(() => {
    const tick = () => setLeft(untilNextClass(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={clsx("rounded-lg border border-[#f6d5d5]", compact ? "p-3.5" : "p-4")} style={{ background: "var(--grad-live)" }}>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-live-soft px-2 py-0.5 text-xs font-semibold text-live">
          <span className="live-dot size-1.5 rounded-full bg-live text-live" />
          লাইভ ক্লাস
        </span>
        <span className="text-sm text-muted">আজ রাত {bn(SAMPLE_CLASS_HOUR - 12)}টা</span>
        <Sample className="ml-auto">নমুনা সময়</Sample>
      </div>
      <p className="mt-2.5 text-lg font-semibold leading-snug">{subject}</p>
      <p className="text-sm text-muted">{chapter}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="font-mono text-2xl font-medium tabular-nums tracking-tight" aria-live="off">
          {left ? `${bn2(left.h)}:${bn2(left.m)}:${bn2(left.s)}` : "--:--:--"}
        </p>
        <p className="pb-1 text-xs text-subtle">শুরু হতে বাকি</p>
      </div>
    </div>
  );
}

/* ───────── Practice: today's MCQ ring fills up ───────── */

export function PracticeRing() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const total = 20;
  const target = 14;
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (!seen) return;
    if (prefersReducedMotion()) return setDone(target);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setDone(n);
      if (n >= target) window.clearInterval(id);
    }, 90);
    return () => window.clearInterval(id);
  }, [seen]);

  const r = 26;
  const c = 2 * Math.PI * r;
  const answers = ["ক", "খ", "গ", "ঘ"];

  return (
    <div ref={ref} className="rounded-lg border border-[#f7dcc0] p-4" style={{ background: "var(--grad-superprep)" }}>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden>
          <defs>
            <linearGradient id="sp-ring-lg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59486" />
              <stop offset="100%" stopColor="#6045ff" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r={r} fill="none" stroke="#eeeaf7" strokeWidth="7" />
          <circle
            cx="32" cy="32" r={r} fill="none" stroke="url(#sp-ring-lg)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - done / total)}
            style={{ transition: "stroke-dashoffset 90ms linear" }}
          />
        </svg>
        <div>
          <p className="text-sm text-muted">আজকের প্র্যাকটিস</p>
          <p className="font-mono text-2xl font-medium tabular-nums" style={{ color: "var(--color-superprep-ink)" }}>
            {bn(done)}<span className="text-subtle">/{bn(total)}</span>
          </p>
          <p className="text-sm text-muted">MCQ, অধ্যায় ধরে</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden>
        {answers.map((a, i) => (
          <span
            key={a}
            className={clsx(
              "flex h-9 items-center justify-center rounded-md border text-sm transition-colors duration-300",
              seen && i === 2 ? "border-brand bg-brand-soft font-semibold text-brand-text" : "border-[#f0d9c0] bg-on-fill/70 text-muted",
            )}
          >
            {seen && i === 2 ? <Check className="size-3.5" /> : a}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ───────── Doubt solving: a question, and the answer typing itself out ───────── */

const QUESTION = "ডট গুণন আর ক্রস গুণনের পার্থক্য কী?";
const ANSWER = "ডট গুণনের ফল একটা সংখ্যা (স্কেলার), আর ক্রস গুণনের ফল একটা ভেক্টর, যার দিক দুটো ভেক্টরের তলের লম্ব বরাবর।";

export function DoubtChat() {
  const [ref, seen] = useInView<HTMLDivElement>();
  const [typed, setTyped] = useState(0);
  const chars = Array.from(ANSWER);

  useEffect(() => {
    if (!seen) return;
    if (prefersReducedMotion()) return setTyped(chars.length);
    let n = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        n += 2;
        setTyped(Math.min(n, chars.length));
        if (n >= chars.length) window.clearInterval(id);
      }, 35);
    }, 700);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [seen, chars.length]);

  const typing = seen && typed < chars.length;

  return (
    <div ref={ref} className="rounded-lg border border-[#e9defa] p-4" style={{ background: "var(--grad-tenten)" }}>
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-lg rounded-br-sm bg-ink px-3.5 py-2 text-sm leading-relaxed text-on-fill">{QUESTION}</p>
      </div>
      <div className="mt-2.5 flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-highlight-soft font-mono text-xs font-semibold text-highlight">
          ১০
        </span>
        <p className={clsx("min-h-[4.5em] max-w-[85%] rounded-lg rounded-tl-sm bg-surface px-3.5 py-2 text-sm leading-relaxed", typing && "caret")}>
          {seen ? chars.slice(0, typed).join("") : ""}
        </p>
      </div>
      <p className="mt-2 text-right text-xs text-subtle">রাত ২টায় প্রশ্ন করলেও উত্তর আসে</p>
    </div>
  );
}
