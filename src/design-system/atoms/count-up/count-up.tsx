"use client";

import { useEffect, useState } from "react";
import { easeOutCubic, splitNumber, withNumber } from "@/lib/count-up";

const DURATION_MS = 700;

/**
 * An already formatted number ("৭৮%", "১২ দিন") that counts up from zero when it first
 * scrolls into view, then stays still (a new value counts again). Server HTML and screen
 * readers get the final text; strings with no number or several (durations, "৩/৫") are shown
 * as they are.
 * With reduced motion it never moves.
 */
export function CountUp({ value }: { value: string }) {
  // The frame's text, tagged with the value it belongs to, so a new value never shows a stale frame.
  const [frameText, setFrameText] = useState<{ of: string; text: string } | null>(null);
  const [el, setEl] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    const parts = splitNumber(value);
    if (!el || !parts || parts.value === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const n = Math.floor(parts.value * easeOutCubic(t) * 10 ** parts.decimals) / 10 ** parts.decimals;
        setFrameText({ of: value, text: t < 1 ? withNumber(parts, n) : value });
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [el, value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={setEl} aria-hidden className="tabular-nums">
        {frameText?.of === value ? frameText.text : value}
      </span>
    </>
  );
}
