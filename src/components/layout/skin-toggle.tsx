"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { readSkin, setSkin, type Skin } from "@/lib/skin";

const CHANGE = "skin-change";
const subscribe = (on: () => void) => {
  window.addEventListener(CHANGE, on);
  return () => window.removeEventListener(CHANGE, on);
};

/**
 * The reviewers' switch, pinned to the bottom-right corner: off is the new UI (the live site's twin), on is the old
 * one. It only flips data-skin on <html> (lib/skin.ts); the page doesn't reload. No visible label (the designer's
 * call); screen readers and the tooltip name it.
 */
export function SkinToggle() {
  const old = useSyncExternalStore(subscribe, readSkin, () => "new" as Skin) === "old";
  const flip = () => {
    setSkin(old ? "new" : "old");
    window.dispatchEvent(new Event(CHANGE));
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={old}
      aria-label="Old UI"
      title={old ? "Old UI" : "New UI"}
      onClick={flip}
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 grid place-items-center rounded-full border border-border bg-surface p-1.5 shadow-pop"
    >
      <span className={cn("flex h-6 w-11 items-center rounded-full p-0.5 transition-colors", old ? "bg-text" : "bg-border-strong")}>
        <span
          aria-hidden
          className={cn("size-5 rounded-full bg-surface shadow-raised transition-transform", old && "translate-x-5")}
        />
      </span>
    </button>
  );
}
