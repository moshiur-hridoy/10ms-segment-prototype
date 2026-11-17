import { SubjectsCard } from "@/design-system/organisms/dashboard/subjects-card";
import { getSubjects } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function SubjectsSection({ ctx, lang, t, instance }: SectionProps & { instance?: string }) {
  const c = await ctx;
  const { groups, counts } = await getSubjects(c);
  return <SubjectsCard groups={groups} counts={counts} fmt={createFormatter(lang, c.now)} t={t} instance={instance} />;
}
