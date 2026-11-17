"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** How far a sideways swipe must travel to turn the week. */
const SWIPE_PX = 48;

/**
 * The phone's week strip, turned by a sideways swipe (the arrows do the same): the row follows
 * the finger, and past `SWIPE_PX` it turns to the week before or after (replacing the history
 * entry, like every page turn here). The new week slides in from the side it came from.
 * Vertical scrolling is left to the browser (`touch-pan-y`).
 */
export function WeekSwipe({ start, prevHref, nextHref, label, children }: { start: string; prevHref: string; nextHref: string; label: string; children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drag, setDrag] = useState<{ x: number; y: number; dx: number } | null>(null);
  // Set when a drag turned the week, so the click that may follow doesn't also open a day.
  const swiped = useRef(false);

  // Which way the week turned, for the slide-in (React's "adjust state on a prop change").
  const [shown, setShown] = useState(start);
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  if (shown !== start) {
    setShown(start);
    setDir(start > shown ? "next" : "prev");
  }

  const onDown = (e: PointerEvent) => {
    swiped.current = false;
    setDrag({ x: e.clientX, y: e.clientY, dx: 0 });
  };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    // Mostly vertical: a scroll, not a swipe.
    if (Math.abs(e.clientY - drag.y) > Math.abs(dx)) return setDrag({ ...drag, dx: 0 });
    setDrag({ ...drag, dx });
  };
  const onUp = () => {
    if (drag && Math.abs(drag.dx) > SWIPE_PX) {
      swiped.current = true;
      const href = drag.dx < 0 ? nextHref : prevHref;
      startTransition(() => router.replace(href, { scroll: false }));
    }
    setDrag(null);
  };

  return (
    <div
      role="group"
      aria-label={label}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => setDrag(null)}
      onClickCapture={(e) => {
        if (!swiped.current) return;
        e.preventDefault();
        swiped.current = false;
      }}
      className={cn("touch-pan-y overflow-hidden select-none", pending && "opacity-60")}
    >
      <div
        key={start}
        // Follows the finger at a third of its travel: a hint of the page under it, not a carousel.
        style={drag?.dx ? { translate: `${drag.dx / 3}px 0`, transition: "none" } : undefined}
        className={cn(
          "grid grid-cols-7 transition-[translate] duration-(--motion-fast)",
          dir === "next" && "motion-safe:animate-[nav-in-right_240ms_ease-out_both]",
          dir === "prev" && "motion-safe:animate-[nav-in-left_240ms_ease-out_both]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
