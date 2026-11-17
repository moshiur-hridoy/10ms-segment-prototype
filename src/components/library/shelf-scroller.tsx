"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The bay scrolls sideways when its books don't fit. No scrollbar over the board: instead the
 * edge that hides books fades out, and a round arrow there pages along (about one screen of
 * books at a time). Trackpads, touch and the keyboard (the region is focusable) scroll as usual.
 */
export function ShelfScroller({
  label,
  prev,
  next,
  bare = false,
  children,
}: {
  label: string;
  prev: string;
  next: string;
  /** CT103 (lab `segment-home` v12): no shelf wall, the edges fading into the page; for a row of covers on the page itself. */
  bare?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft > 4, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  const page = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const fade = cn(
    "pointer-events-none absolute inset-y-0 z-10 w-16 to-transparent transition-opacity duration-300",
    bare ? "from-bg" : "from-surface",
  );
  const arrow =
    "absolute top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-border bg-surface text-text shadow-pop transition-[opacity,scale] hover:scale-105 sm:grid";

  return (
    <div className="relative min-w-0">
      <div
        ref={ref}
        onScroll={measure}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="snap-x snap-proximity scroll-px-5 overflow-x-auto overscroll-x-contain outline-offset-[-2px] [scrollbar-width:none] sm:scroll-px-6 [&::-webkit-scrollbar]:hidden"
        style={bare ? undefined : { background: "var(--shelf-wall)" }}
      >
        {children}
      </div>
      <span aria-hidden className={cn(fade, "left-0 bg-gradient-to-r", edges.start ? "opacity-100" : "opacity-0")} />
      <span aria-hidden className={cn(fade, "right-0 bg-gradient-to-l", edges.end ? "opacity-100" : "opacity-0")} />
      <button
        type="button"
        aria-label={prev}
        onClick={() => page(-1)}
        tabIndex={-1}
        className={cn(arrow, "left-3", !edges.start && "pointer-events-none scale-90 opacity-0")}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={next}
        onClick={() => page(1)}
        tabIndex={-1}
        className={cn(arrow, "right-3", !edges.end && "pointer-events-none scale-90 opacity-0")}
      >
        <ChevronRight className="size-5" aria-hidden />
      </button>
    </div>
  );
}
