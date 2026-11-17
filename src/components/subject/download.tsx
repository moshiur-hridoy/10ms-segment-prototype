"use client";

import { TickCircle } from "iconsax-react";
import { CircleCheck, Download as DownloadIcon, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/design-system/atoms/card";
import { IconButton } from "@/design-system/atoms/icon-button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { useLabAt } from "@/lib/lab";
import { cancelDownload, forgetDownload, startDownload, useDownloaded, useDownloads, type Download } from "./downloads";

type Labels = Dictionary["syllabus"]["downloads"];

/**
 * The open item's download button (P51, P89). At rest the usual icon; while downloading, the same
 * round button holds a stop square in a ring that fills (a tap cancels; the percentage is in the bar at
 * the bottom); once done, a green check (a tap downloads again). Its size never changes, so the row stays put.
 */
export function DownloadButton({
  id,
  title,
  url,
  fileName,
  label,
  labels,
  locale,
}: {
  id: string;
  title: string;
  /** The file to fetch; null for a video (simulated in the demo). */
  url: string | null;
  fileName: string;
  label: string;
  labels: Labels;
  locale: Locale;
}) {
  const d = useDownloads().items[id];
  // Lab `class` v32 (P125): downloaded reads as a filled green tick (v31 tried a filled download icon), also
  // after a reload, since the device remembers it (P121).
  const filled = useLabAt("class", 31);
  const kept = useDownloaded(id);
  // Lab `class` v35 (P128): a tap on the tick offers to delete the download instead of downloading again.
  const deletable = useLabAt("class", 35);
  const [menu, setMenu] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);
  const fmt = createFormatter(locale, 0);
  const start = () => startDownload({ id, title, url, fileName });

  if (d?.status === "running") {
    const pct = fmt.percent(Math.round(d.progress * 100));
    // P89: the same 44px round button as at rest, so nothing beside it moves; the ring fills inside it,
    // and the percentage is in the bar at the bottom (and this button's label).
    return (
      <button
        type="button"
        onClick={() => cancelDownload(id)}
        aria-label={fill(labels.stop, { pct })}
        title={`${labels.cancel} · ${pct}`}
        className="grid size-11 place-items-center rounded-full transition-colors press hover:bg-brand-soft"
      >
        <Ring progress={d.progress} />
      </button>
    );
  }
  if (deletable && (d?.status === "done" || kept)) {
    return (
      <div ref={box} className="relative">
        <IconButton label={labels.done} tooltip={!menu} variant="subtle" size="lg" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
          <TickCircle size={22} color="currentColor" variant="Bold" className="text-brand" aria-hidden />
        </IconButton>
        {menu && (
          <Card as="div" radius="md" elevation="pop" role="menu" className="absolute top-full right-0 z-30 mt-1 min-w-48 p-1">
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={() => {
                forgetDownload(id);
                setMenu(false);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-left text-sm font-semibold whitespace-nowrap text-danger transition-colors hover:bg-raised"
            >
              <Trash2 className="size-4" aria-hidden />
              {labels.remove}
            </button>
          </Card>
        )}
      </div>
    );
  }
  if (filled && (d?.status === "done" || kept)) {
    return (
      <IconButton label={labels.again} tooltip variant="subtle" size="lg" onClick={start}>
        <TickCircle size={22} color="currentColor" variant="Bold" className="text-brand" aria-hidden />
      </IconButton>
    );
  }
  if (d?.status === "done") {
    return (
      <IconButton label={labels.again} tooltip variant="subtle" size="lg" onClick={start}>
        <CircleCheck className="size-5 text-brand-text" aria-hidden />
      </IconButton>
    );
  }
  return (
    <IconButton label={label} tooltip variant="subtle" size="lg" onClick={start}>
      <DownloadIcon className="size-5" aria-hidden />
    </IconButton>
  );
}

/** A stop square inside a ring that fills clockwise with the progress (24px, the size of the button's icon area). */
function Ring({ progress }: { progress: number }) {
  const r = 10;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-6 place-items-center" aria-hidden>
      <svg viewBox="0 0 24 24" className="absolute inset-0 -rotate-90">
        <circle cx="12" cy="12" r={r} fill="none" strokeWidth="2.5" className="stroke-brand/20" />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="stroke-brand transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span className="size-2.5 rounded-xs bg-brand" />
    </span>
  );
}

/**
 * The downloading bar (P51): a dark bar at the bottom of the screen with a spinner, "ডাউনলোড হচ্ছে… ৫০%",
 * the item's title and বাতিল, and a green line along its bottom edge. When the download ends it says
 * so for 3 s and slides away. It sits 12px above whatever holds the bottom edge: the bottom nav, the "up next" bar
 * while it shows, or the screen edge (P141, `.bottom-toast`).
 */
export function DownloadToast({ labels, locale }: { labels: Labels; locale: Locale }) {
  const { items, toast, open } = useDownloads();
  const fmt = createFormatter(locale, 0);
  // The last download's text stays while the bar slides away.
  const shown: Download | null = toast ? items[toast] : null;
  const running = shown?.status === "running";
  const pct = shown ? fmt.percent(Math.round(shown.progress * 100)) : "";
  const line = !shown
    ? ""
    : running
      ? fill(labels.running, { pct })
      : shown.status === "done"
        ? labels.done
        : shown.status === "cancelled"
          ? labels.cancelled
          : labels.failed;

  return (
    <div
      role="status"
      inert={!open}
      className={cn(
        "bottom-toast fixed inset-x-4 z-40 mx-auto max-w-md overflow-hidden rounded-xl bg-player text-on-fill shadow-pop ring-1 ring-on-fill/10 transition-[opacity,translate] duration-(--motion-base) ease-standard",
        !open && "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      {shown && (
        <>
          <div className="flex min-h-14 items-center gap-3 py-2 pr-2 pl-4">
            {running ? (
              <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-on-fill/25 border-t-on-fill" aria-hidden />
            ) : shown.status === "done" ? (
              <CircleCheck className="size-5 shrink-0 text-brand" aria-hidden />
            ) : (
              <DownloadIcon className="size-5 shrink-0 text-on-fill/60" aria-hidden />
            )}
            <span className="grid min-w-0 flex-1">
              <span className="text-sm font-semibold tabular-nums">{line}</span>
              <span className="truncate text-xs text-on-fill/65">{shown.title}</span>
            </span>
            {running && (
              <button
                type="button"
                onClick={() => cancelDownload(shown.id)}
                className="shrink-0 rounded-full px-3 py-2 text-sm font-semibold text-danger transition-colors hover:bg-on-fill/10"
              >
                {labels.cancel}
              </button>
            )}
          </div>
          {running && (
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 bg-brand transition-[width] duration-150"
              style={{ width: `${shown.progress * 100}%` }}
            />
          )}
        </>
      )}
    </div>
  );
}
