"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SegmentedItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Shows a small dot, e.g. new missed classes. */
  dot?: boolean;
};

/**
 * Tabs following the WAI-ARIA tabs pattern (arrow keys, Home/End).
 * `segment` = boxed switcher, `pills` = filter chips.
 * `role="radio"` turns it into a radio group, for settings (theme, language) rather than views.
 * `track="solid"` gives the segment a grey track, for use on a plain surface (menus).
 * `emphasis="strong"` (segment) makes the chosen item a dark pill with light text, for filters that
 * must read as a control at a glance (the syllabus); the default is a white pill.
 * In the segment, the white pill slides to the chosen item instead of jumping.
 * `fill` (segment) stretches the control to its container's width; the items grow from their own widths.
 * `fill="phone"` stretches it below `lg` only; on wide screens it hugs its items (the syllabus, P116).
 * `progress` (pills only) draws a ring round the chosen pill that fills over `duration` ms, then calls
 * `onDone`. It is decorative (aria-hidden); `paused` freezes it where it is, so pause/resume is exact.
 */
export function Segmented({
  items,
  label,
  defaultValue,
  value: controlled,
  onChange,
  variant = "segment",
  role = "tabs",
  track = "glass",
  emphasis = "default",
  fill = false,
  progress,
}: {
  items: SegmentedItem[];
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  variant?: "segment" | "pills";
  role?: "tabs" | "radio";
  track?: "glass" | "solid";
  emphasis?: "default" | "strong";
  fill?: boolean | "phone";
  progress?: { duration: number; paused: boolean; onDone: () => void };
}) {
  const radio = role === "radio";
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id);
  const value = controlled ?? internal;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const index = items.findIndex((item) => item.id === value);

  // Place the sliding pill under the chosen item, by hand (no state, no re-render). Until it has
  // been placed once, the chosen button paints its own background, so server HTML looks the same.
  // The transition switches on a frame after the first placement, so the pill never slides in from 0.
  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;
    const place = () => {
      const el = refs.current[index];
      if (!el) {
        delete list.dataset.pill;
        return;
      }
      pill.style.width = `${el.offsetWidth}px`;
      pill.style.translate = `${el.offsetLeft}px 0`;
      list.dataset.pill = "";
    };
    place();
    const frame = requestAnimationFrame(() => (pill.dataset.ready = ""));
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [index]);

  const select = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    const next =
      e.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : e.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    select(items[next].id);
  };

  return (
    <div
      ref={listRef}
      role={radio ? "radiogroup" : "tablist"}
      aria-label={label}
      className={cn(
        "group/seg relative items-center",
        fill === "phone" ? "flex w-full lg:inline-flex lg:w-auto" : fill ? "flex w-full" : "inline-flex",
        variant === "segment"
          ? cn("gap-1 rounded-md p-1 ring-1 ring-inset", track === "glass" ? "bg-surface/50 ring-glass-edge" : "bg-raised ring-border")
          : "flex-wrap gap-2",
      )}
    >
      {variant === "segment" && (
        <span
          ref={pillRef}
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-0 hidden rounded-sm group-data-[pill]/seg:block data-[ready]:transition-[translate,width] data-[ready]:duration-(--motion-base) data-[ready]:ease-emphasis",
            emphasis === "strong" ? "bg-text shadow-raised" : "bg-surface shadow-card",
          )}
        />
      )}
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role={radio ? "radio" : "tab"}
            aria-selected={radio ? undefined : selected}
            aria-checked={radio ? selected : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => select(item.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 whitespace-nowrap text-sm font-semibold transition-colors",
              // Fill: each item grows from its own width, so a long label gets more room than a short one.
              fill === "phone" ? "flex-auto justify-center lg:flex-none" : fill && "flex-auto justify-center",
              variant === "segment"
                ? cn(
                    cn("relative rounded-sm", fill === "phone" ? "px-2 lg:px-4" : fill ? "px-2" : "px-3"),
                    selected
                      ? emphasis === "strong"
                        ? "bg-text text-surface shadow-raised group-data-[pill]/seg:bg-transparent group-data-[pill]/seg:shadow-none"
                        : "bg-surface text-text shadow-card group-data-[pill]/seg:bg-transparent group-data-[pill]/seg:shadow-none"
                      : "text-muted hover:text-text",
                  )
                : cn(
                    "relative rounded-full border px-3.5",
                    selected
                      ? "border-transparent bg-text text-surface"
                      : "border-border bg-surface text-muted hover:border-border-strong hover:text-text",
                  ),
            )}
          >
            {item.icon}
            {item.label}
            {item.dot && <span aria-hidden className="size-1.5 rounded-full bg-live" />}
            {progress && selected && variant === "pills" && (
              // 2px gap + 2px stroke. Positioned from the padding box (inside the 1px border): the svg starts
              // 5px out and the rect 1px into it, so the stroke's centre runs 3px outside the pill on every side.
              // An svg needs an explicit size (inset alone leaves it at the default 300×150), and the rect is
              // sized in % (attributes, not CSS, which Safari ignores on <rect>). Radius = (34 + 8) / 2.
              <svg aria-hidden className="pointer-events-none absolute -top-[5px] -left-[5px] h-[calc(100%+8px)] w-[calc(100%+8px)] overflow-visible">
                <rect
                  key={item.id}
                  x={1}
                  y={1}
                  width="100%"
                  height="100%"
                  rx={21}
                  ry={21}
                  pathLength={1}
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="pill-ring stroke-brand"
                  style={{
                    animationDuration: `${progress.duration}ms`,
                    animationPlayState: progress.paused ? "paused" : "running",
                  }}
                  onAnimationEnd={progress.onDone}
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
