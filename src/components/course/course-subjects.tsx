import { BookMarked } from "lucide-react";
import { subjectIcons } from "@/design-system/foundations/subject-icons";
import { ICON_FAMILY } from "@/design-system/foundations/book";
import { SectionCard } from "@/design-system/molecules/section-card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SubjectGroup } from "@/lib/api";
import { paperLabel } from "@/lib/describe";
import { fill } from "@/lib/format";
import { jumpTarget } from "./anchor";
import { SubjectFolder } from "./subject-folder";

/** One folder per subject, its papers as books that open the syllabus page. Four across when there's room, two otherwise. */
export function CourseSubjects({ groups, lang, t }: { groups: SubjectGroup[]; lang: Locale; t: Dictionary }) {
  const c = t.courseHome;
  return (
    <SectionCard title={c.subjects} titleId="course-subjects" className={jumpTarget}>
      {groups.length === 0 ? (
        <EmptyState icon={BookMarked} title={c.subjectsEmpty} />
      ) : (
        <div className="@container">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-6 @2xl:grid-cols-4">
            {groups.map((g) => {
              const icon = g.icon ?? g.subjects[0]?.icon ?? "book";
              return (
                <li key={g.id} className="min-w-0">
                  <SubjectFolder
                    name={g.subject ?? g.title}
                    icon={subjectIcons[icon]}
                    family={ICON_FAMILY[icon]}
                    papers={g.subjects.map((s) => ({
                      id: s.id,
                      label: paperLabel(s.name, g.subject),
                      href: `/${lang}/subject/${s.id}`,
                      openLabel: fill(c.openPaper, { name: s.name }),
                    }))}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </SectionCard>
  );
}
