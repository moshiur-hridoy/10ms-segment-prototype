import type { MouseEvent } from "react";

/*
 * The pathname the user came from, kept by NavMotion as pages commit. It lets a "back to the
 * paper" link step back in history when that is where the user came from, so the browser's
 * own back button then leaves the paper instead of returning to the exam.
 */
let previous: string | null = null;

export function notePathChange(from: string, to: string) {
  if (from !== to) previous = from;
}

/**
 * Props for a link that returns to `href`: if the page before this one is `href`, the click goes
 * back in history; otherwise it replaces this entry, so the page being left never comes back on
 * "back". Spread onto a `Link` (or a Button / IconButton with `href`).
 */
export function backLink(href: string) {
  return {
    href,
    replace: true,
    onClick: (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (previous !== new URL(href, location.href).pathname) return;
      e.preventDefault();
      history.back();
    },
  };
}
