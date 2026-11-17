import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { BellOff } from "lucide-react";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { MarkAllRead, UnreadSummary } from "@/design-system/molecules/notice-read";
import { NoticeList, unreadIds } from "@/design-system/molecules/notice-list";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { Card } from "@/design-system/atoms/card";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionSkeleton } from "@/design-system/molecules/section-card";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getNotices, type DataContext } from "@/lib/api";
import { createFormatter } from "@/lib/format";

/*
 * Every notice, newest first, on the same site (the dashboard card and the header inbox show
 * the latest few and link here). The summary names both numbers so "unread" and "total" are
 * never confused: the dashboard badge counts the unread ones.
 */
export default async function NoticesPage({ searchParams }: PageProps<"/[lang]/notices">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <>
      <DashboardHeader ctx={ctx} lang={lang} t={t} current="none" />
      <PageMotion>
        <main className="mx-auto grid max-w-3xl grid-cols-1 gap-5 px-4 pt-4 pb-12 sm:px-6">
          <Breadcrumb label={t.courseHome.crumbs} items={[{ label: t.nav.dashboard, href: `/${lang}` }, { label: t.notices.title }]} />
          <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
            <Reveal fallback={<SectionSkeleton rows={5} label={t.common.loading} />}>
              <NoticesBody ctx={ctx} lang={lang} t={t} />
            </Reveal>
          </SectionErrorBoundary>
        </main>
      </PageMotion>
    </>
  );
}

async function NoticesBody({ ctx, lang, t }: { ctx: Promise<DataContext>; lang: Locale; t: Dictionary }) {
  const c = await ctx;
  const { items } = await getNotices(c);
  const unread = unreadIds(items);
  const fmt = createFormatter(lang, c.now);

  return (
    <Card aria-labelledby="notices-page-title" className="grid grid-cols-1 gap-5 p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 id="notices-page-title" className="type-title">
            {t.notices.title}
          </h1>
          {items.length > 0 && <UnreadSummary unreadIds={unread} total={items.length} template={t.notices.summary} lang={lang} />}
        </div>
        {items.length > 0 && <MarkAllRead unreadIds={unread} label={t.notices.markAllRead} className="-mr-2" />}
      </header>
      {items.length === 0 ? <EmptyState icon={BellOff} title={t.notices.empty} /> : <NoticeList items={items} fmt={fmt} t={t} />}
    </Card>
  );
}
