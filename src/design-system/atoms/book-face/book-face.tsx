import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { BOOK_COLOR, type BookFamily } from "@/design-system/foundations/book";
import { cn } from "@/lib/cn";

/**
 * A paper (or course, or e-book) as a book, cover out: the one book drawn everywhere a paper
 * appears (the library shelf, the dashboard's subject cards).
 *
 * Owned: the subject's cloth, a shaded spine, a sheen and the page edges peeking out. Not owned:
 * a pale tint of the subject with the spine in full colour (ShelfBook adds the shrink-wrap).
 * `mark` stamps the subject's icon large and faint, like a blind stamp. The caller passes the
 * hover motion in `className` (it knows which group is being hovered) and the cover's content.
 */
export function BookFace({
  family,
  owned = true,
  mark: Mark,
  markClassName,
  className,
  children,
}: {
  family: BookFamily;
  owned?: boolean;
  mark?: LucideIcon;
  markClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  const color = BOOK_COLOR[family];
  const cloth: CSSProperties = owned
    ? { backgroundColor: color }
    : { backgroundColor: `color-mix(in oklab, ${color} 13%, var(--color-surface))`, color: `color-mix(in oklab, ${color} 72%, var(--color-text))` };

  return (
    <span className="relative block [perspective:900px]">
      {/* Page edges behind the cover. */}
      {owned && <span aria-hidden className="absolute inset-y-1.5 -right-1 left-2 rounded-r-sm border border-border bg-paper" />}
      <span
        className={cn(
          "relative grid aspect-[3/4] origin-left overflow-hidden rounded-l-sm rounded-r-md shadow-raised transition-[transform,translate] duration-300 ease-out motion-reduce:transition-none",
          owned ? "text-on-fill" : "ring-1 ring-border ring-inset",
          className,
        )}
        style={cloth}
      >
        {owned && <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-sheen)" }} />}
        {/* The spine: shaded cloth when owned, a band of the subject's full colour when wrapped. */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-[10%] min-w-1.5" style={owned ? { background: "var(--book-spine)" } : { backgroundColor: color, opacity: 0.85 }} />
        {Mark && <Mark aria-hidden strokeWidth={1.5} className={cn("absolute -rotate-12", owned ? "opacity-15" : "opacity-20", markClassName)} />}
        {children}
      </span>
    </span>
  );
}
