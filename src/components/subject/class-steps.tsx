"use client";

import { Atom, Check, ChevronDown, ExternalLink, Inbox, ListChecks, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/design-system/atoms/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import type { JourneyTask } from "./class-journey";
import { useLabAt } from "@/lib/lab";
import type { Attendance } from "./demo-attendance";
import { usePlayback } from "./playback";

/** Watched this far (percent) counts the video step as done. */
const WATCHED_AT = 90;

type Step = {
  key: string;
  label: string;
  sub?: string;
  done: boolean;
  /** The current step's button. */
  action: string;
  href?: string;
  onClick?: () => void;
  /** Done steps show their sub line; a step with nothing to do yet is greyed out. */
  inactive?: boolean;
  /** Lab `concept` v7 (P157): a step that can't be done any more (a live class missed): an orange cross. */
  missed?: boolean;
};

/*
 * Lab `concept` v2 (O12, P151): what to do in this class as one path, in the order a student does it:
 * watch the class, open the slide, do the homework. Done steps are ticked, the first one not done is
 * the current step and the only one with a button; nothing is locked. Teacher inbox, MCQ and the
 * simulation sit under it as one quiet row, since they are extras, not steps.
 */
export function ClassSteps({
  tasks,
  videoPct,
  attendance = null,
  locale,
  labels: l,
  className,
}: {
  tasks: JourneyTask[];
  /** 0–100, from the student's progress; the playing video adds to it. */
  videoPct: number;
  /** Lab `concept` v7: how the student attended the live class; null for a recording with no live class. */
  attendance?: Attendance | null;
  locale: Locale;
  labels: { journey: Dictionary["syllabus"]["journey"]; kind: Dictionary["syllabus"]["kind"] };
  className?: string;
}) {
  const j = l.journey;
  const fmt = createFormatter(locale, 0);
  const pb = usePlayback();
  const live = pb.duration > 0 ? (pb.time / pb.duration) * 100 : 0;
  const pct = Math.min(100, Math.max(videoPct, live, pb.demoFull || pb.phase === "ended" ? 100 : 0));
  const watched = pct >= WATCHED_AT;

  const exams = tasks.filter((t) => t.kind === "exam");
  const materials = tasks.filter((t) => t.kind !== "exam");
  const exam = exams.find((t) => !t.done) ?? exams[0];

  // Lab `concept` v7 (P157): the live class's check-in first; the video becomes "the recording", and a missed
  // live class turns it into the way to make up. (v7's progress bar and encouragement line went in v8, P159.)
  const game = useLabAt("concept", 7);
  const liveStep = game && attendance;
  const missedLive = liveStep && attendance === "absent";
  const pctText = fmt.number(Math.round(pct));
  const steps: Step[] = [
    ...(liveStep
      ? [
          {
            key: "live",
            label: j.stepLive,
            sub: attendance === "absent" ? j.liveAbsent : attendance === "late" ? j.liveLate : j.livePresent,
            done: attendance !== "absent",
            missed: attendance === "absent",
            action: "",
          },
        ]
      : []),
    {
      key: "video",
      label: game ? j.stepWatchRec : j.stepWatch,
      sub: game
        ? watched
          ? j.stepWatchedRec
          : pct > 0
            ? fill(j.stepWatchedPctRec, { pct: pctText })
            : missedLive
              ? j.stepMakeUp
              : j.stepNotStarted
        : watched
          ? j.stepWatched
          : pct > 0
            ? fill(j.stepWatchedPct, { pct: pctText })
            : j.stepNotStarted,
      done: watched,
      action: pct > 0 ? j.actResume : j.actWatch,
      onClick: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        pb.play?.();
      },
    },
    ...materials.map((t) => ({
      key: t.id,
      label: t.label,
      sub: t.done ? j.stepOpened : t.meta || j.stepNotOpened,
      done: t.done,
      action: j.actOpen,
      href: t.href,
    })),
    exam
      ? {
          key: "homework",
          label: j.homework,
          sub:
            game && exams.every((t) => t.done)
              ? j.hwDone
              : [fill(j.examCount, { n: fmt.number(exams.length) }), exams.length === 1 && exam.meta].filter(Boolean).join(" · "),
          done: exams.every((t) => t.done),
          action: j.actStart,
          href: exam.href,
        }
      : { key: "homework", label: j.homework, sub: j.homeworkEmpty, done: false, action: "", inactive: true },
  ];

  const counted = steps.filter((s) => !s.inactive);
  const doneCount = counted.filter((s) => s.done).length;
  const left = counted.filter((s) => !s.done && !s.missed).length;
  const allDone = left === 0;
  const current = steps.find((s) => !s.done && !s.inactive && !s.missed);
  // Lab `concept` v4 (P154): the header lines up with the steps (their 4px inset), and the chips sit 12px under the card, not 8.
  const even = useLabAt("concept", 4);

  return (
    <section aria-label={j.afterClass} className={cn("grid", even ? "gap-3" : "gap-2", className)}>
      <Card radius="md" className="px-3 pt-3 pb-1">
        <div className={cn("flex items-baseline justify-between gap-3 pb-2", even && "px-1")}>
          <h2 className="text-sm font-bold">{allDone ? j.stepsAllDone : j.stepsTitle}</h2>
          <span className={cn("text-xs font-semibold tabular-nums", allDone ? "text-success" : "text-subtle")}>
            {fill(j.stepsCount, { done: fmt.number(doneCount), total: fmt.number(counted.length) })}
          </span>
        </div>
        <ol>
          {steps.map((s, i) => (
            <StepRow
              key={s.key}
              step={s}
              n={fmt.number(i + 1)}
              now={s === current}
              last={i === steps.length - 1}
              doneLabel={j.stepDone}
              missedLabel={j.stepMissed}
            />
          ))}
        </ol>
      </Card>
      <Extras labels={j} />
    </section>
  );
}

function StepRow({
  step: s,
  n,
  now,
  last,
  doneLabel,
  missedLabel,
}: {
  step: Step;
  n: string;
  now: boolean;
  last: boolean;
  doneLabel: string;
  missedLabel: string;
}) {
  // Lab `concept` v6 (P156): the circle centred on its two lines (title and sub), not on the title's top,
  // and the line between circles 4px clear of both (it was 2px under one and 14px above the next).
  const centred = useLabAt("concept", 6);
  const body = (
    <>
      <span className="relative flex justify-center self-stretch">
        {/* The path: a line from this stop down to the next. */}
        {!last && (
          <span
            aria-hidden
            className={cn("absolute w-0.5 rounded-full", centred ? "top-9 -bottom-5" : "top-7 -bottom-1", s.done ? "bg-success/40" : "bg-border")}
          />
        )}
        <span
          aria-hidden
          className={cn(
            "relative grid size-6 place-items-center rounded-full text-xs font-bold",
            centred ? "mt-2" : "mt-0.5",
            s.missed
              ? "bg-warning text-on-primary"
              : s.done
                ? "bg-success text-on-primary"
                : now
                  ? "bg-surface text-brand ring-2 ring-brand"
                  : "bg-surface text-subtle ring-1 ring-border-strong",
          )}
        >
          {s.missed ? <X className="size-3.5" strokeWidth={3} /> : s.done ? <Check className="size-3.5" strokeWidth={3} /> : n}
        </span>
      </span>
      <span className="grid min-w-0 flex-1 py-0.5">
        <span className={cn("truncate text-sm", now ? "font-bold" : "font-semibold", s.done && "text-subtle", s.inactive && "text-subtle")}>
          {s.label}
          {s.done && <span className="sr-only"> ({doneLabel})</span>}
          {s.missed && <span className="sr-only"> ({missedLabel})</span>}
        </span>
        {s.sub && <span className={cn("truncate text-xs", s.missed ? "font-semibold text-warning" : "text-subtle")}>{s.sub}</span>}
      </span>
      {now && s.action && (
        <span className="shrink-0 self-center rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-on-primary">{s.action}</span>
      )}
    </>
  );
  const row = "flex w-full items-start gap-3 rounded-md px-1 pt-1 pb-3 text-start transition-colors press";
  return (
    <li>
      {s.inactive || s.missed ? (
        <div className={row}>{body}</div>
      ) : s.href ? (
        <Link href={s.href} replace className={cn(row, "hover:bg-raised")}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={s.onClick} className={cn(row, "hover:bg-raised")}>
          {body}
        </button>
      )}
    </li>
  );
}

/** The extras, one quiet row: grey icons, regular weight. MCQ opens its line in place; the other two open outside. */
function Extras({ labels: j }: { labels: Dictionary["syllabus"]["journey"] }) {
  const [mcq, setMcq] = useState(false);
  // Lab `concept` v3 (P152): each extra is a small bordered chip with its colour on the icon, so one alone
  // (a class without MCQ or simulation) still looks placed on purpose, not like a stray link.
  const chips = useLabAt("concept", 3);
  // Lab `concept` v4 (P153): the three on one line at phone width, each a third of it, and all three open
  // outside (MCQ too, no fold in place), so they look and work alike.
  const line = useLabAt("concept", 4);
  // Lab `concept` v13 (P166): the line's chips without their left icons, for room around the words; the ↗ stays.
  const bare = useLabAt("concept", 13);
  const item = line
    ? "flex min-h-10 min-w-0 flex-auto items-center justify-center gap-1 rounded-full border border-border bg-surface px-2 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors press hover:bg-raised"
    : chips
      ? "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border bg-surface ps-2.5 pe-3 text-sm font-semibold transition-colors press hover:bg-raised"
      : "flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-subtle transition-colors press hover:bg-raised hover:text-text";
  const icon = (Icon: typeof Inbox, tone: string) =>
    chips ? (
      <span className={cn("grid shrink-0 place-items-center rounded-full", line ? "size-5" : "size-6", tone)}>
        <Icon className={line ? "size-3" : "size-3.5"} aria-hidden />
      </span>
    ) : (
      <Icon className="size-4" aria-hidden />
    );
  const tail = line ? "size-3 shrink-0 text-subtle" : chips ? "size-3.5 text-subtle" : "size-3.5";
  const outside = (label: string, Icon: typeof Inbox, tone: string) => (
    <a href="#" target="_blank" rel="noopener noreferrer" className={item}>
      {!(line && bare) && icon(Icon, tone)}
      {line ? <span className="min-w-0 truncate">{label}</span> : label}
      <ExternalLink className={tail} aria-hidden />
      <span className="sr-only">{j.opensOutside}</span>
    </a>
  );
  if (line)
    return (
      <div className="flex gap-2">
        {outside(j.askTeacher, Inbox, "bg-info-soft text-info")}
        {outside(j.mcq, ListChecks, "bg-highlight-soft text-highlight")}
        {outside(j.simulation, Atom, "bg-success-soft text-success")}
      </div>
    );
  return (
    <div className={cn("grid", chips && "gap-2")}>
      <div className={cn("flex flex-wrap items-center", chips ? "gap-2" : "-mx-2 gap-x-1")}>
        {outside(j.askTeacher, Inbox, "bg-info-soft text-info")}
        <button type="button" aria-expanded={mcq} onClick={() => setMcq(!mcq)} className={item}>
          {icon(ListChecks, "bg-highlight-soft text-highlight")}
          {j.mcq}
          <ChevronDown className={cn(tail, "transition-transform", mcq && "rotate-180")} aria-hidden />
        </button>
        {outside(j.simulation, Atom, "bg-success-soft text-success")}
      </div>
      {mcq && <p className={cn("text-sm text-subtle", chips ? "px-1" : "pb-1")}>{j.mcqEmpty}</p>}
    </div>
  );
}
