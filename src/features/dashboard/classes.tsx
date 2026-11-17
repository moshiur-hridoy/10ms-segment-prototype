import { ClassesCard } from "@/design-system/organisms/dashboard/classes-card";
import { getClasses } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import { subjectOptions, type SearchParams } from "./subject-options";
import type { SectionProps } from "./types";

export async function ClassesSection({ ctx, lang, t, searchParams }: SectionProps & { searchParams: Promise<SearchParams> }) {
  const [c, sp] = await Promise.all([ctx, searchParams]);
  const asked = Array.isArray(sp.subject) ? sp.subject[0] : sp.subject;
  const classes = await getClasses(c, asked ?? null);
  const options = subjectOptions(sp, classes.subjects, t.routine.allSubjects);
  return <ClassesCard classes={classes} options={options} fmt={createFormatter(lang, c.now)} lang={lang} t={t} />;
}
