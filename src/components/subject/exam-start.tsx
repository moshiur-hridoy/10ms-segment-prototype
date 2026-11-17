import { Play, Timer } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import { stripPrefix, type SyllabusItem } from "@/lib/api";
import type { Formatter } from "@/lib/format";
import { demoExam } from "./demo-exam";
import { ItemIcon } from "./item-icon";

/**
 * Lab `class` v39 (P132): the exam before it starts, with as little as a student needs: what it covers
 * (the class's topic), three facts (questions, minutes, pass mark), the one rule that surprises people
 * (the timer doesn't stop), and one big button. A taken exam offers "আবার দাও" and its result, no score;
 * a closed one says it's open for practice. Nothing else on the page: no list of the class's items, no
 * inbox. On phones the button sits at the bottom of the screen, near the thumb. The phone's top bar pulls the
 * next block up for the video (P58), so the card takes 16px back (v40, P133).
 */
export function ExamStart({ item, labV, fmt, t }: { item: SyllabusItem; labV: number; fmt: Formatter; t: Dictionary }) {
  const s = t.syllabus;
  const l = s.examStart;
  const facts = demoExam(item.id, item.questions);
  const kind = item.title.includes(":") ? item.title.split(":")[0].trim() : null;
  const done = item.status === "done";
  const tiles = [
    { value: fmt.number(item.questions ?? 0), label: l.questions },
    { value: fmt.number(facts.minutes), label: l.minutes },
    { value: fmt.percent(facts.passPct), label: l.pass },
  ];

  const actions = (
    <div className="grid gap-3">
      {/* v40 (P133): no "time's up" line; a closed exam starts like any other. */}
      {facts.closed && labV < 40 && <p className="rounded-md bg-info-soft px-3 py-2 text-center text-sm text-info">{l.closed}</p>}
      <Button href={item.url} variant="raised" size="lg" className="w-full">
        {done ? s.exam.retake : l.start}
        <Play className="size-4 fill-current" aria-hidden />
      </Button>
      {done && (
        <Button href={item.url} variant="ghost" size="md" className="mx-auto">
          {s.exam.result}
        </Button>
      )}
    </div>
  );

  return (
    <section id="player" aria-label={stripPrefix(item.title)} className="mx-auto w-full max-w-md max-lg:mt-4 max-lg:pb-40">
      <Card radius="lg" className="grid justify-items-center gap-5 px-5 py-7 text-center sm:px-8">
        <ItemIcon kind="exam" size="lg" />
        <div className="grid gap-1.5">
          <p className="text-sm font-semibold text-subtle">{[s.kind.exam, kind].filter(Boolean).join(" · ")}</p>
          <h1 className="type-title text-balance">{stripPrefix(item.title)}</h1>
        </div>
        <ul className="grid w-full grid-cols-3 gap-2">
          {tiles.map((x) => (
            <li key={x.label} className="grid gap-0.5 rounded-md bg-raised px-2 py-3">
              <span className="type-title tabular-nums">{x.value}</span>
              <span className="text-xs text-muted">{x.label}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Timer className="size-4 shrink-0" aria-hidden />
          {l.timer}
        </p>
        {/* Wide screens: the button in the card. */}
        <div className="hidden w-full lg:block">{actions}</div>
      </Card>
      {/* Phones: the button at the bottom of the screen, near the thumb. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto max-w-md">{actions}</div>
      </div>
    </section>
  );
}
