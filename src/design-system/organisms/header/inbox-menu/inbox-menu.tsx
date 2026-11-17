"use client";

import { Mail } from "lucide-react";
import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { createFormatter } from "@/lib/format";
import { useUnreadCount } from "@/lib/notice-read";
import { useDismiss } from "@/lib/use-dismiss";
import { IconButton } from "@/design-system/atoms/icon-button";
import { Card } from "@/design-system/atoms/card";
import { isWide, SheetDialog } from "@/design-system/molecules/bottom-sheet";

/**
 * The header inbox: opens the dashboard's notices in a popover from `lg`, and in a bottom sheet
 * on phones and tablets (a popover anchored to the icon ran off the screen's left edge there).
 * The list is rendered on the server and passed in as `children`, so this only toggles it.
 */
export function InboxMenu({
  title,
  lang,
  unreadIds,
  heading,
  closeLabel,
  children,
}: {
  title: string;
  closeLabel: string;
  lang: Locale;
  /** Ids the server marks unread; reads made in this browser are subtracted. */
  unreadIds: string[];
  heading: ReactNode;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<"popover" | "sheet" | null>(null);
  const unread = useUnreadCount(unreadIds);
  const label = unread ? `${title} (${createFormatter(lang, 0).number(unread)})` : title;
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = useCallback(() => setMode(null), []);
  useDismiss(mode === "popover", close, root, trigger);

  return (
    <div ref={root} className="relative shrink-0">
      <IconButton
        ref={trigger}
        label={label}
        variant="subtle"
        aria-expanded={mode !== null}
        aria-controls={mode === "popover" ? panelId : undefined}
        onClick={() => setMode((m) => (m ? null : isWide() ? "popover" : "sheet"))}
        className="relative"
      >
        <Mail className="size-5" aria-hidden />
        {unread > 0 && <span aria-hidden className="absolute top-1.5 right-1.5 size-2 rounded-full bg-live ring-2 ring-surface" />}
      </IconButton>

      {mode === "popover" && (
        <Card as="div" elevation="pop" id={panelId} className="absolute top-full right-0 mt-2 max-h-[calc(100dvh-5rem)] w-[min(380px,calc(100vw-2rem))] overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">{heading}</div>
          <div className="p-4">{children}</div>
        </Card>
      )}

      <SheetDialog open={mode === "sheet"} onClose={close} title={mode === "sheet" && heading} label={title} closeLabel={closeLabel} closeOn="a">
        {mode === "sheet" && children}
      </SheetDialog>
    </div>
  );
}
