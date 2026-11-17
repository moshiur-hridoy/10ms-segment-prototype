import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { AttendanceSection } from "@/components/report/attendance-section";
import { DaysSection } from "@/components/report/days-section";
import { ExamsSection } from "@/components/report/exams-section";
import { KpiTiles } from "@/components/report/kpi-tiles";
import { NextActions } from "@/components/report/next-actions";
import { ReportSkeleton } from "@/components/report/report-skeleton";
import { ScopeBar, type ReportLink } from "@/components/report/scope-bar";
import { StoryCard } from "@/components/report/story-card";
import { SubjectsSection } from "@/components/report/subjects-section";
import { Button } from "@/design-system/atoms/button";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getClasses, getReport, type DataContext, type PeriodKind } from "@/lib/api";
import { fill, createFormatter } from "@/lib/format";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/*
 * Learning report. One scope for the whole page, from the URL:
 *   ?course=<id>|all   default: the active batch's course
 *   ?period=week|month default: week
 *   ?offset=-1         0 = current, negative = earlier
 */
export default async function ReportPage({ searchParams }: PageProps<"/[lang]/report">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <>
      <DashboardHeader ctx={ctx} lang={lang} t={t} current="report" />
      <PageMotion>
      <main className="mx-auto grid max-w-page grid-cols-1 gap-5 px-4 pb-10 sm:px-6">
        <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
          <Reveal fallback={<ReportSkeleton label={t.common.loading} />}>
            <ReportBody ctx={ctx} searchParams={searchParams} lang={lang} t={t} />
          </Reveal>
        </SectionErrorBoundary>
      </main>
      </PageMotion>
    </>
  );
}

async function ReportBody({ ctx, searchParams, lang, t }: { ctx: Promise<DataContext>; searchParams: Promise<SearchParams>; lang: Locale; t: Dictionary }) {
  const [c, sp] = await Promise.all([ctx, searchParams]);
  const courseParam = first(sp.course);
  const kind: PeriodKind = first(sp.period) === "month" ? "month" : "week";
  const offset = Math.min(0, Number.parseInt(first(sp.offset) ?? "0", 10) || 0);

  const [{ courses, courseId, report }, classes] = await Promise.all([
    getReport(c, courseParam === undefined ? undefined : courseParam === "all" ? null : courseParam, kind, offset),
    getClasses(c),
  ]);
  const fmt = createFormatter(lang, c.now);
  const r = t.report;
  const noun = r.periodKind[kind];

  // Links keep the dev knobs (?fixture=…) and change only what's asked.
  const link: ReportLink = (change) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (!["course", "period", "offset"].includes(key) && typeof value === "string") params.set(key, value);
    }
    const course = change.course ?? (courseId ?? "all");
    const period = change.period ?? kind;
    const off = change.offset ?? offset;
    params.set("course", course);
    if (period !== "week") params.set("period", period);
    if (off !== 0) params.set("offset", String(off));
    return `/${lang}/report?${params}`;
  };

  const inScope = (id?: string) => !courseId || id === courseId;
  const current = report.period.offset === 0;
  const nextClass =
    classes.upcoming.find((x) => inScope(x.courseId) && (x.kind === "class" || x.kind === "free") && (x.status === "live" || x.status === "upcoming")) ?? null;
  const missed = classes.missed.filter((x) => inScope(x.courseId) && x.kind !== "exam" && x.kind !== "homework");
  const course = courses.find((x) => x.id === courseId);
  const hasActions = Boolean(nextClass) || report.pendingHomework.length > 0 || missed.length > 0;
  const showActions = current && hasActions;

  return (
    <>
      <header className="grid gap-1 pt-6">
        <h1 className="type-headline sm:text-3xl">{r.title}</h1>
        <p className="truncate text-sm text-muted">{course?.title ?? r.allCourses}</p>
      </header>

      <ScopeBar courses={courses} courseValue={courseId ?? "all"} period={report.period} link={link} fmt={fmt} t={t} />

      {report.empty ? (
        <>
          <div className="grid justify-items-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-6 text-center">
            <p className="max-w-xl text-muted">{fill(!current ? r.empty.past : hasActions ? r.empty.current : r.empty.fresh, { period: noun })}</p>
            {current && !hasActions && (
              <Button href={`/${lang}`} variant="secondary" size="sm">
                {r.empty.cta}
              </Button>
            )}
          </div>
          {current && <NextActions nextClass={nextClass} homework={report.pendingHomework} missed={missed} fmt={fmt} t={t} />}
        </>
      ) : (
        /*
         * Read top to bottom as a story: what happened (the sentence) and what to do about it
         * side by side, then the numbers, the days, and the subjects. On phones the same
         * order, one column.
         */
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          <StoryCard report={report} fmt={fmt} t={t} className={showActions ? "lg:col-span-7 lg:self-stretch" : "lg:col-span-12"} />
          {showActions && (
            <div className="min-w-0 lg:col-span-5">
              <NextActions nextClass={nextClass} homework={report.pendingHomework} missed={missed} fmt={fmt} t={t} />
            </div>
          )}

          <section aria-labelledby="summary-title" className="grid gap-3 lg:col-span-12">
            <h2 id="summary-title" className="type-subtitle">
              {r.summary}
            </h2>
            <KpiTiles report={report} fmt={fmt} t={t} />
          </section>

          <div className="min-w-0 lg:col-span-12">
            <DaysSection report={report} fmt={fmt} t={t} />
          </div>

          <div className="grid min-w-0 gap-5 lg:col-span-7">
            <SubjectsSection report={report} fmt={fmt} t={t} />
          </div>
          <div className="grid min-w-0 gap-5 lg:col-span-5">
            <AttendanceSection report={report} fmt={fmt} t={t} />
            <ExamsSection report={report} fmt={fmt} t={t} />
          </div>
        </div>
      )}
    </>
  );
}
