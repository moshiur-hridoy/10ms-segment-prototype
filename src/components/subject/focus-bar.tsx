"use client";

import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/design-system/atoms/icon-button";
import { useLab } from "@/lib/lab";

/**
 * Lab `class` v8 (P58): with an item open, phones get one bar at the top instead of the site header,
 * the breadcrumb and the paper's name: back to the paper's list, and what is open (a recorded live class, an archive class, a slide…; P88). It stays at
 * the top while the page scrolls. Its `data-focus-bar` hides the other two below `lg` (globals.css).
 * Lab `class` v48 (P142): the paper's list, an inside page, takes it too (back to the course, the paper's name),
 * with `noBottomNav` so the bottom nav steps aside.
 */
export function FocusBar({ href, title, backLabel, noBottomNav = false }: { href: string; title: string; backLabel: string; noBottomNav?: boolean }) {
  if (useLab("class") === null) return null;
  return (
    <div
      data-focus-bar
      data-no-bottom-nav={noBottomNav || undefined}
      className="sticky top-0 z-40 -mx-4 -mt-6 -mb-3 flex min-h-14 items-center gap-1 border-b border-border bg-overlay pt-[env(safe-area-inset-top)] pr-4 pl-2 backdrop-blur-xl backdrop-saturate-150 sm:-mx-6 lg:hidden"
    >
      <IconButton href={href} label={backLabel} size="md">
        <ArrowLeft className="size-5" aria-hidden />
      </IconButton>
      {/* 16px semibold (P88): close to the 17pt iOS uses for a bar title; Bangla reads a little larger. */}
      <p className="min-w-0 flex-1 truncate text-base font-semibold">{title}</p>
    </div>
  );
}
