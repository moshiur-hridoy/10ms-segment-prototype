"use client";

import { cn } from "@/lib/cn";

/**
 * Story-style progress: one thin bar per item, the current one filling (--animate-brief-fill).
 * The owner advances when the fill ends (`onDone`), so the bar and the content never drift.
 *  - `paused` freezes the fill where it is (hover/focus);
 *  - `held` stops it for good and shows the current bar full (WCAG 2.2.2);
 *  - under prefers-reduced-motion the fill never runs, so nothing advances.
 * Each bar sits in a 24px-wide target (20px bar + 4px gap) to meet WCAG 2.5.8.
 */
export function StorySegments({
  count,
  index,
  paused,
  held,
  labels,
  onSelect,
  onDone,
  duration,
  className,
}: {
  count: number;
  index: number;
  paused: boolean;
  held: boolean;
  labels: string[];
  onSelect: (i: number) => void;
  onDone: () => void;
  /** Overrides the fill length, e.g. "7s" for slides with more to read. */
  duration?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex", className)}>
      {Array.from({ length: count }, (_, i) => {
        const active = i === index;
        const running = active && !held;
        return (
          <button
            key={i}
            type="button"
            aria-label={labels[i]}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(i)}
            className="group/seg grid h-6 w-6 items-center justify-items-start"
          >
            <span className="block h-[3px] w-5 overflow-hidden rounded-full bg-border transition-colors group-hover/seg:bg-border-strong">
              <span
                key={active ? `fill-${index}` : undefined}
                onAnimationEnd={running ? onDone : undefined}
                style={running ? { animationPlayState: paused ? "paused" : "running", animationDuration: duration } : undefined}
                className={cn(
                  "block h-full origin-left rounded-full bg-text",
                  running && "scale-x-0 motion-safe:animate-brief-fill motion-reduce:scale-x-100",
                  (i < index || (active && held)) && "scale-x-100",
                  i > index && "scale-x-0",
                )}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
