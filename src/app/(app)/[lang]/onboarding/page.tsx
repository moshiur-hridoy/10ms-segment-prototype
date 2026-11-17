import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { lang as rootLang } from "next/root-params";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getOnboardingSubjects } from "@/lib/api";
import { safeNext } from "@/lib/session";

type SearchParams = Record<string, string | string[] | undefined>;

/*
 * Onboarding after the first sign-in (OB1–OB3): TenTen asks, the student card fills in. Its own
 * full-screen layout like the login (no dashboard header). A lab for now (`?lab=onboarding`), so
 * without it the page doesn't exist; sign-in doesn't send anyone here until the backend can say
 * whose profile is incomplete (section 9). OB15: the free demo sign-in (LG19) comes here first, with `next`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await rootLang();
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: `${t.onboarding.title} | 10 Minute School` };
}

export default async function OnboardingPage({ searchParams }: PageProps<"/[lang]/onboarding">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  // The lab check and the data read the request, so they stream in behind a boundary.
  return (
    <Suspense>
      <OnboardingBody searchParams={searchParams} lang={lang} t={t} />
    </Suspense>
  );
}

async function OnboardingBody({ searchParams, lang, t }: { searchParams: Promise<SearchParams>; lang: Locale; t: Dictionary }) {
  const sp = await searchParams;
  const lab = typeof sp.lab === "string" ? sp.lab.split("@")[0] : null;
  if (lab !== "onboarding") notFound();
  const subjects = await getOnboardingSubjects(await createDataContext(sp));

  // OB15: a student sent here by the login (`next`, where they were going) goes back there at the end.
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  return <OnboardingFlow copy={t.onboarding} subjects={subjects} lang={lang} doneHref={next ?? `/${lang}`} logoLabel={t.nav.siteHome} />;
}
