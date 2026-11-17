import { CalendarClock } from "lucide-react";
import { Badge } from "@/design-system/atoms/badge";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ClassView } from "@/lib/api";
import { describeClassTime } from "@/lib/describe";
import type { Formatter } from "@/lib/format";
import { ClassTile } from "@/design-system/molecules/class-tile";

/** The single most important thing right now: a live class, or the next class. */
export function LiveHero({
  item,
  fmt,
  t,
}: {
  item: ClassView;
  fmt: Formatter;
  t: Dictionary;
}) {
  const live = item.status === "live";
  const href = (item.kind === "class" && item.joinUrl) || item.url || "#";

  return (
    <Card as="div" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      {/* Same tile as the rows below (and the task view's hero), one size up. */}
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <ClassTile item={item} fmt={fmt} t={t} size="lg" />
        <div className="grid min-w-0 flex-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {live ? (
              <Badge tone="live">{t.classes.liveNow}</Badge>
            ) : (
              <Badge tone="info">
                <CalendarClock className="size-3.5" aria-hidden />
                {t.classes.nextUp}
              </Badge>
            )}
            <span className="truncate text-xs text-subtle">{item.course}</span>
          </div>
          <p className="line-clamp-2 text-lg leading-snug font-semibold">
            {item.title}
          </p>
          <p className="text-sm text-muted">
            {describeClassTime(item, fmt, t)}
          </p>
        </div>
      </div>
      {live && (
        // The badge says it's live; the halo and dot make the Join the thing to look at.
        <Button variant="live" size="lg" href={href} className="sm:self-center">
          {t.classes.joinNow}
        </Button>
      )}
    </Card>
  );
}
