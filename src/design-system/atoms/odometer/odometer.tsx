"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** A number as an odometer: the old value rolls up and out as the new one rolls in (streak day count, login garden). */
export function Odometer({ value, format }: { value: number; format: (v: number) => string }) {
  const [shown, setShown] = useState({ value, prev: null as number | null });
  if (shown.value !== value) setShown({ value, prev: shown.value });
  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <span key={`v${shown.value}`} className={cn("col-start-1 row-start-1", shown.prev !== null && "motion-safe:animate-[streak-roll-in_450ms_var(--ease-emphasis)_both]")}>
        {format(shown.value)}
      </span>
      {shown.prev !== null && (
        <span
          key={`p${shown.prev}-${shown.value}`}
          aria-hidden
          onAnimationEnd={() => setShown((v) => ({ ...v, prev: null }))}
          className="col-start-1 row-start-1 motion-safe:animate-[streak-roll-out_450ms_var(--ease-emphasis)_both] motion-reduce:hidden"
        >
          {format(shown.prev)}
        </span>
      )}
    </span>
  );
}
