"use client";

import { Check, ChevronRight, Droplet, Play, Target, TreeDeciduous } from "lucide-react";
import Link from "next/link";
import { Button } from "@/design-system/atoms/button";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { ItemIcon } from "./item-icon";
import { DEMO_EXAM_PEERS } from "./demo-peers";
import type { UpNextStep } from "./up-next";

/*
 * Lab `class` (P52): what the "up next" card says when a class video ends. First the effort
 * (a real number: how long the class was), then the reward the product already has (today's
 * watering of the streak tree), then the next task with a reason. Items already done are skipped
 * and named in a line; the exam comes first, because testing yourself right after the class is
 * what makes it stick. Only a next class counts down; an exam or a slide waits for the student.
 * P111: more room between the parts and less text. A class left early shows a ring of how much was
 * watched; an exam is a target to beat (the class's average), with how the class did as three numbers.
 */

type Labels = Dictionary["syllabus"]["upNext"]["done"];

/** Where the class leaves the student: the main next task, a second one, and what is already done. */
export function planNext(steps: UpNextStep[]) {
  const doc = (s: UpNextStep) => s.kind === "slide" || s.kind === "sheet";
  const exam = steps.find((s) => s.kind === "exam" && !s.done);
  const docs = steps.filter((s) => doc(s) && !s.done);
  const nextClass = steps.find((s) => s.kind === "video");
  const main = exam ?? docs[0] ?? nextClass;
  return {
    main,
    /** With the exam as the main task, an unread slide or sheet is offered in a line under it. */
    also: main?.kind === "exam" ? docs[0] : undefined,
    /** "পরে" goes here when the main task isn't the next class. */
    later: main === nextClass ? undefined : nextClass,
    doneExam: steps.find((s) => s.kind === "exam" && s.done),
    doneDoc: steps.find((s) => doc(s) && s.done),
  };
}

export type Plan = ReturnType<typeof planNext>;

/** How the class went: watched (nearly) all of it, or jumped to the end with some left. */
export type Effort = { full: true; seconds: number } | { full: false; leftPct: number };

/** Today's watering: newly watered by this class, already watered earlier, or still short of the goal. */
export type Reward = { state: "watered" | "already" | "short"; streak: number; minutesToday: number; minutesLeft: number };

/** "২ ঘণ্টা ১০ মিনিট" */
function spoken(seconds: number, l: Labels, fmt: Formatter) {
  const total = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return fill(l.m, { m: fmt.number(m) });
  return m === 0 ? fill(l.h, { h: fmt.number(h) }) : fill(l.hm, { h: fmt.number(h), m: fmt.number(m) });
}

export function ClassDone({
  plan,
  effort,
  reward,
  countdown,
  labels: l,
  fmt,
  onCancel,
}: {
  plan: Plan;
  effort: Effort;
  reward: Reward | null;
  /** The next class's countdown (only when the main task is the next class). */
  countdown: { remaining: number; fraction: number; cancelled: boolean } | null;
  labels: Labels;
  fmt: Formatter;
  onCancel: () => void;
}) {
  const { main, also, later, doneExam, doneDoc } = plan;
  const showReward = effort.full && reward;
  const watched = effort.full ? 100 : 100 - effort.leftPct;
  const head = effort.full ? fill(l.praise, { time: spoken(effort.seconds, l, fmt) }) : fill(l.watched, { pct: fmt.percent(watched) });
  const sub = showReward
    ? reward.state === "watered"
      ? fill(l.watered, { n: fmt.number(reward.streak) })
      : reward.state === "already"
        ? fill(l.already, { time: fmt.minutes(reward.minutesToday), n: fmt.number(reward.streak) })
        : fill(l.short, { n: fmt.number(reward.minutesLeft) })
    : effort.full
      ? null
      : l.leftHint;

  const taskHead = !main ? null : main.kind === "exam" ? l.examHead : main.kind === "video" ? l.nextHead : l.docHead;
  const why = !main ? null : main.kind === "exam" ? l.examWhy : main.kind === "video" ? main.meta : l.docWhy;
  // P108: how the class did in this exam (sample numbers for now), as something to measure against.
  const peers = main?.kind === "exam" ? DEMO_EXAM_PEERS[main.id] : undefined;
  const donePeers = doneExam ? DEMO_EXAM_PEERS[doneExam.id] : undefined;

  return (
    <div className="grid gap-5 pt-1">
      {/* The effort: the tree it watered, or how much of the class was watched. */}
      <div className="flex items-center gap-3">
        {effort.full ? (
          <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-on-fill/10">
            <TreeDeciduous className="size-6 text-brand-text" aria-hidden />
            {showReward && reward.state === "watered" && (
              <Droplet className="absolute -top-1 right-0 size-3.5 animate-drop-fall fill-info text-info" aria-hidden />
            )}
          </span>
        ) : (
          <WatchedRing pct={watched} label={fmt.percent(watched)} />
        )}
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="text-sm font-semibold">{head}</p>
          {sub && <p className="text-xs text-on-fill/70">{sub}</p>}
        </div>
      </div>

      {main?.kind === "exam" ? (
        // The exam as a target: beat the class's average (sample numbers for now, P108).
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/15">
              <Target className="size-6 text-brand-text" aria-hidden />
            </span>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <p className="text-base font-semibold">{peers ? fill(l.beat, { avg: fmt.number(peers.avg) }) : l.examHead}</p>
              <p className="text-xs text-on-fill/70">{[main.kindLabel, main.meta, peers ? l.peersWhy : l.examWhy].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          {peers && (
            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: l.took, value: fmt.number(peers.takers) },
                { label: l.avg, value: fmt.number(peers.avg), of: fmt.number(peers.total) },
                { label: l.top, value: fmt.number(peers.top), of: fmt.number(peers.total) },
              ].map((t) => (
                <div key={t.label} className="flex flex-col-reverse items-center gap-0.5 rounded-lg bg-on-fill/5 px-2 py-2.5">
                  <dt className="text-xs text-on-fill/70">{t.label}</dt>
                  <dd className="type-subtitle tabular-nums">
                    {t.value}
                    {t.of && <span className="text-xs font-medium text-on-fill/60">/{t.of}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ) : (
        main && (
          <div className="grid gap-2 rounded-lg bg-on-fill/5 p-3">
            <p className="text-xs font-semibold text-brand-text">
              {main.kind === "video" && countdown && !countdown.cancelled
                ? fill(l.startsIn, { n: fmt.number(Math.max(0, countdown.remaining)) })
                : taskHead}
            </p>
            <div className="flex items-center gap-3">
              <ItemIcon kind={main.kind} size="sm" />
              <div className="grid min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-semibold">
                  {main.kind === "video" ? main.title : [main.kindLabel, main.meta].filter(Boolean).join(" · ")}
                </span>
                {why && <span className="text-xs text-on-fill/70">{why}</span>}
              </div>
            </div>
            {main.kind === "video" && countdown && !countdown.cancelled && (
              <span className="h-1 overflow-hidden rounded-full bg-on-fill/15" aria-hidden>
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear"
                  style={{ width: `${countdown.fraction * 100}%` }}
                />
              </span>
            )}
          </div>
        )
      )}

      {/* What the card skipped. */}
      {(doneDoc || doneExam?.score) && (
        <ul className="grid gap-1.5 px-1 text-xs text-on-fill/75">
          {doneDoc && (
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-brand-text" aria-hidden />
              {fill(l.seen, { kind: doneDoc.kindLabel })}
            </li>
          )}
          {doneExam?.score && (
            <li className="flex items-center gap-2">
              <Check className="size-3.5 text-brand-text" aria-hidden />
              {donePeers?.ahead
                ? fill(l.scoredAhead, {
                    got: fmt.number(doneExam.score.got),
                    total: fmt.number(doneExam.score.total),
                    n: fmt.number(donePeers.takers),
                    pct: fmt.percent(donePeers.ahead),
                  })
                : fill(l.scored, { got: fmt.number(doneExam.score.got), total: fmt.number(doneExam.score.total) })}
            </li>
          )}
        </ul>
      )}

      {main && (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            {later ? (
              <Link href={later.href} replace className={onDark}>
                {l.later}
              </Link>
            ) : (
              <button type="button" className={onDark} onClick={onCancel}>
                {main.kind === "video" ? l.cancel : l.later}
              </button>
            )}
            <Button href={main.href} replace>
              {main.kind === "exam" ? l.examGo : main.kind === "video" ? l.playNow : l.open}
              {main.kind === "video" && <Play className="size-4 fill-current" aria-hidden />}
            </Button>
          </div>
          {/* A second task, as a quiet link under the buttons. */}
          {also && (
            <Link
              href={also.href}
              replace
              className="flex min-h-11 items-center justify-center gap-1 rounded-full text-xs font-semibold text-on-fill/75 transition-colors hover:bg-on-fill/5 hover:text-on-fill"
            >
              {fill(l.also, { kind: also.kindLabel })}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** How much of the class was watched, as a ring. */
function WatchedRing({ pct, label }: { pct: number; label: string }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative grid size-11 shrink-0 place-items-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="3" className="stroke-on-fill/15" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className="stroke-brand"
        />
      </svg>
      <span className="text-xs font-semibold tabular-nums" aria-hidden>
        {label}
      </span>
    </span>
  );
}

/** A secondary action on the dark card (as the card's own). */
const onDark = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-on-fill/10 px-5 text-base font-semibold text-on-fill transition-colors press hover:bg-on-fill/15",
);
