import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BOOK_COLOR, type BookFamily } from "@/design-system/foundations/book";

/** `locked` (CT104): a lock beside the paper's name on its cover. */
export type FolderPaper = { id: string; label: string; href: string; openLabel: string; locked?: boolean };

/** Where each paper stands in the pocket: a fan of books, the outer ones leaning outward. */
function slot(i: number, n: number) {
  if (n === 1) return { left: 28, width: 44, tilt: -4 };
  const width = n === 2 ? 38 : 30;
  const pad = n === 2 ? 12 : 10;
  const lean = n === 2 ? 10 : 12;
  const t = i / (n - 1);
  return { left: pad + t * (100 - 2 * pad - width), width, tilt: -lean + t * 2 * lean };
}

/**
 * A subject as a folder: its papers stand as books in the subject's colour inside a frosted
 * pocket that carries the subject's name. Hovering (or focusing) a book slides it out along
 * its lean; clicking opens that paper's syllabus page. The pocket lets the pointer through,
 * so a book is reachable over its hidden part too. Unlike the SuperPrep shelf, there are no
 * covers or progress here: the folder is for finding a subject.
 */
export function SubjectFolder({
  name,
  icon: Icon,
  family,
  papers,
  centered = false,
  badge,
  tintOnPhone = false,
  cornerTag,
}: {
  name: string;
  icon: LucideIcon;
  family: BookFamily;
  papers: FolderPaper[];
  /** CT99 (lab `segment-home` v9): the name and icon in the middle of the pocket, larger, where the eye lands. */
  centered?: boolean;
  /** CT104: a line under the name in the pocket ("ফ্রি", "লগইন করলে খুলবে"). */
  badge?: ReactNode;
  /** CT117 (lab `segment-home` v25): on phones, where the folder sits on the grey page with no card, its back takes a wash of the subject's colour. */
  tintOnPhone?: boolean;
  /** CT126 (lab `segment-home` v33): a tag in the pocket's top-right corner, its outer corner on the pocket's curve, as if cut into it. */
  cornerTag?: ReactNode;
}) {
  const color = BOOK_COLOR[family];
  return (
    <div className="@container relative aspect-[5/4] min-w-0">
      {/* The folder's back, rising behind the books. */}
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-[16%] bottom-0 rounded-lg bg-folder", tintOnPhone && "max-sm:bg-(--folder-tint)")}
        style={tintOnPhone ? ({ "--folder-tint": `color-mix(in oklab, ${color} 22%, var(--color-surface))` } as CSSProperties) : undefined}
      />
      {/* The frosted front pocket; first in reading order, drawn above the books. */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-[56%] rounded-lg border border-glass-edge bg-overlay p-3 shadow-raised ring-1 ring-border backdrop-blur-md",
          centered ? "items-center justify-center" : "items-end",
        )}
      >
        {cornerTag && (
          // Over the pocket's 1px border, so its edges meet the pocket's.
          // CT131 (v37): a faint gloss from the top, and every few seconds a thin band of light sweeps across, so the eye finds it.
          <span className="absolute -top-px -right-px overflow-hidden rounded-tr-lg rounded-bl-md bg-brand bg-[linear-gradient(180deg,rgb(255_255_255/0.2),transparent_70%)] px-2.5 py-1 text-xs leading-4 font-bold whitespace-nowrap text-on-fill">
            <span
              aria-hidden
              className="tag-shine pointer-events-none absolute inset-y-0 -left-3/5 w-2/5 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.5),transparent)] motion-reduce:hidden"
            />
            <span className="relative">{cornerTag}</span>
          </span>
        )}
        <div className={cn("grid min-w-0 gap-1.5", centered && "justify-items-center text-center")}>
          <h3 className={cn("flex min-w-0 items-center gap-2 font-semibold", centered ? "type-subtitle" : "text-sm")}>
            <Icon className={cn("shrink-0", centered ? "size-5" : "size-4")} style={{ color }} aria-hidden />
            <span className="truncate">{name}</span>
          </h3>
          {badge}
        </div>
      </div>
      <ul className="absolute inset-0">
        {papers.map((p, i) => {
          const s = slot(i, papers.length);
          return (
            <li
              key={p.id}
              className="group/book absolute top-[4%] h-[62%] origin-bottom hover:z-10 focus-within:z-10"
              style={{ left: `${s.left}%`, width: `${s.width}%`, rotate: `${s.tilt}deg` }}
            >
              <Link
                href={p.href}
                aria-label={p.openLabel}
                className="relative block h-full overflow-hidden rounded-sm text-on-fill shadow-raised transition-[translate] duration-300 ease-out outline-offset-2 group-hover/book:-translate-y-3 focus-visible:-translate-y-3 motion-reduce:transition-none motion-reduce:group-hover/book:translate-y-0 motion-reduce:focus-visible:translate-y-0"
                style={{ backgroundColor: color }}
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-2" style={{ background: "var(--book-spine)" }} />
                <span className="relative block truncate px-1 pt-2.5 pl-3 text-center text-xs leading-tight font-semibold @[12rem]:px-2 @[12rem]:pl-3.5 @[12rem]:text-sm">
                  {p.label}
                </span>
                {/* CT104: a locked paper's lock sits under its name, in the part of the book above the pocket. */}
                {p.locked && (
                  <span className="absolute top-[38%] left-1/2 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-surface/95 text-text shadow-raised @[12rem]:size-8">
                    <Lock className="size-3.5 @[12rem]:size-4" aria-hidden />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
