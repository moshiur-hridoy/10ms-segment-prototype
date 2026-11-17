import { FileQuestion, FileText, NotebookText, Play, Radio, type LucideIcon } from "lucide-react";
import type { ContentType } from "@/lib/api";
import { softTones, type Tone } from "@/design-system/foundations/tone";
import { cn } from "@/lib/cn";

const map: Record<ContentType, { Icon: LucideIcon; tone: Tone; className?: string }> = {
  video: { Icon: Play, tone: "danger", className: "[&_svg]:fill-current" },
  quiz: { Icon: FileQuestion, tone: "warning" },
  note: { Icon: NotebookText, tone: "info" },
  pdf: { Icon: FileText, tone: "highlight" },
  live: { Icon: Radio, tone: "live" },
};

export function ContentIcon({ type, size = "md", className }: { type: ContentType; size?: "sm" | "md"; className?: string }) {
  const { Icon, tone, className: extra } = map[type];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        size === "sm" ? "size-7 ring-2 ring-surface [&_svg]:size-3.5" : "size-10 [&_svg]:size-5",
        softTones[tone],
        extra,
        className,
      )}
    >
      <Icon />
    </span>
  );
}
