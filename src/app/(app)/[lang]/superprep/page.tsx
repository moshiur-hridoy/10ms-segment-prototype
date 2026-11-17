import { BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { prepHref } from "@/lib/superprep-links";
import { SuperPrepMark } from "@/design-system/atoms/superprep-mark";
import { NextStep } from "@/components/superprep/next-step";
import { PrepSummary } from "@/components/superprep/prep-summary";
import { Shelf } from "@/components/superprep/shelf";
import { SuperPrepSkeleton } from "@/components/superprep/superprep-skeleton";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { Card } from "@/design-system/atoms/card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getSuperPrep, WEAK_BELOW_PCT, type DataContext } from "@/lib/api";
import { createFormatter, fill, type Formatter } from "@/lib/format";

type SearchParams = Record<string, string | string[] | undefined>;

/*
 * SuperPrep home: the bookshelf, opened from the dashboard card. A slim strip (overall ring,
 * the one next step), then every paper as a book grouped by subject family, and the weakest
 * chapters across papers. Opening a book (a paper's page) is a different-looking page on
 * purpose: an open book with its contents.
 */
export default async function SuperPrepPage({ searchParams }: PageProps<"/[lang]/superprep">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <>
      <DashboardHeader ctx={ctx} lang={lang} t={t} current="practice" />
      <PageMotion>
      <main className="mx-auto max-w-page px-4 py-6 sm:px-6">
        <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
          <Reveal fallback={<SuperPrepSkeleton label={t.common.loading} />}>
            <HubBody ctx={ctx} searchParams={searchParams} lang={lang} t={t} />
          </Reveal>
        </SectionErrorBoundary>
      </main>
      </PageMotion>
    </>
  );
}

async function HubBody({ ctx, searchParams, lang, t }: { ctx: Promise<DataContext>; searchParams: Promise<SearchParams>; lang: Locale; t: Dictionary }) {
  const [c, query] = await Promise.all([ctx, searchParams]);
  const sp = await getSuperPrep(c);
  const fmt = createFormatter(lang, c.now);
  const p = t.superprepPage;

  const crumbs = <Breadcrumb label={t.courseHome.crumbs} items={[{ label: t.nav.dashboard, href: `/${lang}` }, { label: p.title }]} />;
  if (sp.subjects.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5">
        {crumbs}
        <EmptyState icon={BookOpen} title={p.noSubjects} />
      </div>
    );
  }

  const weak = sp.subjects
    .flatMap((s) => s.chapters.filter((ch) => ch.weak).map((ch) => ({ subject: s, chapter: ch })))
    .sort((a, b) => (a.chapter.accuracy ?? 0) - (b.chapter.accuracy ?? 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-5">
      {crumbs}
      {/* A slim strip: the overall ring and the one next step; the shelf is the page. */}
      <Card className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8" style={{ backgroundImage: "var(--grad-superprep-glow)" }}>
        <header className="grid gap-1">
          <SuperPrepMark as="h1" className="text-3xl leading-9" />
          <p className="text-sm text-muted">{p.tagline}</p>
        </header>
        <PrepSummary
          totals={sp.totals}
          target={sp.targetPct}
          size={96}
          contents={fill(t.superprep.contents, {
            subjects: fmt.number(sp.subjects.length),
            chapters: fmt.number(sp.totals.chaptersTotal),
            questions: fmt.number(sp.totals.questions),
          })}
          fmt={fmt}
          t={t}
        />
        {sp.focus && (
          <div className="rounded-md bg-superprep-tile p-4 ring-1 ring-border ring-inset">
            <NextStep subject={sp.focus} compact lang={lang} query={query} fmt={fmt} t={t} />
          </div>
        )}
      </Card>

      <div className={weak.length ? "grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]" : "grid grid-cols-1 gap-6"}>
        <Shelf subjects={sp.subjects} lastId={sp.last?.id ?? null} lang={lang} query={query} fmt={fmt} t={t} />
        {weak.length > 0 && <WeakChapters items={weak} lang={lang} query={query} fmt={fmt} t={t} />}
      </div>
    </div>
  );
}

/** The weakest chapters across every paper: where practice pays off most. */
function WeakChapters({
  items,
  lang,
  query,
  fmt,
  t,
}: {
  items: { subject: { id: string; name: string }; chapter: { id: string; number: number; title: string; accuracy: number | null } }[];
  lang: Locale;
  query: SearchParams;
  fmt: Formatter;
  t: Dictionary;
}) {
  const p = t.superprepPage;
  return (
    <Card aria-labelledby="sp-weak" className="grid gap-3 p-5 lg:sticky lg:top-24">
      <header className="grid gap-0.5">
        <h2 id="sp-weak" className="type-subtitle">
          {p.focus}
        </h2>
        <p className="text-sm text-subtle">{fill(p.weakHint, { pct: fmt.percent(WEAK_BELOW_PCT) })}</p>
      </header>
      <ul className="-mx-2 grid">
        {items.map(({ subject, chapter }) => (
          <li key={chapter.id}>
            {/* To the paper's page, where the chapter sits with its bar and the paper's tools. */}
            <Link href={prepHref(lang, query, subject.id)} className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-raised">
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-semibold">{chapter.title}</span>
                <span className="truncate text-xs text-subtle">
                  {subject.name} · {fill(p.chapter, { n: fmt.number(chapter.number) })}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-warning tabular-nums">{fill(p.accuracy, { pct: fmt.percent(chapter.accuracy ?? 0) })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
