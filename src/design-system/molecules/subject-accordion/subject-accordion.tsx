"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { accordionName } from "./accordion-name";

const KEY = "10ms:open-subject";

/**
 * Behaviour around the subject groups (the groups themselves stay server-rendered):
 *  - The subject opened last is opened again on the next visit (the first one until then).
 *  - A group's header stays where it was clicked. Opening a group closes the open one, and closing
 *    a long group shrinks the page; either would pull the page under the pointer. So the toggle
 *    happens here, in the click itself, and the header is put back where it was before the next
 *    paint: nothing on screen moves but the content opening or closing below it (globals.css).
 */
export function SubjectAccordion({ instance, children }: { instance?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const selector = `details[name="${accordionName(instance)}"]`;

    const last = localStorage.getItem(KEY);
    const remembered = last ? root.querySelector<HTMLDetailsElement>(`${selector}[data-subject="${CSS.escape(last)}"]`) : null;
    if (remembered) remembered.open = true;

    const onClick = (e: MouseEvent) => {
      const summary = (e.target as HTMLElement).closest("summary");
      const details = summary?.parentElement;
      // Not one of ours: the browser's own toggle is fine.
      if (!summary || !(details instanceof HTMLDetailsElement) || !details.matches(selector)) return;
      e.preventDefault();

      const before = summary.getBoundingClientRect().top;
      details.open = !details.open; // opening closes the other one (same `name`)
      const after = summary.getBoundingClientRect().top;
      if (Math.abs(after - before) > 1) window.scrollBy({ top: after - before, behavior: "instant" });
    };

    const onToggle = (e: Event) => {
      const details = e.target as HTMLDetailsElement;
      if (details.matches(selector) && details.open && details.dataset.subject) localStorage.setItem(KEY, details.dataset.subject);
    };

    root.addEventListener("click", onClick);
    // `toggle` doesn't bubble, so listen while it travels down (capture).
    root.addEventListener("toggle", onToggle, true);
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("toggle", onToggle, true);
    };
  }, [instance]);

  // `contents`: the filter and the list stay items of the card's grid (and keep its gap).
  return (
    <div ref={ref} className="contents">
      {children}
    </div>
  );
}
