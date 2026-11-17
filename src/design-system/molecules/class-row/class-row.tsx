import { ChevronRight, CircleCheck, CircleDashed, CircleX, Clock } from "lucide-react";
import { Badge } from "@/design-system/atoms/badge";
import { Button } from "@/design-system/atoms/button";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ClassView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { describeClassTime } from "@/lib/describe";
import type { Formatter } from "@/lib/format";
import { ClassTile } from "@/design-system/molecules/class-tile";

export function ClassRow({ item, fmt, t, showFreeLink }: { item: ClassView; fmt: Formatter; t: Dictionary; showFreeLink?: boolean }) {
  const live = item.status === "live";
  const when = describeClassTime(item, fmt, t);
  const href = (item.kind === "class" && item.joinUrl) || item.url || "#";

  return (
    <li className="group relative flex items-center gap-4 rounded-md p-2 -mx-2 press hover:bg-raised">
      <ClassTile item={item} fmt={fmt} t={t} />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <a href={href} className="truncate font-semibold after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-brand">
          {item.title}
        </a>
        <p className={cn("flex min-w-0 items-center gap-1 text-sm", item.status === "overdue" ? "text-danger" : "text-muted")}>
          {item.status === "overdue" && <Clock className="size-3.5 shrink-0" aria-hidden />}
          <span className="truncate">{when}</span>
        </p>
        {item.kind === "homework" && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone={item.attendance === "absent" ? "danger" : "success"}>
              {item.attendance === "absent" ? <CircleX className="size-3.5" aria-hidden /> : <CircleCheck className="size-3.5" aria-hidden />}
              {t.classes.attendance[item.attendance]}
            </Badge>
            <Badge tone={item.homework === "pending" ? "danger" : "success"}>
              {item.homework === "pending" ? <CircleDashed className="size-3.5" aria-hidden /> : <CircleCheck className="size-3.5" aria-hidden />}
              {t.classes.homework[item.homework]}
            </Badge>
          </div>
        )}
        {showFreeLink && item.kind === "free" && (
          <a href="#" className="relative z-10 mt-0.5 inline-flex w-fit items-center gap-0.5 text-sm font-semibold text-brand-text hover:underline">
            {t.classes.seeAllFree}
            <ChevronRight className="size-4" aria-hidden />
          </a>
        )}
      </div>
      {live ? (
        <Button variant="live" size="sm" href={href} className="relative z-10">
          {t.common.join}
        </Button>
      ) : (
        <ChevronRight className="size-5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
      )}
    </li>
  );
}
