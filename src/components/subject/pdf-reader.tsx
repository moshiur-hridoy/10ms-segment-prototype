"use client";

import { Download, Maximize, Minimize } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { publishPlayback } from "./playback";

type Labels = Dictionary["syllabus"]["reader"];

/** The last page counts as reached when this much of it is on screen. */
const END_SHOWN = 0.6;

const barButton = "grid size-9 place-items-center rounded-full bg-player/75 text-on-fill transition-colors hover:bg-player/90";

/*
 * A slide (PDF) opened right in the page, where the video player sits for a class. Phones can't
 * show a PDF inside a page on their own (iOS shows one page, Android downloads it), so PDF.js
 * draws each page onto a canvas, only as it comes into view. The pages are the page: they run down
 * it one under another, and the bar (page, a quiet download, fullscreen) sticks under the header.
 * Fullscreen turns it into a box of pages that snap one at a time. Reaching the last page tells
 * the phone's "up next" card (the slide's version of a video ending). PDF.js loads only here.
 */
export function PdfReader({ url, title, labels: l, lang }: { url: string; title: string; labels: Labels; lang: Locale }) {
  const fmt = createFormatter(lang, 0);
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [failed, setFailed] = useState(false);
  const [page, setPage] = useState(1);
  const [full, setFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | undefined;
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const task = pdfjs.getDocument({ url });
      destroy = () => void task.destroy();
      const d = await task.promise;
      const first = (await d.getPage(1)).getViewport({ scale: 1 });
      if (cancelled) return;
      setAspect(first.width / first.height);
      setDoc(d);
    })().catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      destroy?.();
      publishPlayback({ docAtEnd: false });
    };
  }, [url]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // The page shown: the topmost one at least half on screen (several fit at once in the page). And whether the last has been reached.
  useEffect(() => {
    const box = scroller.current;
    if (!doc || !box) return;
    const shown = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) shown.set(Number((e.target as HTMLElement).dataset.page), e.intersectionRatio);
        const top = [...shown].filter(([, r]) => r >= 0.5).map(([n]) => n);
        if (top.length) setPage(Math.min(...top));
        if ((shown.get(doc.numPages) ?? 0) >= END_SHOWN) publishPlayback({ docAtEnd: true });
      },
      // In the page the window scrolls; in fullscreen, the box of pages.
      { root: full ? box : null, threshold: [0, 0.5, END_SHOWN] },
    );
    for (const el of box.querySelectorAll("[data-page]")) io.observe(el);
    return () => io.disconnect();
  }, [doc, full]);

  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen();
  };

  const pages = doc?.numPages ?? 0;
  return (
    <div ref={root} aria-label={fill(l.label, { title })} role="region" className={cn("relative", full && "h-dvh overflow-hidden bg-raised")}>
      {/* The bar: page, then fullscreen (and download, in full screen). Sticks under the site header as the pages scroll by. */}
      <div className={cn("pointer-events-none z-10", full ? "absolute inset-x-0 top-0" : "sticky top-16 h-0")}>
        <div className="flex items-center justify-between p-2">
          {pages > 0 ? (
            <span className="rounded-full bg-player/75 px-2.5 py-1 text-xs font-semibold text-on-fill tabular-nums">
              {fill(l.page, { n: fmt.number(page), total: fmt.number(pages) })}
            </span>
          ) : (
            <span />
          )}
          <span className="pointer-events-auto flex gap-1">
            {/* P146: the page's own download button (under the title) is the one; this copy shows only in full screen, where that one is hidden. */}
            {full && (
              <a href={url} download aria-label={l.download} title={l.download} className={barButton}>
                <Download className="size-4.5" aria-hidden />
              </a>
            )}
            <button
              type="button"
              onClick={toggleFull}
              aria-label={full ? l.exitFullscreen : l.fullscreen}
              title={full ? l.exitFullscreen : l.fullscreen}
              className={barButton}
            >
              {full ? <Minimize className="size-4.5" aria-hidden /> : <Maximize className="size-4.5" aria-hidden />}
            </button>
          </span>
        </div>
      </div>

      {/* On phones, room under the last page so it can scroll clear of the floating capsule and card. */}
      <div
        ref={scroller}
        className={cn("flex flex-col gap-3", full ? "h-full snap-y snap-mandatory overflow-y-auto overscroll-contain p-3" : "max-lg:pb-56")}
      >
        {failed ? (
          <p className="grid min-h-48 place-items-center rounded-lg border border-border bg-raised p-6 text-center text-sm text-muted">{l.error}</p>
        ) : !doc ? (
          <p className="grid aspect-video place-items-center rounded-lg border border-border bg-raised text-sm text-muted">
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-border border-t-brand" aria-hidden />
              {l.loading}
            </span>
          </p>
        ) : (
          Array.from({ length: pages }, (_, i) => (
            // Remount on fullscreen so pages redraw sharp at the new size.
            <PdfPage key={`${i}-${full}`} doc={doc} n={i + 1} aspect={aspect} full={full} />
          ))
        )}
      </div>
    </div>
  );
}

/** One page, drawn when it comes near the screen, sized to the reader's width (or the screen's height in fullscreen). */
function PdfPage({ doc, n, aspect, full }: { doc: PDFDocumentProxy; n: number; aspect: number; full: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let done = false;
    let cancel: (() => void) | undefined;
    const draw = async () => {
      done = true;
      const p = await doc.getPage(n);
      const c = canvas.current;
      if (!c) return;
      const scale = (el.clientWidth / p.getViewport({ scale: 1 }).width) * (window.devicePixelRatio || 1);
      const viewport = p.getViewport({ scale });
      c.width = Math.floor(viewport.width);
      c.height = Math.floor(viewport.height);
      const task = p.render({ canvas: c, viewport });
      cancel = () => task.cancel();
      await task.promise.catch(() => {});
    };
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !done && void draw(), { rootMargin: "100% 0px" });
    io.observe(el);
    return () => {
      io.disconnect();
      cancel?.();
    };
  }, [doc, n]);

  return (
    <div
      ref={box}
      data-page={n}
      className="mx-auto w-full shrink-0 snap-center overflow-hidden rounded-md bg-surface shadow-raised ring-1 ring-border"
      // In fullscreen a page fits the screen's height; otherwise the reader's width.
      style={{ aspectRatio: aspect, maxWidth: full ? `calc((100dvh - 1.5rem) * ${aspect})` : undefined }}
    >
      <canvas ref={canvas} className="block size-full" aria-hidden />
    </div>
  );
}
