"use client";

import { CalendarDays, CalendarX2, ChevronRight, Lock, PenLine } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Card } from "@/design-system/atoms/card";
import { BARE_ON_PHONE } from "./section-title";
import { LiveWaves } from "@/design-system/molecules/task-tile";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BatchClass } from "@/lib/api";
import { weekStart } from "@/lib/api/routine";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { freeEachSubject, freeLiveIds } from "@/lib/guest";
import { dhakaDay, shiftDay } from "@/lib/time";

type L = Dictionary["segment"];

/*
 * CT74 (lab `free-routine` v1): the paid batch's live routine on the batch page, beside "কোথা থেকে শুরু করবে",
 * as the landing's hero puts its notebook beside its picker. The dashboard's routine card (TasksCard): its gradient,
 * its title with "ফুল রুটিন দেখো", its rows with the time tile. On top, this week (Saturday → Friday) as seven days,
 * a dot per class, green for a free one; a tap shows that day. LIVE_PASSES of the classes are free after a login
 * (`freeLiveIds`), the rest open with the batch. The free batch's own experience stays below, as it was.
 */
export function BatchRoutine({
  classes,
  hard,
  now,
  fmt,
  l,
  fullHref,
  login,
  joinLogin,
  openTag = null,
  className,
  bareOnPhone = false,
  tabDays = false,
  exams = [],
  title,
  batchTags = false,
  footer,
  signedIn = false,
  open = [],
  quiet = false,
  freeHref,
  tightDays = false,
  glassTrack = false,
  freeEach = false,
  tidy = false,
}: {
  classes: BatchClass[];
  /** The visitor's hard subjects (catalogue ids), whose classes are the free ones when there are any. */
  hard: string[];
  now: number;
  fmt: Formatter;
  l: L;
  /** The full routine for this batch and stream (`/routine?batch=`); the chosen day is added when it isn't today. */
  fullHref: string;
  /** The login button for a free class, and its "log in to join" while the class is live. */
  login: ReactNode;
  joinLogin: ReactNode;
  className?: string;
  /** CT117: no card on phones, the routine straight on the page (the segment page's one padding). */
  bareOnPhone?: boolean;
  /** CT118: the week as the page's segmented tabs: a grey track, the chosen day a white tab with a soft shadow, no green but the free dots and today. */
  tabDays?: boolean;
  /** CT90 (lab `segment-home`): the batch's exams, as rows of their own among the classes; never free. */
  exams?: BatchClass[];
  /** CT90: the card's title in place of "পেইড ব্যাচের লাইভ রুটিন". */
  title?: string;
  /** CT90: each row names its online batch ("HSC 27 অনলাইন ব্যাচ - ফিজিক্স") in place of the subject. */
  batchTags?: boolean;
  /** CT90: a row of actions under the day's list (book a demo class). */
  footer?: ReactNode;
  /** CT99: signed in, the free classes are the student's own ("তোমার জন্য ফ্রি"), no login in the lead. */
  signedIn?: boolean;
  /** CT104: subjects (catalogue ids) whose every class is free without a login, and what their rows say instead of a login. */
  open?: string[];
  openTag?: ReactNode;
  /**
   * CT121 (lab `segment-home` v28): quiet rows. The title is the subject alone, the line under it the time once, the
   * batch named once beside the day; no button per row: a free row is itself the link (`freeHref`, with a ›), a locked
   * one shows a lock. The page puts one login under the list (`footer`). An open subject's tag (`openTag`) sits by the name.
   */
  quiet?: boolean;
  freeHref?: string;
  /** CT123 (lab `segment-home` v30): with `tabDays`, the date on its own line height, not the old circle's 32px box, so name, date and dots sit close. */
  tightDays?: boolean;
  /** CT144 (lab `segment-home` v49): with `tabDays`, the track as glass over the card's wash instead of grey. */
  glassTrack?: boolean;
  /** CT146 (lab `segment-home` v51): the next class of every subject is free after a login (`freeEachSubject`), not two in all. */
  freeEach?: boolean;
  /**
   * CT148 (v51), with `quiet`: a class row names its subject as the rest of the page does ("ম্যাথ", not "উচ্চতর গণিত · ম্যাথ"),
   * and a locked class's band shows a lock instead of its subject (which didn't fit: "বায়ো…").
   */
  tidy?: boolean;
}) {
  const today = dhakaDay(now);
  const start = weekStart(today);
  const days = useMemo(() => Array.from({ length: 7 }, (_, k) => shiftDay(start, k)), [start]);
  // CT104: the login passes go to the other subjects; an open subject's classes are free anyway.
  const openKey = open.join(",");
  const free = useMemo(
    () =>
      new Set(
        freeEach
          ? freeEachSubject(classes, now)
          : freeLiveIds(
              classes.filter((c) => !openKey.split(",").includes(c.subject)),
              now,
              hard,
            ),
      ),
    [classes, now, hard, openKey, freeEach],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, BatchClass[]>(days.map((d) => [d, []]));
    for (const c of [...classes, ...exams]) map.get(dhakaDay(Date.parse(c.startsAt)))?.push(c);
    for (const list of map.values()) list.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    return map;
  }, [classes, exams, days]);
  const [day, setDay] = useState(today);

  const week = days.flatMap((d) => byDay.get(d) ?? []);
  const freeThisWeek = week.filter((c) => free.has(c.id)).length;
  const list = byDay.get(day) ?? [];
  // CT121: the batch, named once beside the day ("HSC 28 অনলাইন ব্যাচ - ফিজিক্স" → "HSC 28 অনলাইন ব্যাচ").
  const batchName = batchTags ? classes[0]?.course.split(" - ")[0] : undefined;
  const href = day === today ? fullHref : `${fullHref}${fullHref.includes("?") ? "&" : "?"}day=${day}`;

  return (
    <Card
      as="section"
      aria-labelledby="batch-routine-title"
      className={cn(
        "grid grid-cols-1 content-start gap-4 p-5 sm:p-6",
        bareOnPhone && cn(BARE_ON_PHONE, "sm:[background-image:var(--grad-classes)]"),
        className,
      )}
      style={bareOnPhone ? undefined : { backgroundImage: "var(--grad-classes)" }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="batch-routine-title" className="type-title">
            {title ?? l.routineTitle}
          </h2>
          {week.length > 0 && (
            // Only this week's free classes count here; the rest of the two may fall next week (the full routine shows them).
            <p className="text-sm text-muted">
              {freeThisWeek > 0
                ? fill(signedIn ? l.homeRoutineLeadIn : freeEach ? l.routineLeadEach : l.routineLead, {
                    n: fmt.number(week.length),
                    free: fmt.number(freeThisWeek),
                  })
                : fill(l.routineLeadNoFree, { n: fmt.number(week.length) })}
            </p>
          )}
        </div>
        {/* The dashboard's "ফুল রুটিন দেখো". */}
        <Link
          href={href}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-soft"
        >
          <CalendarDays className="size-4" aria-hidden />
          {l.routineFull}
        </Link>
      </header>

      {classes.length + exams.length === 0 ? (
        <p className="flex items-center gap-3 rounded-md bg-surface px-4 py-6 text-sm text-muted shadow-sm">
          <CalendarX2 className="size-5 shrink-0 text-subtle" aria-hidden />
          {l.routineNone}
        </p>
      ) : (
        <>
          {/* CT77: glass, so the card's gradient shows through: a see-through white with a light blur. CT82: the edge is the grey
              border, as a white one vanished where the card turns white (full width, v8). */}
          <div
            role="group"
            aria-label={l.routineWeek}
            className={cn(
              "grid grid-cols-7 gap-1 rounded-md",
              tabDays
                ? // On phones with no card around it (bareOnPhone), the grey track sits on the grey page: a shade darker so it still reads.
                  glassTrack
                  ? // CT144 (lab `segment-home` v49): see-through white with a blur, so the card's red wash shows through; the grey edge
                    // keeps it visible where the card turns white. Phones without a card keep the grey track.
                    cn(
                      "bg-surface/50 p-1 ring-1 ring-border ring-inset backdrop-blur-md",
                      bareOnPhone && "max-sm:bg-border/60 max-sm:backdrop-blur-none",
                    )
                  : cn("bg-raised p-1 ring-1 ring-border ring-inset", bareOnPhone && "max-sm:bg-border/60")
                : "border border-border bg-surface/50 p-1.5 backdrop-blur-md",
            )}
          >
            {days.map((d) => {
              const items = byDay.get(d) ?? [];
              const freeHere = items.filter((c) => free.has(c.id)).length;
              const on = d === day;
              const isToday = d === today;
              const said = [fmt.dayTitle(d), items.length ? fill(l.routineDayClasses, { n: fmt.number(items.length) }) : l.routineOff];
              if (freeHere) said.push(fill(l.routineDayFree, { n: fmt.number(freeHere) }));
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  aria-label={said.join(", ")}
                  onClick={() => setDay(d)}
                  className={cn(
                    // CT118: inside the track's 4px, a tab's corner is the track's less 4px, so the two curves nest.
                    "grid min-w-0 place-items-center content-center transition-colors",
                    tightDays ? "h-16 gap-1.5" : "h-18 gap-1",
                    tabDays ? "rounded-sm" : "rounded-md",
                    tabDays ? (on ? "bg-surface shadow-card" : "hover:bg-surface/60") : on ? "bg-brand-soft" : "hover:bg-raised",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "max-w-full truncate text-xs",
                      isToday ? "font-bold text-brand-text" : on ? cn("font-semibold", tabDays && "text-text") : "text-subtle",
                    )}
                  >
                    {fmt.weekday(d)}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      tightDays ? "text-base leading-5 tabular-nums" : "grid size-8 place-items-center rounded-full text-sm tabular-nums",
                      tabDays
                        ? isToday
                          ? "font-bold text-brand-text"
                          : on && "font-bold text-text"
                        : on
                          ? "bg-primary font-bold text-on-primary"
                          : isToday
                            ? "font-bold text-brand-text ring-2 ring-brand ring-inset"
                            : "",
                    )}
                  >
                    {fmt.dayNumber(d)}
                  </span>
                  <span aria-hidden className="flex h-1.5 items-center gap-0.5">
                    {items.length === 0 ? (
                      <span className="text-xs leading-none text-subtle">{l.routineOff}</span>
                    ) : (
                      items.map((c) => (
                        <span
                          key={c.id}
                          className={cn("size-1.5 rounded-full", free.has(c.id) || open.includes(c.subject) ? "bg-brand" : "bg-border-strong")}
                        />
                      ))
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <section aria-label={fmt.dayTitle(day)} className="grid gap-1">
            <h3 className="text-xs font-semibold tracking-wide text-subtle">
              {fmt.dayTitle(day)}
              {quiet && batchName && ` · ${batchName}`}
            </h3>
            {list.length === 0 ? (
              <p className="py-3 text-sm text-muted">{l.routineDayEmpty}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-1">
                {list.map((c) => (
                  <Row
                    key={c.id}
                    c={c}
                    free={free.has(c.id) || open.includes(c.subject)}
                    now={now}
                    fmt={fmt}
                    l={l}
                    login={open.includes(c.subject) ? openTag : login}
                    joinLogin={open.includes(c.subject) ? openTag : joinLogin}
                    batchTag={batchTags}
                    quiet={quiet}
                    tidy={tidy}
                    freeHref={open.includes(c.subject) ? href : freeHref}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {footer && <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">{footer}</div>}
    </Card>
  );
}

/** One class: the dashboard's time tile (red while live), the title, subject and time, and either its login or its lock. */
function Row({
  c,
  free,
  now,
  fmt,
  l,
  login,
  joinLogin,
  batchTag = false,
  quiet = false,
  tidy = false,
  freeHref,
}: {
  c: BatchClass;
  free: boolean;
  now: number;
  fmt: Formatter;
  l: L;
  login: ReactNode;
  joinLogin: ReactNode;
  batchTag?: boolean;
  quiet?: boolean;
  tidy?: boolean;
  freeHref?: string;
}) {
  const exam = c.kind === "exam";
  const start = Date.parse(c.startsAt);
  const end = Date.parse(c.endsAt);
  // An exam's window runs all day, so it is never lit as live.
  const live = !exam && now >= start && now < end;
  const ended = now >= end;
  const { period, clock } = fmt.timeParts(start);
  const when = ended ? `${l.routineEnded} · ${fmt.time(c.startsAt)}` : `${fmt.time(c.startsAt)} – ${fmt.time(c.endsAt)}`;

  // The dashboard's 56px tile: the time on top; the band says live, free or just a class.
  const tile = (
    <Card
      as="div"
      radius="md"
      aria-hidden
      className={cn("grid size-14 shrink-0 grid-rows-[1fr_auto] overflow-hidden text-center", ended && "opacity-60")}
    >
      <div className="grid place-items-center">
        {live ? (
          <LiveWaves className="size-7 text-live" />
        ) : exam ? (
          <PenLine className="size-5 text-muted" />
        ) : (
          <span className="grid">
            <span className="text-xs leading-none font-medium text-subtle">{period}</span>
            <span className="mt-0.5 text-sm leading-none font-bold tabular-nums">{clock}</span>
          </span>
        )}
      </div>
      <div
        className={cn(
          "truncate px-1 py-0.5 text-xs leading-4 font-bold text-on-fill",
          live ? "bg-class-band-live" : free ? "bg-brand" : "bg-class-band-class",
        )}
      >
        {free ? l.routineFree : exam ? l.homeExam : tidy ? <Lock className="mx-auto size-3.5" strokeWidth={2.5} /> : c.subjectName}
      </div>
    </Card>
  );

  if (quiet) {
    // The made-up title of a weekly slot ("ফিজিক্স · লাইভ ক্লাস") says the subject twice over; the subject alone does.
    const name = tidy && !exam ? c.subjectName : c.title.replace(/ · লাইভ ক্লাস$/, "");
    const tag = free && !ended ? login : null;
    const body = (
      <>
        {tile}
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className={cn("flex min-w-0 items-center gap-2 font-semibold", ended && "text-muted")}>
            <span className="truncate">{name}</span>
            {/* An open subject's tag ("ফ্রি বিষয়") by the name; other free rows say nothing more, the band says ফ্রি. */}
            {tag && <span className="shrink-0">{tag}</span>}
          </p>
          <p className="truncate text-sm text-muted">{name === c.subjectName || exam ? when : `${when} · ${c.subjectName}`}</p>
        </div>
        {free && !ended && freeHref ? (
          <ChevronRight className="size-5 shrink-0 text-subtle" aria-hidden />
        ) : !free && !ended ? (
          // CT148: with `tidy` the lock is on the tile's band; the row still says so to a screen reader.
          tidy ? (
            <span className="sr-only">{l.routineLocked}</span>
          ) : (
            <Lock className="size-4 shrink-0 text-subtle" aria-label={l.routineLocked} />
          )
        ) : null}
      </>
    );
    const row = cn("-mx-2 flex items-center gap-3 rounded-md p-2 sm:gap-4", live && "bg-danger-soft/60");
    return (
      <li>
        {free && !ended && freeHref ? (
          <Link href={freeHref} className={cn(row, "hover:bg-raised")}>
            {body}
          </Link>
        ) : (
          <div className={row}>{body}</div>
        )}
      </li>
    );
  }

  return (
    <li className={cn("flex items-center gap-3 rounded-md p-2 -mx-2 sm:gap-4", live && "bg-danger-soft/60")}>
      {tile}
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className={cn("truncate font-semibold", ended && "text-muted")}>{c.title}</p>
        <p className="truncate text-sm text-muted">
          {when}
          <span aria-hidden className="text-subtle">
            {" "}
            ·{" "}
          </span>
          {batchTag ? (
            <span className="rounded-sm bg-raised px-1.5 py-px text-xs font-medium text-muted">{c.course}</span>
          ) : (
            <span className="text-subtle">{c.subjectName}</span>
          )}
        </p>
        {/* On phones the button sits under the text, as the dashboard's rows do. */}
        {free && !ended && <span className="mt-1.5 sm:hidden">{live ? joinLogin : login}</span>}
      </div>
      {free ? (
        !ended && <span className="hidden shrink-0 sm:block">{live ? joinLogin : login}</span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-subtle">
          <Lock className="size-3.5" aria-hidden />
          {l.routineLocked}
        </span>
      )}
    </li>
  );
}
