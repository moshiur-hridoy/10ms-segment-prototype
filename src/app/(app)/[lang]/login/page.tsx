import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { LoginBrandPanel } from "@/design-system/organisms/login/login-brand-panel";
import { LoginForm } from "@/design-system/organisms/login/login-form";
import { LoginTemplate } from "@/design-system/templates/login-template";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { loginVoices } from "@/features/login/voices";
import { localDigits } from "@/lib/phone";

/*
 * Sign-in: phone number, then a 6-digit code. Its own full-screen layout (no dashboard header).
 * There is no auth backend yet, so a successful code just opens the dashboard.
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await rootLang();
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: `${t.login.title} | 10 Minute School` };
}

export default async function LoginPage() {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const other = locales.find((l) => l !== lang)!;
  const { login: c } = t;

  return (
    <LoginTemplate
      form={
        <LoginForm
          copy={c}
          doneHref={`/${lang}`}
          switchHref={`/${other}/login`}
          homeHref={`/${lang}/hsc/hsc-28`}
          logoLabel={t.nav.siteHome}
          lang={lang}
        />
      }
      aside={
        <LoginBrandPanel
          voices={loginVoices(c)}
          labels={{ region: c.voicesLabel, slide: c.slideLabel, goTo: c.goTo, sample: c.sampleQuote, caption: c.photoCaption }}
          numerals={[1, 2, 3, 4, 5, 6].map((n) => localDigits(n, lang))}
        />
      }
    />
  );
}
