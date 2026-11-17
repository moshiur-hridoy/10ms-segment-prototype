"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Closes a popover on a click outside `root` or on Escape. Escape also hands focus back to
 * `trigger`, so keyboard users land where they opened it. It also closes when its page is hidden:
 * with cacheComponents, Next keeps a visited page alive (React <Activity>) and would otherwise
 * show the popover still open on the next visit, e.g. the profile menu after logout and login.
 */
export function useDismiss(
  open: boolean,
  close: () => void,
  root: RefObject<HTMLElement | null>,
  trigger?: RefObject<HTMLElement | null>,
) {
  // The latest `close`, so the hide cleanup below runs only when the page is hidden, not on every render.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => () => closeRef.current(), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      trigger?.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, root, trigger]);
}
