"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Card } from "@/design-system/atoms/card";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";

export type SelectOption = { value: string; label: string };

/**
 * The design system's dropdown, in place of the browser's native menu: a pill that opens a list
 * card under it, as wide as the pill (long labels wrap). The chosen option carries a ✓; the
 * active one a soft grey fill. Follows the WAI-ARIA select-only combobox pattern: ↑ ↓ (or opening
 * with them), Home/End, Enter or Space to pick, typing jumps to a label, Esc or a click outside
 * closes and focus returns to the pill. Controlled (`value` + `onChange`) or not (`defaultValue`).
 */
export function Select({
  label,
  options,
  value: controlled,
  defaultValue,
  onChange,
  className,
}: {
  /** Names the control for screen readers; not shown. */
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? options[0]?.value);
  const value = controlled ?? own;
  const chosen = Math.max(0, options.findIndex((o) => o.value === value));

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(chosen);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root, trigger);

  const show = (at = chosen) => {
    setActive(at);
    setOpen(true);
  };

  const pick = (i: number) => {
    setOpen(false);
    trigger.current?.focus();
    const next = options[i].value;
    if (next === value) return;
    setOwn(next);
    onChange?.(next);
  };

  // Focus goes into the list while it is open; the active option follows the keys into view.
  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, id, open]);

  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      show();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      setActive(Math.min(last, Math.max(0, i)));
    };
    if (e.key === "ArrowDown") move(active + 1);
    else if (e.key === "ArrowUp") move(active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    } else if (e.key === "Tab") close();
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      // Type-ahead: letters typed within half a second build one search.
      const now = e.timeStamp;
      const text = (now - typed.current.at < 500 ? typed.current.text : "") + e.key.toLocaleLowerCase();
      typed.current = { text, at: now };
      const order = options.map((_, k) => (active + (text.length === 1 ? 1 : 0) + k) % options.length);
      const hit = order.find((k) => options[k].label.toLocaleLowerCase().startsWith(text));
      if (hit !== undefined) move(hit);
    }
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onTriggerKey}
        className="flex h-10 w-full min-w-0 cursor-pointer items-center gap-2 rounded-full border border-border-strong bg-surface pr-3 pl-4 text-left text-sm font-semibold text-text transition-colors hover:border-brand focus-visible:border-brand aria-expanded:border-brand"
      >
        <span id={`${id}-value`} className="min-w-0 flex-1 truncate">
          {options[chosen]?.label}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>

      {open && (
        <Card
          as="ul"
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
          elevation="pop"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-80 overflow-y-auto p-1 outline-none motion-safe:animate-[fade-in_120ms_ease-out]"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === chosen}
              onClick={() => pick(i)}
              onPointerMove={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-sm leading-snug transition-colors",
                i === active && "bg-raised",
                i === chosen ? "font-semibold text-text" : "text-muted",
              )}
            >
              <Check className={cn("mt-0.5 size-4 shrink-0 text-brand", i !== chosen && "invisible")} aria-hidden />
              <span className="min-w-0 flex-1">{o.label}</span>
            </li>
          ))}
        </Card>
      )}
    </div>
  );
}
