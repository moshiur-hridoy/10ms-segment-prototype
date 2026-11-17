import { ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/design-system/atoms/badge";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { ProgressBar } from "@/design-system/atoms/progress";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { LibraryShelf as Shelf, ShelfBook as Book, ShelfGroup } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { BOOK_WIDTH } from "./book-size";
import { RestToggle } from "./rest-toggle";
import { ShelfScroller } from "./shelf-scroller";
import { ShelfBook, ShelfLink } from "./shelf-book";
import { ShelfFrame } from "./shelf-frame";

type Common = { kind: Shelf["kind"]; lang: Locale; fmt: Formatter; t: Dictionary };

/**
 * One bookcase bay: a batch (HSC 27), or the skills, English or e-book shelf.
 *
 * Books stand on one board running the full width; each subject's books stand together with the
 * subject's name on the board's front under them, the way a library labels its sections. The
 * student's own books come first; a bookend separates them from the ones they could still add
 * (wrapped, see ShelfBook), then a few suggestions and a "+ আরো" slot. A finished batch hides its
 * not-owned papers behind an empty slot. On narrow screens the bay scrolls sideways.
 */
export function LibraryShelf({ shelf, lang, fmt, t }: { shelf: Shelf } & Omit<Common, "kind">) {
  const l = t.library;
  const batch = shelf.kind === "batch";
  const titleId = `shelf-${shelf.id}-title`;
  const moreHref = shelf.catalogId ? `/${lang}/hsc/${shelf.catalogId}` : shelf.moreUrl;
  const common = { kind: shelf.kind, lang, fmt, t };
  const labelled = shelf.rest.length > 0 || shelf.suggestions.length > 0;

  const rest = shelf.rest.length > 0 && (
    <>
      <Bookend />
      <Section label={l.notYet} groups={shelf.rest} {...common} />
    </>
  );

  return (
    <Card as="section" id={`shelf-${shelf.id}`} aria-labelledby={titleId} className="scroll-mt-24 overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="grid min-w-0 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={titleId} className="type-title">
              {shelf.title}
            </h2>
            {batch && <Badge tone={shelf.past ? "neutral" : "success"}>{shelf.past ? l.past : l.current}</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
            {shelf.subtitle && <span>{shelf.subtitle}</span>}
            {batch ? (
              <span className="flex shrink-0 items-center gap-2">
                <span className="block w-20">
                  <ProgressBar value={(shelf.count.owned / Math.max(1, shelf.count.total)) * 100} label={fill(l.ownedOf, { n: fmt.number(shelf.count.owned), total: fmt.number(shelf.count.total) })} thin />
                </span>
                <span aria-hidden className="whitespace-nowrap">{fill(l.ownedOf, { n: fmt.number(shelf.count.owned), total: fmt.number(shelf.count.total) })}</span>
              </span>
            ) : (
              <span>{fill(l.ownedCount, { n: fmt.number(shelf.count.owned) })}</span>
            )}
          </div>
        </div>
        {shelf.courseId && (
          <Button href={`/${lang}/course/${shelf.courseId}`} variant="secondary" size="sm">
            {l.courseHome}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )}
      </header>

      <div className="mt-2">
      <ShelfScroller label={fill(l.shelf, { title: shelf.title })} prev={l.prev} next={l.next}>
        {/* Room above the books for a section label whenever the shelf can show one, even while it's hidden (a finished batch). */}
        <ul className={cn("relative flex min-w-max items-end gap-6 px-5 sm:gap-8 sm:px-6", labelled ? "pt-12" : "pt-6")}>
          {/* The board, under every book; the subject names sit on its front. */}
          <li aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-9" style={{ background: "var(--shelf-board)", boxShadow: "var(--shadow-shelf)" }} />

          {shelf.owned.map((g) => (
            <Group key={g.id} group={g} {...common} />
          ))}

          {shelf.past ? (
            shelf.rest.length > 0 && (
              <RestToggle show={fill(l.showRest, { n: fmt.number(shelf.count.rest) })} hide={l.hideRest}>
                {rest}
              </RestToggle>
            )
          ) : (
            rest
          )}

          {shelf.suggestions.length > 0 && (
            <>
              <Bookend />
              <Section label={l.forYou} groups={[{ id: `${shelf.id}-suggest`, books: shelf.suggestions }]} {...common} />
            </>
          )}

          {moreHref && (
            <li className="relative self-end pb-9">
              <ShelfLink
                href={moreHref}
                className={cn(
                  "grid aspect-[3/4] place-content-center justify-items-center gap-2 rounded-md border border-dashed border-border-strong p-2 text-center text-xs font-semibold text-muted transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand-text",
                  BOOK_WIDTH,
                )}
              >
                <span className="grid size-9 place-items-center rounded-full bg-surface shadow-raised">
                  <Plus className="size-4" aria-hidden />
                </span>
                {l.more}
              </ShelfLink>
            </li>
          )}
        </ul>
      </ShelfScroller>
      </div>
    </Card>
  );
}

/** A course with its own thumbnail (skills, English): a framed picture, not a book. */
const isFramed = (b: Book) => b.coverFit === "plate" && Boolean(b.coverUrl);

/** One subject's books standing together, its name on the board below. */
function Group({ group, ...common }: { group: ShelfGroup } & Common) {
  // Courses with a thumbnail stand as framed pictures, each with its own name on the board.
  if (group.books.every(isFramed)) {
    return (
      <>
        {group.books.map((b) => (
          <li key={b.id} className="relative grid justify-items-center">
            <ShelfFrame book={b} lang={common.lang} fmt={common.fmt} t={common.t} />
            <span className="flex h-9 max-w-full items-center px-1">
              <span title={b.title} className="truncate px-1 text-xs font-semibold tracking-wide text-muted">
                {b.title}
              </span>
            </span>
          </li>
        ))}
      </>
    );
  }
  return (
    <li className="relative grid justify-items-center">
      <ul className="flex items-end gap-2.5 sm:gap-3">
        {group.books.map((b: Book) => (
          <li key={b.id}>
            <ShelfBook book={b} {...common} />
          </li>
        ))}
      </ul>
      <span className="flex h-9 max-w-full items-center px-1">
        {group.name && <span className="truncate rounded-xs px-2 py-0.5 text-xs font-semibold tracking-wide text-muted">{group.name}</span>}
      </span>
    </li>
  );
}

/** A labelled run of groups: "এখনো নেওয়া হয়নি", "তোমার জন্য". The row's top padding holds the label. */
function Section({ label, groups, ...common }: { label: string; groups: ShelfGroup[] } & Common) {
  return (
    <li className="relative">
      {/* Above the books, in the room the row keeps for it, so showing a section never makes the bay taller. */}
      <span className="absolute bottom-full left-0 mb-2 whitespace-nowrap text-xs font-semibold text-subtle">{label}</span>
      <ul className="flex items-end gap-6 sm:gap-8">
        {groups.map((g) => (
          <Group key={g.id} group={g} {...common} />
        ))}
      </ul>
    </li>
  );
}

/** Between the student's books and the rest: a hairline rising from the board, fading out toward the top. */
function Bookend() {
  return (
    <li aria-hidden className="flex self-stretch pt-10 pb-9">
      <span className="w-px flex-1 bg-gradient-to-t from-border-strong to-transparent" />
    </li>
  );
}
