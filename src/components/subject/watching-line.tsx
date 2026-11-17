"use client";

import { Check, ChevronDown, ListVideo, UsersRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Card } from "@/design-system/atoms/card";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { useLabAt } from "@/lib/lab";
import type { Audience } from "./demo-audience";
import { usePlayback } from "./playback";
import { partAt, type VideoPart } from "./player-parts";

/** A recording shows its watching count only from this many (P91); a small number reads as an empty class. */
const MIN = 50;

/**
 * Lab `class` v51 (P147): how many are watching, on its own line just above the class title, instead of
 * on the video. The number drifts a little every 12 s, the demo's stand-in for live numbers (P91).
 * Lab `class` v52 (P148): the part playing sits beside it, with a down arrow; it opens the class's parts,
 * and choosing one jumps the video there (it used to be a chip on the video and a menu in its control bar).
 * Lab `class` v53 (P149): a small playlist icon before the part's name, matching the people icon before the count.
 */
export function WatchingLine({
  audience,
  label,
  locale,
  parts,
  partsLabel,
}: {
  audience: Audience | null;
  label: string;
  locale: Locale;
  parts?: VideoPart[];
  partsLabel?: string;
}) {
  const [n, setN] = useState(audience?.watching ?? 0);
  useEffect(() => {
    if (!audience) return;
    const id = window.setInterval(() => setN((v) => Math.max(1, v + Math.round(Math.random() * 14 - 5))), 12000);
    return () => window.clearInterval(id);
  }, [audience]);
  const fmt = createFormatter(locale, 0);
  const showCount = !!audience && (audience.live || n >= MIN);
  const hasParts = !!parts && parts.length > 1;
  if (!showCount && !hasParts) return null;
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-subtle tabular-nums">
      {showCount && (
        <p role="status" className="flex shrink-0 items-center gap-1.5">
          <UsersRound className="size-3.5" aria-hidden />
          {fill(label, { n: n >= 1000 ? fmt.compact(n) : fmt.number(n) })}
        </p>
      )}
      {/* P150: no dot between the two; the chip's own padding and icon keep them apart. */}
      {hasParts && <PartsChip parts={parts} label={partsLabel ?? ""} fmt={fmt} />}
    </div>
  );
}

function PartsChip({ parts, label, fmt }: { parts: VideoPart[]; label: string; fmt: ReturnType<typeof createFormatter> }) {
  const pb = usePlayback();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menu = useId();
  const current = partAt(parts, pb.time);
  const icon = useLabAt("class", 53);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative min-w-0">
      <button
        type="button"
        aria-label={`${label}: ${current?.title ?? ""}`}
        aria-expanded={open}
        aria-controls={menu}
        onClick={() => setOpen((o) => !o)}
        className="-my-1 flex h-7 max-w-full min-w-0 items-center gap-1 rounded-full px-2 text-text transition-colors press hover:bg-raised"
      >
        {icon && <ListVideo className="size-3.5 shrink-0 text-subtle" aria-hidden />}
        <span className="truncate">{current?.title}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <Card
          as="div"
          radius="md"
          elevation="pop"
          id={menu}
          role="menu"
          className="absolute top-full left-0 z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] p-1"
        >
          {parts.map((p) => {
            const on = p === current;
            return (
              <button
                key={p.startSec}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  pb.seekTo?.(p.startSec);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm transition-colors hover:bg-raised"
              >
                <span className="w-14 shrink-0 text-xs text-subtle tabular-nums">{fmt.duration(p.startSec)}</span>
                <span className={cn("min-w-0 flex-1 truncate", on && "font-semibold")}>{p.title}</span>
                {on && <Check className="size-4 shrink-0 text-brand-text" aria-hidden />}
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
