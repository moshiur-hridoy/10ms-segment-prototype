"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { usePlayback } from "./playback";
import { DEMO_AUDIENCE } from "./demo-audience";
import { openTenTenChat, useTenTenBoxSeen, useTenTenChat } from "./tenten-chat";

/*
 * Lab `class` v22 (P109): TenTen as a chat head, in place of the mascot peeking in again and again (P107).
 * Only in a live class, and it slides away when the class ends. On a phone it rests still, half behind a side
 * of the screen (P110); since v45 (P138) it rests fully out, its side against the edge, leaning on it a little. A touch brings it out, and it follows the finger anywhere. On release it tucks in at
 * the nearer side, kept clear of the video above and the screen's bottom. Where it was left is kept in this
 * browser. It can't be put away (P113): let go anywhere, it springs back to its side with a wobble. Its bubble says what it is for once a day. The poll sheet
 * and the end-of-class card pass over it. Wide screens: fixed at the bottom right, no dragging (P109, I*).
 * A tap, or Enter, opens TenTen (no page yet).
 */

const SIZE = 56; // size-14
const EDGE = 12; // off the screen's edge, when out
// The face's tile fills 30 of the svg's 46 units (the rest is its shadow): 7.76 in from the left, 8.24 from the right.
const PAD_L = (SIZE * 7.76) / 46;
const PAD_R = (SIZE * 8.24) / 46;
const LEAN = 6; // degrees it tilts into the edge at rest (P138)
const DRAG = 6; // movement before a press becomes a drag (less is still a tap)
const SPOT = "tenten-head";
const SAID = "tenten-said";

// Small store over localStorage, so the server render and the first client render agree.
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const useStored = (key: string) =>
  useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
function store(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode: it holds for this visit only.
  }
  for (const l of listeners) l();
}

// The window and the bottom of the (sticky) video, as one string so it compares by value.
const subscribeView = (l: () => void) => {
  addEventListener("resize", l);
  addEventListener("scroll", l, { passive: true });
  return () => {
    removeEventListener("resize", l);
    removeEventListener("scroll", l);
  };
};
const readView = () => `${innerWidth} ${innerHeight} ${Math.round(document.getElementById("player")?.getBoundingClientRect().bottom ?? 0)}`;

/**
 * `handoff` (lab `concept` v10, P163): TenTen's box is on the page, so the head shows in every class, live
 * or not, but only while the box is out of view and the chat is closed; a tap opens the chat under the video.
 */
export function TenTenHead({ itemId, name, ask, handoff = false }: { itemId: string; name: string; ask: string; handoff?: boolean }) {
  const pb = usePlayback();
  const boxSeen = useTenTenBoxSeen();
  const { open } = useTenTenChat();
  const live = handoff || (DEMO_AUDIENCE[itemId]?.live ?? false);
  const view = useSyncExternalStore(subscribeView, readView, () => "");
  const spotRaw = useStored(SPOT);
  const said = useStored(SAID);
  const [say, setSay] = useState(false);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [held, setHeld] = useState(false);
  const [boing, setBoing] = useState(0);
  const press = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  const [vw, vh, playerBottom] = view ? view.split(" ").map(Number) : [0, 0, 0];
  const wide = vw >= 1024;
  const top = Math.max(64, playerBottom) + EDGE;
  const bottom = vh - SIZE - EDGE - 72; // above the island and the poll's folded pill
  const clampY = (y: number) => Math.min(Math.max(y, top), Math.max(top, bottom));
  const [sideRaw, ratioRaw] = (spotRaw ?? "right 0.62").split(" ");
  const side = sideRaw === "left" ? "left" : "right";
  const restY = clampY(Number(ratioRaw) * vh);
  const outX = side === "left" ? EDGE : vw - SIZE - EDGE;
  // At rest the tile's side touches the screen's edge (P138; was 55% behind it, P110).
  const tuckX = side === "left" ? -PAD_L : vw - SIZE + PAD_R;

  const over = pb.phase === "ended";
  const shown = live && !!view;
  const away = over || (handoff && (boxSeen || open));
  const today = new Date().toDateString();
  const canSay = shown && !away && said !== today;
  const openChat = (e: { preventDefault: () => void }) => {
    if (!handoff) return;
    e.preventDefault();
    openTenTenChat();
  };

  useEffect(() => {
    if (!canSay) return;
    const show = window.setTimeout(() => setSay(true), 2500);
    const quiet = window.setTimeout(() => {
      setSay(false);
      store(SAID, today);
    }, 7500);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(quiet);
    };
  }, [canSay, today]);

  if (!shown) return null;

  const x = drag ? drag.x : away ? (side === "left" ? -SIZE - EDGE : vw + EDGE) : held || say ? outX : tuckX;
  const y = drag ? drag.y : restY;
  const resting = !drag && !away && x === tuckX;
  const bubbleLeft = !wide && side === "left";

  const bubble = (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-xl whitespace-nowrap bg-surface px-3 py-2 text-xs font-semibold text-text shadow-pop ring-1 ring-border transition-opacity duration-(--motion-base) ease-standard",
        bubbleLeft ? "left-full ml-2 rounded-bl-sm" : "right-full mr-2 rounded-br-sm",
        say && !drag ? "opacity-100" : "opacity-0",
        wide && "group-hover/head:opacity-100",
      )}
    >
      {ask}
    </span>
  );

  const face = <Image src="/assets/tenten.svg" alt="" width={SIZE} height={SIZE} draggable={false} className="size-full select-none" />;

  if (wide) {
    return (
      <a
        href="#"
        aria-label={`${name}: ${ask}`}
        onClick={openChat}
        aria-hidden={away || undefined}
        tabIndex={away ? -1 : undefined}
        className={cn(
          "group/head fixed right-6 bottom-20 z-20 block size-14 transition-[translate,opacity] duration-(--motion-base) ease-emphasis press",
          away && "pointer-events-none translate-x-24 opacity-0",
        )}
      >
        {bubble}
        {face}
      </a>
    );
  }

  return (
    <a
      href="#"
      aria-label={`${name}: ${ask}`}
      draggable={false}
      onPointerDown={(e) => {
        if (away) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        press.current = { px: e.clientX, py: e.clientY, ox: outX, oy: y, moved: false };
        setHeld(true);
      }}
      onPointerMove={(e) => {
        const p = press.current;
        if (!p) return;
        const dx = e.clientX - p.px;
        const dy = e.clientY - p.py;
        if (!p.moved && Math.hypot(dx, dy) < DRAG) return;
        p.moved = true;
        const next = { x: Math.min(Math.max(p.ox + dx, 0), vw - SIZE), y: Math.min(Math.max(p.oy + dy, 0), vh - SIZE) };
        last.current = next;
        setSay(false);
        setDrag(next);
      }}
      onPointerUp={() => {
        const p = press.current;
        const end = last.current;
        press.current = null;
        last.current = null;
        setHeld(false);
        if (!p?.moved || !end) return;
        dragged.current = true;
        setDrag(null);
        setBoing((n) => n + 1);
        store(SPOT, `${end.x + SIZE / 2 < vw / 2 ? "left" : "right"} ${(clampY(end.y) / vh).toFixed(3)}`);
      }}
      onPointerCancel={() => {
        setHeld(false);
        press.current = null;
        last.current = null;
        setDrag(null);
      }}
      onClick={(e) => {
        // The click that ends a drag doesn't open TenTen.
        if (dragged.current) e.preventDefault();
        else openChat(e);
        dragged.current = false;
      }}
      className={cn(
        "fixed top-0 left-0 block size-14 touch-none select-none [-webkit-touch-callout:none]",
        // Back to its side with a little overshoot, as if on a spring.
        drag ? "z-50 scale-110 cursor-grabbing" : "z-20 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
      )}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      {bubble}
      {/* Leaning on the edge at rest (P138); its own layer, since the wobble also animates rotate. */}
      <span
        className="block size-full transition-[rotate] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ rotate: resting ? `${side === "left" ? -LEAN : LEAN}deg` : "0deg" }}
      >
        {/* A wobble on landing after each drag (the key restarts it). */}
        <span key={boing} className={cn("block size-full", boing > 0 && "motion-safe:animate-wobble")}>
          {face}
        </span>
      </span>
    </a>
  );
}
