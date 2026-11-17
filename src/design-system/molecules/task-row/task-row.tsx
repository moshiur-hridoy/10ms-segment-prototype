import { ChevronRight, Clock } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Task, TaskAction } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dayWord, describeClassTime } from "@/lib/describe";
import { fill, type Formatter } from "@/lib/format";
import { TaskTile } from "@/design-system/molecules/task-tile";

// Red signals "live" (badge, tile); the button stays green, and a live Join is the `live` variant
// (spreading ring and pulsing dot) like every other Join in the app. "join" only exists while live.
const actionVariant: Record<Exclude<TaskAction, "none">, "live" | "soft" | "secondary"> = {
  join: "live",
  exam: "soft",
  submit: "soft",
  watch: "secondary",
};

export const taskHref = (task: Task) => (task.kind === "class" && task.joinUrl) || task.url || "#";

/** One line under the title: what happened or when it's due. */
export function describeTask(task: Task, fmt: Formatter, t: Dictionary): string {
  if (task.done) {
    if (task.missed) return t.tasks.doneText.watched;
    return task.kind === "homework" || task.kind === "exam" ? t.tasks.doneText.submitted : t.tasks.doneText.attended;
  }
  if (task.missed && task.kind !== "homework") {
    return fill(t.tasks.missedAt, { day: dayWord(task.startsAt, fmt, t), time: fmt.time(task.startsAt) });
  }
  return describeClassTime(task, fmt, t);
}

export function TaskAction({ task, t, className }: { task: Task; t: Dictionary; className?: string }) {
  if (task.action === "none") return null;
  return (
    <Button variant={actionVariant[task.action]} size="sm" href={taskHref(task)} className={cn("relative z-10", className)}>
      {t.tasks.action[task.action]}
    </Button>
  );
}

export function TaskRow({ task, fmt, t }: { task: Task; fmt: Formatter; t: Dictionary }) {
  const overdue = task.status === "overdue" && !task.done;
  const label = task.done ? t.tasks.tile.done : task.missed ? t.tasks.tile.missed : t.classes.kind[task.kind];

  return (
    <li className="group relative flex items-center gap-3 rounded-md p-2 -mx-2 press hover:bg-raised/70 sm:gap-4">
      <TaskTile task={task} fmt={fmt} t={t} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <a
          href={taskHref(task)}
          className={cn(
            "truncate font-semibold after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand",
            task.done && "text-muted",
          )}
        >
          {/* The tile is decorative, so name the task type for screen readers. */}
          <span className="sr-only">{label}: </span>
          {task.title}
        </a>
        <p className={cn("flex min-w-0 items-center gap-1 text-sm", overdue ? "text-danger" : "text-muted")}>
          {overdue && <Clock className="size-3.5 shrink-0" aria-hidden />}
          {/* Time first: on narrow screens the course name is what gets truncated. */}
          <span className="truncate">
            {describeTask(task, fmt, t)}
            <span aria-hidden className="text-subtle"> · </span>
            <span className="text-subtle">{task.course}</span>
          </span>
        </p>
        {/* On phones the action sits under the text so long titles keep their room. */}
        {task.action !== "none" && (
          <span className="mt-1.5 sm:hidden">
            <TaskAction task={task} t={t} />
          </span>
        )}
      </div>
      {task.action !== "none" ? (
        <span className="hidden shrink-0 sm:block">
          <TaskAction task={task} t={t} />
        </span>
      ) : (
        <ChevronRight className="size-5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
      )}
    </li>
  );
}
