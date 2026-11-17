import { CalendarCheck, CalendarDays, PartyPopper } from "lucide-react";
import Link from "next/link";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { fill } from "@/lib/format";
import { SubjectFilter } from "@/design-system/molecules/subject-filter";
import { ClassRow } from "@/design-system/molecules/class-row";
import { ClassesTabs } from "@/design-system/molecules/classes-tabs";
import { LiveHero } from "@/design-system/organisms/dashboard/live-hero";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SubjectOption } from "@/design-system/molecules/subject-filter";
import type { ClassesView } from "@/lib/api";
import type { Formatter } from "@/lib/format";

export function ClassesCard({ classes, options, fmt, lang, t }: { classes: ClassesView; options: SubjectOption[]; fmt: Formatter; lang: Locale; t: Dictionary }) {
  const { upcoming, missed, next, subjects, subject } = classes;
  const clear = subject ? (
    <Button href={options[0].href} variant="secondary" size="sm" scroll={false} replace>
      {t.tasks.clearSubject}
    </Button>
  ) : undefined;
  const rest = next ? upcoming.filter((i) => i.id !== next.id) : upcoming;

  return (
    <Card
      id="routine"
      aria-label={t.classes.tabsLabel}
      className="grid grid-cols-1 gap-5 p-5 sm:p-6"
      style={{ backgroundImage: "var(--grad-classes)" }}
    >
      <ClassesTabs
        labels={{
          tabs: t.classes.tabsLabel,
          upcoming: t.classes.upcoming,
          missed: t.classes.missed,
        }}
        missedDot={missed.length > 0}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {subjects.length > 1 && <SubjectFilter label={t.routine.subject} value={subject ?? "all"} options={options} />}
            <Link
              href={`/${lang}/routine`}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-soft"
            >
              <CalendarDays className="size-4" aria-hidden />
              {t.classes.fullRoutine}
            </Link>
          </div>
        }
        upcoming={
          upcoming.length === 0 ? (
            <EmptyState icon={CalendarCheck} title={subject ? fill(t.classes.emptySubject, { subject }) : t.classes.empty} action={clear} />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {next && <LiveHero item={next} fmt={fmt} t={t} />}
              {rest.length > 0 && (
                <ul className="grid grid-cols-1 gap-1">
                  {rest.map((item) => (
                    <ClassRow key={item.id} item={item} fmt={fmt} t={t} showFreeLink />
                  ))}
                </ul>
              )}
            </div>
          )
        }
        missed={
          missed.length === 0 ? (
            <EmptyState icon={PartyPopper} title={t.classes.emptyMissed} action={clear} />
          ) : (
            <ul className="grid grid-cols-1 gap-1">
              {missed.map((item) => (
                <ClassRow key={item.id} item={item} fmt={fmt} t={t} />
              ))}
            </ul>
          )
        }
      />
    </Card>
  );
}
