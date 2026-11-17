"use client";

import Image from "next/image";
import { Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/design-system/atoms/avatar";
import { cn } from "@/lib/cn";

/*
 * The login page's right side, kept clean: a photo from the felicitation event on top, and under
 * it one voice at a time (the CEO, then students), changing every ROTATE_MS with a cross-fade.
 * The photo changes with the voice and carries its own caption, so it never reads as a picture of
 * whoever is quoted. All slides sit in one grid cell, so the panel never jumps to a longer quote.
 * Rotation pauses while the pointer or focus is inside, and never starts with reduced motion; the
 * dots switch by hand and show the current slide's time running out.
 */

export type LoginVoice = {
  quote: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  /** A placeholder quote, labelled as such on the slide. */
  sample: boolean;
  photo: string;
};

const ROTATE_MS = 7000;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? "");

export function LoginBrandPanel({
  voices,
  labels,
  numerals,
}: {
  voices: LoginVoice[];
  labels: { region: string; slide: string; goTo: string; sample: string; caption: string };
  /** The page's digits for 1, 2, 3 … (Bangla or Latin), index 0 = "1". */
  numerals: string[];
}) {
  const [active, setActive] = useState(0);
  const [held, setHeld] = useState(false);
  const [still, setStill] = useState(true);

  // Rotation is off until we know the user doesn't prefer reduced motion.
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    const id = setTimeout(sync, 0);
    mq.addEventListener("change", sync);
    return () => {
      clearTimeout(id);
      mq.removeEventListener("change", sync);
    };
  }, []);

  const playing = !still && !held && voices.length > 1;
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % voices.length), ROTATE_MS);
    return () => clearTimeout(id);
  }, [active, playing, voices.length]);

  const total = numerals[voices.length - 1] ?? String(voices.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.region}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
      className="relative isolate flex h-full min-h-[34rem] flex-col gap-8 overflow-hidden rounded-xl bg-surface p-8 ring-1 ring-border xl:p-10"
    >
      {/* A faint brand light from the top corner; the rest stays white. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(60% 50% at 100% 0%, color-mix(in srgb, var(--color-brand) 10%, transparent), transparent 70%)" }}
      />

      {/* The event photo: each slide's photo cross-fades in and drifts slowly closer while it shows. */}
      <figure className="relative min-h-40 flex-1 overflow-hidden rounded-lg bg-raised">
        {voices.map((v, i) => (
          <Image
            key={v.photo + i}
            src={v.photo}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            priority={i === 0}
            className={cn(
              "object-cover transition-[opacity,scale] ease-out",
              i === active ? "scale-105 opacity-100 duration-[7000ms]" : "scale-100 opacity-0 duration-700",
            )}
          />
        ))}
        <figcaption className="absolute bottom-3 left-3 rounded-full bg-surface/85 px-3 py-1 text-xs font-semibold text-text shadow-raised backdrop-blur">
          {labels.caption}
        </figcaption>
      </figure>

      {/* The voices, stacked in one cell; only the active one is shown and reachable. */}
      <div className="grid">
        {voices.map((v, i) => (
          <figure
            key={v.name}
            role="group"
            aria-roledescription="slide"
            aria-label={fill(labels.slide, { n: numerals[i] ?? String(i + 1), total })}
            aria-hidden={i !== active}
            inert={i !== active}
            className={cn("col-start-1 row-start-1 grid content-start gap-5 transition-opacity duration-500", i === active ? "opacity-100" : "opacity-0")}
          >
            <Quote className="size-8 fill-brand-soft text-brand" aria-hidden />
            <blockquote className="text-xl leading-relaxed font-medium text-pretty text-text">{v.quote}</blockquote>
            <figcaption className="flex items-center gap-3">
              <Avatar src={v.avatarUrl} name={v.name} size={44} />
              <span className="grid min-w-0">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {v.name}
                  {v.sample && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">{labels.sample}</span>}
                </span>
                <span className="text-sm text-muted">{v.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      {voices.length > 1 && (
        <div className="flex items-center gap-1.5">
          {voices.map((v, i) => (
            <button
              key={v.name}
              type="button"
              onClick={() => setActive(i)}
              aria-label={fill(labels.goTo, { n: numerals[i] ?? String(i + 1) })}
              aria-current={i === active}
              className={cn("relative h-1.5 overflow-hidden rounded-full transition-all", i === active ? "w-8 bg-border-strong" : "w-1.5 bg-border-strong/60 hover:bg-border-strong")}
            >
              {i === active && playing && (
                <span key={`run-${active}`} aria-hidden className="absolute inset-0 origin-left bg-brand" style={{ animation: `demo-progress ${ROTATE_MS}ms linear both` }} />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
