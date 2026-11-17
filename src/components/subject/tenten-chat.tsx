"use client";

import Image from "next/image";
import { ArrowLeft, ArrowUp, Play } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import { usePlayback } from "./playback";
import { partAt, type VideoPart } from "./player-parts";

/*
 * Lab `concept` v10 (P163): TenTen in the page, not only as an icon. A box to type in sits above
 * "এই ক্লাসের কাজ" (on wide screens, at the top of the right column); since v11 (P164) it is 40px tall (44px on phones since v23, P177), with
 * no chips above it: what it says changes every 6 s instead. Sending opens the chat right
 * there, under the video: the video stays pinned and keeps playing, and "ক্লাসে ফেরো" brings the class
 * back. Each question carries the moment of the video and its part, and TenTen's answer offers to
 * play that moment again. While the box is out of view, the chat head (TenTenHead) takes over, in every
 * class, live or not; a tap on it opens the chat. TenTen isn't connected yet: its answer is a sample
 * and says so.
 */

export type TenTenChatLabels = {
  placeholder: string;
  send: string;
  /** P169: what the empty box says, in TenTen's voice, one after another. */
  nudgeHelp: string;
  nudgePart: string;
  nudgeFocus: string;
  nudgeStay: string;
  back: string;
  hello: string;
  typing: string;
  sampleReply: string;
  rewatch: string;
  expand: string;
  collapse: string;
};

type Msg = { id: number; who: "me" | "tenten"; text: string; at: number | null; part: string | null };
type Chat = { open: boolean; msgs: Msg[]; typing: boolean; seen: Record<string, boolean> };

let chat: Chat = { open: false, msgs: [], typing: false, seen: {} };
const listeners = new Set<() => void>();
const set = (patch: Partial<Chat>) => {
  chat = { ...chat, ...patch };
  for (const l of listeners) l();
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const idle: Chat = { open: false, msgs: [], typing: false, seen: {} };
export const useTenTenChat = () =>
  useSyncExternalStore(
    subscribe,
    () => chat,
    () => idle,
  );

/** Open the chat under the video (the chat head's tap). */
export function openTenTenChat() {
  set({ open: true });
  // After the chat replaces the class (a smooth scroll started before the swap gets cut short).
  requestAnimationFrame(() => scrollTo({ top: 0 }));
}

let nextId = 1;
let replyTimer: number | undefined;
function ask(text: string, at: number | null, part: string | null) {
  set({ open: true, typing: true, msgs: [...chat.msgs, { id: nextId++, who: "me", text, at, part }] });
  window.clearTimeout(replyTimer);
  replyTimer = window.setTimeout(() => {
    set({ typing: false, msgs: [...chat.msgs, { id: nextId++, who: "tenten", text: "", at, part }] });
  }, 1100);
}

/** The video's moment and part, read when a question is sent. */
function useMoment(parts: VideoPart[] | undefined) {
  const pb = usePlayback();
  const started = pb.phase !== "idle" && pb.phase !== "loading";
  const at = started ? pb.time : null;
  const part = partAt(parts, pb.time)?.title ?? null;
  return { at, part, seekTo: pb.seekTo };
}

// The face's tile sits 4.1 of the svg's 46 units above its centre (the shadow is below it): 9% down centres it.
const Face = ({ className }: { className?: string }) => (
  <Image
    src="/assets/tenten.svg"
    alt=""
    width={40}
    height={40}
    draggable={false}
    className={cn("shrink-0 translate-y-[9%] select-none", className)}
  />
);

/** P164: what the empty box says changes every 6 s (in place of the chips above it, P163). */
const CYCLE_MS = 6000;

function Composer({
  parts,
  labels,
  autoFocus = false,
  dark = false,
  className,
}: {
  parts: VideoPart[] | undefined;
  labels: TenTenChatLabels;
  autoFocus?: boolean;
  /** Inside the chat, which is dark like TenTen's own (P165). */
  dark?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [i, setI] = useState(0);
  const { at, part } = useMoment(parts);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) field.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // P169: TenTen speaking to the student: help on offer (for the part playing too), then a nudge to stay with the class.
  const hints = [labels.nudgeHelp, ...(part ? [labels.nudgePart] : []), labels.nudgeFocus, labels.nudgeStay];
  const hint = hints[i % hints.length];
  // A long part name ("RNA World Hypothesis") shortens with "…", so the rest of the line always shows.
  const [before, after] = hint.includes("{part}") ? hint.split("{part}") : [hint, null];
  const cycling = value === "";
  useEffect(() => {
    if (!cycling || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => n + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, [cycling]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    ask(q, at, part);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send(value);
      }}
      // v23 (P177): 44px with 6px around the face and the button on phones, so they don't touch the edge; 40px from sm up.
      className={cn(
        "flex h-11 items-center gap-2 rounded-full border px-1.5 transition-[border-color,box-shadow] focus-within:border-tenten-violet focus-within:ring-3 focus-within:ring-tenten-violet/20 sm:h-10 sm:px-1",
        dark ? "border-on-fill/15 bg-on-fill/8" : "border-border bg-surface",
        className,
      )}
    >
      <Face className="size-8" />
      <span className="relative grid min-w-0 flex-1">
        <input
          ref={field}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label={labels.placeholder}
          enterKeyHint="send"
          className={cn("w-full bg-transparent text-base outline-none sm:text-sm", dark ? "text-on-fill" : "text-text")}
        />
        {value === "" && (
          // A new hint rises in (the key restarts it).
          <span
            key={hint + part}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center text-sm whitespace-pre transition-[opacity,translate] duration-500 ease-emphasis starting:translate-y-2 starting:opacity-0",
              dark ? "text-on-fill/50" : "text-subtle",
            )}
          >
            {after === null ? (
              <span className="min-w-0 truncate">{before}</span>
            ) : (
              <>
                {before && <span className="shrink-0">{before}</span>}
                <span className="min-w-0 truncate">{part}</span>
                <span className="shrink-0">{after}</span>
              </>
            )}
          </span>
        )}
      </span>
      <button
        type="submit"
        aria-label={labels.send}
        disabled={!value.trim()}
        className="grid size-8 shrink-0 place-items-center rounded-full text-on-fill transition-[opacity,transform] [background-image:var(--tenten-edge)] hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
      >
        <ArrowUp className="size-4" aria-hidden />
      </button>
    </form>
  );
}

/** The box above "এই ক্লাসের কাজ". It tells the chat head whether it can be seen (below the pinned video, above the screen's bottom). */
export function TenTenAsk({ parts, labels, className }: { parts: VideoPart[] | undefined; labels: TenTenChatLabels; className?: string }) {
  const key = useId();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const check = () => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // The video is pinned at the top only on phones and tablets held upright (P105); on wide screens nothing covers the box.
      const pinned = innerWidth < 1024 && matchMedia("(orientation: portrait)").matches;
      const top = pinned ? (document.getElementById("player")?.getBoundingClientRect().bottom ?? 0) : 0;
      // Hidden (display: none at this width) reads as a zero box.
      const seen = r.height > 0 && r.bottom > Math.max(0, top) + 24 && r.top < innerHeight - 24;
      if (chat.seen[key] !== seen) set({ seen: { ...chat.seen, [key]: seen } });
    };
    check();
    addEventListener("scroll", check, { passive: true });
    addEventListener("resize", check);
    return () => {
      removeEventListener("scroll", check);
      removeEventListener("resize", check);
      const rest = { ...chat.seen };
      delete rest[key];
      set({ seen: rest });
    };
  }, [key]);
  return (
    <div ref={box} className={className}>
      <Composer parts={parts} labels={labels} />
    </div>
  );
}

/** Whether a TenTen box is in view (the chat head stays away while one is). */
export const useTenTenBoxSeen = () => Object.values(useTenTenChat().seen).some(Boolean);

/**
 * What sits under the video: the class (title, the box, the steps) or, once a question is sent, the chat.
 * `wide`: the right column's copy (from `lg`); otherwise the phone's (below `lg`). The class stays mounted
 * while the chat shows, so its state (the steps, the parts list) is kept.
 */
export function TenTenSwap({
  wide = false,
  parts,
  locale,
  labels,
  children,
}: {
  wide?: boolean;
  parts: VideoPart[] | undefined;
  locale: Locale;
  labels: TenTenChatLabels;
  children: ReactNode;
}) {
  const { open } = useTenTenChat();
  return (
    <>
      <div className={cn("contents", open && (wide ? "lg:hidden" : "max-lg:hidden"))}>{children}</div>
      {open && <Thread parts={parts} locale={locale} labels={labels} className={wide ? "max-lg:hidden" : "lg:hidden"} />}
    </>
  );
}

/** P167: pulled this far (or a third of the way), the sheet goes on; less springs back. */
const PULL = 72;
/** Before the video is measured: under the phone's top bar and a 16:9 video as wide as the screen. */
const TOP_GUESS = "calc(3.5rem + env(safe-area-inset-top) + 56.25vw)";

/** The pinned video's top and bottom on phones (0, 0 before it is measured). */
function usePlayerEdges() {
  const [edges, setEdges] = useState({ top: 0, bottom: 0 });
  useEffect(() => {
    const read = () => {
      const r = document.getElementById("player")?.getBoundingClientRect();
      if (r) setEdges((e) => (e.top === r.top && e.bottom === r.bottom ? e : { top: r.top, bottom: r.bottom }));
    };
    read();
    addEventListener("resize", read);
    addEventListener("scroll", read, { passive: true });
    return () => {
      removeEventListener("resize", read);
      removeEventListener("scroll", read);
    };
  }, []);
  return edges;
}

let locks = 0;

function Thread({
  parts,
  locale,
  labels,
  className,
}: {
  parts: VideoPart[] | undefined;
  locale: Locale;
  labels: TenTenChatLabels;
  className?: string;
}) {
  const { msgs, typing } = useTenTenChat();
  const { seekTo } = useMoment(parts);
  const fmt = createFormatter(locale, 0);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (msgs.length) end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msgs.length, typing]);
  const moment = (m: Msg) => [m.at !== null && fmt.duration(m.at), m.part].filter(Boolean).join(" · ");

  // P167, phones: a bottom sheet. Since v15 (P168) it is always fixed to the screen, from its top edge to the
  // screen's bottom, so nothing of the page shows under it and only its top edge moves: under the video at rest,
  // under the top bar when full. The finger moves it directly; let go, it glides to the nearer stop.
  const edges = usePlayerEdges();
  const [full, setFull] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const press = useRef<{ y: number; moved: boolean } | null>(null);
  const measured = edges.bottom > edges.top;
  const rest = full ? edges.top : edges.bottom;
  const top = drag ?? rest;
  const lifted = full || (drag !== null && drag < edges.bottom - 1);

  // The page behind doesn't scroll while the chat is open on a phone (both copies, phone and wide, share one lock).
  useEffect(() => {
    if (!matchMedia("(max-width: 1023.98px)").matches) return;
    if (locks++ === 0) document.documentElement.style.overflow = "hidden";
    return () => {
      if (--locks === 0) document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    // P165: dark like TenTen's own chat, with a little purple glow at its top. On phones it runs edge to edge and
    // meets the pinned video, so the two read as one dark block; on wide screens a card in the right column.
    <section
      aria-label={labels.placeholder}
      className={cn(
        "flex flex-col gap-4 bg-player px-4 text-on-fill [background-image:radial-gradient(120%_50%_at_50%_0%,color-mix(in_oklab,var(--color-tenten-violet)_24%,transparent),transparent_70%)]",
        "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-[var(--sheet-top)] max-lg:z-35 sm:max-lg:px-6 lg:rounded-xl lg:pt-3",
        lifted && "max-lg:rounded-t-xl max-lg:shadow-pop",
        drag === null && "max-lg:transition-[top,border-radius] max-lg:duration-300 max-lg:ease-emphasis",
        className,
      )}
      style={{ "--sheet-top": measured ? `${top}px` : TOP_GUESS } as CSSProperties}
    >
      <div className="grid">
        {/* The handle: drag it, or tap it, to make the chat full screen or put it back under the video. */}
        <button
          type="button"
          aria-label={full ? labels.collapse : labels.expand}
          aria-expanded={full}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            press.current = { y: e.clientY, moved: false };
          }}
          onPointerMove={(e) => {
            const p = press.current;
            if (!p) return;
            const dy = e.clientY - p.y;
            if (!p.moved && Math.abs(dy) < 6) return;
            p.moved = true;
            setDrag(Math.min(Math.max(rest + dy, edges.top), edges.bottom));
          }}
          onPointerUp={() => {
            const p = press.current;
            press.current = null;
            if (!p) return;
            if (p.moved && drag !== null) {
              const room = edges.bottom - edges.top;
              const pulled = Math.abs(drag - rest) >= Math.min(PULL, room / 3);
              if (pulled) setFull(!full);
            } else setFull(!full);
            setDrag(null);
          }}
          onPointerCancel={() => {
            press.current = null;
            setDrag(null);
          }}
          // A keyboard (or a script's) click has no pointer: it toggles too.
          onClick={(e) => {
            if (e.detail === 0) setFull(!full);
          }}
          className="-mx-4 grid h-6 touch-none place-items-center lg:hidden"
        >
          <span className="h-1 w-9 rounded-full bg-on-fill/30" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => set({ open: false })}
          className="-ml-2 flex h-10 items-center gap-1.5 justify-self-start rounded-full px-2 text-sm font-semibold text-on-fill/70 transition-colors hover:text-on-fill press"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {labels.back}
        </button>
      </div>

      {/* On phones the messages scroll inside the sheet. */}
      <div className="grid content-start max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain">
        <ol className="grid gap-3">
          <li className="flex items-end gap-2">
            <Face className="size-8" />
            <p className="max-w-[85%] rounded-lg rounded-bl-xs bg-on-fill/10 px-3.5 py-2.5 text-sm">{labels.hello}</p>
          </li>
          {msgs.map((m) =>
            m.who === "me" ? (
              <li key={m.id} className="grid justify-items-end gap-1">
                <p className="max-w-[85%] rounded-lg rounded-br-xs px-3.5 py-2.5 text-sm text-on-fill [background-image:var(--tenten-edge)]">
                  {m.text}
                </p>
                {moment(m) && <span className="text-xs text-on-fill/50 tabular-nums">{moment(m)}</span>}
              </li>
            ) : (
              <li key={m.id} className="flex items-end gap-2">
                <Face className="size-8" />
                <div className="grid max-w-[85%] gap-2 rounded-lg rounded-bl-xs bg-on-fill/10 px-3.5 py-2.5 text-sm">
                  <p>{labels.sampleReply}</p>
                  {m.at !== null && seekTo && (
                    <button
                      type="button"
                      onClick={() => seekTo(Math.max(0, m.at! - 10))}
                      className="flex h-8 items-center gap-1.5 justify-self-start rounded-full bg-on-fill/10 px-3 text-xs font-semibold text-on-fill ring-1 ring-on-fill/15 transition-colors hover:bg-on-fill/15 press"
                    >
                      <Play className="size-3 fill-current" aria-hidden />
                      {fill(labels.rewatch, { time: fmt.duration(m.at) })}
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
          {typing && (
            <li className="flex items-end gap-2" aria-live="polite">
              <Face className="size-8" />
              <p className="rounded-lg rounded-bl-xs bg-on-fill/10 px-3.5 py-2.5 text-sm text-on-fill/60">{labels.typing}</p>
            </li>
          )}
        </ol>
        <div ref={end} />
      </div>

      {/* The composer stays at the bottom of the screen while the chat scrolls. */}
      <div className="sticky bottom-0 z-10 -mx-4 bg-player/90 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:max-lg:-mx-6 sm:max-lg:px-6 lg:rounded-b-xl">
        <Composer parts={parts} labels={labels} autoFocus dark />
      </div>
    </section>
  );
}
