import { Library as LibraryIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { LibraryShelf } from "@/components/library/library-shelf";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionSkeleton } from "@/design-system/molecules/section-card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getLibrary, type DataContext } from "@/lib/api";
import { createFormatter, fill } from "@/lib/format";

/*
 * "কোর্স ও বইসমূহ": the student's library. One shelf per batch (HSC 27, HSC 26), then skills,
 * English and e-books. A batch shelf shows every paper the batch teaches, the student's own first
 * and the rest still wrapped, so they always see where they stand in a batch and what is left.
 * Owned papers open their subject page, owned courses their course home, the rest their product page.
 */
export default async function LibraryPage({ searchParams }: PageProps<"/[lang]/library">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <>
      <DashboardHeader ctx={ctx} lang={lang} t={t} current="courses" />
      <PageMotion>
        <main className="mx-auto grid max-w-page grid-cols-1 gap-5 px-4 pt-4 pb-12 sm:px-6">
          <Breadcrumb label={t.courseHome.crumbs} items={[{ label: t.nav.dashboard, href: `/${lang}` }, { label: t.library.title }]} />
          <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
            <Reveal fallback={<SectionSkeleton rows={6} label={t.common.loading} />}>
              <LibraryBody ctx={ctx} lang={lang} t={t} />
            </Reveal>
          </SectionErrorBoundary>
        </main>
      </PageMotion>
    </>
  );
}

async function LibraryBody({ ctx, lang, t }: { ctx: Promise<DataContext>; lang: Locale; t: Dictionary }) {
  const c = await ctx;
  const { shelves, totals } = await getLibrary(c);
  const fmt = createFormatter(lang, c.now);
  const l = t.library;

  return (
    <div className="grid grid-cols-1 gap-6">
      <header className="grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div className="grid gap-1">
          <h1 className="type-headline">{l.title}</h1>
          <p className="text-muted">
            {shelves.length > 0
              ? fill(l.summary, { papers: fmt.number(totals.papers), courses: fmt.number(totals.courses), ebooks: fmt.number(totals.ebooks) })
              : l.intro}
          </p>
        </div>
        {shelves.length > 1 && (
          <nav aria-label={l.jump} className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
            {shelves.map((s) => (
              <a
                key={s.id}
                href={`#shelf-${s.id}`}
                className="inline-flex h-9 shrink-0 items-center rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                {s.title}
              </a>
            ))}
          </nav>
        )}
      </header>

      {shelves.length === 0 ? (
        <Card className="p-5 sm:p-6">
          <EmptyState
            icon={LibraryIcon}
            title={l.empty}
            action={
              <Button href={`/${lang}/hsc/hsc-28`} variant="secondary" size="sm">
                {l.explore}
              </Button>
            }
          />
        </Card>
      ) : (
        shelves.map((shelf) => <LibraryShelf key={shelf.id} shelf={shelf} lang={lang} fmt={fmt} t={t} />)
      )}
    </div>
  );
}
