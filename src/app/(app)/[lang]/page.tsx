import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { SectionSkeleton } from "@/design-system/molecules/section-card";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { Reveal } from "@/design-system/motion/motion";
import { QuickRail } from "@/design-system/organisms/dashboard/quick-rail";
import { DashboardTemplate } from "@/design-system/templates/dashboard-template";
import { dashboardLayout, type DashboardSection } from "@/features/dashboard/config";
import { RoutineSwitch } from "@/features/dashboard/routine";
import type { DashboardSectionProps } from "@/features/dashboard/types";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { createDataContext } from "@/lib/api";

export default async function Dashboard({ params, searchParams }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  // Not awaited: the shell (header, rail, layout) renders immediately and each
  // section awaits the request-time context inside its own Suspense boundary.
  const ctx = createDataContext(searchParams);
  const props: DashboardSectionProps = { ctx, lang, t, searchParams };

  /** Each section loads, fails and retries independently. */
  const boundary = (node: ReactNode, rows: number) => (
    <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
      <Reveal fallback={<SectionSkeleton rows={rows} label={t.common.loading} />}>{node}</Reveal>
    </SectionErrorBoundary>
  );
  const slot = ({ id, section: Section, rows, wide, quiet }: DashboardSection) => ({
    id,
    wide,
    node: quiet ? (
      <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
        <Suspense fallback={null}>
          <Section {...props} />
        </Suspense>
      </SectionErrorBoundary>
    ) : (
      boundary(<Section {...props} />, rows)
    ),
  });

  return (
    <DashboardTemplate
      header={<DashboardHeader ctx={ctx} lang={lang} t={t} />}
      rail={<QuickRail lang={lang} t={t} />}
      main={dashboardLayout.main.map(slot)}
      aside={dashboardLayout.aside.map(slot)}
      overlay={
        // Two routine versions are being compared; the new one is the default, ?routine=classic picks the old one.
        <Suspense>
          <RoutineSwitch searchParams={searchParams} t={t} />
        </Suspense>
      }
    />
  );
}
