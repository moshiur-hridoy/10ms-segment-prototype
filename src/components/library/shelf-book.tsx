import { BookOpen, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { subjectIcons } from "@/design-system/foundations/subject-icons";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { LibraryShelf, ShelfBook as Book } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { BookFace } from "@/design-system/atoms/book-face";
import { BOOK_WIDTH } from "./book-size";

const FAMILY_ICON = {
  physics: "atom",
  chemistry: "flask",
  biology: "leaf",
  math: "calculator",
  ict: "globe",
  bangla: "book",
  english: "languages",
  other: "book",
} as const;

/** Where a book opens: an owned paper its subject page, an owned course its course home; anything else its product page. */
export function bookHref(book: Book, lang: Locale) {
  if (book.state === "owned" && book.paperId) return `/${lang}/subject/${book.paperId}`;
  if (book.state === "owned" && book.courseId) return `/${lang}/course/${book.courseId}`;
  return book.url;
}

/** In-app paths go through the router; product pages (and placeholders) are plain links. */
export function ShelfLink({ href, className, label, children }: { href: string; className?: string; label?: string; children: ReactNode }) {
  return href.startsWith("/") ? (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} aria-label={label} className={className}>
      {children}
    </a>
  );
}

/**
 * A book standing on a library shelf, cover out.
 *
 * Owned: the subject's cloth with a shaded spine and sheen, page edges peeking out, its reading
 * progress along the foot. Hovering lifts it and tilts the cover on its spine, as if about to open.
 *
 * Not owned yet: the same book still in its shrink-wrap. The cloth is a pale tint of the subject
 * (it stays recognisable), the spine keeps the full colour, two gloss streaks sit on the wrap and
 * a glint sweeps across on hover. A price sticker (or "যোগ করো" / "ফ্রি") and a small lock say what
 * it is without greying it out. It opens the subject's product page.
 */
export function ShelfBook({ book, kind, lang, fmt, t }: { book: Book; kind: LibraryShelf["kind"]; lang: Locale; fmt: Formatter; t: Dictionary }) {
  const l = t.library;
  const owned = book.state === "owned";
  const name = book.kicker && book.title !== book.kicker ? `${book.kicker} ${book.title}` : book.title;
  const label = fill(owned ? l.openOwned : book.state === "free" ? l.openFree : l.openLocked, { name });
  const plate = book.coverUrl && book.coverFit === "plate";
  const full = book.coverUrl && book.coverFit === "full";
  // Papers ("১ম পত্র") read large; course and book titles are longer.
  const short = book.title.length <= 12;
  const Mark = subjectIcons[FAMILY_ICON[book.family]];

  return (
    <ShelfLink
      href={bookHref(book, lang)}
      label={label}
      className={cn("group/book relative block shrink-0 snap-start rounded-md outline-offset-4", BOOK_WIDTH)}
    >
      <BookFace
        family={book.family}
        owned={owned}
        // A paper's cover carries its subject's mark; courses and books have their own covers.
        mark={kind === "batch" && !plate && !full ? Mark : undefined}
        markClassName="right-2 bottom-12 size-10"
        className={cn(
          "group-hover/book:-translate-y-1.5 group-focus-visible/book:-translate-y-1.5 motion-reduce:group-hover/book:translate-y-0",
          owned &&
            "group-hover/book:[transform:rotateY(-14deg)] group-focus-visible/book:[transform:rotateY(-14deg)] motion-reduce:group-hover/book:transform-none",
        )}
      >
        {full && <Image src={book.coverUrl!} alt="" fill sizes="128px" className={cn("object-cover", !owned && "opacity-55 saturate-50")} />}

        {!full && (
          <span className="relative flex min-w-0 flex-col gap-1.5 p-2.5 pl-4">
            {plate && (
              <span className="relative block aspect-video overflow-hidden rounded-sm ring-1 ring-on-fill/25">
                <Image src={book.coverUrl!} alt="" fill sizes="128px" className={cn("object-cover", !owned && "opacity-60 saturate-50")} />
              </span>
            )}
            {/* A course cover's picture says what the kicker would; it leaves the title room. */}
            {book.kicker && !plate && <span className="truncate text-xs font-semibold opacity-80">{book.kicker}</span>}
            <span className={cn("font-bold", plate || !short ? "line-clamp-3 text-sm leading-snug" : "text-lg leading-tight")}>{book.title}</span>
          </span>
        )}

        {/* E-books carry a small mark, so a book reads apart from a course. */}
        {kind === "ebook" && !full && owned && <BookOpen aria-hidden className="absolute right-2.5 bottom-2.5 size-4 opacity-60" />}

        {owned && book.progress !== null && (
          <span className="absolute inset-x-0 bottom-0 grid gap-1 p-2.5 pl-4">
            <span className="text-xs font-semibold tabular-nums opacity-90">
              {book.progress > 0 ? fill(l.read, { pct: fmt.percent(book.progress) }) : l.notStarted}
            </span>
            <span className="h-1 overflow-hidden rounded-full bg-on-fill/25">
              <span className="block h-full rounded-full bg-on-fill" style={{ width: `${book.progress}%` }} />
            </span>
          </span>
        )}

        {!owned && (
          <>
            <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--book-wrap)" }} />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/book:translate-x-full group-focus-visible/book:translate-x-full motion-reduce:hidden"
              style={{ background: "var(--book-wrap-glint)" }}
            />
            {/* The sticker on the wrap: what it costs (or that it's free), a lock for "not yours yet". */}
            <span
              className={cn(
                "absolute right-1.5 bottom-2 inline-flex items-center gap-0.5 rounded-full py-0.5 pr-1.5 pl-1.5 text-xs font-semibold whitespace-nowrap tabular-nums shadow-raised sm:right-2 sm:gap-1 sm:pr-2",
                book.state === "free" ? "bg-success text-on-fill" : "bg-surface text-brand-text",
              )}
            >
              {book.state !== "free" && <Lock className="size-3" aria-hidden />}
              {book.state === "free" ? l.free : book.price ? `৳${fmt.number(book.price)}` : l.buy}
            </span>
          </>
        )}
      </BookFace>
    </ShelfLink>
  );
}
