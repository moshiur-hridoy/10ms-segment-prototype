import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PrepSubject } from "@/lib/api";
import { shortSubjectName } from "@/lib/describe";
import { fill, type Formatter } from "@/lib/format";
import { BOOK_COLOR, bookTransition } from "@/design-system/foundations/book";

/**
 * A paper as a book on the shelf: a cover in its family colour with a shaded spine, the
 * paper's name, a progress strip, and the page edges peeking out. A ribbon marks the book
 * practised last. On hover the cover tilts on its spine, as if about to open; clicking it
 * morphs into the open book (paper page).
 */
export function BookCover({ subject, last, href, fmt, t }: { subject: PrepSubject; last: boolean; href: string; fmt: Formatter; t: Dictionary }) {
  const p = t.superprepPage;
  const family = p.families[subject.family];
  const volume = shortSubjectName(subject.name, family) ?? subject.name;
  const { totals } = subject;
  const started = totals.answered > 0;

  return (
    <Link href={href} aria-label={fill(p.openBook, { name: subject.name })} className="group/book grid w-full gap-2 rounded-md outline-offset-4">
      <span className="relative block [perspective:900px]">
        {/* Page edges behind the cover. */}
        <span aria-hidden className="absolute inset-y-1.5 -right-1 left-2 rounded-r-sm border border-border bg-paper" />
        <ViewTransition name={bookTransition(subject.id)} share="book" default="none">
          <span
            className="relative grid aspect-[3/4] origin-left overflow-hidden rounded-l-sm rounded-r-md text-on-fill shadow-raised transition-transform duration-300 ease-out group-hover/book:[transform:rotateY(-16deg)] group-focus-visible/book:[transform:rotateY(-16deg)] motion-reduce:transition-none motion-reduce:group-hover/book:transform-none"
            style={{ backgroundColor: BOOK_COLOR[subject.family] }}
          >
            {subject.coverUrl && <Image src={subject.coverUrl} alt="" fill sizes="160px" className="object-cover" />}
            <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-sheen)" }} />
            <span aria-hidden className="absolute inset-y-0 left-0 w-3" style={{ background: "var(--book-spine)" }} />
            {last && (
              <span
                aria-hidden
                className="absolute top-0 right-3 h-10 w-4 bg-superprep-pink shadow-raised [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]"
              />
            )}
            <span className="relative grid content-between gap-2 p-3 pl-5">
              <span className="grid gap-1">
                <span className="text-xs font-semibold opacity-80">{family}</span>
                <span className="text-lg leading-tight font-bold">{volume}</span>
              </span>
              <span className="grid gap-1.5">
                <span className="text-xs opacity-80">{fill(p.chaptersCount, { n: fmt.number(subject.chapters.length) })}</span>
                <span className="h-1 overflow-hidden rounded-full bg-on-fill/25">
                  <span className="block h-full rounded-full bg-on-fill" style={{ width: `${totals.pct}%` }} />
                </span>
              </span>
            </span>
          </span>
        </ViewTransition>
      </span>
      <span className="grid gap-0.5 px-0.5 text-xs">
        <span className="font-semibold tabular-nums">{started ? fill(p.pctDone, { pct: fmt.percent(totals.pct) }) : p.notStarted}</span>
        {last ? (
          <span className="text-superprep-pink">{p.lastRibbon}</span>
        ) : subject.weakCount > 0 ? (
          <span className="text-warning">{fill(p.weakCount, { n: fmt.number(subject.weakCount) })}</span>
        ) : started && totals.accuracy !== null ? (
          <span className="text-muted tabular-nums">{fill(p.accuracy, { pct: fmt.percent(totals.accuracy) })}</span>
        ) : null}
      </span>
    </Link>
  );
}
