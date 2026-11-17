"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useId, useRef, useState, type ComponentType } from "react";
import { Card } from "@/design-system/atoms/card";
import { cn } from "@/lib/cn";
import { useDismiss } from "@/lib/use-dismiss";

/** An item's icon: a picture (the class backpacks) or an Iconsax icon in a token colour. */
export type PublicNavIcon =
  | { src: string }
  | { Icon: ComponentType<{ size?: number | string; color?: string; variant?: "Linear" | "Bold"; className?: string }>; tone: string };
export type PublicNavItem = { label: string; href?: string; icon?: PublicNavIcon; sub?: { label: string; href: string }[] };
/** A tab: a plain link, or a menu of items ("divider" draws a rule). */
export type PublicNavGroup = { label: string; href?: string; items?: (PublicNavItem | "divider")[] };

/**
 * The header's menus for visitors who aren't signed in (the landing pages), in the explore
 * menu's style: a tab opens a card of items, each with its icon in a tile; an item with `sub`
 * (HSC, SSC) opens a second card beside it, on hover or click. One menu is open at a time.
 */
export function PublicNav({ groups, label, tabClassName }: { groups: PublicNavGroup[]; label: string; tabClassName: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <nav aria-label={label} className="flex h-full items-stretch gap-1">
      {groups.map((g, i) =>
        g.items ? (
          <Menu key={g.label} group={g} open={open === i} onOpen={(on) => setOpen(on ? i : null)} tabClassName={tabClassName} />
        ) : (
          <a key={g.label} href={g.href} className={tabClassName}>
            {g.label}
          </a>
        ),
      )}
    </nav>
  );
}

function Menu({ group, open, onOpen, tabClassName }: { group: PublicNavGroup; open: boolean; onOpen: (on: boolean) => void; tabClassName: string }) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [sub, setSub] = useState<string | null>(null);
  const close = useCallback(() => {
    onOpen(false);
    setSub(null);
  }, [onOpen]);
  useDismiss(open, close, root, trigger);

  return (
    <div ref={root} className="relative flex">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? close() : onOpen(true))}
        className={cn(tabClassName, open && "text-text")}
      >
        {group.label}
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      <Card as="ul" elevation="pop" id={menuId} hidden={!open} className="absolute top-full left-0 z-50 mt-2 w-72 p-2">
        {group.items!.map((item, k) =>
          item === "divider" ? (
            <li key={`d${k}`} role="separator" className="mx-2 my-1 border-t border-border" />
          ) : (
            <li key={item.label} className="relative" onPointerEnter={() => setSub(item.sub ? item.label : null)}>
              {item.sub ? (
                <button
                  type="button"
                  aria-expanded={sub === item.label}
                  onClick={() => setSub((s) => (s === item.label ? null : item.label))}
                  className={cn(ROW, sub === item.label && "bg-raised")}
                >
                  <ItemIcon icon={item.icon} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronRight className="size-4 text-subtle" aria-hidden />
                </button>
              ) : (
                <a href={item.href} onClick={close} className={ROW}>
                  <ItemIcon icon={item.icon} />
                  <span className="flex-1">{item.label}</span>
                </a>
              )}
              {item.sub && sub === item.label && (
                <Card as="ul" elevation="pop" className="absolute top-0 left-full z-50 ml-2 w-60 p-2">
                  {item.sub.map((s) => (
                    <li key={s.label}>
                      <a href={s.href} onClick={close} className="block rounded-md px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-raised">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </Card>
              )}
            </li>
          ),
        )}
      </Card>
    </div>
  );
}

const ROW = "flex w-full items-center gap-3 rounded-md p-2 text-sm font-medium text-text transition-colors hover:bg-raised";

function ItemIcon({ icon }: { icon?: PublicNavIcon }) {
  if (!icon) return null;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-raised">
      {"src" in icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon.src} alt="" className="size-6" />
      ) : (
        <icon.Icon size={22} color="currentColor" variant="Bold" className={icon.tone} />
      )}
    </span>
  );
}
