import { ClipboardCheck, FileQuestion } from "lucide-react";
import { IconTile } from "@/design-system/atoms/icon-tile";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ReportView } from "@/lib/api";
import { dayWord } from "@/lib/describe";
import { fill, type Formatter } from "@/lib/format";

/** The latest attempts with their scores; correct answers by subject are in the subject table. */
export function ExamsSection({ report, fmt, t }: { report: ReportView; fmt: Formatter; t: Dictionary }) {
  const e = t.report.exams;
  const { recent } = report.exams;

  if (recent.length === 0) {
    return (
      <SectionCard density="compact" titleId="report-exams" title={e.title}>
        <p className="rounded-md bg-raised px-3 py-3 text-sm text-muted">{e.none}</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard density="compact" titleId="report-exams" title={e.title} action={<span className="text-sm text-muted">{e.recent}</span>}>
      <ul className="grid divide-y divide-border">
        {recent.map((a) => {
          const exam = a.kind === "exam";
          return (
            <li key={a.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
              <IconTile icon={exam ? ClipboardCheck : FileQuestion} tone={exam ? "highlight" : "warning"} size="sm" />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-semibold">
                  {e.kind[a.kind]} · {a.subject}
                </span>
                <span className="text-xs text-subtle">{dayWord(a.takenAt, fmt, t)}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">
                {fill(e.score, { correct: fmt.number(a.correct), total: fmt.number(a.total) })}
              </span>
            </li>
          );
        })}
      </ul>
    </SectionCard>
  );
}
