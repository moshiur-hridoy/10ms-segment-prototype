import { ChevronRight, ClipboardCheck, NotebookPen, Video, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/design-system/atoms/card";
import type { RoutineEntry } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { EntryActionButton, entryHref, entryNote } from "./entry";
import type { Props } from "./planner";

/**
 * CT215: the timeline's own colours per kind, so each reads apart at a glance: a live class red with the video icon, a
 * free class green with the video icon, an exam violet with the clipboard, homework amber. CT217: every card is white;
 * the kind shows in the dot and the coloured name, not in the card's background.
 */
const TL_KIND: Record<RoutineEntry["kind"], { icon: LucideIcon; dot: string; text: string }> = {
  class: { icon: Video, dot: "bg-danger", text: "text-danger" },
  free: { icon: Video, dot: "bg-brand", text: "text-brand-text" },
  exam: { icon: ClipboardCheck, dot: "bg-highlight", text: "text-highlight" },
  homework: { icon: NotebookPen, dot: "bg-warning", text: "text-warning" },
};
/** Time, rail, content: the rail's centre is where the line runs. */
const ROW = "grid grid-cols-[3rem_2rem_minmax(0,1fr)] gap-x-2";
const NOTE_TONE = { muted: "text-muted", danger: "text-danger", live: "text-live", success: "text-success" } as const;

/**
 * CT211 (lab `segment-home` v95): the routine on phones as one line through the week, a train's route: from the chosen
 * day to Friday, each day a heading that stays at the top while its entries scroll. Every entry is a stop on the line,
 * its dot the kind's colour and icon, the kind named in that colour on its first line (লাইভ ক্লাস, পরীক্ষা, ফ্রি ক্লাস)
 * and a key above with the week's count of each, so a class, an exam and a free class are told apart at a glance.
 * What's over fades; the red line marks now; the next entry opens as a card with how
 * long until it starts.
 */
export function Timeline({ view, href, lang, fmt, t, idSuffix = "" }: Props) {
  const r = t.routine;
  const days = view.week.days.map((d) => d.day).filter((d) => d >= view.day);
  const list = view.weekEntries.filter((e) => e.day >= view.day);
  const now = fmt.now;
  const next = list.find((e) => e.state === "live" || e.state === "open") ?? list.find((e) => e.at > now);
  const kinds = (Object.keys(TL_KIND) as RoutineEntry["kind"][])
    .map((k) => ({ k, n: list.filter((e) => e.kind === k).length }))
    .filter((x) => x.n > 0);
  const { clock: nowClock } = fmt.timeParts(now);

  const nowLine = (
    <li key="now" aria-label={fill(r.now, { time: fmt.time(now) })} className={cn(ROW, "relative items-center py-1")}>
      <span className="text-right text-xs font-bold text-danger tabular-nums">{nowClock}</span>
      <span className="relative flex justify-center">
        <span className="size-2.5 rounded-full bg-danger ring-4 ring-surface" />
      </span>
      <span className="h-0.5 rounded-full bg-danger" />
    </li>
  );

  const stop = (e: RoutineEntry) => {
    const kind = TL_KIND[e.kind];
    const Icon = kind.icon;
    const over = e.state === "ended" || e.state === "done";
    const open = e === next;
    const note = entryNote(e, fmt, t);
    const { period, clock } = fmt.timeParts(e.at);
    return (
      <li key={e.id} className={cn(ROW, "relative py-2", over && "opacity-55")}>
        <span className="grid content-start justify-items-end pt-2 tabular-nums">
          <span className="text-xs leading-none text-subtle">{period}</span>
          <span className="mt-0.5 leading-tight font-bold">{clock}</span>
        </span>
        <span className="relative flex justify-center pt-1.5">
          <span
            aria-hidden
            className={cn(
              "grid size-8 place-items-center rounded-full ring-4 ring-surface",
              over ? "bg-border text-muted" : cn(kind.dot, "text-on-fill"),
            )}
          >
            <Icon className={cn("size-4", Icon === Video && !over && "fill-current")} />
          </span>
        </span>
        <div className={cn("grid min-w-0 gap-0.5 rounded-lg px-3 py-2", open && "border border-border bg-surface shadow-raised")}>
          <p className="flex min-w-0 items-center gap-1.5 text-xs">
            {e.state === "live" && <span aria-hidden className="size-2 shrink-0 rounded-full bg-live motion-safe:animate-pulse-live" />}
            <span className={cn("shrink-0 font-semibold", over ? "text-muted" : kind.text)}>{r.tlKind[e.kind]}</span>
            <span aria-hidden className="text-subtle">
              ·
            </span>
            <span className="truncate text-subtle">{e.course}</span>
          </p>
          <a href={entryHref(e, lang)} className="line-clamp-2 leading-snug font-semibold hover:underline">
            {e.title}
          </a>
          <p className={cn("text-sm", NOTE_TONE[note.tone])}>{note.text}</p>
          {open && e.at > now && <p className="text-sm font-semibold text-text">{fill(r.tlStartsIn, { in: fmt.ago(e.at) })}</p>}
          {open && e.action !== "none" && (
            <EntryActionButton e={e} lang={lang} t={t} className="mt-2 h-11 w-full lg:w-auto lg:justify-self-start lg:px-5" />
          )}
        </div>
      </li>
    );
  };

  return (
    <Card aria-labelledby={`tl-title${idSuffix}`} className="grid grid-cols-1 gap-2 pt-4 pb-3 lg:pt-6 lg:pb-4">
      <header className="grid gap-2.5 px-4 lg:px-6">
        <h2 id={`tl-title${idSuffix}`} className="type-title">
          {r.weekTitle}
        </h2>
        {/* The key: each kind as its dot, its name and the week's count. */}
        {kinds.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {kinds.map(({ k, n }) => {
              const Icon = TL_KIND[k].icon;
              return (
                <li key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border py-1 pr-2.5 pl-1 text-xs">
                  <span aria-hidden className={cn("grid size-5 place-items-center rounded-full text-on-fill", TL_KIND[k].dot)}>
                    <Icon className={cn("size-3", Icon === Video && "fill-current")} />
                  </span>
                  <span className="font-semibold">{r.tlKind[k]}</span>
                  <span className="text-subtle tabular-nums">{fmt.number(n)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </header>

      {days.map((d) => {
        const rel = fmt.relativeDay(`${d}T12:00:00+06:00`);
        const entries = list.filter((e) => e.day === d);
        const isToday = d === view.today;
        const nowAt = isToday ? entries.findIndex((e) => e.at > now) : -2;
        return (
          <section key={d} aria-labelledby={`tl-${d}${idSuffix}`}>
            {/* The day stays at the top while its stops scroll under it. */}
            <h3 id={`tl-${d}${idSuffix}`} className="sticky top-16 z-10 flex items-baseline gap-2 bg-surface/95 px-4 py-2 backdrop-blur-sm lg:px-6">
              {rel && <span className="text-sm font-semibold text-brand-text first-letter:uppercase">{t.time[rel]}</span>}
              <span className="font-semibold">{fmt.dayTitle(d)}</span>
            </h3>
            {entries.length ? (
              <ol className="relative px-2 lg:px-4">
                {/* The line, through the dots' centre. */}
                <span
                  aria-hidden
                  className="absolute top-0 bottom-0 left-[calc(0.5rem+3rem+0.5rem+1rem)] lg:left-[calc(1rem+3rem+0.5rem+1rem)] w-0.5 -translate-x-1/2 bg-border"
                />
                {entries.flatMap((e, i) => [...(isToday && nowAt === i ? [nowLine] : []), stop(e)])}
                {isToday && nowAt === -1 && nowLine}
              </ol>
            ) : (
              <p className="px-4 pb-2 pl-[calc(0.5rem+3rem+0.5rem+2rem+0.5rem)] lg:pl-[calc(1rem+3rem+0.5rem+2rem+0.5rem)] text-sm text-subtle">
                {r.dayNothing}
              </p>
            )}
          </section>
        );
      })}

      <Link
        href={href({ day: view.nextWeek })}
        scroll={false}
        className="mx-4 mt-1 inline-flex lg:mx-6 min-h-11 items-center gap-1 justify-self-start text-sm font-semibold text-brand-text hover:underline"
      >
        {r.nextWeek}
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </Card>
  );
}
