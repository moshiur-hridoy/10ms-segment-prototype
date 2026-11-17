import Link from "next/link";
import { Award, ChevronRight, CircleCheck, Compass } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { ProgressRing } from "@/design-system/atoms/progress";
import { EmptyState } from "@/design-system/molecules/empty-state";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Category, CategoryCounts, DataOf } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { courseMorph } from "@/lib/motion";
import { Morph } from "@/design-system/motion/motion";
import { CategoryFilter } from "@/design-system/molecules/category-filter";
import { Cover } from "@/design-system/molecules/course-cover";

type Course = DataOf<"courses">["enrolled"][number];

/** The category filter only earns its space once the list is long. */
const FILTER_FROM = 5;

/*
 * "My library". The subjects section above answers "what do I study today?";
 * this one answers "what have I enrolled in, and where do I pick up?":
 *   in progress → rows with progress, most recently used first
 *   not started → compact tiles that invite a start (never a 0% bar)
 * The whole row/tile opens the course home; there is no second button.
 */
export function CoursesCard({ courses, active, notStarted, counts, fmt, t, instance }: { courses: Course[]; active: Course[]; notStarted: Course[]; counts: CategoryCounts; fmt: Formatter; t: Dictionary; instance?: string }) {
  const title = (
    <h2 id="courses-title" className="type-title">
      {t.courses.title}
    </h2>
  );

  /** "৪টি" per filter, computed here because the filter runs on the client. */
  const countsFor = (list: Course[]) => {
    const n = (cat?: Category) => fill(t.courses.count, { n: fmt.number(cat ? list.filter((x) => x.category === cat).length : list.length) });
    return { all: n(), academic: n("academic"), english: n("english"), skills: n("skills") };
  };

  return (
    <Card aria-labelledby="courses-title" className="grid grid-cols-1 gap-5 p-5 sm:p-6">
      {courses.length === 0 ? (
        <>
          {title}
          <EmptyState
            icon={Compass}
            title={t.courses.empty}
            action={
              <Button size="sm" href="#">
                {t.courses.explore}
              </Button>
            }
          />
        </>
      ) : (
        <CategoryFilter
          title={title}
          label={t.courses.filterLabel}
          filterable={courses.length >= FILTER_FROM}
          labels={{
            all: t.common.all,
            academic: `${t.common.academic} (${fmt.number(counts.academic)})`,
            english: `${t.common.english} (${fmt.number(counts.english)})`,
            skills: `${t.common.skills} (${fmt.number(counts.skills)})`,
          }}
          groups={[
            { id: "active", label: t.courses.active, className: "grid grid-cols-1 gap-1" },
            { id: "notStarted", label: t.courses.notStarted, counts: countsFor(notStarted), className: "grid grid-cols-1 gap-1 sm:grid-cols-2" },
          ]}
          items={[
            ...active.map((course) => ({
              id: course.id,
              category: course.category,
              group: "active",
              node: <ActiveRow course={course} fmt={fmt} t={t} morph={!instance} />,
            })),
            ...notStarted.map((course) => ({
              id: course.id,
              category: course.category,
              group: "notStarted",
              node: <StartTile course={course} fmt={fmt} t={t} morph={!instance} />,
            })),
          ]}
        />
      )}
    </Card>
  );
}

/** Course cards open the course home. */
const courseHref = (course: Course, fmt: Formatter) => `/${fmt.locale}/course/${course.id}`;

function ActiveRow({ course, fmt, t, morph }: { course: Course; fmt: Formatter; t: Dictionary; morph: boolean }) {
  const done = course.progress >= 100;
  const pct = fmt.percent(course.progress);
  return (
    <Link href={courseHref(course, fmt)} className="-mx-2 flex items-center gap-3 rounded-md p-2 press hover:bg-raised sm:gap-4">
      {/* The cover grows into the course home's hero (share="course"). */}
      <Morph name={morph ? courseMorph(course.id) : undefined} share="course">
        <Cover course={course} className="w-20 sm:w-28" />
      </Morph>
      <div className="grid min-w-0 flex-1 gap-1">
        <h3 className="line-clamp-2 leading-snug font-semibold">{course.title}</h3>
        <Meta course={course} fmt={fmt} t={t} />
      </div>
      {done ? (
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-success">
          <CircleCheck className="size-5" aria-hidden />
          <span className="hidden sm:inline">{t.courses.done}</span>
          <span className="sr-only sm:hidden">{t.courses.done}</span>
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5">
          <ProgressRing value={course.progress} size={22} stroke={3} tone="subject" label={fill(t.courses.complete, { pct })} />
          <span className="text-sm font-semibold tabular-nums text-subject-text" aria-hidden>
            {pct}
          </span>
        </span>
      )}
    </Link>
  );
}

function StartTile({ course, fmt, t, morph }: { course: Course; fmt: Formatter; t: Dictionary; morph: boolean }) {
  return (
    <Link href={courseHref(course, fmt)} className="group -mx-2 flex items-center gap-3 rounded-md p-2 press hover:bg-raised">
      <Morph name={morph ? courseMorph(course.id) : undefined} share="course">
        <Cover course={course} className="w-20" />
      </Morph>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">{course.title}</h3>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <span className="inline-flex items-center gap-0.5 font-semibold text-brand-text">
            {t.courses.startCta}
            <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
          {course.badges && <BadgeCount badges={course.badges} fmt={fmt} t={t} />}
        </span>
      </div>
    </Link>
  );
}

/** Batch type · subject count · badges. Each part only when the data has it. */
function Meta({ course, fmt, t }: { course: Course; fmt: Formatter; t: Dictionary }) {
  const parts = [
    course.batchType && t.batchType[course.batchType],
    course.subjectCount && fill(t.courses.subjectCount, { n: fmt.number(course.subjectCount) }),
  ].filter(Boolean) as string[];
  if (parts.length === 0 && !course.badges) return null;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-subtle">
      {parts.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>·</span>}
          {p}
        </span>
      ))}
      {course.badges && (
        <>
          {parts.length > 0 && <span aria-hidden>·</span>}
          <BadgeCount badges={course.badges} fmt={fmt} t={t} />
        </>
      )}
    </span>
  );
}

function BadgeCount({ badges, fmt, t }: { badges: { earned: number; total: number }; fmt: Formatter; t: Dictionary }) {
  return (
    <span className="inline-flex items-center gap-1 text-subtle">
      <Award className="size-3.5 text-subject" aria-hidden />
      {fill(t.courses.badges, { earned: fmt.number(badges.earned), total: fmt.number(badges.total) })}
    </span>
  );
}
