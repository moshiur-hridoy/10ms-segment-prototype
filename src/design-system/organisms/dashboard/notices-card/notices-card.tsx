import { BellOff, ChevronRight } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { NoticeList, unreadIds } from "@/design-system/molecules/notice-list";
import { UnreadBadge } from "@/design-system/molecules/notice-read";
import { SectionCard } from "@/design-system/molecules/section-card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Notice } from "@/lib/api";
import type { Formatter } from "@/lib/format";

/** The latest three notices, with the unread count beside the title. */
export function NoticesCard({ items, fmt, lang, t }: { items: Notice[]; fmt: Formatter; lang: Locale; t: Dictionary }) {
  return (
    <SectionCard
      titleId="notices-title"
      title={
        <>
          {t.notices.title}
          <UnreadBadge unreadIds={unreadIds(items)} lang={lang} />
        </>
      }
      action={
        items.length > 0 && (
          <Button variant="ghost" size="sm" href={`/${lang}/notices`} className="-mr-2">
            {t.common.seeAll}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={BellOff} title={t.notices.empty} />
      ) : (
        <NoticeList items={items.slice(0, 3)} fmt={fmt} t={t} />
      )}
    </SectionCard>
  );
}
