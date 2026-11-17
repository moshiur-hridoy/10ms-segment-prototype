"use client";

import { ListVideo, SkipForward } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, ViewTransition, type ComponentProps, type PointerEvent } from "react";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { useLab } from "@/lib/lab";
import { SyllabusPanel } from "./syllabus-panel";
import { UpNextIsland, type UpNextDoc, type UpNextFinish, type UpNextStep } from "./up-next";

type PanelProps = Omit<ComponentProps<typeof SyllabusPanel>, "sheet" | "id">;

type Props = PanelProps & {
  /** "৩/৮": the open class among its chapter's classes, when the item belongs to a class. */
  position: string | null;
  next: { href: string; title: string } | null;
  /** Shared name with the list-only view, so opening an item glides the list into the rail. */
  morph: string;
  /** What to study after the open item, for the "up next" card. */
  upNext: UpNextStep[];
  /** The open exam's own actions (null otherwise). */
  doc: UpNextDoc | null;
  /** The open video's end-of-class facts (lab `class`); null for other items. */
  finish: UpNextFinish | null;
  /** A slide or sheet is open: on phones the page is all pages, so the list lives only in the sheet. */
  pagesOnly?: boolean;
};

const PANEL_ID = "syllabus";
/** How far the sheet must be dragged down by its handle to close. */
const DRAG_CLOSE_PX = 96;

/*
 * The syllabus beside the player on desktop; below it on phones and tablets, where a floating
 * bar (playlist + next class) keeps it one tap away without scrolling down. The playlist opens
 * the same panel in a bottom sheet. The bar steps aside while the panel itself is on screen.
 */
export function SubjectPlaylist({ position, next, morph, upNext, doc, finish, pagesOnly = false, ...panel }: Props) {
  const s = panel.labels.playlist;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [panelInView, setPanelInView] = useState(false);
  const [drag, setDrag] = useState<{ start: number; dy: number } | null>(null);
  // Lab `class` v9 (P59): with an item open the list leaves the page; another class is chosen on the
  // paper's list, one step back. Only the "up next" card stays, for the end of a class or slide.
  const lab = useLab("class") !== null;

  useEffect(() => {
    const el = document.getElementById(PANEL_ID);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPanelInView(entry.isIntersecting), { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The panel mounts with the sheet (so it opens scrolled to the current item), then the sheet shows.
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    dialog.current?.showModal();
  }, [open]);
  // Leaving the page with the sheet open must not leave scrolling locked.
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  const close = () => dialog.current?.close();

  const onDragStart = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ start: e.clientY, dy: 0 });
  };
  const onDragMove = (e: PointerEvent) => drag && setDrag({ ...drag, dy: Math.max(0, e.clientY - drag.start) });
  const onDragEnd = () => {
    if (drag && drag.dy > DRAG_CLOSE_PX) close();
    setDrag(null);
  };

  const hidden = panelInView || open;

  if (lab) {
    return (
      <>
        {/* Tells the page's grid to give the open item the full width. */}
        <span data-solo hidden />
        <UpNextIsland
          key={panel.currentId}
          steps={upNext}
          doc={doc}
          finish={finish}
          labels={panel.labels.upNext}
          lang={panel.lang}
          hidden={false}
          sheetOpen={false}
        />
      </>
    );
  }

  return (
    <>
      <ViewTransition name={morph} share="syllabus" default="none">
        <SyllabusPanel {...panel} id={PANEL_ID} className={cn("lg:order-first", pagesOnly && "max-lg:hidden")} />
      </ViewTransition>

      {/* Keyed by item: each item starts with the capsule and its own suggestions. */}
      <UpNextIsland
        key={panel.currentId}
        steps={upNext}
        doc={doc}
        finish={finish}
        labels={panel.labels.upNext}
        lang={panel.lang}
        hidden={hidden}
        sheetOpen={open}
        playlist={{ label: s.open, position, onOpen: () => setOpen(true) }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="flex h-full items-center gap-2 rounded-full pr-4 pl-4 text-sm font-semibold press hover:bg-raised"
        >
          <ListVideo className="size-5 text-brand-text" aria-hidden />
          {s.open}
          {position && <span className="font-medium text-subtle tabular-nums">{position}</span>}
        </button>
        {next && (
          <>
            <span className="h-6 w-px bg-border" aria-hidden />
            <Link
              href={next.href}
              replace
              aria-label={fill(s.next, { title: next.title })}
              title={fill(s.next, { title: next.title })}
              className="grid h-full w-12 place-items-center rounded-full text-brand-text press hover:bg-raised"
            >
              <SkipForward className="size-5 fill-current" aria-hidden />
            </Link>
          </>
        )}
      </UpNextIsland>

      <dialog
        ref={dialog}
        aria-label={panel.labels.title}
        onClose={() => {
          document.documentElement.style.overflow = "";
          setOpen(false);
        }}
        // A click on the backdrop lands on the dialog itself.
        onClick={(e) => e.target === e.currentTarget && close()}
        style={drag ? { translate: `0 ${drag.dy}px`, transition: "none" } : undefined}
        className={cn(
          "sheet mx-auto mt-auto mb-0 h-[85dvh] max-h-none w-full max-w-2xl overflow-hidden rounded-t-lg border-0 bg-surface p-0 text-text shadow-pop transition-[translate] duration-(--motion-fast) backdrop:bg-text/30",
        )}
      >
        {open && (
          <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
            {/* Drag handle: pull down to close. */}
            <div
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
              className="grid h-6 shrink-0 cursor-grab touch-none place-items-center"
              aria-hidden
            >
              <span className="h-1 w-10 rounded-full bg-border-strong" />
            </div>
            <div className="min-h-0 flex-1">
              <SyllabusPanel {...panel} sheet={{ onClose: close, closeLabel: s.close }} />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
