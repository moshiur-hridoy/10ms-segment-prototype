import { ListChecks, PencilLine } from "lucide-react";
import type { ClassView } from "@/lib/api";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import type { Formatter } from "@/lib/format";
import { LiveWaves } from "@/design-system/molecules/task-tile";
import { Card } from "@/design-system/atoms/card";

const bands = {
  free: "bg-class-band-free",
  class: "bg-class-band-class",
  live: "bg-class-band-live",
  homework: "bg-class-band-hw",
  exam: "bg-class-band-exam",
} as const;

/**
 * 56px calendar tile: date/time (or an icon) on top, a coloured label band below.
 * Rebuilt in CSS from the Figma tiles so it follows the theme.
 */
export function ClassTile({ item, fmt, t, size = "md" }: { item: ClassView; fmt: Formatter; t: Dictionary; size?: "md" | "lg" }) {
  const live = item.status === "live";
  const band = live ? bands.live : bands[item.kind];
  const label = live ? t.common.live : t.classes.tileLabel[item.kind];

  let top: React.ReactNode;
  if (live) {
    top = <LiveWaves className="size-7 text-live" />;
  } else if (item.kind === "homework") {
    top = <PencilLine className="size-6 text-class-band-hw dark:text-warning" aria-hidden />;
  } else if (item.kind === "exam") {
    top = <ListChecks className="size-6 text-highlight" aria-hidden />;
  } else {
    // Bangla month names are long; show day of month + weekday instead.
    top = (
      <span className="grid">
        <span className="text-sm leading-none font-bold tabular-nums">{fmt.dayOfMonth(item.startsAt)}</span>
        <span className="mt-0.5 text-xs leading-none font-medium text-subtle">{fmt.weekday(item.startsAt)}</span>
      </span>
    );
  }

  return (
    <Card
      as="div"
      radius="md"
      aria-hidden
      className={cn(
        "grid shrink-0 grid-rows-[1fr_auto] overflow-hidden text-center",
        size === "lg" ? "size-16" : "size-14",
      )}
    >
      <div className="grid place-items-center">{top}</div>
      <div className={cn("truncate px-1 py-0.5 text-xs leading-4 font-bold text-on-fill", band)}>{label}</div>
    </Card>
  );
}
