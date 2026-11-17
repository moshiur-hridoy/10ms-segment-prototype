"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useCallback, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { Card } from "@/design-system/atoms/card";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";

/**
 * The desktop strip's month name, opening the whole month under it, for jumping further than the
 * arrows reach. The month comes from the server, so its own arrows turn it in place while the
 * popover stays open; picking a day (anything matching `closeOn`) closes it. A click outside or
 * Escape closes it too.
 */
export function MonthPopover({
  month,
  triggerLabel,
  closeOn,
  children,
}: {
  /** What the trigger reads ("অক্টোবর ২০২৬", or two months when the strip spans both). */
  month: string;
  triggerLabel: string;
  closeOn: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root, trigger);

  const onPanelClick = (e: MouseEvent) => {
    if ((e.target as Element).closest(closeOn)) close();
  };

  return (
    <div ref={root} className="relative min-w-0">
      <button
        ref={trigger}
        type="button"
        aria-label={triggerLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn("inline-flex h-10 min-w-0 items-center gap-2 rounded-full pr-3 pl-2 transition-colors", open ? "bg-raised" : "hover:bg-raised")}
      >
        <CalendarDays className="size-5 shrink-0 text-brand-text" aria-hidden />
        <span className="type-title truncate">{month}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <Card as="div" elevation="pop" id={panelId} onClick={onPanelClick} className="absolute top-full left-0 z-20 mt-2 w-[340px] p-5">
          {children}
        </Card>
      )}
    </div>
  );
}
