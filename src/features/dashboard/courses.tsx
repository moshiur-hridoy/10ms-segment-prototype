import { CoursesCard } from "@/design-system/organisms/dashboard/courses-card";
import { getCourses } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function Courses({ ctx, lang, t, instance }: SectionProps & { instance?: string }) {
  const c = await ctx;
  const { courses, active, notStarted, counts } = await getCourses(c);
  return <CoursesCard courses={courses} active={active} notStarted={notStarted} counts={counts} fmt={createFormatter(lang, c.now)} t={t} instance={instance} />;
}
