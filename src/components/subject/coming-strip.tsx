import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { describeTask, TaskAction, taskHref } from "@/design-system/molecules/task-row";
import { TaskTile } from "@/design-system/molecules/task-tile";
import { Badge } from "@/design-system/atoms/badge";
import { Card } from "@/design-system/atoms/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { subjectOf, type Task } from "@/lib/api";
import type { Formatter } from "@/lib/format";

/**
 * This paper's next class or deadline, between the page header and the syllabus: at most two rows,
 * each with the dashboard's task tile, badge and action ("জয়েন করো", "পরীক্ষা দাও"), and a link to
 * the full routine narrowed to this subject. Not rendered when nothing is coming, so the page stays
 * as quiet as before. Titles come without the paper's name, which the page header already shows.
 */
export function ComingStrip({ items, lang, fmt, t }: { items: Task[]; lang: Locale; fmt: Formatter; t: Dictionary }) {
  if (items.length === 0) return null;
  const live = items.some((task) => task.action === "join");
  const routineHref = `/${lang}/routine?${new URLSearchParams({ subject: subjectOf(items[0].course) })}`;

  return (
    <Card aria-labelledby="coming-title" className="grid gap-2 p-4 sm:px-5" style={live ? { backgroundImage: "var(--grad-classes)" } : undefined}>
      <header className="flex items-center justify-between gap-3">
        <h2 id="coming-title" className="text-xs font-semibold tracking-wide text-subtle">
          {t.syllabus.coming}
        </h2>
        <Link href={routineHref} className="-my-1 inline-flex items-center gap-0.5 rounded-sm text-sm font-semibold text-brand-text hover:underline">
          {t.classes.fullRoutine}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </header>
      <ul className="grid gap-1">
        {items.map((task) => (
          <li key={task.id} className="group relative -mx-2 flex items-center gap-3 rounded-md p-2 press hover:bg-raised/70 sm:gap-4">
            <TaskTile task={task} fmt={fmt} t={t} />
            <div className="grid min-w-0 flex-1 gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                {task.action === "join" && <Badge tone="live">{t.classes.liveNow}</Badge>}
                <a
                  href={taskHref(task)}
                  className="truncate font-semibold after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand"
                >
                  <span className="sr-only">{t.classes.kind[task.kind]}: </span>
                  {task.title}
                </a>
              </div>
              <p className="truncate text-sm text-muted">{describeTask(task, fmt, t)}</p>
              {/* On phones the action sits under the text, full width, so the title keeps its room. */}
              {task.action !== "none" && (
                <span className="mt-1.5 grid sm:hidden">
                  <TaskAction task={task} t={t} />
                </span>
              )}
            </div>
            {task.action !== "none" && (
              <span className="hidden shrink-0 sm:block">
                <TaskAction task={task} t={t} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
