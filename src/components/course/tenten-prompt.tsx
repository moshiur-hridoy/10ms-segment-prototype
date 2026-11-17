"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const CYCLE_MS = 3200;

/**
 * TenTen's entry, shaped like an AI prompt: type a chapter, or watch the placeholder
 * cycle through this course's real chapter names. Cycling stops while the field is
 * focused or filled, and for reduced motion. `subject` (on a paper's page) goes along,
 * so TenTen opens on that subject without asking.
 */
export function TenTenPrompt({
  href,
  chapters,
  subject,
  labels,
}: {
  href: string;
  chapters: string[];
  subject?: string;
  labels: { prompt: string; example: string; start: string };
}) {
  const hints = [labels.prompt, ...chapters.map((c) => `${labels.example} ${c}`)];
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [i, setI] = useState(0);
  const cycling = hints.length > 1 && !focused && value === "";

  useEffect(() => {
    if (!cycling || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % hints.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [cycling, hints.length]);

  return (
    <form
      role="search"
      action={href}
      // TenTen's URL isn't known yet (`#`): until then, don't reload the page.
      onSubmit={(e) => href === "#" && e.preventDefault()}
      className="flex h-11 items-center gap-2 rounded-full border border-border bg-surface pr-1.5 pl-3.5 transition-[border-color,box-shadow] hover:border-border-strong focus-within:border-tenten-violet focus-within:ring-3 focus-within:ring-tenten-violet/20"
    >
      {subject && <input type="hidden" name="subject" value={subject} />}
      <Sparkles className="size-4 shrink-0 text-tenten-violet" aria-hidden />
      <span className="relative min-w-0 flex-1">
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={labels.prompt}
          className="w-full bg-transparent text-sm text-text outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {value === "" && (
          <span
            key={focused ? "focused" : i}
            aria-hidden
            className="pointer-events-none absolute inset-0 truncate text-sm text-subtle transition-opacity duration-500 starting:opacity-0"
          >
            {focused ? labels.prompt : hints[i]}
          </span>
        )}
      </span>
      <button
        type="submit"
        aria-label={labels.start}
        className="grid size-8 shrink-0 place-items-center rounded-full text-on-fill transition-transform [background-image:var(--tenten-edge)] hover:scale-105"
      >
        <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
}
