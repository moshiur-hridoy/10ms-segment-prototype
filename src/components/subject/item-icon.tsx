"use client";

import { CircleCheck, ClipboardCheck, History, NotebookText, Play, Presentation, type LucideIcon } from "lucide-react";
import { ProgressRing } from "@/design-system/atoms/progress";
import { softTones } from "@/design-system/foundations/tone";
import type { ProgressStatus, SyllabusItemKind } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { useLabAt } from "@/lib/lab";

const kinds: Record<SyllabusItemKind, { Icon: LucideIcon; fg: string; bg: string }> = {
  video: { Icon: Play, fg: "text-danger [&_svg]:fill-current", bg: "bg-danger-soft" },
  sheet: { Icon: NotebookText, fg: "text-info", bg: "bg-info-soft" },
  slide: { Icon: Presentation, fg: "text-warning", bg: "bg-warning-soft" },
  exam: { Icon: ClipboardCheck, fg: "text-highlight", bg: "bg-highlight-soft" },
};

/** A previous batch's class video: the same play glyph, in grey, so it never passes for this batch's live class. */
const archiveVideo = { Icon: Play, fg: "text-muted [&_svg]:fill-current", bg: "bg-raised ring-1 ring-border ring-inset" };
/**
 * Lab `concept` v21 (P174): the live class's red tile gets a light red edge like the archive's grey one, and the
 * archive's play is drawn in outline, so the two differ by shape too, not only by colour (red and this grey are
 * about as light as each other, and red darkens further for red-blind eyes).
 */
const liveVideoEdged = { ...kinds.video, bg: "bg-danger-soft ring-1 ring-danger/20 ring-inset" };
const archiveVideoOutline = { ...archiveVideo, fg: "text-muted" };

/** Content type badge. `sm` is the bare glyph used for materials nested under a class. */
export function ItemIcon({
  kind,
  archive = false,
  size = "md",
  round = false,
  className,
}: {
  kind: SyllabusItemKind;
  /** From the previous batch's recordings: changes the class video's colour. */
  archive?: boolean;
  size?: "sm" | "md" | "lg";
  /** A 36px disc, like the class page's link cards (teacher inbox, MCQ; lab `class` v24, P117). */
  round?: boolean;
  className?: string;
}) {
  const shapes = useLabAt("concept", 21);
  const { Icon, fg, bg } =
    kind === "video" ? (archive ? (shapes ? archiveVideoOutline : archiveVideo) : shapes ? liveVideoEdged : kinds.video) : kinds[kind];
  if (size === "sm") {
    return (
      <span aria-hidden className={cn("grid shrink-0 place-items-center [&_svg]:size-4", fg, className)}>
        <Icon />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center",
        round
          ? "size-9 rounded-full [&_svg]:size-[1.125rem]"
          : size === "lg"
            ? "size-14 rounded-md [&_svg]:size-7"
            : "size-8 rounded-md [&_svg]:size-4",
        fg,
        bg,
        className,
      )}
    >
      <Icon />
    </span>
  );
}

/**
 * Where a class comes from: this batch's live class (red dot) or the previous batch's
 * recording (clock-back icon, grey). Shown on every class row and in the player, so the
 * two can't be mixed up even in a flat search list.
 */
export function SourceTag({ archive, label, className }: { archive: boolean; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 text-xs leading-4 font-semibold whitespace-nowrap",
        archive ? "bg-raised text-muted ring-1 ring-border ring-inset" : softTones.live,
        className,
      )}
    >
      {archive ? <History className="size-3" aria-hidden /> : <span aria-hidden className="size-1.5 rounded-full bg-live" />}
      {label}
    </span>
  );
}

/** Done ✓, a ring for a part-watched video, or an empty circle. The label is for screen readers. */
export function StatusMark({ status, progress, label }: { status: ProgressStatus; progress?: number; label: string }) {
  if (status === "done") {
    return <CircleCheck className="size-[18px] shrink-0 text-success" role="img" aria-label={label} />;
  }
  if (status === "started") {
    return <ProgressRing value={progress ?? 0} size={18} stroke={3} label={label} className="shrink-0" />;
  }
  return (
    <span role="img" aria-label={label} className="grid size-[18px] shrink-0 place-items-center">
      <span className="size-3.5 rounded-full border-2 border-border-strong" />
    </span>
  );
}

/** Three bars that pulse in turn: "this is the one that's open". */
export function NowPlaying({ label, paused = false, className }: { label: string; paused?: boolean; className?: string }) {
  return (
    <span role="img" aria-label={label} className={cn("flex h-[18px] w-[18px] shrink-0 items-end justify-center gap-[3px]", className)}>
      {["h-2", "h-3.5", "h-2.5"].map((h, i) => (
        <span
          key={h}
          // Paused: no animation at all (the animation shorthand would reset a paused play state).
          className={cn("w-[3px] rounded-full bg-brand", !paused && "motion-safe:animate-wave", h)}
          style={{ animationDelay: `${i * 0.25}s` }}
        />
      ))}
    </span>
  );
}
