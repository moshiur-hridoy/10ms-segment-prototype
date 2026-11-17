import { TasksCard } from "@/design-system/organisms/dashboard/tasks-card";
import { getTasks } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import { subjectOptions, type SearchParams } from "./subject-options";
import type { SectionProps } from "./types";

export async function TasksSection({ ctx, lang, t, searchParams }: SectionProps & { searchParams: Promise<SearchParams> }) {
  const [c, sp] = await Promise.all([ctx, searchParams]);
  const asked = Array.isArray(sp.subject) ? sp.subject[0] : sp.subject;
  const tasks = await getTasks(c, asked ?? null);
  const options = subjectOptions(sp, tasks.subjects, t.routine.allSubjects);
  return <TasksCard tasks={tasks} options={options} fmt={createFormatter(lang, c.now)} lang={lang} t={t} />;
}
