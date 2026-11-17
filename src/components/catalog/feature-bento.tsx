"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { NUMBER_NOTES } from "@/components/landing/desktop/proof";
import type { CatalogView } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";

type Feature = CatalogView["features"][number];

const PAPER = "rounded-xl bg-paper shadow-[0_1px_2px_rgb(52_36_16/0.15),0_12px_24px_-20px_rgb(52_36_16/0.4)]";
/** The small tiles' icon wells, in turn, so the six don't read as one repeated box. */
const WELLS = ["bg-brand-soft", "bg-info-soft", "bg-warning-soft", "bg-success-soft", "bg-live-soft", "bg-highlight-soft"];

/**
 * CT111 (lab `segment-home` v19): "সব লাইভ ব্যাচে যা থাকছে" as a bento instead of eight equal closed cards. The live
 * class and TenTen get the big tiles with a small glimpse of the product (a practice question during class; a photo
 * question and TenTen's answer); the other six are small tiles whose description shows (three lines, tap for the rest).
 * Everything written comes from the batch's own feature texts; the glimpses carry no figures.
 */
/*
 * CT113 (v21): with `numbers`, the landing's three numbers (the board's sticky notes until v20) join the bento as tiles in
 * their note colours: on desktop the rating and the students beside the live tile under TenTen, the first places a wide
 * tile at the start of the next row; the board then gives the bento its full width.
 */
export function FeatureBento({ features, numbers = false }: { features: Feature[]; numbers?: boolean }) {
  const liveAt = features.findIndex((f) => /^live\b/i.test(f.title));
  const aiAt = features.findIndex((f) => /\bAI\b|tenten/i.test(f.title));
  const live = features[liveAt];
  const ai = features[aiAt];
  const rest = features.filter((_, i) => i !== liveAt && i !== aiAt);

  return (
    <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {live && (
        <li className="col-span-2 xl:row-span-2">
          <LiveTile f={live} />
        </li>
      )}
      {ai && (
        <li className="col-span-2">
          <AiTile f={ai} />
        </li>
      )}
      {numbers &&
        NUMBER_NOTES.map((n, i) => (
          <li key={n.label} className={cn(i === 2 && "col-span-2")}>
            <NumberTile value={n.value} label={n.label} bg={n.bg} wide={i === 2} />
          </li>
        ))}
      {rest.map((f, i) => (
        <li key={f.title}>
          <SmallTile f={f} well={WELLS[i % WELLS.length]} />
        </li>
      ))}
    </ul>
  );
}

function Icon({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cn("grid size-11 shrink-0 place-items-center rounded-lg", className)}>
      <Image src={src} alt="" width={26} height={26} className="size-[26px] object-contain" />
    </span>
  );
}

/** The live class: the player's dark, a LIVE pill, and a practice question as it appears mid-class. */
function LiveTile({ f }: { f: Feature }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 overflow-hidden rounded-xl bg-player p-5 text-on-fill ring-1 ring-on-fill/12 shadow-[0_12px_28px_-16px_rgb(0_0_0/0.6)] sm:p-6",
        // A red glow from the corner, so the tile stands apart on the page's dark end too.
        "[background-image:radial-gradient(90%_70%_at_0%_0%,color-mix(in_oklab,var(--color-live)_30%,transparent),transparent_70%)]",
      )}
    >
      <div className="flex items-center justify-between">
        <Icon src={f.iconUrl} className="bg-on-fill/10" />
        <span className="flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-xs font-bold tracking-wide text-on-fill">
          <span className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-on-fill/80 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-on-fill" />
          </span>
          LIVE
        </span>
      </div>
      <div className="grid gap-2">
        <h3 className="text-xl font-bold sm:text-2xl">{f.title}</h3>
        <p className="text-sm leading-relaxed text-on-fill/75">{f.description}</p>
      </div>
      {/* The glimpse: the class's board (graph paper with a curve; on desktop it fills the tall tile), then a multiple-choice
          question during class, one answer picked. Shapes only, no copy of its own. */}
      <div aria-hidden className="relative hidden min-h-24 flex-1 overflow-hidden rounded-lg bg-on-fill/[0.04] ring-1 ring-on-fill/10 xl:block">
        <span className="absolute inset-0 [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:20px_20px]" />
        <svg
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
          className="absolute inset-x-4 top-1/2 h-1/2 w-[calc(100%-2rem)] -translate-y-1/2 text-on-fill/60"
        >
          <path
            d="M0 40 C 25 0, 50 0, 75 40 S 125 80, 150 40 S 190 5, 200 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div aria-hidden className="mt-auto rounded-lg bg-on-fill/[0.07] p-3.5 ring-1 ring-on-fill/10 xl:mt-0">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded bg-on-fill/15 px-1.5 py-0.5 text-[11px] font-bold">MCQ</span>
          <span className="h-2 flex-1 rounded-full bg-on-fill/20" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["ক", "খ", "গ", "ঘ"].map((o, i) => (
            <span
              key={o}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs ring-1",
                i === 2 ? "bg-success/25 ring-success/60" : "ring-on-fill/15",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-[11px] font-bold",
                  i === 2 ? "bg-success text-on-fill" : "bg-on-fill/15",
                )}
              >
                {o}
              </span>
              <span className="h-1.5 flex-1 rounded-full bg-on-fill/20" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** TenTen: its violet glow (as in the subject page's chat), and a photo question with TenTen's answer coming in. */
function AiTile({ f }: { f: Feature }) {
  return (
    <div
      className={cn(
        PAPER,
        "flex h-full flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6",
        "[background-image:radial-gradient(90%_120%_at_100%_0%,color-mix(in_oklab,var(--color-tenten-violet)_16%,transparent),transparent_70%)]",
      )}
    >
      <div className="grid min-w-0 flex-1 content-start gap-2">
        <Icon src={f.iconUrl} className="mb-1 bg-surface ring-1 ring-border" />
        <h3 className="text-lg font-bold sm:text-xl">{f.title}</h3>
        <p className="text-sm leading-relaxed text-muted">{f.description}</p>
      </div>
      <div aria-hidden className="grid w-full shrink-0 gap-2 sm:w-[200px]">
        <span className="ml-auto grid h-16 w-24 place-items-center rounded-2xl rounded-br-sm bg-tenten-violet/15 text-tenten-violet">
          <ImageIcon className="size-6" />
        </span>
        <span className="flex items-end gap-2">
          <Image src={f.iconUrl} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" />
          <span className="grid flex-1 gap-1.5 rounded-2xl rounded-bl-sm bg-surface p-3 ring-1 ring-border">
            <span className="h-1.5 w-full rounded-full bg-tenten-violet/30" />
            <span className="h-1.5 w-4/5 rounded-full bg-tenten-violet/20" />
            <span className="h-1.5 w-3/5 rounded-full bg-tenten-violet/20" />
          </span>
        </span>
      </div>
    </div>
  );
}

/** The other six: the description shows, three lines, and a tap opens the rest. */
function SmallTile({ f, well }: { f: Feature; well: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      className={cn(
        PAPER,
        "flex h-full w-full flex-col items-start gap-2.5 p-4 text-left transition-transform hover:-translate-y-0.5 motion-reduce:transform-none",
      )}
    >
      <Icon src={f.iconUrl} className={well} />
      <span className="text-[15px] leading-snug font-semibold">{f.title}</span>
      <span className={cn("text-[13px] leading-relaxed text-muted", !open && "line-clamp-3")}>{f.description}</span>
      <span className="mt-auto text-xs font-semibold text-brand-text">{open ? "কম দেখাও" : "আরও পড়ো"}</span>
    </button>
  );
}

/** One of the landing's numbers as a bento tile: the figure large, what it counts under it (beside it on the wide one), on its note colour. */
function NumberTile({ value, label, bg, wide = false }: { value: string; label: string; bg: string; wide?: boolean }) {
  return (
    <div
      className={cn(
        PAPER,
        "flex h-full min-h-32 flex-col justify-between gap-3 p-5",
        wide && "sm:flex-row sm:items-center sm:justify-start sm:gap-6 sm:px-7",
      )}
      style={{ background: bg }}
    >
      <span className={cn("shrink-0 text-3xl font-bold tracking-tight text-[#1f1c14] sm:text-4xl", wide && "sm:text-6xl")}>{value}</span>
      <span className={cn("text-sm leading-snug text-[#4b4636]", wide && "sm:max-w-56 sm:text-base")}>{label}</span>
    </div>
  );
}
