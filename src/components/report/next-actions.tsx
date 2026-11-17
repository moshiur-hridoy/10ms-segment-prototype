import { CalendarClock, ClipboardList, PlayCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { IconTile } from "@/design-system/atoms/icon-tile";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { Tone } from "@/design-system/foundations/tone";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { ClassView, ReportView } from "@/lib/api";
import { dayWord, describeClassTime } from "@/lib/describe";
import { fill, type Formatter } from "@/lib/format";

type Action = { key: string; Icon: LucideIcon; tone: Tone; title: string; detail: string; cta: string; href: string; live?: boolean };

/**
 * "What you can do now": the report turned into next steps. Only for the current period,
 * and only rows that apply; nothing renders when there is nothing to do.
 */
export function NextActions({
  nextClass,
  homework,
  missed,
  fmt,
  t,
}: {
  nextClass: ClassView | null;
  homework: ReportView["pendingHomework"];
  missed: ClassView[];
  fmt: Formatter;
  t: Dictionary;
}) {
  const a = t.report.actions;
  const actions: Action[] = [];

  if (nextClass) {
    const live = nextClass.status === "live";
    actions.push({
      key: "class",
      Icon: CalendarClock,
      tone: live ? "live" : "info",
      title: nextClass.title,
      detail: `${live ? t.classes.liveNow : a.nextClass} · ${describeClassTime(nextClass, fmt, t)}`,
      cta: live ? t.common.join : a.open,
      href: (nextClass.kind === "class" && nextClass.joinUrl) || nextClass.url || "#",
      live,
    });
  }
  if (homework.length > 0) {
    const first = homework[0];
    actions.push({
      key: "homework",
      Icon: ClipboardList,
      tone: "warning",
      title: fill(a.homework, { n: fmt.number(homework.length) }),
      detail: fill(a.homeworkDue, { day: dayWord(first.dueAt, fmt, t), time: fmt.time(first.dueAt) }),
      cta: a.submit,
      href: first.url,
    });
  }
  if (missed.length > 0) {
    actions.push({
      key: "missed",
      Icon: PlayCircle,
      tone: "highlight",
      title: fill(a.missed, { n: fmt.number(missed.length) }),
      detail: a.missedHint,
      cta: a.watch,
      href: missed[0].url ?? "#",
    });
  }
  if (actions.length === 0) return null;

  return (
    <SectionCard density="compact" titleId="actions-title" title={a.title}>
      <ul className="grid grid-cols-1 divide-y divide-border">
        {actions.map((x) => (
          <li key={x.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <IconTile icon={x.Icon} tone={x.tone} shape="circle" />
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-semibold">{x.title}</span>
              <span className="truncate text-sm text-muted">{x.detail}</span>
            </span>
            <Button href={x.href} size="sm" variant={x.live ? "live" : "secondary"}>
              {x.cta}
            </Button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
