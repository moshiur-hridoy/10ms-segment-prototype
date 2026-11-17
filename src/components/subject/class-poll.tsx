"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChartColumn, Check, ChevronDown, X } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { useLab } from "@/lib/lab";
import { usePlayback } from "./playback";
import { DEMO_AUDIENCE } from "./demo-audience";
import { DEMO_POLLS } from "./demo-polls";

/**
 * Lab `class` v20 (P103): the teacher's poll. It opens at its moment in the video (live: when the teacher
 * starts it from the studio; a recording replays it there), counts down a minute and closes by itself.
 * Phones: a sheet from the bottom, below the video, with no backdrop, so the video and its slide stay in
 * view. Wide screens: a card at the bottom right, above the lab chip. Full screen: a panel on the right, and the video
 * moves left to make room (the stage's `data-poll`), so the slide stays whole. "পরে" folds it to a pill
 * with the time left. After an answer, the class's answers show as bars, with the student's marked.
 */
export function ClassPoll({ itemId, locale, labels }: { itemId: string; locale: Locale; labels: Dictionary["syllabus"]["poll"] }) {
  const lab = useLab("class") !== null;
  const pb = usePlayback();
  const poll = lab ? DEMO_POLLS[itemId] : undefined;
  const [answer, setAnswer] = useState<number | null>(null);
  const [folded, setFolded] = useState(false);
  const [closed, setClosed] = useState(false);
  const live = DEMO_AUDIENCE[itemId]?.live ?? false;
  const left = poll ? poll.at + poll.seconds - pb.time : 0;
  const open = !!poll && pb.phase !== "idle" && pb.phase !== "loading" && pb.time >= poll.at && left > 0 && !closed;
  const full = pb.fullStage;
  const panel = open && !folded;

  useEffect(() => {
    if (!full) return;
    full.toggleAttribute("data-poll", panel);
    return () => full.removeAttribute("data-poll");
  }, [full, panel]);

  if (!open || !poll) return null;
  const fmt = createFormatter(locale, 0);
  const time = fmt.duration(left);
  const dark = Boolean(full);

  if (folded) {
    const pill = (
      <button
        type="button"
        onClick={() => setFolded(false)}
        aria-label={`${labels.open}: ${fill(labels.left, { time })}`}
        className={cn(
          "z-40 flex h-11 items-center gap-2 rounded-full bg-player px-4 text-sm font-semibold text-on-fill shadow-pop ring-1 ring-on-fill/15 press",
          full
            ? "absolute top-3 left-1/2 -translate-x-1/2"
            : "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 lg:right-6 lg:bottom-16 lg:left-auto lg:translate-x-0",
        )}
      >
        <ChartColumn className="size-4" aria-hidden />
        {labels.title}
        <span className="text-on-fill/70 tabular-nums">· {time}</span>
      </button>
    );
    return createPortal(pill, full ?? document.body);
  }

  const card = (
    <section
      role="region"
      aria-label={labels.title}
      className={cn(
        "z-40 grid content-start gap-3 overflow-y-auto overscroll-contain p-4 transition-[translate,opacity] duration-(--motion-base) ease-emphasis starting:opacity-0",
        full
          ? "absolute top-3 right-3 max-h-[calc(100%-6rem)] w-[min(22rem,45%)] rounded-xl bg-player text-on-fill shadow-pop ring-1 ring-on-fill/15 starting:translate-x-8"
          : "fixed inset-x-0 bottom-0 max-h-[60dvh] rounded-t-xl border-t border-border bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] text-text shadow-pop starting:translate-y-8 lg:inset-x-auto lg:right-6 lg:bottom-16 lg:w-96 lg:rounded-xl lg:border",
      )}
    >
      <div className="flex items-center gap-2">
        <ChartColumn className={cn("size-4 shrink-0", dark ? "text-on-fill" : "text-brand-text")} aria-hidden />
        <span className="text-sm font-semibold">{labels.title}</span>
        {live && (
          <span className="flex items-center gap-1 text-xs font-semibold text-live">
            <span className="size-1.5 rounded-full bg-live motion-safe:animate-pulse" aria-hidden />
            {labels.live}
          </span>
        )}
        <span className={cn("ml-auto text-xs tabular-nums", dark ? "text-on-fill/70" : "text-subtle")}>{fill(labels.left, { time })}</span>
        {answer === null ? (
          <button
            type="button"
            onClick={() => setFolded(true)}
            className={cn(
              "-my-1 -mr-2 flex h-9 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors",
              dark ? "hover:bg-on-fill/10" : "text-muted hover:bg-raised",
            )}
          >
            {labels.later}
            <ChevronDown className="size-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label={labels.close}
            className={cn(
              "-my-1 -mr-2 grid size-9 place-items-center rounded-full transition-colors",
              dark ? "hover:bg-on-fill/10" : "text-muted hover:bg-raised",
            )}
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {/* The minute running out. */}
      <span className={cn("h-1 overflow-hidden rounded-full", dark ? "bg-on-fill/15" : "bg-border")} aria-hidden>
        <span
          className="block h-full rounded-full bg-brand transition-[width] duration-1000 ease-linear"
          style={{ width: `${(left / poll.seconds) * 100}%` }}
        />
      </span>

      <p className="type-subtitle">{poll.question}</p>

      <ul className="grid gap-2">
        {poll.options.map((o, i) => (
          <li key={o}>
            {answer === null ? (
              <button
                type="button"
                onClick={() => setAnswer(i)}
                className={cn(
                  "flex min-h-11 w-full items-center rounded-md border px-3 py-2 text-left text-sm font-semibold transition-colors press",
                  dark ? "border-on-fill/20 hover:bg-on-fill/10" : "border-border hover:border-border-strong hover:bg-raised",
                )}
              >
                {o}
              </button>
            ) : (
              <div
                className={cn(
                  "relative flex min-h-11 items-center gap-2 overflow-hidden rounded-md border px-3 py-2 text-sm",
                  i === answer ? "border-brand font-semibold" : dark ? "border-on-fill/20" : "border-border",
                )}
              >
                <span
                  className={cn("absolute inset-y-0 left-0", i === answer ? "bg-brand/20" : dark ? "bg-on-fill/10" : "bg-raised")}
                  style={{ width: `${poll.votes[i]}%` }}
                  aria-hidden
                />
                <span className="relative min-w-0 flex-1">{o}</span>
                {i === answer && (
                  <span className="relative flex items-center gap-1 text-xs font-semibold">
                    <Check className="size-4" aria-hidden />
                    <span className="sr-only">{labels.yours}</span>
                  </span>
                )}
                <span className="relative text-xs font-semibold tabular-nums">{fmt.percent(poll.votes[i])}</span>
              </div>
            )}
          </li>
        ))}
      </ul>

      {answer !== null && (
        <p role="status" className={cn("text-xs", dark ? "text-on-fill/70" : "text-subtle")}>
          {labels.sent} · {live ? labels.classAnswers : labels.liveAnswers}
        </p>
      )}
    </section>
  );

  return createPortal(card, full ?? document.body);
}
