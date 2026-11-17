"use client";

import { X } from "lucide-react";
import { createContext, use, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { IconButton } from "@/design-system/atoms/icon-button";
import { cn } from "@/lib/cn";

const CloseContext = createContext<(() => void) | null>(null);

/** Phones and tablets get sheets; from `lg` the header's menus stay dropdowns. */
export const isWide = () => matchMedia("(min-width: 64rem)").matches;

type SheetProps = {
  /** Shown as the sheet's heading, with a close button. Leave out when the content has its own (`labelledBy` + `SheetClose`). */
  title?: ReactNode;
  labelledBy?: string;
  /** The accessible name, when `title` isn't plain text (the inbox heading carries buttons). */
  label?: string;
  closeLabel: string;
  /** A full-width button at the foot that closes the sheet ("ঠিক আছে"). */
  done?: string;
  /** A tap on anything matching this closes the sheet (a day in the month, a link). */
  closeOn?: string;
  /** No padding round the content, for content that draws its own rows edge to edge. */
  flush?: boolean;
  children: ReactNode;
};

/**
 * A sheet that rises from the bottom edge on phones: a native modal <dialog>, the same build as
 * the SuperPrep "বদলাও" popup and the playlist sheet. Focus is trapped and Escape closes it for
 * free; a tap on the backdrop closes it too, and so does a tap on anything matching `closeOn`.
 * Controlled: `open` shows it, `onClose` hears every way it closes. `BottomSheet` below brings
 * its own trigger.
 */
export function SheetDialog({ open, onClose, title, labelledBy, label, closeLabel, done, closeOn, flush, children }: SheetProps & { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => dialog.current?.close();

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      document.documentElement.style.overflow = "hidden";
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open]);
  // Leaving the page with the sheet open must not leave scrolling locked.
  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={title && !label ? titleId : labelledBy}
      aria-label={label}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onClose();
      }}
      // A click on the backdrop lands on the dialog itself; the content sits inside.
      onClick={(e) => {
        if (e.target === e.currentTarget || (closeOn && (e.target as Element).closest(closeOn))) close();
      }}
      className="sheet mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/30 open:flex"
    >
      <CloseContext value={close}>
        {title && (
          <div className="flex shrink-0 items-center gap-2 border-b border-border py-2 pr-2 pl-5">
            {/* With `label`, the title is a row that carries its own heading and buttons. */}
            {label ? (
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">{title}</div>
            ) : (
              <h2 id={titleId} className="type-subtitle min-w-0 flex-1">
                {title}
              </h2>
            )}
            <SheetClose label={closeLabel} />
          </div>
        )}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            !flush && "p-4",
            !done && (flush ? "pb-[env(safe-area-inset-bottom)]" : "pb-[max(1.5rem,env(safe-area-inset-bottom))]"),
          )}
        >
          {children}
        </div>
        {done && (
          <div className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button onClick={close} className="w-full">
              {done}
            </Button>
          </div>
        )}
      </CloseContext>
    </dialog>
  );
}

/**
 * A button and the sheet it opens (the routine's month and filters, the bottom nav's "আরও"). Its
 * contents come from the server, so a filter or month turned inside it updates in place while it
 * stays open.
 */
export function BottomSheet({
  trigger,
  triggerLabel,
  triggerClassName,
  ...sheet
}: SheetProps & {
  trigger: ReactNode;
  /** The trigger's accessible name, when its text alone doesn't say what opens. */
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={triggerLabel} className={triggerClassName}>
        {trigger}
      </button>
      <SheetDialog open={open} onClose={() => setOpen(false)} {...sheet} />
    </>
  );
}

/** The sheet's close button, for content that draws its own header (the month calendar). */
export function SheetClose({ label }: { label: string }) {
  const close = use(CloseContext);
  return (
    <IconButton label={label} size="lg" onClick={() => close?.()}>
      <X className="size-5" aria-hidden />
    </IconButton>
  );
}
