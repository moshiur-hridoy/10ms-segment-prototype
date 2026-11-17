"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A raised button that has to be held down (OB10): a darker fill runs across it while it is pressed,
 * and when the fill reaches the end, `onDone` fires once with a short vibration. Let go early and the
 * fill runs back. For a moment the student should do themselves, like stamping their card; not for
 * ordinary actions. Holding Space or Enter works the same way; a screen reader's single activation
 * (a click with no pointer or key down) completes it straight away.
 */
export function HoldButton({
  onDone,
  ms = 800,
  icon,
  className,
  children,
}: {
  onDone: () => void;
  /** How long to hold. */
  ms?: number;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [held, setHeld] = useState(false);
  const frame = useRef<number | null>(null);
  const start = useRef(0);
  const value = useRef(0);
  const done = useRef(false);
  const holding = useRef(false);
  // Set while a key or pointer drives the hold, so the click that follows it is ignored.
  const driven = useRef(false);

  useEffect(() => () => void (frame.current && cancelAnimationFrame(frame.current)), []);

  const run = (to: 1 | 0) => {
    if (frame.current) cancelAnimationFrame(frame.current);
    const from = value.current;
    start.current = -1;
    // Filling takes the whole hold; running back is quicker.
    const span = (to === 1 ? 1 - from : from) * (to === 1 ? ms : ms / 3);
    const tick = (now: number) => {
      if (start.current < 0) start.current = now;
      const t = span ? Math.min(1, (now - start.current) / span) : 1;
      value.current = from + (to - from) * t;
      setProgress(value.current);
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else if (to === 1) finish();
    };
    frame.current = requestAnimationFrame(tick);
  };

  const finish = () => {
    if (done.current) return;
    done.current = true;
    holding.current = false;
    value.current = 1;
    setProgress(1);
    setHeld(false);
    navigator.vibrate?.(20);
    onDone();
  };

  const press = () => {
    if (done.current) return;
    driven.current = true;
    holding.current = true;
    setHeld(true);
    run(1);
  };

  const release = () => {
    if (done.current || !holding.current) return;
    holding.current = false;
    setHeld(false);
    run(0);
    // The click that follows a key or pointer release belongs to this hold.
    window.setTimeout(() => (driven.current = false), 0);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, down: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (down && !e.repeat) press();
    if (!down) release();
  };

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        press();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onKeyDown={(e) => onKey(e, true)}
      onKeyUp={(e) => onKey(e, false)}
      onClick={() => {
        if (!driven.current) finish();
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative isolate inline-flex h-12 shrink-0 touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-6 text-base font-semibold whitespace-nowrap text-on-primary select-none [-webkit-touch-callout:none]",
        "shadow-[0_3px_0_var(--color-primary-edge)] transition-[translate,box-shadow] duration-75",
        held && "translate-y-[3px] shadow-none",
        className,
      )}
    >
      <span aria-hidden className="absolute inset-0 -z-10 origin-left bg-primary-edge" style={{ transform: `scaleX(${progress})` }} />
      {icon}
      {children}
    </button>
  );
}
