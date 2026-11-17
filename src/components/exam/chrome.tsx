"use client";

import { X } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { IconButton } from "@/design-system/atoms/icon-button";
import { Card } from "@/design-system/atoms/card";
import { useDismiss } from "@/lib/use-dismiss";
import { backLink } from "@/lib/nav-history";
import type { ExamLabels } from "./types";

/**
 * Leaving mid-set asks first (answers aren't saved); otherwise it's a plain link. Either way it
 * goes back to the paper as a step back (`backLink`), so the exam isn't left in the history.
 */
export function ExitControl({ href, warn, label, t }: { href: string; warn: boolean; label: string; t: ExamLabels }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root, trigger);

  if (!warn) {
    return (
      <IconButton {...backLink(href)} label={label} size="md">
        <X className="size-5" aria-hidden />
      </IconButton>
    );
  }
  return (
    <div ref={root} className="relative shrink-0">
      <IconButton ref={trigger} label={label} size="md" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <X className="size-5" aria-hidden />
      </IconButton>
      {open && (
        <Card as="div" elevation="pop" role="dialog" aria-label={label} className="absolute top-12 left-0 z-50 grid w-72 gap-3 p-4">
          <p className="text-sm">{t.exitWarn}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={close} className="flex-1">
              {t.stay}
            </Button>
            <Button size="sm" variant="secondary" {...backLink(href)} className="flex-1">
              {t.exit}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

/** Bottom sheet for the navigator on phones. Escape or a tap outside closes it. */
export function Sheet({ title, closeLabel, onClose, children }: { title: string; closeLabel: string; onClose: () => void; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useDismiss(true, onClose, root);
  return (
    <div className="fixed inset-0 z-50 bg-text/30 lg:hidden">
      <div ref={root} role="dialog" aria-label={title} className="absolute inset-x-0 bottom-0 grid gap-4 rounded-t-lg bg-surface p-5 pb-8 shadow-pop">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <IconButton label={closeLabel} onClick={onClose}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

/** The slim top bar of focus mode: exit, paper · set, then the page's own controls. */
export function FocusBar({ back, subjectName, title, children }: { back: ReactNode; subjectName: string; title: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-overlay backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-wide items-center gap-3 px-4 sm:px-6">
        {back}
        <div className="grid min-w-0 flex-1">
          <p className="truncate text-xs text-subtle">{subjectName}</p>
          <p className="truncate font-semibold">{title}</p>
        </div>
        {children}
      </div>
    </header>
  );
}
