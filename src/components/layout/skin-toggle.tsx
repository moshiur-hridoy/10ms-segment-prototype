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
 * The reviewers' switch between the new UI (the live site's twin) and the old one, pinned to the bottom-right corner.
 * It only flips data-skin on <html> (lib/skin.ts); the page doesn't reload.
 */
export function SkinToggle() {
  const skin = useSyncExternalStore(subscribe, readSkin, () => "new" as Skin);
  const pick = (s: Skin) => {
    setSkin(s);
    window.dispatchEvent(new Event(CHANGE));
  };
  return (
    <div
      role="group"
      aria-label="UI"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex rounded-full border border-border bg-surface p-1 text-xs font-semibold shadow-pop"
    >
      {(["new", "old"] as const).map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={skin === s}
          onClick={() => pick(s)}
          className={cn(
            "h-7 rounded-full px-3 transition-colors",
            skin === s ? "bg-text text-surface" : "text-muted hover:text-text",
          )}
        >
          {s === "new" ? "New UI" : "Old UI"}
        </button>
      ))}
    </div>
  );
}
