"use client";

import { ArrowUpRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Card } from "@/design-system/atoms/card";
import { useVisitor } from "@/features/segment/visitor";
import type { Locale } from "@/i18n/config";
import type { CatalogView } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";
import { STREAM_ICON } from "./stream-icons";

// The onboarding's group ids against the catalogue's stream ids (as in SegmentBody).
const GROUP_OF: Record<string, string> = { science: "science", "business-studies": "business", humanities: "humanities" };
const streamHref = (lang: Locale, batch: string, stream: string) => `/${lang}/hsc/${batch}?stream=${stream}`;

/**
 * CT84 (lab `free-routine` v11): the three streams inside the green hero, on its own glass: a translucent white pill
 * with the current stream in solid white and green text, as the batch switch beside it draws its current batch. Links, so
 * they work without script; a tap also remembers the choice (CT61), so the page opened without a stream comes back here.
 * Phones: the three share the row in equal parts.
 */
export function HeroStreamTabs({ view, lang, keep, label }: { view: CatalogView; lang: Locale; keep: string; label: string }) {
  const visitor = useVisitor(null);
  const cls = view.batch.id === "hsc-27" ? "12" : "11";
  return (
    <nav aria-label={label}>
      <div className="grid w-full grid-cols-3 gap-1 rounded-full bg-on-hero/10 p-1 ring-1 ring-on-hero/20 ring-inset sm:inline-flex sm:w-auto">
        {view.streams.map((s) => {
          const on = s.id === view.stream.id;
          const Icon = STREAM_ICON[s.id];
          return (
            <Link
              key={s.id}
              href={streamHref(lang, view.batch.id, s.id) + keep}
              scroll={false}
              aria-current={on ? "page" : undefined}
              onClick={() => visitor?.pick({ cls, group: GROUP_OF[s.id] ?? null, hard: visitor.known?.hard ?? [] })}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold whitespace-nowrap transition-colors sm:gap-2 sm:pr-5 sm:pl-4 sm:text-base",
                on ? "bg-on-hero text-hero shadow-raised" : "text-on-hero/85 hover:bg-on-hero/10 hover:text-on-hero",
              )}
            >
              {Icon && <Icon size={16} color="currentColor" variant={on ? "Bold" : "Linear"} aria-hidden className="shrink-0 sm:size-[18px]" />}
              {s.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * CT84: the batch's name is also a switch. "এইচএসসি ২৭ ▾" opens a small menu of the batches: this one ticked, the others
 * here open in the same stream (with the page's lab and viewer), HSC 26 opens the live site. The pills on the right stay,
 * so the batch can be switched from either place. Esc or a click outside closes it.
 */
export function BatchMenu({ view, lang, keep, label, external }: { view: CatalogView; lang: Locale; keep: string; label: string; external: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismiss(open, () => setOpen(false), root, trigger);
  const row = "flex min-h-11 items-center gap-2 rounded-md px-3 text-base font-semibold transition-colors hover:bg-raised";

  return (
    <div ref={root} className="relative w-fit">
      <h1 id="catalog-title" className="type-display">
        <button
          ref={trigger}
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`${view.batch.name}, ${label}`}
          onClick={() => setOpen((o) => !o)}
          className="-mx-2 inline-flex items-center gap-2 rounded-md px-2 transition-colors hover:bg-on-hero/10"
        >
          {view.batch.name}
          <ChevronDown className={cn("size-7 opacity-80 transition-transform", open && "rotate-180")} strokeWidth={2.5} aria-hidden />
        </button>
      </h1>
      {open && (
        <Card as="div" role="menu" className="absolute top-full left-0 z-30 mt-2 grid w-64 gap-0.5 p-1.5 text-text shadow-pop">
          {view.batches.map((b) => {
            const current = b.id === view.batch.id;
            if (current)
              return (
                <span key={b.id} role="menuitem" aria-current="page" className={cn(row, "bg-brand-soft text-brand-text hover:bg-brand-soft")}>
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                  {b.label}
                </span>
              );
            return b.here ? (
              <Link
                key={b.id}
                role="menuitem"
                href={`${streamHref(lang, b.id, view.stream.id)}${keep}`}
                className={row}
                onClick={() => setOpen(false)}
              >
                <span className="size-4" aria-hidden />
                {b.label}
              </Link>
            ) : (
              <a key={b.id} role="menuitem" href={b.url} className={cn(row, "text-muted")}>
                <span className="size-4" aria-hidden />
                {b.label}
                <ArrowUpRight className="ml-auto size-4" aria-hidden />
                <span className="sr-only">{external}</span>
              </a>
            );
          })}
        </Card>
      )}
    </div>
  );
}
