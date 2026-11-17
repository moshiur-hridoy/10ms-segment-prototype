"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Segmented } from "@/design-system/molecules/segmented";
import { cn } from "@/lib/cn";

/** How long each shelf's ring takes to fill during the one-time peek. */
const PEEK_MS = 7000;
/** Share of the card that must be on screen to start (it can be taller than a phone). */
const PEEK_VISIBLE = 0.6;
/** Set once the peek has finished or been cancelled, so it runs once per browser session. */
const PEEK_KEY = "shelf-peek-done";

/**
 * The one-time peek that shows there are more shelves: once the card is in view, a ring fills round
 * each pill in turn (PEEK_MS each) and the shelf follows, then it returns to the first and stops.
 * Any interaction with the card ends it for the session. Leaving the screen pauses it, keeping the
 * time left (the ring is a CSS animation, so "paused" is just animation-play-state).
 * Everything starts in effects, after hydration; reduced motion means no peek at all.
 */
function usePeek(rootRef: RefObject<HTMLDivElement | null>, ids: string[], select: (id: string) => void) {
  const [running, setRunning] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const runningRef = useRef(false);
  const startedRef = useRef(false);
  const many = ids.length > 1;

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    try {
      sessionStorage.setItem(PEEK_KEY, "1");
    } catch {}
  }, []);

  useEffect(() => {
    const card = rootRef.current?.parentElement;
    if (!card || !many) return;
    try {
      if (sessionStorage.getItem(PEEK_KEY)) return;
    } catch {}
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const seen = entry.intersectionRatio >= PEEK_VISIBLE;
        setInView(seen);
        // The first time it is seen, the peek starts; after that, in-view only pauses and resumes.
        if (seen && !runningRef.current && !startedRef.current) {
          startedRef.current = true;
          runningRef.current = true;
          setRunning(true);
        }
      },
      { threshold: [0, PEEK_VISIBLE] },
    );
    observer.observe(card);

    const onVisibility = () => setVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    // Hover, focus, click, keys, and sideways scrolling of a shelf end it. Plain page scrolling doesn't.
    const cancel = () => runningRef.current && stop();
    const cancelShelf = (e: Event) => e.target instanceof Element && e.target.closest("ul") && cancel();
    // Hover means the mouse really moved: scrolling the page under a still cursor fires hover events
    // too (with no movement), and that would end the peek the moment the card scrolls into view.
    const cancelHover = (e: PointerEvent) => (e.movementX || e.movementY) && cancel();
    card.addEventListener("pointermove", cancelHover);
    const events = ["focusin", "click", "keydown"] as const;
    events.forEach((name) => card.addEventListener(name, cancel));
    const shelfEvents = ["wheel", "touchstart", "scroll"] as const;
    // Capture, because scroll doesn't bubble.
    shelfEvents.forEach((name) => card.addEventListener(name, cancelShelf, { capture: true, passive: true }));

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      card.removeEventListener("pointermove", cancelHover);
      events.forEach((name) => card.removeEventListener(name, cancel));
      shelfEvents.forEach((name) => card.removeEventListener(name, cancelShelf, { capture: true }));
    };
  }, [rootRef, many, stop]);

  const [step, setStep] = useState(0);
  const onDone = useCallback(() => {
    if (step < ids.length - 1) {
      select(ids[step + 1]);
      setStep(step + 1);
    } else {
      select(ids[0]);
      stop();
    }
  }, [step, ids, select, stop]);

  return { running, step, paused: !inView || !visible, onDone };
}

/** Title row with shelf pills, then the selected server-rendered shelf. Pills hide when there is one shelf. */
export function ShelfTabs({
  title,
  label,
  shelves,
}: {
  title: ReactNode;
  label: string;
  shelves: { id: string; label: string; panel: ReactNode }[];
}) {
  const [current, setCurrent] = useState(shelves[0]?.id);
  // The fade belongs to switching, not to the first paint.
  const [switched, setSwitched] = useState(false);
  const shelf = shelves.find((s) => s.id === current) ?? shelves[0];
  const ids = shelves.map((s) => s.id);

  const select = useCallback((id: string) => {
    setCurrent(id);
    setSwitched(true);
  }, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const peek = usePeek(rootRef, ids, select);

  return (
    // `contents`: no box of its own, so the card's grid still lays out the two children; it only marks where to listen.
    <div ref={rootRef} className="contents">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title}
        {shelves.length > 1 && (
          <Segmented
            variant="pills"
            label={label}
            value={shelf.id}
            onChange={select}
            items={shelves.map((s) => ({ id: s.id, label: s.label }))}
            progress={peek.running ? { duration: PEEK_MS, paused: peek.paused, onDone: peek.onDone } : undefined}
          />
        )}
      </div>
      <div key={shelf.id} role="tabpanel" aria-label={shelf.label} className={cn("min-w-0", switched && "shelf-fade")}>
        {shelf.panel}
      </div>
    </div>
  );
}
