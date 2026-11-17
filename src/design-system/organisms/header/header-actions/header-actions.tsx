import { BellOff, ChevronRight } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { Skeleton } from "@/design-system/atoms/skeleton";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { NoticeList, unreadIds } from "@/design-system/molecules/notice-list";
import { MarkAllRead, UnreadBadge } from "@/design-system/molecules/notice-read";
import { InboxMenu } from "@/design-system/organisms/header/inbox-menu";
import { ProfileMenu } from "@/design-system/organisms/header/profile-menu";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Notice, UserView } from "@/lib/api";
import type { Formatter } from "@/lib/format";

/** The inbox shows more than the dashboard card (3); the rest are behind "সব দেখো". */
const INBOX_LIMIT = 6;

/** The header's right end: the notice inbox and the profile menu. */
export function HeaderActions({ user, notices, fmt, lang, t }: { user: UserView; notices: Notice[]; fmt: Formatter; lang: Locale; t: Dictionary }) {
  const unread = unreadIds(notices);

  return (
    <>
      <InboxMenu
        title={t.notices.title}
        lang={lang}
        unreadIds={unread}
        closeLabel={t.nav.bottom.close}
        heading={
          <>
            <span className="flex items-center gap-2 font-semibold">
              {t.notices.title}
              <UnreadBadge unreadIds={unread} lang={lang} />
            </span>
            {notices.length > 0 && (
              <span className="-mr-2 flex items-center">
                <MarkAllRead unreadIds={unread} label={t.notices.markAllRead} />
                <Button variant="ghost" size="sm" href={`/${lang}/notices`}>
                  {t.common.seeAll}
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </span>
            )}
          </>
        }
      >
        {notices.length === 0 ? (
          <EmptyState icon={BellOff} title={t.notices.empty} />
        ) : (
          <NoticeList items={notices.slice(0, INBOX_LIMIT)} fmt={fmt} t={t} />
        )}
      </InboxMenu>
      <ProfileMenu
        user={{ name: user.name, avatarUrl: user.avatarUrl, batch: user.activeBatch.label }}
        lang={lang}
        labels={t.profileMenu}
        triggerLabel={`${t.nav.profile}: ${user.name}`}
        title={t.nav.profile}
        closeLabel={t.nav.bottom.close}
      />
    </>
  );
}

export function HeaderActionsSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <Skeleton radius="full" className="size-9" />
      <Skeleton radius="full" className="size-10" />
    </div>
  );
}
