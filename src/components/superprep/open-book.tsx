import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * How the open book is drawn. Under review (`?book=`), so the designer can compare them on the
 * real page; the losers go once one is picked.
 * - `a` hardcover: the cover's boards frame the pages, in the subject colour.
 * - `b` ribbon: the page block alone, with a ribbon bookmark in the subject colour.
 * - `c` thickness: seen a little from the front, the page block's tail edge and the board's
 *   edge under it, in the subject colour.
 */
export type BookVariant = "a" | "b" | "c";
export const BOOK_VARIANTS: readonly BookVariant[] = ["a", "b", "c"];
const DEFAULT_VARIANT: BookVariant = "a";

export function bookVariant(value: string | string[] | undefined): BookVariant {
  return BOOK_VARIANTS.find((v) => v === value) ?? DEFAULT_VARIANT;
}

/**
 * A paper as a book lying open: two pages meeting in a gutter that curves into the binding,
 * a few sheets fanned at each fore-edge, and the cover's colour where a real book shows it.
 * On phones the pages stack, so the gutter, page edges and spine are drawn only from `lg`.
 */
export function OpenBook({
  variant,
  accent,
  labelledBy,
  left,
  right,
  rightLabelledBy,
}: {
  variant: BookVariant;
  accent: string;
  labelledBy: string;
  left: ReactNode;
  right: ReactNode;
  rightLabelledBy: string;
}) {
  const hardcover = variant === "a";
  return (
    <article
      aria-labelledby={labelledBy}
      className={cn(
        "relative mt-1 origin-left motion-safe:animate-[book-open_520ms_cubic-bezier(0.2,0.7,0.2,1)_both]",
        hardcover && "rounded-xs p-1 [background-image:var(--book-board-cloth)] lg:px-3 lg:py-2.5 lg:[background-image:var(--book-board-cloth),var(--book-board-shade)]",
        variant === "b" && "mb-8",
        variant === "c" && "mb-6",
      )}
      style={hardcover ? { backgroundColor: accent, boxShadow: "var(--book-board-bevel), var(--shadow-book)" } : undefined}
    >
      {/* Without boards the page block itself rests on the desk. */}
      {variant === "b" && <span aria-hidden className="absolute inset-0 rounded-xs shadow-book lg:-inset-x-1.5" />}
      {variant === "c" && <Thickness accent={accent} />}

      <div className="relative">
        {/* Headband and tailband, seen on the spine where the pages dip into it. */}
        {hardcover && <Headband accent={accent} className="top-0" />}
        {hardcover && <Headband accent={accent} className="bottom-0" />}
        {/* The sheets under each page, fanned at the fore-edges. */}
        <span aria-hidden className="absolute inset-y-0 left-0 hidden w-8 rounded-l-xs bg-paper lg:block" style={{ boxShadow: "var(--book-stack-left)" }} />
        <span aria-hidden className="absolute inset-y-0 right-0 hidden w-8 rounded-r-xs bg-paper lg:block" style={{ boxShadow: "var(--book-stack-right)" }} />

        <div className={cn("relative grid overflow-hidden bg-paper lg:grid-cols-2 lg:[mask:var(--book-pages-mask)]", variant === "b" ? "rounded-xs border border-border lg:border-0" : "rounded-xs")}>
          {/* Left page: the paper at a glance and what to do. */}
          <section className="grid content-start gap-6 p-6 sm:p-8 lg:pr-12">{left}</section>
          {/* Right page: the contents. */}
          <section
            aria-labelledby={rightLabelledBy}
            className="grid content-start gap-4 border-t border-paper-edge p-6 motion-safe:animate-[page-in_420ms_ease-out_220ms_both] sm:p-8 lg:border-t-0 lg:pl-12"
          >
            {right}
          </section>
          {/* The gutter: each page curving down into the binding. */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-1/2 hidden w-22 lg:block" style={{ background: "var(--book-gutter-left)" }} />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-16 lg:block" style={{ background: "var(--book-gutter-right)" }} />
        </div>
      </div>

      {variant === "b" && <Ribbon accent={accent} />}
    </article>
  );
}

/**
 * The book's depth, as if seen a little from the front: the page block's tail edge (fine page
 * lines, visible too where the pages dip into the spine) on the board's edge, which carries
 * the cover colour; the contact shadow sits under both.
 */
function Thickness({ accent }: { accent: string }) {
  return (
    <>
      <span aria-hidden className="absolute inset-x-0 top-0 -bottom-4 rounded-b-xs shadow-book lg:-inset-x-1.5" />
      <span aria-hidden className="absolute -inset-x-px -bottom-4 h-1 rounded-b-xs lg:-inset-x-2" style={{ backgroundColor: accent, backgroundImage: "var(--book-board-edge)" }} />
      <span aria-hidden className="absolute inset-x-0 top-[calc(100%-0.5rem)] h-5 rounded-b-xs lg:-inset-x-1.5" style={{ background: "var(--book-tail-edge)" }} />
    </>
  );
}

/** The striped cap at the spine's end, in the cover colour; mostly hidden behind the pages. */
function Headband({ accent, className }: { accent: string; className: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute left-1/2 hidden h-1 w-12 -translate-x-1/2 rounded-full lg:block", className)}
      style={{ backgroundColor: accent, backgroundImage: "var(--book-headband)" }}
    />
  );
}

/**
 * The ribbon bookmark: lost in the gutter's shadow, it surfaces just above the tail as a
 * sliver, leaves the book and hangs over the edge with a swallowtail cut. On phones (no
 * gutter) it hangs from the bottom edge.
 */
function Ribbon({ accent }: { accent: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute right-10 -bottom-7 h-10 w-3.5 drop-shadow-sm lg:right-auto lg:left-1/2 lg:h-28 lg:-translate-x-1/2">
      <span
        className="block size-full [clip-path:polygon(0_0,100%_0,100%_100%,50%_calc(100%-8px),0_100%)] lg:[clip-path:polygon(calc(50%-1.5px)_0,calc(50%+1.5px)_0,calc(50%+1.5px)_calc(100%-40px),100%_calc(100%-27px),100%_100%,50%_calc(100%-8px),0_100%,0_calc(100%-27px),calc(50%-1.5px)_calc(100%-40px))] lg:[mask-image:var(--book-ribbon-fade)]"
        style={{ backgroundColor: accent, backgroundImage: "var(--book-ribbon-sheen)" }}
      />
    </span>
  );
}
