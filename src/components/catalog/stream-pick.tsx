"use client";

import { ChevronDown, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { IconButton } from "@/design-system/atoms/icon-button";
import { softTones, type Tone } from "@/design-system/foundations/tone";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { STREAM_COOKIE, STREAM_ICON } from "./stream-icons";

/** Each stream its own tint, so the three choices read apart. */
const TONE: Record<string, Tone> = { science: "info", "business-studies": "warning", humanities: "highlight" };
const OPEN = "stream-pick:open";

/**
 * CT216, CT218 (`segment-page` working v5): "তোমার বিভাগ কী?" as a pop-up over the segment page. Opened without a stream
 * (the menu's "এইচএসসি ২৮") and with none remembered, it opens on load over the page drawn for the default stream; the
 * stream in the header's path (`StreamCrumb`) opens it again at any time. A choice is remembered (`STREAM_COOKIE`) and
 * replaces the address (`?stream=…`), so the back button doesn't return to the question. Middle of the screen from `md`,
 * a sheet from the bottom on phones, as the folders' sheet.
 */
export function StreamPick({
  batch,
  batchName,
  streams,
  current,
  ask,
  lang,
  keep,
  l,
  closeLabel,
}: {
  batch: string;
  batchName: string;
  streams: { id: string; name: string }[];
  current: string;
  /** Open on load: no stream in the address and none remembered. */
  ask: boolean;
  lang: Locale;
  keep: string;
  l: Dictionary["segment"];
  closeLabel: string;
}) {
  const box = useRef<HTMLDialogElement>(null);
  const lock = (on: boolean) => void (document.documentElement.style.overflow = on ? "hidden" : "");

  useEffect(() => {
    const open = () => {
      if (box.current?.open) return;
      box.current?.showModal();
      lock(true);
    };
    if (ask) open();
    addEventListener(OPEN, open);
    return () => removeEventListener(OPEN, open);
  }, [ask]);

  const close = () => box.current?.close();
  const remember = (id: string) => {
    document.cookie = `${STREAM_COOKIE}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    close();
  };

  return (
    <dialog
      ref={box}
      aria-labelledby="stream-pick-title"
      onClose={() => !document.querySelector("dialog[open]") && lock(false)}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="mx-auto mt-auto mb-0 w-full max-w-3xl overflow-hidden rounded-t-lg border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/40 md:my-auto md:rounded-lg"
    >
      <div className="relative grid gap-6 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-8">
        <IconButton label={closeLabel} onClick={close} className="absolute top-3 right-3">
          <X className="size-5" aria-hidden />
        </IconButton>
        <header className="grid gap-1 px-8 text-center">
          <p className="text-sm font-semibold text-brand-text">{batchName}</p>
          <h2 id="stream-pick-title" className="type-headline">
            {l.homeStreamAsk}
          </h2>
          <p className="text-muted">{l.homeStreamLead}</p>
        </header>
        <ul className="grid gap-3 sm:grid-cols-3">
          {streams.map((s) => {
            const Icon = STREAM_ICON[s.id];
            const on = s.id === current && !ask;
            return (
              <li key={s.id}>
                <Link
                  href={`/${lang}/hsc/${batch}?stream=${s.id}${keep}`}
                  replace
                  scroll={false}
                  onClick={() => remember(s.id)}
                  aria-current={on ? "true" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md border bg-surface p-4 press transition-colors hover:border-border-strong hover:bg-raised sm:grid sm:justify-items-center sm:p-6 sm:text-center",
                    on ? "border-brand ring-1 ring-brand" : "border-border",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("grid size-12 shrink-0 place-items-center rounded-full sm:size-16", softTones[TONE[s.id] ?? "brand"])}
                  >
                    {Icon && <Icon size={28} color="currentColor" variant="Bold" />}
                  </span>
                  <span className="type-title">{s.name}</span>
                  <ChevronRight aria-hidden className="ms-auto size-5 text-subtle sm:hidden" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </dialog>
  );
}

/** CT218: the stream in the header's path, a button that opens the pop-up again ("বিজ্ঞান ⌄"). */
export function StreamCrumb({ name, label }: { name: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => dispatchEvent(new Event(OPEN))}
      aria-label={`${name}: ${label}`}
      className="relative inline-flex items-center gap-0.5 truncate rounded-sm font-medium text-text after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] hover:underline"
    >
      {name}
      <ChevronDown aria-hidden className="size-3.5 shrink-0" />
    </button>
  );
}
