"use client";

import { Check, Download, NotebookPen } from "lucide-react";
import type { ReactNode } from "react";
import { softTones } from "@/design-system/foundations/tone";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ProgressStatus } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { useDownloaded } from "./downloads";
import { useLabAt } from "@/lib/lab";
import { useNotes } from "./notes";

/**
 * Lab `class` v28 (P121): a class row's state as small pills on its date line, in English like the
 * date and the player: watched, how far (a started class), downloaded on this device, and whether it
 * has the student's notes or marks. They take the place of the tick or ring at the row's end.
 */
export function ClassBadges({
  id,
  status,
  progress,
  downloadedPill = true,
  labels: l,
}: {
  id: string;
  status: ProgressStatus;
  /** 0–100, for a started class. */
  progress?: number;
  /** False under the class title from v43 (P136): the download button's tick already says it. */
  downloadedPill?: boolean;
  labels: Dictionary["syllabus"]["badges"];
}) {
  const downloaded = useDownloaded(id);
  // Lab `class` v50 (P144): no notes, so no notes pill.
  const noNotes = useLabAt("class", 50);
  const notes = useNotes(id).length > 0 && !noNotes;
  // Lab `concept` v2 (P151): the steps card's first step says how much is watched, so these two pills go.
  const steps = useLabAt("concept", 2);
  return (
    <>
      {status === "done" && !steps && (
        <Pill tone={softTones.brand} icon={<Check className="size-3" strokeWidth={3} aria-hidden />}>
          {l.watched}
        </Pill>
      )}
      {status === "started" && !steps && progress !== undefined && progress > 0 && (
        <Pill tone={softTones.neutral}>{fill(l.progress, { pct: `${Math.round(progress)}%` })}</Pill>
      )}
      {downloaded && downloadedPill && (
        <Pill tone={softTones.info} icon={<Download className="size-3" aria-hidden />}>
          {l.downloaded}
        </Pill>
      )}
      {notes && (
        <Pill tone={softTones.warning} icon={<NotebookPen className="size-3" aria-hidden />}>
          {l.notes}
        </Pill>
      )}
    </>
  );
}

function Pill({ tone, icon, children }: { tone: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 text-xs leading-4 font-semibold whitespace-nowrap", tone)}>
      {icon}
      {children}
    </span>
  );
}
