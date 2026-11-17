import { ArrowUpRight, ChevronDown, ChevronRight, ClipboardCheck, Folder } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Button } from "@/design-system/atoms/button";
import { FacebookMark } from "@/design-system/atoms/facebook-mark";
import { ProgressBar, ProgressRing } from "@/design-system/atoms/progress";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import { BookFace } from "@/design-system/atoms/book-face";
import { BOOK_COLOR, ICON_FAMILY } from "@/design-system/foundations/book";
import { subjectIcons } from "@/design-system/foundations/subject-icons";
import type { SubjectCard as Group } from "@/lib/api";
import { paperLabel } from "@/lib/describe";
import { fill, type Formatter } from "@/lib/format";
import { subjectMorph } from "@/lib/motion";
import { ResumeStrip } from "@/design-system/molecules/resume-strip";
import { accordionName } from "@/design-system/molecules/subject-accordion/accordion-name";
import { Morph } from "@/design-system/motion/motion";

/*
 * A resume strip first (the single most likely next action), then three tiers
 * ordered by how often a student needs them. Only tier 1 gets card treatment;
 * everything else is flat, so the subject cards are where the eye lands.
 *  1. Subjects (paper-wise progress) — what they open on almost every visit.
 *  2. Exams — recurring but scheduled, so one compact row.
 *  3. Other resources — occasional; collapsed behind a disclosure that previews its contents.
 */
/** `instance`: one of several copies on a page (style guide): its own accordion group, no morphs. */
export function SubjectGroup({ group, open, fmt, t, instance }: { group: Group; open: boolean; fmt: Formatter; t: Dictionary; instance?: string }) {
  const exams = group.folders.filter((f) => f.kind === "exam");
  const resources = group.folders.filter((f) => f.kind === "resource");
  const empty = group.subjects.length === 0 && group.folders.length === 0;
  const groupIcon = group.icon ?? group.subjects[0]?.icon ?? "book";
  const GroupIcon = subjectIcons[groupIcon];
  // The subject's book colour, the same as on its books (library, course home).
  const groupColor = BOOK_COLOR[ICON_FAMILY[groupIcon]];
  const average =
    group.subjects.length > 0 ? group.subjects.reduce((sum, s) => sum + s.progress, 0) / group.subjects.length : null;

  return (
    <Card as="details" name={accordionName(instance)} data-subject={group.id} radius="md" open={open} className="group/acc overflow-hidden transition-[border-color,box-shadow] open:border-border-strong has-[>summary:focus-visible]:border-brand has-[>summary:focus-visible]:ring-3 has-[>summary:focus-visible]:ring-brand/20">
      <summary className="flex select-none cursor-pointer list-none outline-none items-center gap-3 px-4 py-3.5 transition-colors hover:bg-raised group-open/acc:bg-raised [&::-webkit-details-marker]:hidden">
        {/* Open: the tile fills with the subject's colour and the icon turns white, so the open subject stands out. */}
        <span
          className="grid size-10 shrink-0 place-items-center rounded-md bg-surface text-(--group-color) ring-1 ring-border transition-colors group-open/acc:bg-(--group-color) group-open/acc:text-on-fill group-open/acc:ring-transparent"
          style={{ "--group-color": groupColor } as CSSProperties}
        >
          <GroupIcon className="size-5" aria-hidden />
        </span>
        {/* Subject first so rows are told apart by their first word; the batch is secondary. */}
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-base font-semibold sm:text-lg">{group.subject ?? group.title}</span>
          {group.subject && group.batch && <span className="truncate text-xs text-subtle sm:text-sm">{group.batch}</span>}
        </span>
        {average !== null && (
          <span className="flex shrink-0 items-center gap-1.5">
            <ProgressRing
              value={average}
              size={22}
              stroke={3}
              color={groupColor}
              label={fill(t.subjects.average, { pct: fmt.percent(average) })}
            />
            {/* On phones the ring alone carries it, so the subject name keeps its room. */}
            <span className="hidden text-sm font-semibold tabular-nums sm:inline" aria-hidden>
              {fmt.percent(average)}
            </span>
          </span>
        )}
        <ChevronDown className="size-5 shrink-0 text-subtle transition-transform group-open/acc:rotate-180" aria-hidden />
      </summary>

      {/* The divider is the content's top edge, not the header's bottom: it arrives with the content, so the header never grows by a pixel on opening. */}
      <div className="grid grid-cols-1 gap-6 border-t border-border p-4 sm:p-5">
        {empty && <p className="text-sm text-muted">{t.subjects.groupEmpty}</p>}

        {/* Resume — where the student stopped last time */}
        {group.continue && (
          <ResumeStrip
            href={group.continue.url}
            type={group.continue.type}
            label={t.subjects.resume}
            title={group.continue.title}
            action={t.common.continue}
          />
        )}

        {/* Tier 1 — subjects */}
        {group.subjects.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
            {group.subjects.map((s) => {
              const read = fill(t.subjects.read, { pct: fmt.percent(s.progress) });
              // "১ম পত্র" even when the paper's name differs from the group's ("উচ্চতর গণিত ১ম পত্র" under "হায়ার ম্যাথ").
              const label = paperLabel(s.name, group.subject);
              const short = label === s.name ? null : label;
              return (
                <li key={s.id} className="min-w-0">
                  {/* Opens the paper's syllabus page (`/[lang]/subject/[id]`). */}
                  <Morph name={instance ? undefined : subjectMorph(s.id)} share="subject">
                  <Link
                    href={`/${fmt.locale}/subject/${s.id}`}
                    className="group/card flex items-center gap-4 rounded-lg border border-border p-3 press lift hover:border-border-strong hover:shadow-raised sm:p-4"
                    // A wash of the book's own colour, the same direction as the shared subject gradient.
                    style={{ backgroundImage: `linear-gradient(-60deg, var(--color-surface) 0%, color-mix(in oklab, ${BOOK_COLOR[ICON_FAMILY[s.icon]]} 9%, var(--color-surface)) 100%)` }}
                  >
                    {/* The paper as the same book it is on the library shelf; it tilts open on hover. */}
                    <span className="w-14 shrink-0 sm:w-16">
                      <BookFace
                        family={ICON_FAMILY[s.icon]}
                        mark={subjectIcons[s.icon]}
                        markClassName="right-0.5 bottom-1 size-8"
                        className="group-hover/card:[transform:rotateY(-14deg)] group-focus-visible/card:[transform:rotateY(-14deg)] motion-reduce:group-hover/card:transform-none"
                      >
                        <span className="relative p-1.5 pl-2.5 text-xs leading-tight font-bold sm:text-sm">
                          {short ? (
                            <>
                              {/* Out of context (e.g. a screen reader's link list) "১ম পত্র" alone is ambiguous. */}
                              <span className="sr-only">{group.subject} </span>
                              {short}
                            </>
                          ) : (
                            s.name
                          )}
                        </span>
                      </BookFace>
                    </span>
                    {/* Beside the book, where the student is in it (the cover already names the paper). */}
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-subtle">
                          {s.chapter ? fill(t.subjects.chapterNo, { n: fmt.number(s.chapter.number) }) : (group.subject ?? group.title)}
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-subtle opacity-0 transition-[opacity,transform] group-hover/card:translate-x-0.5 group-hover/card:opacity-100 group-focus-visible/card:opacity-100"
                          aria-hidden
                        />
                      </span>
                      <span className="line-clamp-2 type-subtitle">{s.chapter?.title ?? s.name}</span>
                      <span className="mt-1.5 flex items-center gap-3">
                        <ProgressBar value={s.progress} color={BOOK_COLOR[ICON_FAMILY[s.icon]]} label={`${s.name}: ${read}`} className="flex-1" />
                        <span className="shrink-0 text-sm font-semibold tabular-nums" aria-hidden>
                          {fmt.percent(s.progress)}
                        </span>
                      </span>
                    </span>
                  </Link>
                  </Morph>
                </li>
              );
            })}
          </ul>
        )}

        {/* Tier 2 — exams */}
        {exams.length > 0 && (
          <section aria-label={t.subjects.exams} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-xs font-semibold tracking-wide text-subtle">{t.subjects.exams}</h3>
            <ul className="-mx-1 flex flex-wrap gap-1">
              {exams.map((f) => (
                <li key={f.id} className="min-w-0">
                  <a
                    href={f.url}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors hover:bg-highlight-soft"
                  >
                    <ClipboardCheck className="size-4 shrink-0 text-highlight" aria-hidden />
                    <span className="truncate">{f.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tier 3 — other resources, collapsed by default */}
        {resources.length > 0 && (
          <details className="group/res -mx-2">
            <summary className="flex select-none min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-md px-2 text-sm transition-colors hover:bg-raised [&::-webkit-details-marker]:hidden">
              <Folder className="size-4 shrink-0 text-subject" aria-hidden />
              <span className="shrink-0 font-medium">{t.subjects.resources}</span>
              <span className="shrink-0 text-subtle">· {fill(t.subjects.resourcesCount, { count: fmt.number(resources.length) })}</span>
              {/* Preview of what's inside, so students know whether to open it */}
              <span className="hidden min-w-0 flex-1 truncate text-subtle group-open/res:invisible sm:block" aria-hidden>
                {resources.map((f) => f.label).join(", ")}
              </span>
              <ChevronDown className="ml-auto size-4 shrink-0 text-subtle transition-transform group-open/res:rotate-180" aria-hidden />
            </summary>
            <ul className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3">
              {resources.map((f) => (
                <li key={f.id} className="min-w-0">
                  <a
                    href={f.url}
                    className="flex min-h-11 items-center gap-2 rounded-md px-2 py-2 text-sm text-muted transition-colors hover:bg-raised hover:text-text"
                  >
                    <Folder className="size-4 shrink-0 text-subtle" aria-hidden />
                    <span className="line-clamp-2 min-w-0 flex-1">{f.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex justify-end border-t border-border pt-4">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" href={group.courseId ? `/${fmt.locale}/course/${group.courseId}` : group.courseHomeUrl}>
              {t.common.courseHome}
            </Button>
            {group.communityUrl && (
              <Button variant="secondary" size="sm" href={group.communityUrl} target="_blank" rel="noopener noreferrer" className="text-info">
                <FacebookMark className="size-4" />
                {t.common.community}
                <ArrowUpRight className="-mr-1 size-4 opacity-70" aria-hidden />
                <span className="sr-only">{t.common.newTab}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
