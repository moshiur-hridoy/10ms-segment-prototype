"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** A section counts as "current" once its heading passes this line: header (64) + this bar (48) + some air. */
const ACTIVE_LINE = 160;

/**
 * Tabs attached under the course hero. They stick below the header and highlight the
 * section you're in, so the bar doubles as a "you are here".
 */
export function JumpLinks({ items, label, className }: { items: { id: string; label: string }[]; label: string; className?: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_LINE) current = id;
      }
      // The last sections may be too short to ever reach the line; at the bottom, the last one wins.
      if (atBottom) current = items[items.length - 1]?.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  // On phones the bar scrolls sideways: keep the active tab visible.
  useEffect(() => {
    const list = listRef.current;
    const tab = list?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!list || !tab) return;
    const left = tab.offsetLeft - list.offsetLeft;
    if (left < list.scrollLeft || left + tab.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: left - 16, behavior: "smooth" });
    }
  }, [active]);

  if (items.length < 2) return null;
  return (
    <nav aria-label={label} className={cn("sticky top-16 z-30 rounded-b-lg border border-t-0 border-border bg-surface px-2", className)}>
      <ul ref={listRef} className="flex overflow-x-auto [scrollbar-width:none]">
        {items.map((i) => {
          const current = i.id === active;
          return (
            <li key={i.id} className="shrink-0">
              <a
                href={`#${i.id}`}
                data-id={i.id}
                aria-current={current ? "location" : undefined}
                onClick={() => setActive(i.id)}
                className={cn(
                  "inline-flex h-12 items-center border-b-2 px-3 text-sm font-semibold transition-colors",
                  current ? "border-brand text-brand-text" : "border-transparent text-muted hover:text-text",
                )}
              >
                {i.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
