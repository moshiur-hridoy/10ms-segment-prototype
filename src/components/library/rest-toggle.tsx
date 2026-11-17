"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BOOK_WIDTH } from "./book-size";

/**
 * A finished batch keeps its not-owned papers out of the way: an empty slot at the shelf's end
 * shows them on request and hides them again. The papers are rendered on the server and passed in.
 */
export function RestToggle({ show, hide, children }: { show: string; hide: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const Icon = open ? EyeOff : Eye;
  return (
    <>
      {open && children}
      <li className="relative self-end pb-9">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className={cn(
            "grid aspect-[3/4] place-content-center justify-items-center gap-2 rounded-md border border-dashed border-border-strong p-2 text-center text-xs font-semibold text-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-text",
            BOOK_WIDTH,
          )}
        >
          <Icon className="size-5" aria-hidden />
          {open ? hide : show}
        </button>
      </li>
    </>
  );
}
