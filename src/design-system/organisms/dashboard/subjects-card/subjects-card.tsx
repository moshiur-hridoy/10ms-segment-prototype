import { BookOpen } from "lucide-react";
import { Card } from "@/design-system/atoms/card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { CategoryFilter } from "@/design-system/molecules/category-filter";
import { SubjectAccordion } from "@/design-system/molecules/subject-accordion";
import { SubjectGroup } from "@/design-system/organisms/dashboard/subject-group";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { CategoryCounts, SubjectCard } from "@/lib/api";
import type { Formatter } from "@/lib/format";

export function SubjectsCard({ groups, counts, fmt, t, instance }: { groups: SubjectCard[]; counts: CategoryCounts; fmt: Formatter; t: Dictionary; instance?: string }) {
  const title = (
    <h2 id="subjects-title" className="type-title">
      {t.subjects.title}
    </h2>
  );

  return (
    <Card aria-labelledby="subjects-title" className="grid grid-cols-1 gap-5 p-5 sm:p-6">
      {groups.length === 0 ? (
        <>
          {title}
          <EmptyState icon={BookOpen} title={t.subjects.empty} />
        </>
      ) : (
        <SubjectAccordion instance={instance}>
          <CategoryFilter
            title={title}
            label={t.subjects.filterLabel}
            labels={{
              all: t.common.all,
              academic: `${t.common.academic} (${fmt.number(counts.academic)})`,
              english: `${t.common.english} (${fmt.number(counts.english)})`,
              skills: `${t.common.skills} (${fmt.number(counts.skills)})`,
            }}
            items={groups.map((g, i) => ({
              id: g.id,
              category: g.category,
              node: <SubjectGroup group={g} open={i === 0} fmt={fmt} t={t} instance={instance} />,
            }))}
          />
        </SubjectAccordion>
      )}
    </Card>
  );
}
