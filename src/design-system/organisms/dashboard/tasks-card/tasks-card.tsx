import { CalendarCheck, CalendarClock, CalendarDays, ChevronDown, ChevronRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { Button } from "@/design-system/atoms/button";
import { Badge } from "@/design-system/atoms/badge";
import { Card } from "@/design-system/atoms/card";
import { ProgressBar } from "@/design-system/atoms/progress";
import { EmptyState } from "@/design-system/molecules/empty-state";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Task } from "@/lib/api";
import { cn } from "@/lib/cn";
import { dayWord } from "@/lib/describe";
import { fill, type Formatter } from "@/lib/format";
import { SubjectFilter } from "@/design-system/molecules/subject-filter";
import { describeTask, TaskAction, TaskRow } from "@/design-system/molecules/task-row";
import { TaskTile } from "@/design-system/molecules/task-tile";
import type { Locale } from "@/i18n/config";
import type { SubjectOption } from "@/design-system/molecules/subject-filter";
import type { TasksView } from "@/lib/api";

/*
 * Task-based routine ("আজকের কাজ"). Same data as ClassesSection, reorganised around
 * what the student has to do today:
 *   hero (do it now) → today → done → backlog (collapsed) → later (collapsed)
 * The default routine; ?routine=classic shows the old tabs. See RoutineSection.
 */
export function TasksCard({ tasks, options, fmt, lang, t }: { tasks: TasksView; options: SubjectOption[]; fmt: Formatter; lang: Locale; t: Dictionary }) {
  const { hero, today, done, backlog, later, progress, subjects, subject } = tasks;
  const nothingToday = progress.total === 0;
  const allDone = !nothingToday && progress.done === progress.total;

  return (
    <Card id="routine" aria-labelledby="tasks-title" className="grid grid-cols-1 gap-5 p-5 sm:p-6" style={{ backgroundImage: "var(--grad-classes)" }}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1.5">
          <h2 id="tasks-title" className="type-title">
            {t.tasks.title}
          </h2>
          {!nothingToday && <Progress done={progress.done} total={progress.total} fmt={fmt} t={t} />}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {subjects.length > 1 && <SubjectFilter label={t.routine.subject} value={subject ?? "all"} options={options} />}
          <Link
            href={`/${lang}/routine`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-soft"
          >
            <CalendarDays className="size-4" aria-hidden />
            {t.classes.fullRoutine}
          </Link>
        </div>
      </header>

      {hero && <Hero task={hero} fmt={fmt} t={t} />}

      {nothingToday && subject && <SubjectEmpty subject={subject} later={later} clearHref={options[0].href} fmt={fmt} t={t} />}
      {nothingToday && !subject && <EmptyState icon={CalendarCheck} title={t.tasks.empty} />}
      {allDone && (
        <p className="flex items-center gap-2 rounded-md bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          <PartyPopper className="size-4 shrink-0" aria-hidden />
          {t.tasks.allDone}
        </p>
      )}

      {(today.length > 0 || done.length > 0) && (
        <Group title={t.tasks.today}>
          {today.map((task) => (
            <TaskRow key={task.id} task={task} fmt={fmt} t={t} />
          ))}
          {done.map((task) => (
            <TaskRow key={task.id} task={task} fmt={fmt} t={t} />
          ))}
        </Group>
      )}

      {backlog.total > 0 && <Backlog backlog={backlog} fmt={fmt} t={t} />}
      {later.length > 0 && <Later groups={later} fmt={fmt} t={t} />}
    </Card>
  );
}

/**
 * A subject with nothing today. Rather than a dead end it says what comes next: the subject's next
 * class (else its next task) from the coming days, and a way back to every subject.
 */
function SubjectEmpty({ subject, later, clearHref, fmt, t }: { subject: string; later: { items: Task[] }[]; clearHref: string; fmt: Formatter; t: Dictionary }) {
  const coming = later.flatMap((g) => g.items);
  const next = coming.find((task) => task.kind === "class" || task.kind === "free") ?? coming[0] ?? null;
  const isClass = next && (next.kind === "class" || next.kind === "free");

  return (
    <EmptyState
      icon={CalendarCheck}
      title={fill(t.tasks.emptySubject, { subject })}
      action={
        <div className="grid w-full max-w-md justify-items-center gap-3">
          {next && (
            <section aria-label={fill(isClass ? t.tasks.nextClassFor : t.tasks.nextTaskFor, { subject })} className="grid w-full gap-1 rounded-md bg-surface p-2 text-left shadow-sm">
              <h3 className="px-2 pt-1 text-xs font-semibold tracking-wide text-subtle">{fill(isClass ? t.tasks.nextClassFor : t.tasks.nextTaskFor, { subject })}</h3>
              <ul>
                <TaskRow task={next} fmt={fmt} t={t} />
              </ul>
            </section>
          )}
          <Button href={clearHref} variant="secondary" size="sm" scroll={false} replace>
            {t.tasks.clearSubject}
          </Button>
        </div>
      }
    />
  );
}

/** One segment per task when there are few (feels like ticking boxes), a bar when there are many. */
function Progress({ done, total, fmt, t }: { done: number; total: number; fmt: Formatter; t: Dictionary }) {
  const text = fill(t.tasks.progress, { done: fmt.number(done), total: fmt.number(total) });
  return (
    <div className="flex items-center gap-3">
      {total <= 8 ? (
        <div role="img" aria-label={`${t.tasks.progressLabel}: ${text}`} className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={cn("h-1.5 w-5 rounded-full", i < done ? "bg-brand" : "bg-border-strong/70")} />
          ))}
        </div>
      ) : (
        <ProgressBar value={(done / total) * 100} label={`${t.tasks.progressLabel}: ${text}`} thin className="w-32" />
      )}
      <span className="text-sm text-muted" aria-hidden>
        {text}
      </span>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="grid gap-1">
      <h3 className="text-xs font-semibold tracking-wide text-subtle">{title}</h3>
      <ul className="grid grid-cols-1 gap-1">{children}</ul>
    </section>
  );
}

/** The single thing to act on now: a live class or an open exam, else the next class today. */
function Hero({ task, fmt, t }: { task: Task; fmt: Formatter; t: Dictionary }) {
  const badge =
    task.action === "join" ? (
      <Badge tone="live">{t.classes.liveNow}</Badge>
    ) : task.action === "exam" ? (
      <Badge tone="highlight">{t.tasks.examOpen}</Badge>
    ) : (
      <Badge tone="info">
        <CalendarClock className="size-3.5" aria-hidden />
        {t.classes.nextUp}
      </Badge>
    );

  return (
    <Card as="div" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <TaskTile task={task} fmt={fmt} t={t} size="lg" />
        <div className="grid min-w-0 flex-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {badge}
            <span className="truncate text-xs text-subtle">{task.course}</span>
          </div>
          <p className="line-clamp-2 text-lg leading-snug font-semibold">{task.title}</p>
          <p className="text-sm text-muted">{describeTask(task, fmt, t)}</p>
        </div>
      </div>
      {/* Urgency comes from the badge and the animated tile; the button stays still. */}
      <TaskAction task={task} t={t} className="h-12 px-6 text-base sm:self-center" />
    </Card>
  );
}

type BacklogData = TasksView["backlog"];

/** Missed and overdue work from the last week. Collapsed below today so it never pushes today's work down. */
function Backlog({ backlog, fmt, t }: { backlog: BacklogData; fmt: Formatter; t: Dictionary }) {
  const parts = [
    backlog.recordings > 0 && fill(t.tasks.backlogRecordings, { n: fmt.number(backlog.recordings) }),
    backlog.homework > 0 && fill(t.tasks.backlogHomework, { n: fmt.number(backlog.homework) }),
  ].filter(Boolean);
  const rest = backlog.total - backlog.items.length;

  return (
    <details className="group/backlog border-t border-border pt-4">
      <summary className="flex select-none min-h-11 cursor-pointer list-none items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">{t.tasks.backlog}</span>
        <span className="min-w-0 flex-1 truncate text-subtle">
          · {fill(t.tasks.backlogCount, { n: fmt.number(backlog.total) })}
          {parts.length > 0 && ` (${parts.join(", ")})`}
        </span>
        <ChevronDown className="size-4 shrink-0 text-subtle transition-transform group-open/backlog:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-2 grid grid-cols-1 gap-1">
        {backlog.items.map((task) => (
          <TaskRow key={task.id} task={task} fmt={fmt} t={t} />
        ))}
        {rest > 0 && (
          <li className="pt-1">
            <a href="#" className="inline-flex items-center gap-0.5 text-sm font-semibold text-brand-text hover:underline">
              {fill(t.tasks.backlogMore, { n: fmt.number(rest) })}
              <ChevronRight className="size-4" aria-hidden />
            </a>
          </li>
        )}
      </ul>
    </details>
  );
}

/** Everything after today, collapsed to one line that still says what's coming. */
function Later({ groups, fmt, t }: { groups: { day: string; items: Task[] }[]; fmt: Formatter; t: Dictionary }) {
  const dayLabel = (items: Task[]) => dayWord(new Date(items[0].sortAt).toISOString(), fmt, t);
  const summary = groups.map((g) => fill(t.tasks.laterCount, { day: dayLabel(g.items), n: fmt.number(g.items.length) })).join(" · ");

  return (
    <details className="group/later border-t border-border pt-4">
      <summary className="flex select-none min-h-11 cursor-pointer list-none items-center gap-2 text-sm [&::-webkit-details-marker]:hidden">
        <span className="font-semibold">{t.tasks.later}</span>
        <span className="min-w-0 flex-1 truncate text-subtle">· {summary}</span>
        <ChevronDown className="size-4 shrink-0 text-subtle transition-transform group-open/later:rotate-180" aria-hidden />
      </summary>
      <div className="mt-2 grid gap-4">
        {groups.map((g) => (
          <section key={g.day} aria-label={dayLabel(g.items)} className="grid gap-1">
            <h3 className="text-xs font-semibold tracking-wide text-subtle">{dayLabel(g.items)}</h3>
            <ul className="grid grid-cols-1 gap-1">
              {g.items.map((task) => (
                <TaskRow key={task.id} task={task} fmt={fmt} t={t} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </details>
  );
}
