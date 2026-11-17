"use client";

import { useRef, useState, type ReactNode } from "react";
import { StorySegments } from "@/design-system/molecules/story-segments";

type Labels = { label: string; slide: string[] };

/**
 * Scroll-snap carousel: swipe on touch, trackpad or drag, and the same story segments as the
 * welcome brief (press one to jump). It moves on by itself while the current segment fills;
 * hover/focus pauses it, and any swipe or segment press stops it for good. No arrow buttons.
 */
export function PromoCarousel({ slides, labels }: { slides: { id: string; node: ReactNode }[]; labels: Labels }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const many = slides.length > 1;

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: n * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };
  const choose = (i: number) => {
    setHeld(true);
    go(i);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.label}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
    >
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onPointerDown={() => setHeld(true)}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={labels.slide[i]}
            aria-hidden={i !== index}
            inert={i !== index}
            className="w-full shrink-0 snap-center"
          >
            {s.node}
          </div>
        ))}
      </div>

      {/* Slides carry more to read than a brief line, so each one stays a little longer. */}
      {many && (
        <StorySegments
          className="mt-1 translate-x-0.5 justify-center"
          count={slides.length}
          index={index}
          paused={paused}
          held={held}
          labels={labels.slide}
          onSelect={choose}
          onDone={() => go(index + 1)}
          duration="7s"
        />
      )}
    </section>
  );
}
