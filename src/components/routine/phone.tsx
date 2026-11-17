import { CalendarCheck, CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { IconButton } from "@/design-system/atoms/icon-button";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { CatchUp, DayEntries, daySummary, DOT, KINDS, MonthCalendar, WeekSummary, type Props } from "./planner";
import { RoutineSheet, SheetClose } from "./sheet";
import { Timeline } from "./timeline";
import { WeekSwipe } from "./week-swipe";

/** Heading ids here carry this, so they don't clash with the book's (rendered, hidden, for `lg`). */
const ID = "-phone";

/*
 * The routine below `lg`, as three cards, one question each, like desktop. On top, the week as a
 * strip (swipe or the arrows to turn it, tap a day to open it) with the month a tap away in a bottom
 * sheet; under it one line for the week's load and what to catch up on, which opens in place;
 * then the chosen day, the main view, with the same rows and red "now" line as desktop.
 */
export function PhoneRoutine({ className, aside, ...props }: Props & { className?: string; /** CT74: in place of the week's load (a batch's routine for a guest has nothing done or missed). */ aside?: ReactNode }) {
  const { view, href, fmt, t } = props;
  const rel = fmt.relativeDay(`${view.day}T12:00:00+06:00`);
  const isToday = view.day === view.today;

  return (
    <div className={cn("grid grid-cols-1 gap-3", className)}>
      <Card as="div">
        <WeekStrip {...props} />
      </Card>
      {aside ?? <WeekLine {...props} />}

      {/* CT211: the week from the chosen day as one timeline, in place of the day's card. */}
      {props.timeline ? (
        <Timeline {...props} idSuffix={ID} />
      ) : (
        <Card aria-labelledby={`day-title${ID}`} className="grid grid-cols-1 gap-3 overflow-hidden pt-4">
          <header className="grid gap-0.5 px-4">
            {/* Only "আজ / আগামীকাল / গতকাল" (a bare weekday would repeat the title), and the way back
                to today on its right, so the title keeps the full width. */}
            {(rel || !isToday) && (
              <div className="flex min-h-6 items-center justify-between gap-2">
                <p className="text-sm font-semibold text-brand-text first-letter:uppercase">
                  {rel && t.time[rel]}
                </p>
                {!isToday && (
                  // 44px to tap, without making the line that tall.
                  <Button variant="ghost" href={href({ day: view.today })} replace scroll={false} className="-my-2.5 -mr-4">
                    {t.routine.backToToday}
                  </Button>
                )}
              </div>
            )}
            <h2 id={`day-title${ID}`} className="type-title">
              {fmt.dayTitle(view.day)}
            </h2>
          </header>
          <DayEntries {...props} />
        </Card>
      )}
    </div>
  );
}

/** The month's name (opening the whole month), back to today, the arrows, and the week's seven days. */
function WeekStrip(props: Props) {
  const { view, href, fmt, t } = props;
  const r = t.routine;
  const month = fmt.month(view.day);

  return (
    <div className="grid gap-1 px-2 pt-2 pb-3">
      <header className="flex items-center gap-1">
        <RoutineSheet
          labelledBy={`month-title${ID}`}
          closeLabel={r.close}
          closeOn="td a"
          triggerLabel={fill(r.openMonth, { month })}
          triggerClassName="inline-flex h-11 min-w-0 items-center gap-2 rounded-full px-3 font-semibold transition-colors hover:bg-raised active:bg-raised"
          trigger={
            <>
              <CalendarDays className="size-5 shrink-0 text-brand-text" aria-hidden />
              <span className="truncate">{month}</span>
              <ChevronDown className="size-4 shrink-0 text-subtle" aria-hidden />
            </>
          }
        >
          <MonthCalendar {...props} idSuffix={ID} headerEnd={<SheetClose label={r.close} />} />
        </RoutineSheet>
        <div className="ml-auto flex shrink-0 items-center">
          <IconButton href={href({ day: view.prevWeek })} replace scroll={false} label={r.prevWeek} size="lg">
            <ChevronLeft className="size-5" aria-hidden />
          </IconButton>
          <IconButton href={href({ day: view.nextWeek })} replace scroll={false} label={r.nextWeek} size="lg">
            <ChevronRight className="size-5" aria-hidden />
          </IconButton>
        </div>
      </header>

      <WeekSwipe
        start={view.week.start}
        prevHref={href({ day: view.prevWeek })}
        nextHref={href({ day: view.nextWeek })}
        label={fill(r.weekOther, { range: fmt.dayRange(view.week.start, view.week.end) })}
      >
        {view.week.days.map((c) => {
          const selected = c.day === view.day;
          const today = c.day === view.today;
          return (
            <Link
              key={c.day}
              href={href({ day: c.day })}
              replace
              scroll={false}
              draggable={false}
              aria-label={daySummary(c, fmt, t)}
              aria-current={selected ? "date" : undefined}
              className="grid h-18 min-w-0 place-items-center content-center gap-1 rounded-md transition-colors active:bg-raised"
            >
              {/* Today: its weekday in the brand colour and a ring. */}
              <span
                aria-hidden
                className={cn("max-w-full truncate text-xs", today ? "font-bold text-brand-text" : selected ? "font-semibold text-text" : "text-subtle")}
              >
                {fmt.weekday(c.day)}
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid size-8 place-items-center rounded-full text-sm tabular-nums",
                  selected ? "bg-primary font-bold text-on-primary" : today ? "font-bold text-brand-text ring-2 ring-brand ring-inset" : "text-text",
                )}
              >
                {fmt.dayNumber(c.day)}
              </span>
              <span aria-hidden className="flex h-1.5 gap-0.5">
                {KINDS.filter((k) => c.counts[k] > 0).map((k) => (
                  <span key={k} className={cn("size-1.5 rounded-full", DOT[k])} />
                ))}
                {c.missed > 0 && <span className={cn("size-1.5 rounded-full", DOT.missed)} />}
              </span>
            </Link>
          );
        })}
      </WeekSwipe>
    </div>
  );
}

/**
 * The week's load and the catch-up list, folded into one line on its own card between the strip and the day:
 * how much of the week is done, and a red count of what's still to catch up on. A tap opens the
 * full week summary and the catch-up list in place (a native <details>, so no script needed).
 */
function WeekLine(props: Props) {
  const { view, fmt, t } = props;
  const r = t.routine;
  const { week } = view;
  const missed = view.catchUp.total;
  const isThisWeek = view.today >= week.start && view.today <= week.end;
  const pct = week.total ? (week.done / week.total) * 100 : 0;

  return (
    <Card as="details" className="group overflow-hidden">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-2 transition-colors active:bg-raised [&::-webkit-details-marker]:hidden">
        <span className="grid min-w-0 flex-1 grid-cols-1 gap-1">
          {/* "এই সপ্তাহে কিছু নেই" says which week by itself. */}
          {!(isThisWeek && week.total === 0) && (
            <span className="truncate text-xs text-muted">{isThisWeek ? r.weekTitle : fill(r.weekOther, { range: fmt.dayRange(week.start, week.end) })}</span>
          )}
          {week.total === 0 ? (
            <span className="text-sm font-semibold">{r.weekEmpty}</span>
          ) : (
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-10 shrink-0 overflow-hidden rounded-full bg-border">
                <span className="block h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-sm font-semibold tabular-nums">{fill(r.weekDone, { done: fmt.number(week.done), total: fmt.number(week.total) })}</span>
            </span>
          )}
        </span>
        {missed > 0 ? (
          <span className="shrink-0 rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger tabular-nums">
            {r.catchUp} {fmt.number(missed)}
          </span>
        ) : (
          <CalendarCheck className="size-5 shrink-0 text-success" aria-label={r.catchUpEmpty} />
        )}
        <ChevronDown className="size-5 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid grid-cols-1 gap-5 px-4 pt-1 pb-4">
        <WeekSummary {...props} idSuffix={ID} />
        <CatchUp {...props} idSuffix={ID} />
      </div>
    </Card>
  );
}
