import { ChevronRight, ChevronsUpDown } from "lucide-react";
import { Avatar } from "@/design-system/atoms/avatar";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BriefItem, UserView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { BriefTicker } from "@/design-system/molecules/brief-ticker";

/*
 * Greeting + a one-line brief of today that rotates through what's true right now
 * (live class, open exam, tasks left, streak, new content, notices), most urgent first.
 * Each update links to the section with the details, so nothing is duplicated here.
 * With nothing to say, the line falls back to today's date.
 */
export function WelcomeCard({ user, brief, now, fmt, t }: { user: UserView; brief: BriefItem[]; now: number; fmt: Formatter; t: Dictionary }) {
  const date = `${fmt.weekday(now)}, ${fmt.date(now)}`;

  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar src={user.avatarUrl} name={user.name} size={52} className="ring-4 ring-brand-soft" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <h1 className="truncate type-subtitle sm:type-title">
            {fill(t.greeting.withName, { greeting: t.greeting[fmt.greeting()], name: user.name })}
          </h1>
          {brief.length > 0 ? (
            <BriefTicker
              label={`${t.welcome.briefLabel} · ${date}`}
              goTo={brief.map((_, i) => fill(t.welcome.briefGoTo, { i: fmt.number(i + 1) }))}
              items={brief.map((item, i) => ({ id: `${item.kind}-${i}`, node: <BriefLine item={item} fmt={fmt} t={t} /> }))}
            />
          ) : (
            <p className="text-sm text-subtle">{date}</p>
          )}
        </div>
      </div>
      {/* Switching batch changes the whole dashboard, so it's labelled as such. */}
      <div className="grid shrink-0 gap-1 sm:justify-items-end">
        <span className="text-xs text-subtle">{t.welcome.batch}</span>
        <button
          type="button"
          aria-label={`${t.welcome.changeBatch}: ${user.activeBatch.label}`}
          className="flex h-11 max-w-full items-center gap-2 rounded-md border border-border bg-raised px-4 text-left font-medium transition-colors hover:border-border-strong sm:max-w-72"
        >
          <span className="truncate">{user.activeBatch.label}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-subtle" aria-hidden />
        </button>
      </div>
    </Card>
  );
}

const dots: Record<BriefItem["kind"], string> = {
  live: "bg-live motion-safe:animate-pulse",
  exam: "bg-highlight",
  tasksLeft: "bg-brand",
  allDone: "bg-success",
  streakStart: "bg-streak",
  streakAtRisk: "bg-streak",
  streakGoing: "bg-streak",
  newContent: "bg-info",
  notices: "bg-danger",
};

/** One update: coloured dot, the sentence, and (when there is something to do) an action. */
function BriefLine({ item, fmt, t }: { item: BriefItem; fmt: Formatter; t: Dictionary }) {
  const b = t.welcome.brief;
  const n = (v: number) => fmt.number(v);
  let href = "#routine";
  let lead: string | null = null;
  let text: string;
  let action: string | null = b.see;

  switch (item.kind) {
    case "live":
      [href, lead, text, action] = [item.href, b.live, item.title, t.common.join];
      break;
    case "exam":
      [href, lead, text, action] = [item.href, b.exam, item.title, b.examCta];
      break;
    case "tasksLeft":
      text = fill(b.tasksLeft, { n: n(item.n) });
      break;
    case "allDone":
      [text, action] = [b.allDone, null];
      break;
    case "streakStart":
      [href, text, action] = ["#streak-title", b.streakStart, null];
      break;
    case "streakAtRisk":
      [href, text, action] = ["#streak-title", fill(b.streakAtRisk, { n: n(item.next) }), null];
      break;
    case "streakGoing":
      [href, text, action] = ["#streak-title", fill(b.streakGoing, { n: n(item.days) }), null];
      break;
    case "newContent":
      [href, text] = ["#recent-title", fill(b.newContent, { n: n(item.n) })];
      break;
    case "notices":
      [href, text, action] = ["#notices-title", fill(b.notices, { n: n(item.n) }), b.read];
      break;
  }

  return (
    <a href={href} className="group flex min-w-0 items-center gap-2 text-sm">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dots[item.kind])} />
      <span className="min-w-0 truncate text-muted">
        {lead && <span className="font-semibold text-text">{lead} </span>}
        {text}
      </span>
      {action && (
        <span className="inline-flex shrink-0 items-center font-semibold text-brand-text group-hover:underline">
          {action}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </a>
  );
}
