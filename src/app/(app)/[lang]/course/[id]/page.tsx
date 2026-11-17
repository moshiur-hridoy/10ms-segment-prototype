import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { CourseHero } from "@/components/course/course-hero";
import { CourseSkeleton } from "@/components/course/course-skeleton";
import { CourseFolders } from "@/components/course/course-folders";
import { CourseRoutine } from "@/components/course/course-routine";
import { CourseSide } from "@/components/course/course-side";
import { CourseSubjects } from "@/components/course/course-subjects";
import { JumpLinks } from "@/components/course/jump-links";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getCourseHome, getSuperPrep, type DataContext } from "@/lib/api";
import { createFormatter } from "@/lib/format";

/*
 * Course home: everything about one enrolled course (its subjects, its own routine,
 * exams and resources). Opened from a course card or a subject group's "কোর্স হোম".
 * Breadcrumb, a tinted hero and "কোর্স ও বইসমূহ" active in the header keep it from
 * reading as the dashboard.
 */
export default async function CoursePage({ params, searchParams }: PageProps<"/[lang]/course/[id]">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <>
      <DashboardHeader ctx={ctx} lang={lang} t={t} current="courses" />
      <PageMotion>
      <main className="mx-auto max-w-page px-4 py-6 sm:px-6">
        <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
          <Reveal fallback={<CourseSkeleton label={t.common.loading} />}>
            {params.then(({ id }) => (
              <CourseBody id={id} ctx={ctx} lang={lang} t={t} />
            ))}
          </Reveal>
        </SectionErrorBoundary>
      </main>
      </PageMotion>
    </>
  );
}

async function CourseBody({ id, ctx, lang, t }: { id: string; ctx: Promise<DataContext>; lang: Locale; t: Dictionary }) {
  const c = await ctx;
  // SuperPrep failing to load only hides its side card, never the course page.
  const [home, sp] = await Promise.all([getCourseHome(c, id), getSuperPrep(c).catch(() => null)]);
  if (!home) notFound();
  const fmt = createFormatter(lang, c.now);
  const h = t.courseHome;

  const sections = [
    { id: "course-routine", label: h.routineShort },
    { id: "course-subjects", label: h.subjects },
    home.exams.length > 0 && { id: "course-exams", label: h.exams },
    home.resources.length > 0 && { id: "course-resources", label: h.resources },
  ].filter((s): s is { id: string; label: string } => Boolean(s));

  return (
    <div className="grid grid-cols-1 gap-5">
      <Breadcrumb
        label={h.crumbs}
        // The hero names the course; repeating it here was a second copy of the title.
        items={[
          { label: t.nav.dashboard, href: `/${lang}` },
          { label: t.nav.courses, href: `/${lang}/library` },
        ]}
      />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* The hero spans the main column only, so the side cards line up with its top. */}
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <CourseHero
            course={home.course}
            groups={home.groups}
            resume={home.resume}
            attached={sections.length >= 2}
            lang={lang}
            fmt={fmt}
            t={t}
          />
          {/* A direct child of the (tall) main column so it sticks while scrolling; -mt cancels the gap to sit flush under the hero. */}
          <JumpLinks items={sections} label={h.jump} className="-mt-6" />
          {/* Routine first: a live class or today's class is the most time-sensitive thing in a course. */}
          <CourseRoutine items={home.routine.items} more={home.routine.more} missed={home.routine.missed} routineHref={`/${lang}/routine?course=${id}`} fmt={fmt} t={t} />
          <CourseSubjects groups={home.groups} lang={lang} t={t} />
          <CourseFolders id="course-exams" title={h.exams} rows={home.exams} />
          <CourseFolders id="course-resources" title={h.resources} rows={home.resources} />
        </div>
        <CourseSide
          superprepHref={sp ? `/${lang}/superprep` : null}
          communityUrl={home.communityUrl}
          academic={home.course.category === "academic"}
          subjects={home.groups.map((g) => g.subject ?? g.title)}
          chapters={home.chapters}
          reportHref={`/${lang}/report?course=${home.course.id}`}
          t={t}
        />
      </div>
    </div>
  );
}
