import { Suspense } from "react";
import { BottomNav, LiveDot } from "@/design-system/organisms/header/bottom-nav";
import { HeaderActionsSkeleton } from "@/design-system/organisms/header/header-actions";
import { SiteHeader, type HeaderTab } from "@/design-system/organisms/header/site-header";
import { QuietErrorBoundary } from "@/design-system/molecules/section-error";
import type { SectionProps } from "@/features/dashboard/types";
import { getClasses } from "@/lib/api";
import { HeaderUser } from "./header-user";

/**
 * The site header with the signed-in student's inbox and profile streamed into its right end,
 * and below `lg` the bottom nav (`bottomNav={false}` leaves it out, for the style guide).
 */
export function DashboardHeader({ ctx, lang, t, current = "dashboard", bottomNav = true }: SectionProps & { current?: HeaderTab; bottomNav?: boolean }) {
  return (
    <>
      <SiteHeader
        lang={lang}
        t={t}
        current={current}
        actions={
          <QuietErrorBoundary>
            <Suspense fallback={<HeaderActionsSkeleton />}>
              <HeaderUser ctx={ctx} lang={lang} t={t} />
            </Suspense>
          </QuietErrorBoundary>
        }
      />
      {bottomNav && (
        <BottomNav
          lang={lang}
          t={t}
          current={current}
          routineBadge={
            <QuietErrorBoundary>
              <Suspense fallback={null}>
                <RoutineLive ctx={ctx} label={t.nav.bottom.liveNow} />
              </Suspense>
            </QuietErrorBoundary>
          }
        />
      )}
    </>
  );
}

/** A red dot on the routine tab while a class is live. */
async function RoutineLive({ ctx, label }: Pick<SectionProps, "ctx"> & { label: string }) {
  const { liveCount } = await getClasses(await ctx);
  return liveCount ? <LiveDot label={label} /> : null;
}
