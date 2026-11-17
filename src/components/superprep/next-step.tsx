import { ArrowRight, PartyPopper } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PrepSubject } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { keepQuery, nextHref } from "@/lib/superprep-links";
import { SetPicker, type PickerLabels } from "./set-picker";

/**
 * The single main action of a SuperPrep page, worked out from the data: continue the last
 * chapter, start the next one, redo mistakes, or (all done) a custom exam.
 * `showSubject` names the paper too, for the hub.
 */
export function NextStep({
  subject,
  showSubject = false,
  compact = false,
  lang,
  query,
  fmt,
  t,
}: {
  subject: PrepSubject;
  showSubject?: boolean;
  /** One line and one button, no set-size picker (the shelf's top strip). */
  compact?: boolean;
  lang: Locale;
  query: Record<string, string | string[] | undefined>;
  fmt: Formatter;
  t: Dictionary;
}) {
  const p = t.superprepPage;
  const next = subject.next;

  if (compact) {
    const startable = next.kind === "continue" || next.kind === "start";
    const href = nextHref(lang, query, subject);
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="text-xs font-semibold text-muted">{p.next}</p>
          <p className="truncate text-sm text-muted">
            {subject.name}
            {startable && ` · ${fill(p.chapter, { n: fmt.number(next.chapter.number) })}`}
          </p>
          <p className="truncate font-bold">{startable ? next.chapter.title : next.kind === "mistakes" ? p.mistakesNext : p.finishedNext}</p>
        </div>
        <Button href={href} className="shrink-0">
          {next.kind === "continue" ? p.continue : next.kind === "start" ? p.start : next.kind === "mistakes" ? p.redo : p.custom}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md bg-superprep-tile p-4 ring-1 ring-border ring-inset">
      <p className="text-xs font-semibold text-muted">{p.next}</p>
      {next.kind === "continue" || next.kind === "start" ? (
        <>
          <div className="grid gap-0.5">
            <p className="text-sm text-muted">
              {showSubject && `${subject.name} · `}
              {fill(p.chapter, { n: fmt.number(next.chapter.number) })}
            </p>
            <p className="type-subtitle leading-snug">{next.chapter.title}</p>
            <p className="text-sm text-subtle tabular-nums">
              {next.kind === "continue"
                ? [
                    fill(p.left, { n: fmt.number(next.chapter.remaining) }),
                    next.chapter.accuracy !== null && fill(p.accuracy, { pct: fmt.percent(next.chapter.accuracy) }),
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : fill(p.questions, { n: fmt.number(next.chapter.questions) })}
            </p>
          </div>
          <SetPicker
            lang={lang}
            examPath={`/${lang}/superprep/${subject.id}/exam`}
            keep={keepQuery(query).toString()}
            chapter={{
              id: next.chapter.id,
              label: fill(p.chapter, { n: fmt.number(next.chapter.number) }),
              title: next.chapter.title,
              counts: { new: next.chapter.remaining, wrong: next.chapter.wrong, correct: next.chapter.correct },
            }}
            labels={{ start: p.startSet, change: p.changeSet, changeLabel: p.changeSetLabel, none: { new: p.noneNew, wrong: p.noneWrong, correct: p.noneCorrect } }}
            t={pickerLabels(t.exam)}
          />
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-semibold">
            <PartyPopper className="size-5 shrink-0 text-success" aria-hidden />
            {showSubject && `${subject.name}: `}
            {next.kind === "mistakes" ? p.mistakesNext : p.finishedNext}
          </p>
          <Button href={nextHref(lang, query, subject)} className="flex-1 sm:flex-none">
            {next.kind === "mistakes" ? `${p.redo} (${fmt.number(next.count)})` : p.custom}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}

/** Only the exam labels the popup needs travel to the browser. */
function pickerLabels(e: Dictionary["exam"]): PickerLabels {
  const { types, typeNew, typeNewHint, typeWrong, typeWrongHint, typeCorrect, typeCorrectHint, size, sizeOption, questionsCount, start, needType, noneAvailable, close } = e;
  return { types, typeNew, typeNewHint, typeWrong, typeWrongHint, typeCorrect, typeCorrectHint, size, sizeOption, questionsCount, start, needType, noneAvailable, close };
}
