"use client";

import { useState, type ReactNode } from "react";
import { StorySegments } from "@/design-system/molecules/story-segments";

/**
 * Shows one server-rendered update at a time, story-style: segments under the line,
 * the current one filling; when it finishes, the next update comes in.
 * Hover/focus pauses, choosing a segment holds that update (see StorySegments).
 * Not a live region, so screen readers aren't interrupted every few seconds.
 */
export function BriefTicker({ items, label, goTo }: { items: { id: string; node: ReactNode }[]; label: string; goTo: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);

  const current = items[index] ?? items[0];
  if (!current) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className="grid min-w-0 gap-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
    >
      <div key={current.id} className="min-w-0 motion-safe:animate-brief-in">
        {current.node}
      </div>
      {items.length > 1 && (
        // Flush with the greeting and the dot.
        <StorySegments
          className="-my-2"
          count={items.length}
          index={index}
          paused={paused}
          held={held}
          labels={goTo}
          onSelect={(i) => {
            setIndex(i);
            setHeld(true);
          }}
          onDone={() => setIndex((index + 1) % items.length)}
        />
      )}
    </div>
  );
}
