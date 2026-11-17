import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { CustomSetup } from "@/components/exam/custom-setup";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { keepQuery, prepHref } from "@/lib/superprep-links";
import { SuperPrepSkeleton } from "@/components/superprep/superprep-skeleton";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getSuperPrep, type DataContext } from "@/lib/api";

type SearchParams = Record<string, string | string[] | undefined>;

/*
 * Custom exam setup for one paper. One page, no confirm step: the start button links
 * straight to the exam. `?chapter=` preselects a chapter, else the paper's next-step chapter.
 */
export default async function CustomExamPage({ params, searchParams }: PageProps<"/[lang]/superprep/[id]/custom">) {
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
            {params.then(({ id }) => (
              <SetupBody id={id} ctx={ctx} searchParams={searchParams} lang={lang} t={t} />
            ))}
          </Reveal>
        </SectionErrorBoundary>
      </main>
      </PageMotion>
    </>
  );
}

async function SetupBody({ id, ctx, searchParams, lang, t }: { id: string; ctx: Promise<DataContext>; searchParams: Promise<SearchParams>; lang: Locale; t: Dictionary }) {
  const [c, query] = await Promise.all([ctx, searchParams]);
  const sp = await getSuperPrep(c);
  const subject = sp.subjects.find((s) => s.id === id);
  if (!subject) notFound();

  const asked = typeof query.chapter === "string" ? query.chapter : undefined;
  const next = subject.next.kind === "continue" || subject.next.kind === "start" ? subject.next.chapter.id : undefined;
  const preselect = [asked, next, subject.chapters[0]?.id].find((x) => x && subject.chapters.some((ch) => ch.id === x));

  return (
    <div className="grid grid-cols-1 gap-5">
      <Breadcrumb
        label={t.courseHome.crumbs}
        items={[
          { label: t.nav.dashboard, href: `/${lang}` },
          { label: t.superprepPage.title, href: prepHref(lang, query) },
          { label: subject.name, href: prepHref(lang, query, id) },
          { label: t.exam.custom },
        ]}
      />
      <header className="grid gap-1">
        <h1 className="type-headline">{t.exam.custom}</h1>
        <p className="text-muted">
          {subject.name} · {t.exam.customLead}
        </p>
      </header>
      <CustomSetup
        lang={lang}
        now={c.now}
        chapters={subject.chapters
          .filter((ch) => ch.questions > 0)
          .map((ch) => ({ id: ch.id, number: ch.number, title: ch.title, counts: { new: ch.remaining, wrong: ch.wrong, correct: ch.correct } }))}
        preselect={preselect ? [preselect] : []}
        examPath={`/${lang}/superprep/${id}/exam`}
        keep={keepQuery(query).toString()}
        chapterLabel={t.superprepPage.chapter}
        t={t.exam}
      />
    </div>
  );
}
