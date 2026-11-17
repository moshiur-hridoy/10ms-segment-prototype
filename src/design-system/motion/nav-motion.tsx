"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { notePathChange } from "@/lib/nav-history";

/** A navigation only counts as slow after this long, so quick clicks never show the logo ring. */
const SLOW_AFTER_MS = 300;
/** Give up on a navigation that never commits (cancelled, or a plain link that left the page).
 *  Long, because on a weak connection a real page can take this long and the bar and note must stay. */
const GIVE_UP_MS = 30_000;

/**
 * Pending state for every page-to-page navigation, from one place so no link needs editing: a
 * navigation that hasn't committed after 300ms sets <html data-nav-slow>, which the logo's ring,
 * the top bar and the slow-network note read (globals.css), and announces the wait once. It clears
 * when the pathname changes. Nothing here blocks a click: the listeners only read, and never call
 * preventDefault.
 */
export function NavMotion({ label, slowLabel }: { label: string; slowLabel: string }) {
  const pathname = usePathname();
  const current = useRef(pathname);
  const timers = useRef<{ slow?: number; giveUp?: number }>({});
  // The pathname a slow navigation started from: once the pathname moves on, it no longer matches.
  const [slowFrom, setSlowFrom] = useState<string | null>(null);
  const slow = slowFrom === pathname;

  // A new pathname means the navigation committed.
  useEffect(() => {
    notePathChange(current.current, pathname);
    current.current = pathname;
    const t = timers.current;
    window.clearTimeout(t.slow);
    window.clearTimeout(t.giveUp);
    document.documentElement.removeAttribute("data-nav-slow");
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const t = timers.current;

    const start = () => {
      window.clearTimeout(t.slow);
      window.clearTimeout(t.giveUp);
      t.slow = window.setTimeout(() => {
        root.setAttribute("data-nav-slow", "");
        setSlowFrom(current.current);
      }, SLOW_AFTER_MS);
      t.giveUp = window.setTimeout(() => {
        root.removeAttribute("data-nav-slow");
        setSlowFrom(null);
      }, GIVE_UP_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const to = new URL(a.href, location.href);
      // Other sites, and the same page (hash jumps, query changes), don't move between pages.
      if (to.origin !== location.origin || to.pathname === current.current) return;
      start();
    };

    // React doesn't animate back/forward (the browser's own restore): the page swaps instantly.
    // A slow one still shows the ring.
    const onPop = () => {
      if (location.pathname !== current.current) start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // One polite announcement per slow navigation, not a live-updating spinner. The bar and the
  // note are visual only: CSS shows them later in the same wait, so they'd only repeat it.
  return (
    <>
      <div role="status" className="sr-only">
        {slow ? label : ""}
      </div>
      <div className="nav-bar" aria-hidden />
      <p
        className="nav-slow-note whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text shadow-lg"
        aria-hidden
      >
        {slowLabel}
      </p>
    </>
  );
}
