import { Check, PencilLine, Play } from "lucide-react";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Task } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Formatter } from "@/lib/format";
import { Card } from "@/design-system/atoms/card";

/*
 * 56px task tile. The band colour is the task's *state*, not its type:
 * coloured only when it needs the student now (live, open exam, homework due),
 * neutral when it's just scheduled. Only "now" tiles animate, and only when
 * the user hasn't asked for reduced motion.
 */

/** Broadcast waves (from the original live tile): arcs light up outward from the dot. */
export function LiveWaves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <g className="motion-safe:animate-wave">
        <path d="M8.5 8.5a5 5 0 0 0 0 7" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      </g>
      <g className="motion-safe:animate-wave motion-safe:[animation-delay:300ms]">
        <path d="M5.2 5.2a9.6 9.6 0 0 0 0 13.6" />
        <path d="M18.8 5.2a9.6 9.6 0 0 1 0 13.6" />
      </g>
    </svg>
  );
}

/** Checklist (from the original exam tile): the ticks draw in one after another. */
function ExamChecklist({ className }: { className?: string }) {
  const tick = "[stroke-dasharray:1] motion-safe:animate-tick";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 6.5l2 2 3.5-3.5" pathLength={1} className={tick} />
      <path d="M3 13.5l2 2 3.5-3.5" pathLength={1} className={cn(tick, "motion-safe:[animation-delay:400ms]")} />
      <path d="M3.5 19l3 3m0-3l-3 3" className="opacity-60" />
      <path d="M12 7h9M12 14h9M12 20.5h6" className="opacity-60" />
    </svg>
  );
}

const bands = {
  live: "bg-class-band-live",
  exam: "bg-class-band-exam",
  homework: "bg-class-band-hw",
  neutral: "bg-class-band-class",
  done: "bg-success",
} as const;

export function TaskTile({ task, fmt, t, size = "md" }: { task: Task; fmt: Formatter; t: Dictionary; size?: "md" | "lg" }) {
  let band: keyof typeof bands = "neutral";
  let label: string = t.classes.tileLabel[task.kind];
  let top: React.ReactNode;

  if (task.done) {
    band = "done";
    label = t.tasks.tile.done;
    top = <Check className="size-6 text-success" strokeWidth={2.5} aria-hidden />;
  } else if (task.missed) {
    label = t.tasks.tile.missed;
    top = <Play className="size-5 fill-current text-subtle" aria-hidden />;
  } else if (task.action === "join") {
    band = "live";
    label = t.common.live;
    top = <LiveWaves className="size-7 text-live" />;
  } else if (task.action === "exam") {
    band = "exam";
    top = <ExamChecklist className="size-6 text-highlight" />;
  } else if (task.action === "submit") {
    band = "homework";
    top = <PencilLine className="size-6 text-class-band-hw dark:text-warning" aria-hidden />;
  } else {
    // Scheduled: the time is what matters (the day comes from the group heading).
    const { period, clock } = fmt.timeParts(task.sortAt);
    top = (
      <span className="grid">
        <span className="text-xs leading-none font-medium text-subtle">{period}</span>
        <span className="mt-0.5 text-sm leading-none font-bold tabular-nums">{clock}</span>
      </span>
    );
  }

  return (
    <Card
      as="div"
      radius="md"
      aria-hidden
      className={cn(
        "grid shrink-0 grid-rows-[1fr_auto] overflow-hidden text-center",
        size === "lg" ? "size-16" : "size-14",
        task.done && "opacity-70",
      )}
    >
      <div className="grid place-items-center">{top}</div>
      <div className={cn("truncate px-1 py-0.5 text-xs leading-4 font-bold text-on-fill", bands[band])}>{label}</div>
    </Card>
  );
}
