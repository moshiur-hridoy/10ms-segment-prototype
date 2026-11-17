import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PrepSubject } from "@/lib/api";
import type { Formatter } from "@/lib/format";
import type { BookFamily } from "@/design-system/foundations/book";
import { BookCover } from "./book-cover";
import { prepHref } from "@/lib/superprep-links";
import { Card } from "@/design-system/atoms/card";

/**
 * Every paper as a book, grouped by subject family (1st and 2nd papers stand together like
 * volumes of a set), each group on its own shelf board.
 */
export function Shelf({
  subjects,
  lastId,
  lang,
  query,
  fmt,
  t,
}: {
  subjects: PrepSubject[];
  lastId: string | null;
  lang: Locale;
  query: Record<string, string | string[] | undefined>;
  fmt: Formatter;
  t: Dictionary;
}) {
  const p = t.superprepPage;
  const groups = new Map<BookFamily, PrepSubject[]>();
  for (const s of subjects) groups.set(s.family, [...(groups.get(s.family) ?? []), s]);

  return (
    <Card aria-labelledby="shelf-title" className="grid gap-6 p-5 sm:p-6">
      <header className="grid gap-0.5">
        <h2 id="shelf-title" className="type-title">
          {p.shelf}
        </h2>
        <p className="text-sm text-muted">{p.shelfHint}</p>
      </header>
      <div className="flex flex-wrap gap-x-8 gap-y-8">
        {[...groups].map(([family, books]) => (
          <section key={family} aria-label={p.families[family]} className="grid content-start gap-2">
            <h3 className="text-sm font-semibold text-muted">{p.families[family]}</h3>
            <ul className="flex gap-4">
              {books.map((s) => (
                <li key={s.id} className="w-28 sm:w-32">
                  <BookCover subject={s} last={s.id === lastId} href={prepHref(lang, query, s.id)} fmt={fmt} t={t} />
                </li>
              ))}
            </ul>
            {/* The shelf board the books stand on. */}
            <span aria-hidden className="-mx-2 h-2 rounded-sm bg-raised shadow-raised ring-1 ring-border" />
          </section>
        ))}
      </div>
    </Card>
  );
}
