import { ArrowRight, Check, ChevronRight, ClipboardList, Trophy } from "lucide-react";
import { chapterSetSize, nextHref } from "@/lib/superprep-links";
import { SuperPrepMark } from "@/design-system/atoms/superprep-mark";
import { MiniBook, MiniShelf } from "@/design-system/molecules/mini-shelf";
import { SuperPrepRing } from "@/design-system/atoms/superprep-ring";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { Badge } from "@/design-system/atoms/badge";
import type { PrepSubject, SuperPrepView } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** What the ring means, beside it: syllabus, the target (only if one is set), chapters done. */
function Summary({ done, target, chapters, fmt, t }: { done: number; target: number; chapters: [number, number]; fmt: Formatter; t: Dictionary }) {
  const reached = target > 0 && done >= target;
  return (
    <div className="grid min-w-0 gap-1">
      <p className="text-sm text-muted">{t.superprep.syllabus}</p>
      {target > 0 &&
        (reached ? (
          <p className="flex items-center gap-1.5 font-semibold text-success">
            <Trophy className="size-4 shrink-0" aria-hidden />
            {t.superprep.reached}
          </p>
        ) : (
          <p className="leading-snug">
            <span className="font-semibold">{fill(t.superprep.targetLine, { pct: fmt.percent(target) })}</span>
            <br />
            <span className="text-sm text-muted">{fill(t.superprep.left, { pct: fmt.percent(target - done) })}</span>
          </p>
        ))}
      {chapters[1] > 0 && (
        <p className="text-sm text-subtle tabular-nums">
          {fill(t.superprepPage.chaptersDone, { done: fmt.number(chapters[0]), total: fmt.number(chapters[1]) })}
        </p>
      )}
    </div>
  );
}

/**
 * The next test: the paper's closed book beside which chapter and how many questions, and a
 * button straight into it. The same step the hub's top strip offers (`buildSuperPrep`'s focus).
 * The book opens the paper (it morphs into the open book); the button starts the test.
 */
function NextTest({ subject, lang, fmt, t, morph }: { subject: PrepSubject; lang: Locale; fmt: Formatter; t: Dictionary; morph: boolean }) {
  const p = t.superprepPage;
  const next = subject.next;
  const startable = next.kind === "continue" || next.kind === "start";
  return (
    <div className="grid gap-4 rounded-md bg-surface/80 p-4 shadow-raised ring-1 ring-border ring-inset backdrop-blur-sm">
      <div className="flex min-w-0 gap-4">
        <MiniBook subject={subject} lang={lang} t={t} morph={morph} />
        <div className="grid min-w-0 content-start gap-0.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-superprep-ink">
            <ClipboardList className="size-3.5 shrink-0" aria-hidden />
            {t.superprep.nextTest}
          </p>
          <p className="truncate text-sm text-muted">
            {subject.name}
            {startable && ` · ${fill(p.chapter, { n: fmt.number(next.chapter.number) })}`}
          </p>
          <p className="line-clamp-2 font-bold leading-snug">
            {startable ? next.chapter.title : next.kind === "mistakes" ? fill(p.redoHint, { n: fmt.number(next.count) }) : p.finishedNext}
          </p>
          {startable && <p className="text-sm text-subtle tabular-nums">{fill(p.questions, { n: fmt.number(chapterSetSize(next.chapter)) })}</p>}
        </div>
      </div>
      <Button href={nextHref(lang, {}, subject)} className="w-full">
        {startable ? t.superprep.takeTest : next.kind === "mistakes" ? p.redo : p.custom}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

/*
 * Two states:
 *  - not started: an invitation (what's inside + "শুরু করো"), no rows of zeros;
 *  - in progress: three parts, each with one job: the ring (how far), the hub's shelf in miniature
 *    (what's inside: every paper as a spine, with questions and accuracy in one line under it), and
 *    the next test with its book and a button straight into it.
 * The look comes from the inner pages' materials (cloth spines, covers, ribbon) and the logo's
 * colours: a 1px "Super" gradient edge and a peach-and-violet glow.
 * Numbers are derived from per-chapter answers (`superprep.ts`), the same ones the hub shows.
 * The hub is the header link once started (and each spine opens its paper), the main button before.
 */
/**
 * `instance`: one of several copies on a page (style guide), so the book doesn't morph.
 * `startHref`: CT124 (lab `segment-home` v31): where "শুরু করো" goes before it's started; the segment page sends a guest to the login first.
 * `tagline`, `contents`: CT125 (v32): the not-started card's line under the logo and its count line, in the segment page's own words.
 */
export function SuperPrepCard({
  sp,
  fmt,
  lang,
  t,
  instance,
  startHref,
  tagline,
  contents,
  features,
}: {
  sp: SuperPrepView;
  fmt: Formatter;
  lang: Locale;
  t: Dictionary;
  instance?: string;
  startHref?: string;
  tagline?: string;
  contents?: string;
  /** CT152 (lab `segment-home` v51): for a guest, what's inside as a short list instead of a 0% ring and "এখনো শুরু করোনি". */
  features?: string[];
}) {
  const s = sp.totals;
  const subjects = sp.subjects.length;
  const started = sp.started;

  const ringLabel = [
    `${t.superprep.syllabus} ${fmt.percent(s.pct)}`,
    sp.targetPct > 0 && fill(t.superprep.targetLine, { pct: fmt.percent(sp.targetPct) }),
  ]
    .filter(Boolean)
    .join(", ");

  // The "Super" gradient shows through a transparent border as a 1px edge (`--bg-superprep-card`).
  return (
    <Card aria-labelledby="superprep-title" className="grid gap-5 p-5" style={{ borderColor: "transparent", background: "var(--bg-superprep-card)" }}>
      <header className="grid gap-1">
        <div className="flex items-center gap-2">
          <SuperPrepMark as="h2" id="superprep-title" className="text-2xl leading-7" />
          {/* Marketing bits are for students who haven't started yet. */}
          {!started && sp.isNew && (
            <Badge tone="new" size="sm">
              {t.common.new}
            </Badge>
          )}
          {started && (
            <Button variant="ghost" size="sm" href={`/${lang}/superprep`} className="-mr-2 ml-auto">
              {t.superprep.allSubjects}
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
        {!started && <p className="text-sm text-muted">{tagline ?? fill(t.superprep.tagline, { n: fmt.number(sp.learners) })}</p>}
      </header>

      {started ? (
        <>
          <div className="flex items-center gap-4">
            <SuperPrepRing done={s.pct} target={sp.targetPct} label={ringLabel} value={fmt.percent(s.pct)} />
            <Summary done={s.pct} target={sp.targetPct} chapters={[s.chaptersDone, s.chaptersTotal]} fmt={fmt} t={t} />
          </div>

          <div className="grid gap-2.5">
            <MiniShelf subjects={sp.subjects} lastId={sp.last?.id ?? null} lang={lang} fmt={fmt} t={t} />
            {/* Questions and accuracy in one line under the shelf. */}
            <p className="text-sm text-muted tabular-nums">
              {[
                fill(t.superprepPage.progress, { done: fmt.number(s.answered), total: fmt.number(s.questions) }),
                s.accuracy !== null && fill(t.superprepPage.accuracy, { pct: fmt.percent(s.accuracy) }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </>
      ) : features ? (
        <ul className="grid gap-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check className="mt-0.5 size-4 shrink-0 text-superprep-ink" strokeWidth={2.5} aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-4">
          <SuperPrepRing done={0} label={`${t.superprep.syllabus} ${fmt.percent(0)}`} value={fmt.percent(0)} muted />
          <div className="grid min-w-0 gap-1">
            <p className="font-semibold">{t.superprep.notStarted}</p>
            {s.chaptersTotal > 0 && (
              <p className="text-sm leading-snug text-muted">
                {contents ??
                  fill(t.superprep.contents, {
                    subjects: fmt.number(subjects),
                    chapters: fmt.number(s.chaptersTotal),
                    questions: fmt.number(s.questions),
                  })}
              </p>
            )}
          </div>
        </div>
      )}

      {started && sp.focus ? (
        <NextTest subject={sp.focus} lang={lang} fmt={fmt} t={t} morph={!instance} />
      ) : (
        <Button href={started ? `/${lang}/superprep` : (startHref ?? `/${lang}/superprep`)} className="w-full">
          {started ? t.common.continue : t.superprep.start}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </Card>
  );
}
