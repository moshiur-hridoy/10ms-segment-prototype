import { Lock } from "lucide-react";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ShelfBook as Book } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { bookHref, ShelfLink } from "./shelf-book";

/** Wide enough for a 16:9 picture about as tall as a book beside it. */
export const FRAME_WIDTH = "w-40 sm:w-48";

/**
 * A course (skills, English) is not a book, so it stands on the shelf as a framed picture of its
 * own thumbnail: a slim frame, a white mat with a deeper bottom margin, the picture recessed in
 * it, leaning back a touch against the wall. The course's name goes on the board below, like a
 * gallery label (LibraryShelf), so long names are never cut.
 *
 * Not owned: the picture in black and white, its colour coming in on hover; glass over it with
 * the same gloss and hover glint as a wrapped book; a price tag (lock + price) on the frame's corner.
 */
export function ShelfFrame({ book, lang, fmt, t }: { book: Book; lang: Locale; fmt: Formatter; t: Dictionary }) {
  const l = t.library;
  const owned = book.state === "owned";
  const label = fill(owned ? l.openOwned : book.state === "free" ? l.openFree : l.openLocked, { name: book.title });

  return (
    <ShelfLink href={bookHref(book, lang)} label={label} className={cn("group/frame relative block shrink-0 snap-start rounded-sm outline-offset-4", FRAME_WIDTH)}>
      <span className="block origin-bottom [transform:perspective(700px)_rotateX(4deg)]">
        <span
          className="relative block rounded-xs bg-frame p-1 transition-[translate] duration-300 ease-out group-hover/frame:-translate-y-1.5 group-focus-visible/frame:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover/frame:translate-y-0"
          style={{ boxShadow: "var(--frame-edge), var(--shadow-raised)" }}
        >
          {/* The mat: even margins, a deeper one at the bottom, as framers cut them. */}
          <span className="block bg-frame-mat p-2 pb-4">
            <span className="relative block aspect-video overflow-hidden bg-raised" style={{ boxShadow: "var(--frame-recess)" }}>
              {book.coverUrl && <Image src={book.coverUrl} alt="" fill sizes="192px" className={cn(
                    "object-cover",
                    // Not yours yet: in black and white until the pointer (or focus) brings its colour in.
                    !owned &&
                      "grayscale transition-[filter] duration-500 ease-out group-hover/frame:grayscale-0 group-focus-visible/frame:grayscale-0",
                  )} />}
              {!owned && (
                <>
                  <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--book-wrap)" }} />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/frame:translate-x-full group-focus-visible/frame:translate-x-full motion-reduce:hidden"
                    style={{ background: "var(--book-wrap-glint)" }}
                  />
                </>
              )}
            </span>
          </span>

          {!owned && (
            <span
              className={cn(
                "absolute -top-2 -right-2 inline-flex items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-xs font-semibold whitespace-nowrap tabular-nums shadow-raised",
                book.state === "free" ? "bg-success text-on-fill" : "bg-surface text-brand-text ring-1 ring-border",
              )}
            >
              {book.state !== "free" && <Lock className="size-3" aria-hidden />}
              {book.state === "free" ? l.free : book.price ? `৳${fmt.number(book.price)}` : l.buy}
            </span>
          )}
        </span>
      </span>
    </ShelfLink>
  );
}
