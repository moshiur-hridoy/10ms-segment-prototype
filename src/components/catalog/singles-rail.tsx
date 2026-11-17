"use client";

import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { BookFace } from "@/design-system/atoms/book-face";
import { Button } from "@/design-system/atoms/button";
import type { BookFamily } from "@/design-system/foundations/book";
import { subjectIcons } from "@/design-system/foundations/subject-icons";
import type { Dictionary } from "@/i18n/get-dictionary";
import { nudgeFor, planFor, type CatalogView } from "@/lib/api/catalog";
import type { CatalogProduct } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { SECTION_TITLE_BIG } from "./section-title";

type L = Dictionary["segment"];
type CatalogLabels = Dictionary["catalog"];

/** The catalogue's subject ids are the book families; the icon is the library's mark for each (ShelfBook). */
const FAMILIES: BookFamily[] = ["physics", "chemistry", "biology", "math", "ict", "bangla", "english"];
const MARK = {
  physics: "atom",
  chemistry: "flask",
  biology: "leaf",
  math: "calculator",
  ict: "globe",
  bangla: "book",
  english: "languages",
  other: "book",
} as const;

/*
 * CT80 (lab `free-routine` v6→v7): one subject at a time as a rail of books, not cards with covers. We don't push
 * buying subject by subject, so the section is quieter: no thumbnails, no receipt card. Each single is the library's book
 * (BookFace) in its subject's colour, shrink-wrapped like a book you don't have, its name and papers on the cover and the
 * price under it. A tap takes it: the wrap comes off (the full cloth), it lifts a little and a tick appears. Under the rail
 * one line adds them up the cheapest way (planFor, a bundle when it costs less), with the existing saving note, bonus and
 * "add these too" nudge, and "ভর্তি হও". The rail scrolls sideways on phones.
 */
export function SinglesRail({
  view,
  fmt,
  l,
  c,
  buy,
}: {
  view: CatalogView;
  fmt: Formatter;
  l: L;
  c: CatalogLabels;
  buy: (products: CatalogProduct[]) => void;
}) {
  const { stream, billing } = view;
  const singles = stream.live.filter((p) => p.subjects.length === 1 && !stream.owned.includes(p.subjects[0]));
  const have = stream.live.filter((p) => p.subjects.length === 1 && stream.owned.includes(p.subjects[0]));
  const [picked, setPicked] = useState<string[]>([]);
  const plan = useMemo(() => planFor(picked, stream.live, stream.owned), [picked, stream.live, stream.owned]);
  if (!singles.length) return null;

  const nudge = nudgeFor(picked, stream.live, stream.owned, plan);
  const subjects = [...stream.group, ...stream.compulsory];
  const names = new Map(subjects.map((s) => [s.id, s.name]));
  const list = (ids: string[]) => fmt.list(ids.map((id) => names.get(id) ?? id));
  const papersOf = (id: string) => subjects.find((s) => s.id === id)?.papers ?? 2;
  const unit = billing ? c.perCycle : undefined;
  const taka = (n: number) => `৳${fmt.number(n)}`;
  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <section aria-labelledby="singles-title" className="grid gap-5">
      <div className="grid gap-1">
        <h2 id="singles-title" className={cn("type-title", SECTION_TITLE_BIG)}>
          {l.singlesTitle}
        </h2>
        <p className="text-sm text-muted sm:text-base">{l.singlesLead}</p>
        {have.length > 0 && (
          <p className="mt-1 flex items-start gap-1.5 text-sm font-medium text-success">
            <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} aria-hidden />
            {fill(l.planHave, { subjects: list(have.map((p) => p.subjects[0])) })}
          </p>
        )}
      </div>

      {/* The rail: room above for the lift, sideways scroll on phones. */}
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pt-2 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {singles.map((p) => {
          const id = p.subjects[0];
          const family: BookFamily = FAMILIES.includes(id as BookFamily) ? (id as BookFamily) : "other";
          const on = picked.includes(id);
          const name = names.get(id) ?? p.title;
          return (
            <li key={p.id} className="w-22 shrink-0 snap-start sm:w-26">
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${name}, ${taka(p.price.final)}`}
                onClick={() => toggle(id)}
                className="group/book grid w-full gap-2 rounded-md text-left outline-offset-4"
              >
                <BookFace
                  family={family}
                  owned={on}
                  mark={subjectIcons[MARK[family]]}
                  markClassName="right-2 bottom-2 size-10"
                  className={cn(
                    "transition-[transform,translate] duration-300 ease-out motion-reduce:transition-none",
                    on ? "-translate-y-1.5" : "group-hover/book:-translate-y-1",
                  )}
                >
                  <span className="relative flex min-w-0 flex-col gap-1 p-2 pl-3.5 sm:p-2.5 sm:pl-4">
                    <span className="text-sm leading-tight font-bold whitespace-nowrap sm:text-lg">{name}</span>
                    {/* "১ম পত্র · ২য় পত্র" one paper a line, so it never breaks inside a word on the narrow cover. */}
                    <span className="grid text-xs font-medium opacity-80">
                      {(papersOf(id) === 1 ? l.paperOne : l.paperTwo).split(" · ").map((x) => (
                        <span key={x}>{x}</span>
                      ))}
                    </span>
                  </span>
                  {!on && <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--book-wrap)" }} />}
                  {/* Taken: a tick in the bottom corner, like a stamp, clear of the name. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute bottom-2.5 left-4 grid size-6 place-items-center rounded-full transition-[opacity,scale] duration-200",
                      on ? "scale-100 bg-surface text-brand-text opacity-100 shadow-raised" : "scale-75 opacity-0",
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                </BookFace>
                <span className="grid justify-items-start px-0.5 tabular-nums">
                  <span className={cn("text-sm font-semibold", on && "text-brand-text")}>{taka(p.price.final)}</span>
                  {unit && <span className="text-xs text-subtle">{unit}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* One line adds them up; the button stays until something is picked. */}
      <div className="grid gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <p className="min-w-0 flex-1 tabular-nums">
            {plan.items.length === 0 ? (
              <span className="text-sm text-muted">{l.singlesEmpty}</span>
            ) : (
              <>
                <span className="font-semibold">{fill(l.singlesCount, { n: fmt.number(picked.length) })}</span>
                <span className="text-muted"> · </span>
                <span className="type-subtitle">{taka(plan.total)}</span>
                {unit && <span className="text-sm text-subtle"> {unit}</span>}
                {plan.saving > 0 && plan.separateTotal !== null && (
                  <span className="block text-sm text-muted">
                    {fill(l.receiptSaving, { saving: taka(plan.saving), separate: taka(plan.separateTotal) })}
                  </span>
                )}
              </>
            )}
          </p>
          <Button
            size="md"
            className="disabled:bg-border disabled:text-subtle disabled:opacity-100 disabled:shadow-none max-sm:w-full"
            disabled={plan.items.length === 0}
            onClick={() => buy(plan.items)}
          >
            {c.buy}
          </Button>
        </div>
        {plan.bonus.length > 0 && <p className="text-sm text-muted">{fill(c.bonus, { subjects: list(plan.bonus) })}</p>}
        {nudge && (
          <p className="flex flex-wrap items-center gap-x-2 rounded-md bg-highlight-soft px-3 py-2 text-sm text-text">
            <Sparkles className="size-4 shrink-0 text-highlight" aria-hidden />
            {fill(c.nudge, { extra: taka(nudge.extra), subjects: list(nudge.add) })}
            <button
              type="button"
              onClick={() => setPicked((cur) => [...cur, ...nudge.add])}
              className="font-semibold text-brand-text hover:underline"
            >
              {c.nudgeAdd}
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
