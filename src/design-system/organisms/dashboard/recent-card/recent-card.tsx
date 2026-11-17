import { ChevronRight, History } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { SectionCard } from "@/design-system/molecules/section-card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { cn } from "@/lib/cn";
import { ContentIcon } from "@/design-system/atoms/content-icon";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { RecentItem } from "@/lib/api";
import type { Formatter } from "@/lib/format";

export function RecentCard({ items, fmt, t }: { items: RecentItem[]; fmt: Formatter; t: Dictionary }) {
  const shown = items.slice(0, 5);
  const usualBatch = mostCommon(shown.map((i) => i.batchType));

  return (
    <SectionCard
      title={t.recent.title}
      titleId="recent-title"
      action={
        items.length > 0 && (
          <Button variant="ghost" size="sm" href="#">
            {t.common.seeAll}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={History} title={t.recent.empty} />
      ) : (
        <ul className="grid grid-cols-1 gap-1">
          {shown.map((item) => {
            const isNew = item.seen === false;
            const ago = fmt.ago(item.uploadedAt);
            return (
              <li key={item.id} className="min-w-0">
                {/* Inbox pattern: what it is on the left, when on the right. The whole row is the link. */}
                <a href={item.url} className="-mx-2 flex items-center gap-3 rounded-md p-2 press hover:bg-raised">
                  <ContentIcon type={item.type} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className={cn("truncate", isNew ? "font-semibold" : "font-medium")}>
                      {isNew && <span className="sr-only">{t.common.new}: </span>}
                      {item.title}
                    </span>
                    {/* Wraps on phones so the subject is never squeezed out; one line from sm up. */}
                    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-subtle sm:flex-nowrap">
                      <span className="min-w-0 truncate">{item.subject}</span>
                      <span aria-hidden>·</span>
                      <span className="shrink-0">{t.contentType[item.type]}</span>
                      {/* The batch only when it differs from the rest, e.g. one recorded course among online batches. */}
                      {item.batchType !== usualBatch && (
                        <>
                          <span aria-hidden>·</span>
                          <span className="shrink-0">{t.batchType[item.batchType]}</span>
                        </>
                      )}
                      {/* Phones: the time joins this line instead of taking a column. */}
                      <span aria-hidden className="sm:hidden">·</span>
                      <span className="shrink-0 sm:hidden">{ago}</span>
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-2 text-sm whitespace-nowrap text-subtle sm:flex">
                    {isNew && <span aria-hidden className="size-2 rounded-full bg-brand" />}
                    <span className={cn(isNew && "font-medium text-text")}>{ago}</span>
                  </span>
                  {isNew && <span aria-hidden className="size-2 shrink-0 rounded-full bg-brand sm:hidden" />}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function mostCommon<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}
