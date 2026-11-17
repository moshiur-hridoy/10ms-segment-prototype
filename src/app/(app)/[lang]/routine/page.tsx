import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { Suspense } from "react";
import { LoginButton } from "@/components/catalog/segment";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { VisitorHeader } from "@/features/header/visitor-header";
import { HeaderActionsSkeleton } from "@/design-system/organisms/header/header-actions";
import { SiteHeader } from "@/design-system/organisms/header/site-header";
import { routineHref } from "@/components/routine/links";
import { PhoneRoutine } from "@/components/routine/phone";
import { Timeline } from "@/components/routine/timeline";
import { CatchUp, DayPage, RangeLoad, RangeStrip } from "@/components/routine/planner";
import { PhoneFilters, RoutineFilters } from "@/components/routine/routine-filters";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { Card } from "@/design-system/atoms/card";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { batchContext, createDataContext, getBatchRoutine, getCatalog, getRoutine, type DataContext } from "@/lib/api";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { dhakaDay } from "@/lib/time";
import { versionOf } from "@/lib/lab-version";
import { visitorOf } from "@/lib/visitor";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/*
 * The full routine: a strip of day tiles on top (one week or two, a dot per type on each day, the
 * month a click away); under it the chosen day (every entry in time order, a red "now" line on
 * today) and, in a column beside it, the stretch's load and what to catch up on. Everything comes
 * from the URL:
 *   ?day=YYYY-MM-DD   default: today
 *   ?course=<id>      ?subject=<name>      ?missed=1      ?span=14 (default 7, desktop only)
 * Below `lg` three cards (PhoneRoutine): the week as a strip, the week's load, the chosen day as
 * the main view; the month and the filters in bottom sheets.
 *
 * CT74: `?batch=hsc-27&stream=science` (the batch page's "ফুল রুটিন দেখো", lab `free-routine`) shows a batch's paid
 * live routine instead of the student's own: the stream's subjects, no one's attendance, the free classes marked
 * (`&hard=` picks them from those subjects), the batch page's header and a login card where the week's load was.
 */
export default async function RoutinePage({ searchParams }: PageProps<"/[lang]/routine">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);
  const batch = searchParams.then((sp) => first(sp.batch) ?? null);

  return (
    <>
      <Suspense fallback={<SiteHeader lang={lang} t={t} current="routine" actions={<HeaderActionsSkeleton />} />}>
        {batch.then((b) =>
          b ? (
            <VisitorHeader visitor={visitorOf(searchParams)} ctx={ctx} lang={lang} t={t} current="routine" />
          ) : (
            <DashboardHeader ctx={ctx} lang={lang} t={t} current="routine" />
          ),
        )}
      </Suspense>
      <PageMotion>
        <main className="mx-auto grid max-w-page grid-cols-1 gap-5 px-4 pt-4 pb-12 sm:px-6">
          <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
            <Reveal fallback={<RoutineSkeleton label={t.common.loading} />}>
              <RoutineBody ctx={ctx} searchParams={searchParams} lang={lang} t={t} />
            </Reveal>
          </SectionErrorBoundary>
        </main>
      </PageMotion>
    </>
  );
}

async function RoutineBody({
  ctx,
  searchParams,
  lang,
  t,
}: {
  ctx: Promise<DataContext>;
  searchParams: Promise<SearchParams>;
  lang: Locale;
  t: Dictionary;
}) {
  const [c, sp] = await Promise.all([ctx, searchParams]);
  const query = {
    day: first(sp.day) ?? null,
    course: first(sp.course) ?? null,
    subject: first(sp.subject) ?? null,
    missed: first(sp.missed) === "1",
    span: first(sp.span) === "14" ? (14 as const) : (7 as const),
  };
  const batchId = first(sp.batch);
  if (batchId) return <BatchRoutineBody c={c} sp={sp} batchId={batchId} query={query} lang={lang} t={t} />;
  const view = await getRoutine(c, query);
  const fmt = createFormatter(lang, c.now);
  const r = t.routine;
  const current = { ...view.query, today: view.today };
  const href = (change: Parameters<typeof routineHref>[3]) => routineHref(lang, sp, current, change);
  const props = { view, href, lang, fmt, t };
  const filters = {
    label: r.filters,
    course: {
      label: r.course,
      value: view.query.course ?? "all",
      options: [
        { value: "all", label: r.allCourses, href: href({ course: null }) },
        ...view.courses.map((o) => ({ ...o, href: href({ course: o.value }) })),
      ],
    },
    subject: {
      label: r.subject,
      value: view.query.subject ?? "all",
      options: [
        { value: "all", label: r.allSubjects, href: href({ subject: null }) },
        ...view.subjects.map((o) => ({ ...o, href: href({ subject: o.value }) })),
      ],
    },
    missed: { label: r.missedOnly, on: view.query.missed, href: href({ missed: !view.query.missed }) },
  };
  const active = [view.query.course, view.query.subject, view.query.missed].filter(Boolean).length;

  return (
    <div className="grid gap-5">
      <Breadcrumb label={r.crumbs} items={[{ label: t.nav.dashboard, href: `/${lang}` }, { label: r.title }]} />
      <div className="flex flex-wrap items-end justify-between gap-4 max-lg:items-center">
        <h1 className="type-headline">{r.title}</h1>
        <RoutineFilters {...filters} className="max-lg:hidden" />
        <PhoneFilters
          {...filters}
          className="lg:hidden"
          labels={{ filter: r.filter, clear: r.clearFilters, done: r.sheetDone, close: r.close }}
          active={active ? { count: fmt.number(active), label: fill(r.filterOn, { n: fmt.number(active) }) } : null}
          clearHref={href({ course: null, subject: null, missed: false })}
        />
      </div>

      {/* Desktop: the strip of days across the top; under it the day, and beside it a column that stays put. */}
      <div className="grid gap-5 max-lg:hidden">
        <Card as="div">
          <RangeStrip {...props} />
        </Card>
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5">
          <Card aria-labelledby="day-title" className="p-6">
            <DayPage {...props} />
          </Card>
          <aside className="sticky top-24 grid gap-4">
            <Card className="p-5">
              <RangeLoad {...props} />
            </Card>
            <Card className="p-5">
              <CatchUp {...props} />
            </Card>
          </aside>
        </div>
      </div>
      <PhoneRoutine {...props} className="lg:hidden" />
    </div>
  );
}

/**
 * CT74: a batch's routine for someone not in it. The planner as it is, over the batch's live classes; the subject filter
 * only (one course, nothing missed); where the week's load and the catch-up list were, the free classes and a login.
 */
async function BatchRoutineBody({
  c,
  sp,
  batchId,
  query,
  lang,
  t,
}: {
  c: DataContext;
  sp: SearchParams;
  batchId: string;
  query: Parameters<typeof getRoutine>[1];
  lang: Locale;
  t: Dictionary;
}) {
  const bc = batchContext(c);
  const catalog = await getCatalog(bc, batchId, first(sp.stream) ?? null);
  if (!catalog) notFound();
  const subjects = [...catalog.stream.group, ...catalog.stream.compulsory].map((s) => s.id);
  const hard = (first(sp.hard) ?? "").split(",").filter(Boolean);
  // CT104: `open=` subjects (the segment page's open ones) have every class free, no login.
  const open = (first(sp.open) ?? "").split(",").filter((x) => subjects.includes(x));
  const { view, free } = await getBatchRoutine(bc, batchId, subjects, hard, { ...query, course: null, missed: false }, open);
  const fmt = createFormatter(lang, c.now);
  const r = t.routine;
  const current = { ...view.query, today: view.today };
  const href = (change: Parameters<typeof routineHref>[3]) => routineHref(lang, sp, current, change);
  // CT211, CT213: the routine's own versions; from 2 (the working one) the phone shows the week as a timeline.
  const lab = first(sp.lab);
  const v = versionOf("routine-page", lab ? `?lab=${encodeURIComponent(lab)}` : "") ?? 0;
  const props = { view, href, lang, fmt, t, timeline: v >= 2 };
  const subject = {
    label: r.subject,
    value: view.query.subject ?? "all",
    options: [
      { value: "all", label: r.allSubjects, href: href({ subject: null }) },
      ...view.subjects.map((o) => ({ ...o, href: href({ subject: o.value }) })),
    ],
  };
  const keep = (["lab", "as"] as const).map((k) => (first(sp[k]) ? `&${k}=${encodeURIComponent(first(sp[k])!)}` : "")).join("");
  const back = `/${lang}/hsc/${catalog.batch.id}?stream=${catalog.stream.id}${keep}`;
  const title = fill(r.batchTitle, { batch: catalog.batch.name, stream: catalog.stream.name });
  const login = free.length > 0 && <FreeCard free={free} fmt={fmt} lang={lang} t={t} />;

  return (
    <div className="grid gap-5">
      <Breadcrumb label={r.crumbs} items={[{ label: catalog.batch.name, href: back }, { label: r.title }]} />
      <div className="flex flex-wrap items-end justify-between gap-4 max-lg:items-center">
        <h1 className="type-headline">{title}</h1>
        <RoutineFilters label={r.filters} subject={subject} className="max-lg:hidden" />
        <PhoneFilters
          label={r.filters}
          subject={subject}
          className="lg:hidden"
          labels={{ filter: r.filter, clear: r.clearFilters, done: r.sheetDone, close: r.close }}
          active={view.query.subject ? { count: fmt.number(1), label: fill(r.filterOn, { n: fmt.number(1) }) } : null}
          clearHref={href({ subject: null })}
        />
      </div>

      <div className="grid gap-5 max-lg:hidden">
        <Card as="div">
          <RangeStrip {...props} />
        </Card>
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5">
          {/* CT214: desktop shows the same timeline as the phone (routine-page v2). */}
          {props.timeline ? (
            <Timeline {...props} />
          ) : (
            <Card aria-labelledby="day-title" className="p-6">
              <DayPage {...props} />
            </Card>
          )}
          {login && <aside className="sticky top-24 grid gap-4">{login}</aside>}
        </div>
      </div>
      <PhoneRoutine {...props} aside={login || <span hidden />} className="lg:hidden" />
    </div>
  );
}

/** CT74: the free classes of a batch's routine (LIVE_PASSES of them), with the login that opens them. */
function FreeCard({
  free,
  fmt,
  lang,
  t,
}: {
  free: { id: string; title: string; subject: string; startsAt: string }[];
  fmt: Formatter;
  lang: Locale;
  t: Dictionary;
}) {
  const r = t.routine;
  return (
    <Card aria-labelledby="free-title" className="grid gap-4 p-5">
      <div className="grid gap-1">
        <h2 id="free-title" className="type-title">
          {fill(r.batchFreeTitle, { n: fmt.number(free.length) })}
        </h2>
        <p className="text-sm text-muted">{r.batchFreeLead}</p>
      </div>
      <ul className="grid gap-3">
        {free.map((f) => (
          <li key={f.id} className="grid gap-0.5 border-l-2 border-brand pl-3">
            <span className="text-xs font-semibold text-brand-text">
              {fmt.dayTitle(dhakaDay(Date.parse(f.startsAt)))} · {fmt.time(f.startsAt)} · {f.subject}
            </span>
            <span className="line-clamp-2 text-sm leading-snug font-semibold">{f.title}</span>
          </li>
        ))}
      </ul>
      <LoginButton lang={lang} label={t.segment.login} size="md" />
    </Card>
  );
}

function RoutineSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid gap-5">
      <Skeleton className="h-4 w-48" />
      <div className="flex justify-between gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton radius="full" className="h-10 w-96 max-lg:h-11 max-lg:w-28" />
      </div>
      <Skeleton radius="lg" className="h-[36rem]" />
    </SkeletonGroup>
  );
}
