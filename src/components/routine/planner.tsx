import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { IconButton } from "@/design-system/atoms/icon-button";
import { IconTile } from "@/design-system/atoms/icon-tile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { CATCH_UP_DAYS, SPANS, type DayCell, type EntryKind, type RoutineView, type Span } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { EntryActionButton, EntryRow, KIND } from "./entry";
import { MonthPopover } from "./month-popover";

export type Href = (change: { day?: string; missed?: boolean; course?: null; subject?: null; span?: Span }) => string;
/** `idSuffix` keeps heading ids unique when the phone layout renders a section a second time. */
export type Props = {
  view: RoutineView;
  href: Href;
  lang: Locale;
  fmt: Formatter;
  t: Dictionary;
  idSuffix?: string;
  /** CT211 (lab `routine-page` 2): below `lg` the day's card is a timeline of the week from the chosen day. */
  timeline?: boolean;
};

export const KINDS: EntryKind[] = ["class", "exam", "homework"];
/** Calendar dots: one per type the day holds, red when something there was missed. */
export const DOT: Record<EntryKind | "missed", string> = { class: "bg-brand", exam: "bg-highlight", homework: "bg-warning", missed: "bg-danger" };

/** A day square's spoken name: its date and what it holds ("…: ৩টি ক্লাস, ১টি মিসড"). */
export function daySummary(c: DayCell, fmt: Formatter, t: Dictionary) {
  const r = t.routine;
  const parts = KINDS.filter((k) => c.counts[k] > 0).map((k) => fill(r.count[k], { n: fmt.number(c.counts[k]) }));
  if (c.missed) parts.push(fill(r.dayMissed, { n: fmt.number(c.missed) }));
  return fill(r.dayLabel, { date: fmt.dayTitle(c.day), summary: parts.join(", ") || r.dayNothing });
}

/* ---------- Desktop: the strip over the day ---------- */

/**
 * The strip on top of the desktop page: the months it covers (opening the whole month, for jumps
 * further than the arrows reach), one week or two, back to today and the arrows; then each day
 * as a tile with its weekday, date and a dot per type. The stretch's load and what to catch up on
 * sit beside the day, in the right column (RangeLoad, CatchUp).
 */
export function RangeStrip(props: Props) {
  const { view, href, fmt, t } = props;
  const r = t.routine;
  const { range } = view;
  const two = range.span === 14;

  return (
    <div className="grid">
      <header className="flex items-center gap-3 px-4 pt-4">
        <MonthPopover month={fmt.monthSpan(range.start, range.end)} triggerLabel={fill(r.openMonth, { month: fmt.month(view.day) })} closeOn="td a">
          <MonthCalendar {...props} />
        </MonthPopover>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <nav aria-label={r.span} className="inline-flex items-center gap-1 rounded-md bg-raised p-1 ring-1 ring-border ring-inset">
            {SPANS.map((n) => (
              <Link
                key={n}
                href={href({ span: n })}
                replace
                scroll={false}
                aria-current={n === range.span || undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-sm px-3 text-sm font-semibold whitespace-nowrap transition-colors",
                  n === range.span ? "bg-surface text-text shadow-card" : "text-muted hover:text-text",
                )}
              >
                {fill(r.spanDays, { n: fmt.number(n) })}
              </Link>
            ))}
          </nav>
          <Button variant="secondary" size="sm" href={href({ day: view.today })} replace scroll={false}>
            {r.today}
          </Button>
          <div className="flex items-center gap-1">
            <IconButton href={href({ day: range.prev })} replace scroll={false} label={two ? r.prevTwoWeeks : r.prevWeek} size="sm">
              <ChevronLeft className="size-5" aria-hidden />
            </IconButton>
            <IconButton href={href({ day: range.next })} replace scroll={false} label={two ? r.nextTwoWeeks : r.nextWeek} size="sm">
              <ChevronRight className="size-5" aria-hidden />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Keyed by the stretch, so turning it plays the page settling in. */}
      <ol
        key={range.start}
        aria-label={fmt.dayRange(range.start, range.end)}
        className={cn("grid gap-2 px-4 pt-3 pb-4 motion-safe:animate-[page-in_320ms_ease-out_both]", two ? "grid-cols-14" : "grid-cols-7")}
      >
        {range.days.map((c) => {
          const selected = c.day === view.day;
          const today = c.day === view.today;
          const past = c.day < view.today;
          // The 1st of a month says which month in place of its weekday, where the strip crosses into it.
          const monthStart = c.day.endsWith("-01");
          return (
            <li key={c.day} className="min-w-0">
              <Link
                href={href({ day: c.day })}
                replace
                scroll={false}
                aria-label={daySummary(c, fmt, t)}
                aria-current={selected ? "date" : undefined}
                // A tile per day: grey, lighter once past; today outlined in the brand colour; the chosen day solid.
                className={cn(
                  "grid h-24 min-w-0 place-items-center content-center gap-1.5 rounded-md transition-colors",
                  selected ? "bg-primary text-on-primary shadow-card"
                  : today ? "bg-surface ring-2 ring-brand ring-inset hover:bg-brand-soft"
                  : past ? "bg-raised/50 hover:bg-raised"
                  : "bg-raised hover:bg-border",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "max-w-full truncate px-1 text-xs",
                    selected ? "font-semibold" : monthStart || today ? "font-semibold text-brand-text" : "text-subtle",
                  )}
                >
                  {monthStart ? fmt.monthName(c.day) : fmt.weekday(c.day)}
                </span>
                <span aria-hidden className={cn("type-title tabular-nums", !selected && (today ? "text-brand-text" : past ? "text-muted" : "text-text"))}>
                  {fmt.dayNumber(c.day)}
                </span>
                {/* On the solid tile the dots sit on a white pill, so the green one still shows. */}
                <Dots c={c} className={cn(selected && c.total > 0 && "bg-surface")} />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A dot per type the day holds, and a red one when something there was missed. */
function Dots({ c, className }: { c: DayCell; className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-1.5 items-center gap-0.5 rounded-full", className && "h-3 px-1.5", className)}>
      {KINDS.filter((k) => c.counts[k] > 0).map((k) => (
        <span key={k} className={cn("size-1.5 rounded-full", DOT[k])} />
      ))}
      {c.missed > 0 && <span className={cn("size-1.5 rounded-full", DOT.missed)} />}
    </span>
  );
}

/**
 * The stretch's load, at the top of the desktop page's right column: a ring for how much is done
 * ("৫৮%", with "২৪টির মধ্যে ১৪টি শেষ" beside it), then a row per type with its own done count and
 * a bar in the type's colour, so the type falling behind shows at a glance.
 */
export function RangeLoad({ view, fmt, t }: Props) {
  const r = t.routine;
  const { range } = view;
  const two = range.span === 14;
  const current = view.today >= range.start && view.today <= range.end;
  const title = current ? (two ? r.twoWeeksTitle : r.weekTitle) : two ? fmt.dayRange(range.start, range.end) : fill(r.weekOther, { range: fmt.dayRange(range.start, range.end) });
  const share = (done: number, total: number) => (total ? done / total : 0);
  const pct = share(range.done, range.total);

  return (
    <section aria-labelledby="load-title" className="grid gap-4">
      <h2 id="load-title" className="font-semibold">
        {title}
      </h2>
      {range.total === 0 ? (
        <p className="text-sm text-muted first-letter:uppercase">{r.dayNothing}</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <Ring value={pct} label={fmt.percent(pct * 100)} />
            <p className="text-sm text-muted">{fill(r.weekDone, { done: fmt.number(range.done), total: fmt.number(range.total) })}</p>
          </div>
          <ul className="grid gap-3">
            {KINDS.filter((k) => range.counts[k] > 0).map((k) => (
              <li key={k} className="grid gap-1.5">
                <span className="flex items-center gap-2 text-sm">
                  <span aria-hidden className={cn("size-2 rounded-full", DOT[k])} />
                  <span className="flex-1 font-semibold">{r.kind[k]}</span>
                  <span className="text-muted tabular-nums">
                    {fill(r.doneOf, { done: fmt.number(range.doneBy[k]), total: fmt.number(range.counts[k]) })}
                  </span>
                </span>
                <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-raised">
                  <span className={cn("block h-full rounded-full", DOT[k])} style={{ width: `${share(range.doneBy[k], range.counts[k]) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** A done ring: a grey track, the done share in green from twelve o'clock, the percent inside. */
function Ring({ value, label }: { value: number; label: string }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <span className="relative grid size-20 shrink-0 place-items-center">
      <svg aria-hidden viewBox="0 0 72 72" className="absolute inset-0 size-full -rotate-90">
        <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" className="stroke-raised" />
        {value > 0 && (
          <circle cx="36" cy="36" r={R} fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${C * value} ${C}`} className="stroke-success" />
        )}
      </svg>
      <span className="type-subtitle tabular-nums">{label}</span>
    </span>
  );
}

/* ---------- The month ---------- */

/**
 * The month: Saturday-first weeks, a dot per type on each day, a ribbon on today, the open day
 * filled. It opens from the strip's month name: under it on desktop, in a bottom sheet on phones,
 * which adds its close button (`headerEnd`).
 */
export function MonthCalendar({ view, href, fmt, t, idSuffix = "", headerEnd }: Props & { headerEnd?: ReactNode }) {
  const r = t.routine;
  const summary = (c: DayCell) => daySummary(c, fmt, t);

  return (
    <section aria-labelledby={`month-title${idSuffix}`} className="grid gap-3">
      <header className="flex items-center justify-between gap-3">
        <h2 id={`month-title${idSuffix}`} className="type-title">
          {fmt.month(view.day)}
        </h2>
        <div className="flex items-center gap-1">
          <IconButton href={href({ day: view.prevMonth })} replace scroll={false} label={r.prevMonth} size="sm" className="max-lg:size-11">
            <ChevronLeft className="size-5" aria-hidden />
          </IconButton>
          <IconButton href={href({ day: view.nextMonth })} replace scroll={false} label={r.nextMonth} size="sm" className="max-lg:size-11">
            <ChevronRight className="size-5" aria-hidden />
          </IconButton>
          {headerEnd}
        </div>
      </header>

      <table className="w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            {view.weeks[0].map((c) => (
              <th key={c.day} scope="col" className="pb-1 text-xs font-semibold text-subtle">
                {fmt.weekday(c.day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.weeks.map((week) => (
            <tr key={week[0].day}>
              {week.map((c) => {
                const selected = c.day === view.day;
                const today = c.day === view.today;
                return (
                  <td key={c.day} className="p-0">
                    <Link
                      href={href({ day: c.day })}
                      replace
                      scroll={false}
                      aria-label={summary(c)}
                      aria-current={selected ? "date" : undefined}
                      className={cn(
                        "relative grid h-14 place-items-center content-center gap-1 rounded-md transition-colors hover:bg-raised",
                        !c.inMonth && "opacity-40",
                        selected && "bg-raised",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-7 place-items-center rounded-full text-sm tabular-nums",
                          selected ? "bg-primary font-bold text-on-primary" : today ? "font-bold text-brand-text ring-2 ring-brand ring-inset" : "text-text",
                        )}
                      >
                        {fmt.dayNumber(c.day)}
                      </span>
                      <Dots c={c} />
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <ul aria-label={r.legend} className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {KINDS.map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2 rounded-full", DOT[k])} />
            {r.kind[k]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2 rounded-full", DOT.missed)} />
          {t.tasks.tile.missed}
        </li>
      </ul>
    </section>
  );
}

/** The week's load at a glance (the phone's folded line opens to it): how many of each, and how many are done. */
export function WeekSummary({ view, fmt, t, idSuffix = "" }: Props) {
  const r = t.routine;
  const { week } = view;
  const isThisWeek = view.today >= week.start && view.today <= week.end;
  const pct = week.total ? (week.done / week.total) * 100 : 0;
  return (
    <section aria-labelledby={`week-title${idSuffix}`} className="grid gap-2 rounded-md bg-raised p-4">
      <h2 id={`week-title${idSuffix}`} className="text-sm font-semibold text-muted">
        {isThisWeek ? r.weekTitle : fill(r.weekOther, { range: fmt.dayRange(week.start, week.end) })}
      </h2>
      {week.total === 0 ? (
        <p className="text-muted">{r.weekEmpty}</p>
      ) : (
        <>
          <p className="flex flex-wrap gap-x-3 gap-y-1 font-semibold">
            {KINDS.filter((k) => week.counts[k] > 0).map((k, i) => (
              <span key={k} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-subtle">·</span>}
                <span aria-hidden className={cn("size-2 rounded-full", DOT[k])} />
                {fill(r.count[k], { n: fmt.number(week.counts[k]) })}
              </span>
            ))}
          </p>
          <div className="flex items-center gap-3">
            <div aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted tabular-nums">{fill(r.weekDone, { done: fmt.number(week.done), total: fmt.number(week.total) })}</span>
          </div>
        </>
      )}
    </section>
  );
}

/** Misses still worth catching up on, newest first, each with its way back in under the text (the list sits in a narrow column on desktop, a folded line on phones). */
export function CatchUp({ view, href, lang, fmt, t, idSuffix = "" }: Props) {
  const r = t.routine;
  const { items, total } = view.catchUp;
  return (
    <section aria-labelledby={`catchup-title${idSuffix}`} className="grid gap-2">
      <header className="grid gap-0.5">
        <h2 id={`catchup-title${idSuffix}`} className="font-semibold">
          {r.catchUp}
          {total > 0 && <span className="ml-1.5 text-sm font-normal text-danger tabular-nums">({fmt.number(total)})</span>}
        </h2>
        <p className="text-xs text-subtle">{fill(r.catchUpHint, { n: fmt.number(CATCH_UP_DAYS) })}</p>
      </header>
      {total === 0 ? (
        <p className="flex items-center gap-2 text-sm text-success">
          <CalendarCheck className="size-4" aria-hidden />
          {r.catchUpEmpty}
        </p>
      ) : (
        <ul className="grid divide-y divide-border">
          {items.map((e) => (
            <li key={e.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-3">
              <IconTile icon={KIND[e.kind].icon} tone={KIND[e.kind].tone} size="sm" />
              <div className="grid min-w-0 grid-cols-1">
                <Link href={href({ day: e.day })} replace scroll={false} className="line-clamp-2 text-sm font-semibold hover:underline">
                  {e.title}
                </Link>
                <p className="text-xs text-danger">
                  {fmt.date(e.at)} · {e.state === "overdue" ? r.state.overdue : e.kind === "exam" ? r.state.missedExam : r.state.missedClass}
                </p>
              </div>
              <EntryActionButton e={e} lang={lang} t={t} className="col-start-2 justify-self-start max-lg:h-11 max-lg:px-4" />
            </li>
          ))}
        </ul>
      )}
      {total > items.length && (
        <Link
          href={href({ missed: true })}
          replace
          scroll={false}
          className="justify-self-start text-sm font-semibold text-brand-text hover:underline max-lg:inline-flex max-lg:min-h-11 max-lg:items-center"
        >
          {fill(r.catchUpMore, { n: fmt.number(total - items.length) })}
        </Link>
      )}
    </section>
  );
}

/* ---------- The day ---------- */

/** The day: its title, then every entry in time order, with a red "now" line where the day has got to. The strip above turns the days. */
export function DayPage({ view, href, lang, fmt, t }: Props) {
  const rel = fmt.relativeDay(`${view.day}T12:00:00+06:00`);
  return (
    <div className="grid content-start gap-4">
      <header className="grid gap-0.5">
        <p className="text-sm font-semibold text-brand-text first-letter:uppercase">
          {rel ? t.time[rel] : fmt.weekday(view.day)}
        </p>
        <h2 id="day-title" className="type-title">
          {fmt.dayTitle(view.day)}
        </h2>
      </header>

      <DayEntries view={view} href={href} lang={lang} fmt={fmt} t={t} />
    </div>
  );
}

/** The day's entries under the ruled margin (or why there are none). Shared by the book and the phone. */
export function DayEntries({ view, href, lang, fmt, t }: Props) {
  const r = t.routine;
  const nowLine = (
    <li key="now" aria-label={fill(r.now, { time: fmt.time(fmt.now) })} className="relative -my-px grid grid-cols-[4.5rem_minmax(0,1fr)] items-center max-lg:grid-cols-[3.5rem_minmax(0,1fr)]">
      <span aria-hidden className="pr-2 text-right text-xs font-bold text-live tabular-nums">
        {fmt.timeParts(fmt.now).clock}
      </span>
      <span aria-hidden className="relative h-0.5 rounded-full bg-live">
        <span className="absolute top-1/2 -left-1 size-2.5 -translate-y-1/2 rounded-full bg-live" />
      </span>
    </li>
  );

  return (
    // Keyed by day, so turning to another day plays the page settling in.
    <div key={view.day} className="motion-safe:animate-[page-in_320ms_ease-out_both]">
      {view.entries.length === 0 ? (
        <div className="grid justify-items-start gap-2 border-y border-border py-10 pl-[5.5rem] max-lg:py-8 max-lg:pr-4 max-lg:pl-[4.25rem]">
          <p className="text-muted">{view.query.missed ? r.emptyMissed : r.emptyDay}</p>
          {view.nextBusyDay && (
            <Link
              href={href({ day: view.nextBusyDay })}
              replace
              scroll={false}
              className="text-sm font-semibold text-brand-text hover:underline max-lg:inline-flex max-lg:min-h-11 max-lg:items-center"
            >
              {fill(r.nextBusy, { day: fmt.dayTitle(view.nextBusyDay) })} →
            </Link>
          )}
        </div>
      ) : (
        <ol className="border-y border-border">
          {view.entries.flatMap((e, i) => [...(view.nowIndex === i ? [nowLine] : []), <EntryRow key={e.id} e={e} lang={lang} fmt={fmt} t={t} />])}
          {view.nowIndex === view.entries.length && nowLine}
        </ol>
      )}
    </div>
  );
}
