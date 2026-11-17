import { Play } from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { Cover } from "@/design-system/molecules/course-cover";
import { ProgressRing } from "@/design-system/atoms/progress";
import { Badge } from "@/design-system/atoms/badge";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Course, SubjectGroup } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { courseMorph } from "@/lib/motion";

type Props = {
  course: Course;
  groups: SubjectGroup[];
  resume: SubjectGroup["continue"];
  /** The jump-link tabs sit flush under the hero, so its bottom corners are square. */
  attached: boolean;
  lang: Locale;
  fmt: Formatter;
  t: Dictionary;
};

/**
 * The course's identity: a compact card on a green mesh with a dot texture, so it reads
 * as "inside a course", never the dashboard. Live classes are in the routine section
 * below; the card only offers "continue" (or "start").
 */
export function CourseHero({ course, groups, resume, attached, lang, fmt, t }: Props) {
  const c = t.courseHome;
  const pct = fmt.percent(course.progress);
  const subjects = course.subjectCount ?? (groups.length || undefined);
  const facts = [
    course.batchType && t.batchType[course.batchType],
    subjects && fill(c.subjectCount, { n: fmt.number(subjects) }),
  ].filter((f): f is string => Boolean(f));

  const firstPaper = groups.flatMap((g) => g.subjects)[0];
  const action = resume
    ? { href: resume.paperId ? `/${lang}/subject/${resume.paperId}?resume=1` : resume.url, label: t.common.continue, detail: `${c.resume}: ${resume.title}` }
    : firstPaper
      ? { href: `/${lang}/subject/${firstPaper.id}`, label: c.start, detail: c.startHint }
      : null;

  return (
    <section
      aria-labelledby="course-title"
      className={cn("relative isolate overflow-hidden text-on-hero", attached ? "rounded-t-lg" : "rounded-lg")}
      style={{ backgroundImage: "var(--hero-mesh)", backgroundColor: "var(--color-hero)" }}
    >
      {/* Texture: dots that fade out toward the title, so the text sits on a clean surface. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_left,black_10%,transparent_75%)]"
        style={{ background: "var(--hero-dots)" }}
      />
      <div className="flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
        {/* The dashboard's course cover lands here (hidden on phones, where it simply cross-fades). */}
        <ViewTransition name={courseMorph(course.id)} share="course" default="none">
          <Cover course={course} className="hidden w-28 ring-on-hero/25 sm:grid md:w-32" />
        </ViewTransition>
        <div className="grid min-w-0 flex-1 justify-items-start gap-2">
          <h1 id="course-title" className="line-clamp-2 text-lg leading-snug font-bold tracking-tight sm:text-xl">
            {course.title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            {facts.map((f) => (
              <Badge key={f} tone="onHero" size="sm" className="px-2.5">
                {f}
              </Badge>
            ))}
            {action && (
              <Link
                href={action.href}
                title={action.detail}
                aria-label={`${action.label}: ${action.detail}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-on-hero px-3.5 text-sm font-semibold text-hero shadow-raised transition-transform hover:scale-[1.03]"
              >
                <Play className="size-3.5 fill-current" aria-hidden />
                {action.label}
              </Link>
            )}
          </div>
        </div>
        <ProgressRing value={course.progress} size={60} stroke={6} tone="hero" label={fill(c.progress, { pct })} className="shrink-0">
          <span className="text-xs font-bold tabular-nums">{pct}</span>
        </ProgressRing>
      </div>
    </section>
  );
}
