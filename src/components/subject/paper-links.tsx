import { ChevronDown } from "lucide-react";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PaperFolders } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { PaperGroups, type PaperNote } from "./paper-groups";

/**
 * The subject's exam and resource folders ("Weekly Exam", "One Shot Class"), so a student who
 * lands on the paper page reaches them without going back to the course home. Quiet on purpose:
 * plain rows, no card, the syllabus stays the page's main job. `rail`: in the column right of
 * the syllabus (wide screens; it gives way to the player when an item opens). `fold`: on phones, a
 * card like the syllabus card below it (P96), holding one closed row that opens the same list.
 * Not rendered when the subject has no folders.
 */
export function PaperLinks({
  folders,
  variant,
  filter = false,
  notes = [],
  fold = false,
  kinds = false,
  chapterExams = [],
  fmt,
  t,
  className,
}: {
  folders: PaperFolders;
  variant: "rail" | "fold";
  /** Lab `class` v41 (P134): a সব · পরীক্ষা · রিসোর্স filter inside. */
  filter?: boolean;
  /** Lab `class` v42 (P135): the chapters' lecture sheets, moved up from the syllabus. */
  notes?: PaperNote[];
  /** Lab `class` v46 (P139): on the wide screen's rail, folding groups in place of the tabs. */
  fold?: boolean;
  /** Lab `concept` v17 (P170): on the phone's closed card, a line saying what's inside, by kind with counts. */
  kinds?: boolean;
  /** Lab `concept` v22 (P175): the chapters' own exams, listed first under পরীক্ষা. */
  chapterExams?: PaperNote[];
  fmt: Formatter;
  t: Dictionary;
  className?: string;
}) {
  const exams = chapterExams.length + folders.exams.length;
  const count = exams + folders.resources.length + notes.length;
  if (count === 0) return null;
  const s = t.syllabus;

  const groups = (
    <PaperGroups
      folders={folders}
      notes={notes}
      chapterExams={chapterExams}
      filter={filter}
      fold={fold && variant === "rail"}
      labels={{ all: s.filter.all, exams: t.courseHome.exams, notes: s.paperNotes, resources: t.courseHome.resources, filter: s.paperFilter }}
    />
  );

  if (variant === "rail") {
    return (
      <aside aria-label={s.more} className={className}>
        {/* v46 (P139): the section names itself on the rail, as the phone's fold card does. */}
        {fold && (
          <h2 className="mb-2 text-sm">
            <span className="font-semibold">{s.more}</span> <span className="text-subtle">· {fill(s.moreCount, { count: fmt.number(count) })}</span>
          </h2>
        )}
        {groups}
      </aside>
    );
  }

  // "পরীক্ষা ৩ · নোট ৬ · রিসোর্স ৪", in the order the list shows them; a kind the subject lacks is left out.
  const inside = [
    [t.courseHome.exams, exams],
    [s.paperNotes, notes.length],
    [t.courseHome.resources, folders.resources.length],
  ]
    .filter(([, n]) => n)
    .map(([label, n]) => `${label} ${fmt.number(n as number)}`)
    .join(" · ");

  return (
    <Card as="details" className={cn("group/more px-4", className)}>
      <summary
        className={cn(
          "flex min-h-12 cursor-pointer list-none items-center gap-2 text-sm select-none [&::-webkit-details-marker]:hidden",
          kinds && "py-2.5",
        )}
      >
        {kinds ? (
          // The count moves into the line under the title, by kind.
          <span className="grid min-w-0 gap-0.5">
            <span className="font-semibold">{s.more}</span>
            <span className="truncate text-xs text-subtle">{inside}</span>
          </span>
        ) : (
          <>
            <span className="font-semibold">{s.more}</span>
            <span className="text-subtle">· {fill(s.moreCount, { count: fmt.number(count) })}</span>
          </>
        )}
        <ChevronDown className="ml-auto size-4 shrink-0 text-subtle transition-transform group-open/more:rotate-180" aria-hidden />
      </summary>
      <div className="pt-1 pb-4">{groups}</div>
    </Card>
  );
}
