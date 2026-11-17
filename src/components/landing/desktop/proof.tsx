"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { proof, results } from "@/data/landing/site";
import { event2025, parentQuotes, stageVideos, studentQuotes } from "@/data/landing/proof";
import { bn } from "@/lib/bn";
import { useFormal, useT } from "../address";
import { Arrow } from "../ui";

/**
 * L22: "কাজ করে কি?" as a results board: a lot of real proof in little space, and always moving
 * a little so it doesn't tire. The event photos change on their own, the stage prints are spread
 * on a small blackboard, the quotes are a stack of paper that turns, the numbers are sticky
 * notes. Guardians see the parents' words in the larger place. Everything pauses on hover.
 */
export function DesktopProof() {
  const formal = useFormal();
  const t = useT();
  return (
    <section id="proof" className="scroll-mt-16 border-y border-border bg-surface">
      <div className="mx-auto max-w-[1200px] px-10 py-24">
        <div className="grid grid-cols-12 items-end gap-10">
          <div className="col-span-7">
            <p className="flex items-center gap-3 text-sm font-medium text-subtle">
              <span className="font-mono text-sm text-brand-text">০৬</span>
              <span aria-hidden className="h-px w-8 bg-border-strong" />
              কাজ করে কি?
            </p>
            <h2 className="font-sans mt-4 text-4xl leading-[1.25] font-bold">কথা না, ফলাফল।</h2>
          </div>
          <p className="col-span-5 pb-1.5 text-lg leading-relaxed text-muted">
            {t("সংবর্ধনার মঞ্চ, শিক্ষার্থী আর অভিভাবকদের নিজের কথা। সব ১০ মিনিট স্কুলের নিজের অনুষ্ঠান আর শিক্ষার্থীদের থেকে।", "সংবর্ধনার মঞ্চ, অভিভাবক আর শিক্ষার্থীদের নিজের কথা। সব ১০ মিনিট স্কুলের নিজের অনুষ্ঠান আর পরিবারগুলোর থেকে।")}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-12 gap-5">
          <EventPhotos className="col-span-7 h-[400px]" />
          <StageBoard className="col-span-5 h-[400px]" />
          {formal ? (
            <>
              <ParentQuotes className="col-span-5" />
              <StudentQuotes className="col-span-4" />
            </>
          ) : (
            <>
              <StudentQuotes className="col-span-5" />
              <ParentQuotes className="col-span-4" />
            </>
          )}
          <Numbers className="col-span-3" />
        </div>
      </div>
    </section>
  );
}

/** Steps through n items every `ms`, unless paused or motion is reduced. */
function useCycle(n: number, ms: number) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || n < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setI((x) => (x + 1) % n), ms);
    return () => window.clearInterval(id);
  }, [n, ms, paused]);
  return { i, setI, hover: { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false) } };
}

/* ───────── the 2025 event, photos changing on their own ───────── */

function EventPhotos({ className }: { className?: string }) {
  const { i, setI, hover } = useCycle(event2025.photos.length, 4500);
  return (
    <figure {...hover} className={clsx("relative overflow-hidden rounded-xl bg-ink text-on-fill", className)}>
      {event2025.photos.map((src, j) => (
        <Image
          key={src}
          src={src}
          alt={j === 0 ? `${event2025.caption}` : ""}
          fill
          sizes="700px"
          priority={j === 0}
          className={clsx("object-cover transition-[opacity,transform] duration-[1200ms] ease-standard", j === i ? "scale-100 opacity-100" : "scale-[1.04] opacity-0", j === 0 && "object-[50%_40%]")}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_23_30/0)_38%,rgb(18_23_30/0.92)_100%)]" />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-8">
        <span>
          <span className="font-sans block text-6xl leading-none font-bold" style={{ color: "var(--marker)" }}>{event2025.number}</span>
          <span className="mt-2 block text-xl leading-snug font-semibold">{event2025.line}</span>
          <span className="mt-1.5 block text-sm text-on-fill/60">{event2025.caption}</span>
        </span>
        <span className="flex gap-1.5 pb-1">
          {event2025.photos.map((src, j) => (
            <button key={src} onClick={() => setI(j)} aria-label={`ছবি ${bn(j + 1)}`} className={clsx("h-1.5 rounded-full transition-all", j === i ? "w-5 bg-surface" : "w-1.5 bg-on-fill/40")} />
          ))}
        </span>
      </figcaption>
    </figure>
  );
}

/* ───────── stage prints on a small blackboard; each one plays its video (L37) ───────── */

const SPREAD = [
  { left: "3%", top: 92, rotate: -7 },
  { left: "20%", top: 70, rotate: -2 },
  { left: "37%", top: 96, rotate: 4 },
  { left: "53.5%", top: 74, rotate: -4 },
  { left: "68%", top: 98, rotate: 6 },
];

/** A video on the board: a vertical YouTube video, its title, who and where from (CT72: the segment page's reviews too). */
export type StageVideo = { videoId: string; title: string; name: string; school: string; img: string };

export function StageBoard({
  className,
  videos = stageVideos,
  label = "মঞ্চে যারা উঠেছে",
  kicker = "কৃতী শিক্ষার্থী",
}: {
  className?: string;
  videos?: StageVideo[];
  label?: string;
  kicker?: string;
}) {
  const [playing, setPlaying] = useState<number | null>(null);
  return (
    <div className={clsx("relative overflow-hidden rounded-xl", className)} style={{ background: "var(--slate)" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen" style={{ backgroundImage: "var(--dust)", backgroundSize: "240px" }} />
      <p className="chalk absolute top-6 left-7 text-xl font-semibold text-on-fill/80">{label}</p>
      <button onClick={() => setPlaying(0)} className="absolute top-6 right-7 flex items-center gap-1.5 text-sm text-on-fill/60 hover:text-on-fill">
        <PlayIcon className="size-3" /> {bn(videos.length)}টি ভিডিও
      </button>
      {videos.slice(0, SPREAD.length).map((v, j) => (
        <button
          key={v.videoId}
          onClick={() => setPlaying(j)}
          aria-label={`ভিডিও দেখো: ${v.title}`}
          className="group absolute w-[132px] text-left transition-transform duration-300 ease-emphasis hover:z-20 hover:!rotate-0 hover:-translate-y-3 hover:scale-[1.08]"
          style={{ left: SPREAD[j].left, top: SPREAD[j].top, transform: `rotate(${SPREAD[j].rotate}deg)`, zIndex: j }}
        >
          <span className="block bg-[#fbf8f1] p-1.5 pb-0 shadow-[0_10px_20px_-6px_rgb(0_0_0/0.6)]">
            <span className="relative block aspect-[9/16] overflow-hidden">
              <Image src={v.img} alt="" fill sizes="132px" className="object-cover" />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
              <span className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-on-fill/90 text-ink shadow-[0_4px_12px_rgb(0_0_0/0.4)] transition-transform group-hover:scale-110">
                <PlayIcon className="ml-0.5 size-3.5" />
              </span>
            </span>
            <span className="block truncate px-0.5 py-1.5 text-xs font-semibold text-[#3d3a33]">{v.name}</span>
          </span>
        </button>
      ))}
      {playing !== null && <VideoBox videos={videos} kicker={kicker} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={className} fill="currentColor">
      <path d="M2.5 1.2v9.6c0 .5.5.8.9.5l7.3-4.8c.4-.3.4-.8 0-1L3.4.7c-.4-.3-.9 0-.9.5z" />
    </svg>
  );
}

/** A lightbox with the video playing (YouTube Shorts, vertical), its story, and the others. On phones (CT72) the video alone. */
export function VideoBox({
  videos = stageVideos,
  kicker = "কৃতী শিক্ষার্থী",
  index,
  onIndex,
  onClose,
}: {
  videos?: StageVideo[];
  kicker?: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const v = videos[index];
  const n = videos.length;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % n);
      if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [index, n, onClose, onIndex]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={v.title} onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(10_14_12/0.86)] backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="rise flex items-center gap-10">
        <div className="relative h-[min(78vh,760px)] max-w-[92vw] overflow-hidden rounded-lg bg-black md:h-[min(82vh,760px)] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]" style={{ aspectRatio: "9 / 16" }}>
          <iframe
            key={v.videoId}
            src={`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0&playsinline=1&modestbranding=1`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="w-[300px] text-on-fill max-md:hidden">
          <p className="text-sm text-on-fill/50">
            {kicker} · {bn(index + 1)}/{bn(n)}
          </p>
          <p key={v.videoId} className="rise mt-3 text-2xl leading-snug font-bold">{v.title}</p>
          <p className="mt-4 text-base font-semibold">{v.name}</p>
          <p className="text-sm text-on-fill/60">{v.school}</p>
          <div className="mt-8 flex gap-2">
            <button onClick={() => onIndex((index - 1 + n) % n)} aria-label="আগের ভিডিও" className="flex size-11 items-center justify-center rounded-full bg-on-fill/10 hover:bg-on-fill/20">
              <Arrow className="size-4 rotate-180" />
            </button>
            <button onClick={() => onIndex((index + 1) % n)} className="flex h-11 items-center gap-2 rounded-full bg-on-fill/10 px-5 text-sm font-medium hover:bg-on-fill/20">
              পরের ভিডিও <Arrow className="size-4" />
            </button>
          </div>
          {/* the other videos */}
          <div className="mt-8 grid grid-cols-4 gap-2">
            {videos.map((o, j) => (
              <button key={o.videoId} onClick={() => onIndex(j)} aria-label={o.title} className={clsx("relative aspect-[9/16] overflow-hidden rounded-sm transition-opacity", j === index ? "ring-2 ring-surface" : "opacity-55 hover:opacity-100")}>
                <Image src={o.img} alt="" fill sizes="70px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
      <button ref={closeRef} onClick={onClose} aria-label="বন্ধ করো" className="absolute top-6 right-6 flex size-11 items-center justify-center rounded-full bg-on-fill/10 text-2xl text-on-fill hover:bg-on-fill/20">
        ×
      </button>
    </div>,
    document.body,
  );
}

/* ───────── quotes: a stack of paper that turns ───────── */

function Stack({ label, count, i, setI, hover, className, height = "h-[300px]", swipe = false, children }: {
  label: string;
  count: number;
  i: number;
  setI: (fn: (x: number) => number) => void;
  hover: Record<string, () => void>;
  className?: string;
  /** The sheet's height (CT72: taller beside the segment page's video board). */
  height?: string;
  /** CT116: a finger drags the top sheet sideways; let go far enough and it flies off, the next comes up from the stack. */
  swipe?: boolean;
  children: React.ReactNode;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(0);
  const [held, setHeld] = useState(false);
  const turn = (dir: number) => setI((x) => (x + dir + count) % count);
  const drag = swipe
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          if (e.pointerType === "mouse" || gone) return;
          // A touch stops the stack turning on its own; the reader is in charge now.
          hover.onMouseEnter?.();
          start.current = { x: e.clientX, y: e.clientY };
          setHeld(true);
        },
        onPointerMove: (e: React.PointerEvent) => {
          if (!start.current) return;
          setDx(e.clientX - start.current.x);
        },
        onPointerUp: () => {
          if (!start.current) return;
          start.current = null;
          setHeld(false);
          if (Math.abs(dx) < 60) return setDx(0);
          const dir = dx < 0 ? 1 : -1;
          setGone(dir);
          window.setTimeout(() => {
            turn(dir);
            setGone(0);
            setDx(0);
          }, 180);
        },
        onPointerCancel: () => {
          start.current = null;
          setHeld(false);
          setDx(0);
        },
      }
    : {};
  const moved = gone !== 0 || dx !== 0;
  return (
    <div {...hover} className={clsx("relative", height, className)}>
      {/* the sheets underneath */}
      <span aria-hidden className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-[1.5deg] rounded-lg bg-[#f3eee3] shadow-[0_1px_2px_rgb(52_36_16/0.12)]" />
      <span aria-hidden className="absolute inset-0 translate-x-0.5 translate-y-0.5 -rotate-[0.8deg] rounded-lg bg-[#f7f3ea] shadow-[0_1px_2px_rgb(52_36_16/0.12)]" />
      <div
        {...drag}
        className={clsx(
          "relative flex h-full flex-col rounded-lg bg-paper p-7 shadow-[0_1px_2px_rgb(52_36_16/0.15),0_18px_30px_-20px_rgb(52_36_16/0.4)]",
          swipe && "touch-pan-y select-none",
        )}
        style={
          moved
            ? {
                transform: gone ? `translateX(${-gone * 115}%) rotate(${-gone * 8}deg)` : `translateX(${dx}px) rotate(${dx / 24}deg)`,
                opacity: gone ? 0 : 1,
                transition: held ? "none" : "transform 180ms ease-out, opacity 180ms ease-out",
              }
            : undefined
        }
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-subtle">{label}</p>
          <div className="flex items-center gap-1">
            <span className="mr-1 font-mono text-xs text-subtle">
              {bn(i + 1)}/{bn(count)}
            </span>
            <button onClick={() => turn(-1)} aria-label="আগেরটা" className="relative flex size-7 items-center justify-center rounded-full text-subtle after:absolute after:-inset-2 after:content-[''] hover:bg-raised hover:text-text">
              <Arrow className="size-3.5 rotate-180" />
            </button>
            <button onClick={() => turn(1)} aria-label="পরেরটা" className="relative flex size-7 items-center justify-center rounded-full text-subtle after:absolute after:-inset-2 after:content-[''] hover:bg-raised hover:text-text">
              <Arrow className="size-3.5" />
            </button>
          </div>
        </div>
        <div key={i} className="rise mt-4 flex flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

/** A stack of paper quotes for any list (CT72: the segment page's written reviews), turning on its own. */
export function QuoteStack({
  label,
  quotes,
  ms = 6500,
  className,
  height,
}: {
  label: string;
  quotes: { quote: string; name: string; role: string; photo?: string | null }[];
  ms?: number;
  className?: string;
  height?: string;
}) {
  const { i, setI, hover } = useCycle(quotes.length, ms);
  const q = quotes[i];
  if (!q) return null;
  return (
    <Stack label={label} count={quotes.length} i={i} setI={setI} hover={hover} className={className} height={height} swipe>
      <blockquote className="line-clamp-6 text-lg leading-[1.7]">“{q.quote}”</blockquote>
      <p className="mt-auto flex items-center gap-3 pt-4">
        {q.photo && (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-surface">
            <Image src={q.photo} alt={q.name} fill sizes="44px" className="object-cover object-[40%_25%]" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-base font-semibold">{q.name}</span>
          <span className="block truncate text-sm text-muted">{q.role}</span>
        </span>
      </p>
    </Stack>
  );
}

function StudentQuotes({ className }: { className?: string }) {
  const { i, setI, hover } = useCycle(studentQuotes.length, 6500);
  const q = studentQuotes[i];
  return (
    <Stack label="শিক্ষার্থীরা বলছে" count={studentQuotes.length} i={i} setI={setI} hover={hover} className={className}>
      <blockquote className="line-clamp-5 text-lg leading-[1.7]">“{q.quote}”</blockquote>
      <p className="mt-auto pt-4">
        <span className="block text-base font-semibold">{q.name}</span>
        <span className="block text-sm text-muted">{q.school}</span>
      </p>
    </Stack>
  );
}

function ParentQuotes({ className }: { className?: string }) {
  const { i, setI, hover } = useCycle(parentQuotes.length, 7000);
  const q = parentQuotes[i];
  return (
    <Stack label="অভিভাবকেরা বলছেন" count={parentQuotes.length} i={i} setI={setI} hover={hover} className={className}>
      <blockquote className="line-clamp-5 text-lg leading-[1.7]">“{q.quote}”</blockquote>
      <p className="mt-auto flex items-center gap-3 pt-4">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-surface">
          <Image src={q.photo} alt={q.name} fill sizes="44px" className="object-cover object-[40%_25%]" />
        </span>
        <span>
          <span className="block text-base font-semibold">{q.name}</span>
          <span className="block text-sm text-muted">{q.role}</span>
        </span>
      </p>
    </Stack>
  );
}

/* ───────── the numbers as sticky notes ───────── */

/** The landing's three numbers with their note colours; the segment page's bento shows them as tiles too (CT113). */
export const NUMBER_NOTES = [
  { value: `${proof.rating}★`, label: `${proof.ratingCount} শিক্ষার্থীর রেটিং, গুগল প্লে`, bg: "#fff1a6", rotate: -2 },
  { value: proof.academicStudents, label: "শিক্ষার্থী এখন একাডেমিক কোর্সে", bg: "#dff3e4", rotate: 1.5 },
  { value: results.firstInAnnualExam, label: "শিক্ষার্থী সারাদেশ থেকে বার্ষিক পরীক্ষায় ১ম", bg: "#e4ecfb", rotate: -1 },
];

export function Numbers({ className }: { className?: string }) {
  const notes = NUMBER_NOTES;
  return (
    <div className={clsx("flex h-[300px] flex-col justify-between gap-2.5", className)}>
      {notes.map((n) => (
        <div key={n.label} className="flex flex-1 items-center gap-3 rounded-[4px] px-5 shadow-[0_1px_1px_rgb(52_36_16/0.12),0_8px_14px_-10px_rgb(52_36_16/0.4)]" style={{ background: n.bg, transform: `rotate(${n.rotate}deg)` }}>
          <span className="text-2xl font-bold tracking-tight">{n.value}</span>
          <span className="text-xs leading-snug text-[#4b4636]">{n.label}</span>
        </div>
      ))}
    </div>
  );
}
