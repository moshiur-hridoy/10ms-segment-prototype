import { ClipboardCheck, NotebookPen, Sparkles, Video, type LucideIcon } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { IconTile } from "@/design-system/atoms/icon-tile";
import type { Tone } from "@/design-system/foundations/tone";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { EntryAction, RoutineEntry } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";

/** Each type has its own shape, not just its own colour: a camera, a spark, a checklist, a notebook. */
export const KIND: Record<RoutineEntry["kind"], { icon: LucideIcon; tone: Tone }> = {
  class: { icon: Video, tone: "brand" },
  free: { icon: Sparkles, tone: "info" },
  exam: { icon: ClipboardCheck, tone: "highlight" },
  homework: { icon: NotebookPen, tone: "warning" },
};

const actionVariant: Record<Exclude<EntryAction, "none">, "live" | "soft" | "secondary"> = {
  join: "live",
  exam: "soft",
  submit: "soft",
  watch: "secondary",
  practice: "secondary",
};

export function entryHref(e: RoutineEntry, lang: Locale) {
  if (e.action === "practice") return `/${lang}/superprep`;
  return (e.kind === "class" && e.joinUrl) || e.url || "#";
}

/** The line under the title: when, or what happened. Red only for a deadline within a day, one passed, or a miss. */
export function entryNote(e: RoutineEntry, fmt: Formatter, t: Dictionary): { text: string; tone: "muted" | "danger" | "live" | "success" } {
  const s = t.routine.state;
  const end = e.kind === "homework" ? "" : fmt.time(e.endsAt);
  switch (e.state) {
    case "live":
      return { text: fill(s.live, { time: end }), tone: "live" };
    case "open":
      return { text: fill(s.open, { time: end }), tone: "live" };
    case "upcoming":
      return { text: fill(e.kind === "exam" ? s.opens : s.upcoming, { start: fmt.time(e.at), end }), tone: "muted" };
    case "due":
      return { text: fill(s.due, { time: fmt.time(e.at) }), tone: e.urgent ? "danger" : "muted" };
    case "overdue":
      return { text: s.overdue, tone: "danger" };
    case "missed":
      return { text: e.kind === "exam" ? s.missedExam : s.missedClass, tone: "danger" };
    case "done":
      return { text: s[e.doneHow ?? "attended"], tone: "success" };
    case "ended":
      return { text: fill(s.ended, { start: fmt.time(e.at), end }), tone: "muted" };
  }
}

const noteTone = { muted: "text-muted", danger: "text-danger", live: "text-live", success: "text-success" } as const;

export function EntryActionButton({ e, lang, t, size = "sm", className }: { e: RoutineEntry; lang: Locale; t: Dictionary; size?: "sm" | "md"; className?: string }) {
  if (e.action === "none") return null;
  return (
    <Button size={size} variant={actionVariant[e.action]} href={entryHref(e, lang)} className={cn("shrink-0", className)}>
      {t.routine.action[e.action]}
    </Button>
  );
}

/** A pencil tick, drawn by hand, for what's done. */
export function PencilTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 17.5c2 1.2 4.3 3.4 6.4 6.3C15 16.6 20.4 9.8 27 5.5" />
    </svg>
  );
}

/**
 * One line in the planner's day: the time in the margin, then the type, the title, a note and
 * the next step. Done entries are ticked and struck through; a live class or open exam is lit.
 * Below `lg` the margin narrows, the next step drops under the text (so the title keeps the
 * width) and the tick moves into the margin, under the time, under the time.
 */
export function EntryRow({ e, lang, fmt, t }: { e: RoutineEntry; lang: Locale; fmt: Formatter; t: Dictionary }) {
  const { period, clock } = fmt.timeParts(e.at);
  const note = entryNote(e, fmt, t);
  const kind = KIND[e.kind];
  const lit = e.state === "live" || e.state === "open";
  const done = e.state === "done";
  // CT74: a past class in a batch's routine for a guest: neither ticked nor missed, just quieter.
  const ended = e.state === "ended";

  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] border-b border-border last:border-b-0 max-lg:grid-cols-[3.5rem_minmax(0,1fr)]">
      {/* The time column, right-aligned against a hairline. */}
      <div className="grid content-start justify-items-end border-r border-border py-4 pr-3 tabular-nums max-lg:pr-2">
        <span className="text-xs leading-none text-subtle">{period}</span>
        <span className={cn("mt-1 text-base leading-none font-bold", done && "text-muted")}>{clock}</span>
        {done && <PencilTick className="mt-2 size-6 text-success lg:hidden" />}
      </div>
      <div
        className={cn(
          "flex items-center gap-3 py-3 pl-4 max-lg:grid max-lg:grid-cols-[auto_minmax(0,1fr)] max-lg:items-start max-lg:gap-y-2.5 max-lg:pr-3 max-lg:pl-3",
          lit && "-my-px rounded-r-md bg-danger-soft/60",
        )}
      >
        <IconTile icon={kind.icon} tone={done || ended ? "neutral" : kind.tone} size="md" className="max-lg:size-8 max-lg:[&_svg]:size-4" />
        <div className="grid min-w-0 flex-1 gap-0.5 max-lg:grid-cols-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-subtle max-lg:whitespace-nowrap">
            {lit && <span aria-hidden className="size-2 rounded-full bg-live motion-safe:animate-pulse-live" />}
            {t.routine.kind[e.kind]}
            <span aria-hidden>·</span>
            <span className="truncate font-normal">{e.course}</span>
          </p>
          <a
            href={entryHref(e, lang)}
            className={cn(
              "line-clamp-2 leading-snug font-semibold hover:underline max-lg:line-clamp-3",
              done && "text-muted line-through decoration-muted/60",
              ended && "text-muted",
            )}
          >
            {e.title}
          </a>
          <p className={cn("text-sm", noteTone[note.tone])}>{note.text}</p>
        </div>
        {done ? (
          <PencilTick className="size-8 shrink-0 text-success max-lg:hidden" />
        ) : (
          <EntryActionButton e={e} lang={lang} t={t} className="max-lg:col-start-2 max-lg:h-11 max-lg:justify-self-start max-lg:px-4" />
        )}
      </div>
    </li>
  );
}
