import { ClipboardCheck, Folder } from "lucide-react";
import { ChipLink } from "@/design-system/atoms/chip";
import { IconTile } from "@/design-system/atoms/icon-tile";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { FolderRow } from "@/lib/api";
import { jumpTarget } from "./anchor";

/** Exams or resources: each folder once ("Weekly Exam"), with a link per subject that has it. */
export function CourseFolders({ id, title, rows }: { id: string; title: string; rows: FolderRow[] }) {
  if (rows.length === 0) return null;
  const exam = rows[0].kind === "exam";
  return (
    <SectionCard title={title} titleId={id} className={jumpTarget}>
      <ul className="grid grid-cols-1 divide-y divide-border">
        {rows.map((r) => (
          <li key={r.label} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 first:pt-0 last:pb-0">
            <span className="flex min-w-0 flex-1 basis-48 items-center gap-2.5">
              <IconTile icon={exam ? ClipboardCheck : Folder} tone={exam ? "highlight" : "warning"} size="sm" />
              <span className="truncate text-sm font-semibold">{r.label}</span>
            </span>
            <ul className="flex flex-wrap gap-1.5" aria-label={r.label}>
              {r.links.map((l) => (
                <li key={l.subject}>
                  <ChipLink href={l.url}>{l.subject}</ChipLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
