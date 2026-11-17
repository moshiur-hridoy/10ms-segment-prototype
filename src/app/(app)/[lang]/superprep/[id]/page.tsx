import { BookOpen, ChevronRight, ListChecks, RotateCcw, SlidersHorizontal, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { ViewTransition } from "react";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { AnswerLegend } from "@/components/superprep/answer-bar";
import { chapterSet, customHref, examHref, prepHref } from "@/lib/superprep-links";
import { SuperPrepMark } from "@/design-system/atoms/superprep-mark";
import { NextStep } from "@/components/superprep/next-step";
import { bookVariant, OpenBook } from "@/components/superprep/open-book";
import { BOOK_COLOR, bookTransition } from "@/design-system/foundations/book";
import { PrepSummary } from "@/components/superprep/prep-summary";
import { TocRow, type RowBadge } from "@/components/superprep/toc-row";
import { SubjectRail } from "@/components/superprep/subject-rail";
import { BookSkeleton } from "@/components/superprep/superprep-skeleton";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { IconTile } from "@/design-system/atoms/icon-tile";
import { EmptyState } from "@/design-system/molecules/empty-state";
import type { Tone } from "@/design-system/foundations/tone";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getSuperPrep, WEAK_BELOW_PCT, type DataContext } from "@/lib/api";
import { createFormatter, fill } from "@/lib/format";

type SearchParams = Record<string, string | string[] | undefined>;

/*
 * One paper in SuperPrep ("রসায়ন ১ম পত্র"): its ring and next step, its chapters as a map
 * (one answer bar each, weak ones flagged), and the paper's tools on the side.
 * Only chapters the course has taught are listed, which the section says outright.
 */
export default async function SuperPrepSubjectPage({ params, searchParams }: PageProps<"/[lang]/superprep/[id]">) {
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
          <Reveal fallback={<BookSkeleton label={t.common.loading} />}>
            {params.then(({ id }) => (
              <SubjectBody id={id} ctx={ctx} searchParams={searchParams} lang={lang} t={t} />
            ))}
          </Reveal>
        </SectionErrorBoundary>
      </main>
      </PageMotion>
    </>
  );
}

async function SubjectBody({
  id,
  ctx,
  searchParams,
  lang,
  t,
}: {
  id: string;
  ctx: Promise<DataContext>;
  searchParams: Promise<SearchParams>;
  lang: Locale;
  t: Dictionary;
}) {
  const [c, query] = await Promise.all([ctx, searchParams]);
  const sp = await getSuperPrep(c);
  const subject = sp.subjects.find((s) => s.id === id);
  if (!subject) notFound();
  const fmt = createFormatter(lang, c.now);
  const p = t.superprepPage;
  const { totals } = subject;

  const accent = BOOK_COLOR[subject.family];
  const variant = bookVariant(query.book);
  const nextChapter = subject.next.kind === "continue" || subject.next.kind === "start" ? subject.next.chapter.id : undefined;

  return (
    <div className="grid grid-cols-1 gap-4">
      <Breadcrumb
        label={t.courseHome.crumbs}
        items={[{ label: t.nav.dashboard, href: `/${lang}` }, { label: p.title, href: prepHref(lang, query) }, { label: subject.name }]}
      />
      {sp.subjects.length > 1 && <SubjectRail subjects={sp.subjects} currentId={subject.id} href={(sid) => prepHref(lang, query, sid)} label={p.otherBooks} fmt={fmt} />}

      {/* The open book: same name as the shelf's cover, so the cover morphs into these pages. */}
      <ViewTransition name={bookTransition(subject.id)} share="book" default="none">
        <OpenBook
          variant={variant}
          accent={accent}
          labelledBy="book-title"
          rightLabelledBy="contents-title"
          left={
            <>
              <header className="grid gap-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold" style={{ color: accent }}>
                    {p.families[subject.family]}
                  </p>
                  <SuperPrepMark className="text-base leading-5" />
                </div>
                <h1 id="book-title" className="text-2xl leading-tight font-bold tracking-tight">
                  {subject.name}
                </h1>
              </header>
              <PrepSummary
                totals={totals}
                contents={fill(p.invite, { chapters: fmt.number(totals.chaptersTotal), questions: fmt.number(totals.questions) })}
                fmt={fmt}
                t={t}
              />
              {subject.chapters.length > 0 && <NextStep subject={subject} lang={lang} query={query} fmt={fmt} t={t} />}
              {/* Secondary practice. Each tool appears only when it has something to work on. */}
              <nav aria-label={p.tools} className="grid gap-1">
                <h2 className="text-sm font-semibold text-muted">{p.tools}</h2>
                <ul className="-mx-2 grid divide-y divide-border">
                  {totals.wrong > 0 && (
                    <Tool href={examHref(lang, query, subject.id, { types: ["wrong"] })} icon={RotateCcw} tone="danger" title={p.redo} hint={fill(p.redoHint, { n: fmt.number(totals.wrong) })} />
                  )}
                  <Tool href={customHref(lang, query, subject.id, nextChapter)} icon={SlidersHorizontal} tone="highlight" title={p.custom} hint={p.customHint} />
                  {totals.answered > 0 && <Tool href={subject.reviewUrl} icon={ListChecks} tone="success" title={p.review} hint={fill(p.reviewHint, { n: fmt.number(totals.answered) })} />}
                </ul>
              </nav>
            </>
          }
          right={
            <>
              <header className="grid gap-2">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 id="contents-title" className="type-title">
                    {p.contents}
                  </h2>
                  <AnswerLegend labels={{ correct: p.correct, wrong: p.wrong, unanswered: p.unanswered }} />
                </div>
                {/* Says why numbering can skip (a paper may start at chapter 2). */}
                <p className="text-sm text-subtle">{p.chaptersNote}</p>
              </header>
              {subject.chapters.length === 0 ? (
                <EmptyState icon={BookOpen} title={p.emptySubject} />
              ) : (
                <ol className="-mx-2 grid">
                  {subject.chapters.map((ch) => {
                    const badges: RowBadge[] = [];
                    if (ch.weak) badges.push({ tone: "warning", label: p.weak, hint: fill(p.weakHint, { pct: fmt.percent(WEAK_BELOW_PCT) }) });
                    if (ch.status === "done" && ch.questions > 0) badges.push({ tone: "success", label: p.done });
                    return (
                      <TocRow
                        key={ch.id}
                        ch={ch}
                        href={ch.questions > 0 ? examHref(lang, query, subject.id, chapterSet(ch)) : null}
                        badges={badges}
                        accent={accent}
                        fmt={fmt}
                        t={t}
                      />
                    );
                  })}
                </ol>
              )}
            </>
          }
        />
      </ViewTransition>
    </div>
  );
}

/** A practice tool on the book's left page: icon, title and hint in one compact row. */
function Tool({ href, icon, tone, title, hint }: { href: string; icon: LucideIcon; tone: Tone; title: string; hint: string }) {
  return (
    <li>
      <Link href={href} className="group/tool flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-raised">
        <IconTile icon={icon} tone={tone} size="sm" shape="circle" />
        <span className="grid min-w-0 flex-1">
          <span className="text-sm font-semibold">{title}</span>
          <span className="truncate text-xs text-subtle">{hint}</span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover/tool:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}
