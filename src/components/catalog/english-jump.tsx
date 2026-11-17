"use client";

import { ArrowDown } from "lucide-react";

/** CT226, CT227: the "তোমার জন্য ইংলিশ ও স্কিলস কোর্স" section, where the banner's "আরও দেখো" and "ইংলিশ শিখতে এসেছি" land. */
export const ENGLISH_ID = "home-english";

/**
 * CT226, CT227: a smooth scroll to a section of the page (a jump for anyone who asks for reduced motion), the address's
 * `#id` kept. With `flash`, the section's card (`[data-flash]` inside it, else the section) is marked `data-flash="on"`
 * for a moment once the scroll stops, and draws its own green glow, so the eye finds where it landed.
 */
export function glideTo(id: string, flash = false) {
  const to = document.getElementById(id);
  if (!to) return false;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  to.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
  if (flash) {
    let done = false;
    const glow = () => {
      if (done) return;
      done = true;
      removeEventListener("scrollend", glow);
      const box = to.querySelector<HTMLElement>("[data-flash]") ?? to;
      box.dataset.flash = "on";
      setTimeout(() => (box.dataset.flash = ""), 1400);
    };
    addEventListener("scrollend", glow, { once: true });
    // Browsers without `scrollend`, and a page already in place (no scroll to end).
    setTimeout(glow, reduce ? 0 : 900);
  }
  return true;
}

/**
 * CT227 (segment-page v5): the visitor's own choice in the page's first view, without a question in the way: the page
 * opens academic first, and at the path's right end a small "ইংলিশ শিখতে এসেছি ↓" glides down to "তোমার জন্য ইংলিশ ও
 * স্কিলস কোর্স" ("ইংলিশ ↓" on phones, where the path needs the rest of the line).
 */
export function EnglishJump({ label, short }: { label: string; short: string }) {
  return (
    <a
      href={`#${ENGLISH_ID}`}
      onClick={(e) => glideTo(ENGLISH_ID, true) && e.preventDefault()}
      aria-label={label}
      className="relative inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-3 text-sm font-semibold text-brand-text press hover:border-border-strong hover:bg-raised after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-['']"
    >
      {/* On phones the path leaves room for one word: "ইংলিশ ↓". */}
      <span className="sm:hidden">{short}</span>
      <span className="max-sm:hidden">{label}</span>
      <ArrowDown className="size-4" aria-hidden />
    </a>
  );
}
