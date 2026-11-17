import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PrepSubject } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { BOOK_COLOR, bookTransition } from "@/design-system/foundations/book";
import { Morph } from "@/design-system/motion/motion";
import { prepHref } from "@/lib/superprep-links";

const doneLabel = (s: PrepSubject, fmt: Formatter, t: Dictionary) =>
  s.totals.answered > 0 ? fill(t.superprepPage.pctDone, { pct: fmt.percent(s.totals.pct) }) : t.superprepPage.notStarted;

/**
 * The hub's shelf in miniature: every paper as a spine standing on a board, in its book colour
 * and cloth. Papers not started yet stand a little faded (colour kept); the one practised last
 * carries the ribbon. All spines are one height: different heights read as a bar chart of data
 * that isn't there. Hovering (or focusing) a spine lifts it and names the paper and its progress;
 * a tap opens the paper.
 */
export function MiniShelf({ subjects, lastId, lang, fmt, t }: { subjects: PrepSubject[]; lastId: string | null; lang: Locale; fmt: Formatter; t: Dictionary }) {
  return (
    <div className="grid">
      <ul className="flex items-end gap-[3px] px-1">
        {subjects.map((s, i) => {
          const last = s.id === lastId;
          const done = doneLabel(s, fmt, t);
          // The name sits centred over its spine, but starts or ends at the shelf's edge for the outer spines.
          const align = i < 2 ? "left-0" : i >= subjects.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2";
          return (
            // A small gap between families, so the 1st and 2nd papers stand together.
            <li key={s.id} className={`min-w-0 max-w-7 flex-1 ${i > 0 && subjects[i - 1].family !== s.family ? "ml-1.5" : ""}`}>
              <Link
                href={prepHref(lang, {}, s.id)}
                aria-label={`${fill(t.superprepPage.openBook, { name: s.name })}, ${done}`}
                className="group/spine relative block rounded-t-xs outline-offset-2 transition-transform duration-200 ease-out hover:-translate-y-1.5 focus-visible:-translate-y-1.5 motion-reduce:transition-none"
              >
                {/* The paper's name on hover, in the report heatmap's tooltip style. */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute bottom-full z-20 mb-2.5 hidden w-max max-w-56 rounded-md bg-text px-2.5 py-1.5 text-xs text-surface shadow-pop group-hover/spine:grid group-focus-visible/spine:grid ${align}`}
                >
                  <span className="font-semibold">{s.name}</span>
                  <span className="opacity-75 tabular-nums">{done}</span>
                </span>
                {last && (
                  <span
                    aria-hidden
                    className="absolute -top-2 left-1/2 h-4 w-1.5 -translate-x-1/2 bg-superprep-pink [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]"
                  />
                )}
                <span
                  className={`relative block overflow-hidden rounded-t-xs shadow-[inset_0_0_0_1px_rgb(0_0_0/0.14)] ${s.totals.answered > 0 ? "" : "opacity-70"}`}
                  style={{ height: 44, backgroundColor: BOOK_COLOR[s.family] }}
                >
                  <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-board-cloth)" }} />
                  <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-spine-round)" }} />
                  {/* Gilt bands near the head and tail, as on a bound spine. */}
                  <span aria-hidden className="absolute inset-x-0 top-2 h-px bg-on-fill/50" />
                  <span aria-hidden className="absolute inset-x-0 top-3 h-px bg-on-fill/30" />
                  <span aria-hidden className="absolute inset-x-0 bottom-2 h-px bg-on-fill/40" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {/* The board the books stand on. */}
      <span aria-hidden className="h-2 rounded-sm bg-raised shadow-raised ring-1 ring-border" />
    </div>
  );
}

/**
 * A paper's closed book, small: its cover with spine, sheen, page edges and ribbon. It opens the
 * paper, and shares the shelf's transition name, so the cover morphs into the open book.
 */
export function MiniBook({ subject, lang, t, morph = true }: { subject: PrepSubject; lang: Locale; t: Dictionary; morph?: boolean }) {
  return (
    <Link
      href={prepHref(lang, {}, subject.id)}
      aria-label={fill(t.superprepPage.openBook, { name: subject.name })}
      className="group/book relative block w-12 shrink-0 self-start rounded-sm outline-offset-4 [perspective:400px]"
    >
      {/* Page edges behind the cover. */}
      <span aria-hidden className="absolute inset-y-1 -right-1 left-1 rounded-r-sm border border-border bg-paper" />
      <Morph name={morph ? bookTransition(subject.id) : undefined} share="book">
        <span
          className="relative block aspect-[3/4] origin-left overflow-hidden rounded-l-xs rounded-r-sm shadow-raised transition-transform duration-300 ease-out group-hover/book:[transform:rotateY(-18deg)] motion-reduce:transition-none motion-reduce:group-hover/book:transform-none"
          style={{ backgroundColor: BOOK_COLOR[subject.family] }}
        >
          <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-board-cloth)" }} />
          <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-sheen)" }} />
          <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: "var(--book-spine)" }} />
          <span aria-hidden className="absolute inset-x-2.5 top-2.5 h-px bg-on-fill/45" />
          <span aria-hidden className="absolute top-0 right-1.5 h-5 w-2 bg-superprep-pink shadow-raised [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]" />
        </span>
      </Morph>
    </Link>
  );
}
