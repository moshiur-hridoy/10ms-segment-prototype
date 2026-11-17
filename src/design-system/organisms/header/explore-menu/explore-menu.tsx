"use client";

import { Discover } from "iconsax-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Card } from "@/design-system/atoms/card";
import { EXPLORE_ITEMS } from "./items";

type Labels = Pick<Dictionary["nav"], "explore" | "exploreItems">;

export function ExploreMenu({ labels, lang, tabClassName, idleClassName }: { labels: Labels; lang: string; tabClassName: string; idleClassName: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, root, trigger);

  return (
    <div ref={root} className="relative h-full">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(tabClassName, open ? "text-text" : idleClassName)}
      >
        <Discover size={20} color="currentColor" variant={open ? "Bold" : "Linear"} aria-hidden />
        {labels.explore}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      <Card as="ul" elevation="pop"
        id={menuId}
        hidden={!open}
        className="absolute top-full left-0 mt-2 w-72 p-2"
      >
        {EXPLORE_ITEMS.map((item) => {
          const { key, Icon, tone, more } = item;
          const href = "local" in item ? `/${lang}${item.local}` : item.href;
          return (
            <li key={key}>
              <a
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md p-2 text-sm font-medium text-text transition-colors hover:bg-raised"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-raised">
                  <Icon className={cn("size-5", tone)} aria-hidden />
                </span>
                <span className="flex-1">{labels.exploreItems[key]}</span>
                {more && <ChevronRight className="size-4 text-subtle" aria-hidden />}
              </a>
            </li>
          );
        })}
      </Card>
    </div>
  );
}
