import "katex/dist/katex.min.css";
import { BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { ExamHall } from "@/components/exam/exam-hall";
import { PracticeRunner } from "@/components/exam/practice-runner";
import type { ExamQuestion } from "@/components/exam/types";
import { ExitControl, FocusBar } from "@/components/exam/chrome";
import { BOOK_COLOR } from "@/design-system/foundations/book";
import { customHref, examHref, prepHref } from "@/lib/superprep-links";
import { Button } from "@/design-system/atoms/button";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getQuestionSet, parseSetQuery, timeLimit, type DataContext } from "@/lib/api";
import { createFormatter, fill } from "@/lib/format";
import { richText } from "@/lib/rich-text";

type SearchParams = Record<string, string | string[] | undefined>;

/*
 * A SuperPrep set in focus mode: no site header, just the set. Which questions comes from
 * the URL (`?chapters=&types=&count=&skip=&ids=&mode=`, see `question-set.ts`), so every
 * entry point (chapter row, next step, redo mistakes, custom setup, result) is a plain link.
 * Maths is typeset here on the server; KaTeX's CSS loads only on this route.
 */
export default async function ExamPage({ params, searchParams }: PageProps<"/[lang]/superprep/[id]/exam">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <PageMotion>
    <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
      <Reveal fallback={<ExamSkeleton label={t.common.loading} />}>
        {params.then(({ id }) => (
          <ExamBody id={id} ctx={ctx} searchParams={searchParams} lang={lang} t={t} />
        ))}
      </Reveal>
    </SectionErrorBoundary>
    </PageMotion>
  );
}

async function ExamBody({ id, ctx, searchParams, lang, t }: { id: string; ctx: Promise<DataContext>; searchParams: Promise<SearchParams>; lang: Locale; t: Dictionary }) {
  const [c, query] = await Promise.all([ctx, searchParams]);
  const set = parseSetQuery(query);
  const data = await getQuestionSet(c, id, set);
  if (!data) notFound();
  const fmt = createFormatter(lang, c.now);
  const e = t.exam;
  const backHref = prepHref(lang, query, id);

  if (data.questions.length === 0) {
    return (
      <div className="min-h-dvh">
        <FocusBar back={<ExitControl href={backHref} warn={false} label={e.backToPaper} t={e} />} subjectName={t.superprepPage.title} title={data.subject.name} />
        <main className="mx-auto grid max-w-reading gap-4 px-4 py-16">
          <EmptyState
            icon={BookOpen}
            title={`${e.emptySet} ${e.emptyHint}`}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button href={customHref(lang, query, id)}>{e.emptyCustom}</Button>
                <Button href={backHref} variant="secondary">
                  {fill(e.backTo, { name: data.subject.name })}
                </Button>
              </div>
            }
          />
        </main>
      </div>
    );
  }

  const byId = new Map(data.subject.chapters.map((ch) => [ch.id, ch]));
  const label = (chapterId: string) => fill(t.superprepPage.chapter, { n: fmt.number(byId.get(chapterId)?.number ?? 0) });
  const only = data.chapters.length === 1 ? data.chapters[0] : null;
  const title = set.ids.length
    ? e.setRedo
    : set.mode === "exam" && !only
      ? `${e.custom} · ${fill(e.setChapters, { n: fmt.number(data.chapters.length) })}`
      : set.types.length === 1 && set.types[0] === "wrong" && set.chapters.length === 0
        ? e.setMistakes
        : only
          ? fill(e.setChapter, { n: fmt.number(only.number), title: only.title })
          : fill(e.setChapters, { n: fmt.number(data.chapters.length) });

  const questions: ExamQuestion[] = data.questions.map((q) => ({
    id: q.id,
    chapter: label(q.chapterId),
    html: richText(q.text),
    options: q.options.map(richText),
    answer: q.answer,
    explanation: q.explanation ? richText(q.explanation) : null,
    // Formulas count as a few characters each; anything longer gets a full-width row.
    short: q.options.every((o) => o.replace(/\$[^$]*\$/g, "xxxx").length <= 28),
  }));

  const common = {
    // A new set (next set, redo) starts fresh.
    key: questions.map((q) => q.id).join(),
    lang,
    now: c.now,
    t: e,
    subjectName: data.subject.name,
    title,
    questions,
    backHref,
    nextHref: data.more ? examHref(lang, query, id, { ...set, ids: [], skip: set.skip + set.count }) : null,
    // Redo keeps the same mode and exam rules.
    redoBase: examHref(lang, query, id, { mode: set.mode, time: set.time, negative: set.negative, strict: set.strict }),
    before: data.before,
  };

  if (set.mode === "practice") {
    const { key, ...props } = common;
    return <PracticeRunner key={key} {...props} accent={BOOK_COLOR[data.subject.family]} />;
  }
  const { key, ...props } = common;
  return <ExamHall key={key} {...props} rules={{ limit: timeLimit(set, questions.length), negative: set.negative, strict: set.strict }} />;
}

function ExamSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="mx-auto grid max-w-wide gap-6 px-4 py-6 sm:px-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <Skeleton radius="lg" className="h-[28rem]" />
        <Skeleton radius="lg" className="hidden h-72 lg:block" />
      </div>
    </SkeletonGroup>
  );
}
