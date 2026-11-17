import type { Metadata } from "next";
import { Anek_Bangla, Fugaz_One, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "../../globals.css";
import { isLocale, locales } from "@/i18n/config";
import { NavMotion } from "@/design-system/motion/nav-motion";
import { getDictionary } from "@/i18n/get-dictionary";
import { Splash } from "@/components/layout/splash";
import { splashScript } from "@/lib/splash";
import { themeScript } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// DS73 (16 Nov): Anek Bangla for every Bangla letter, the designer's choice (was Noto Sans Bengali). Latin stays Inter.
const bengali = Anek_Bangla({
  subsets: ["bengali"],
  variable: "--font-bengali",
  display: "swap",
});

/** Only for the SuperPrep wordmark. */
const fugaz = Fugaz_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fugaz",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.meta.title, description: t.meta.description };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <html
      lang={lang}
      data-mode="light"
      data-brand="online"
      className={`${inter.variable} ${bengali.variable} ${fugaz.variable}`}
      // The theme script below may switch data-mode before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-text">
        <Splash slowLabel={t.common.slowNetwork} />
        {children}
        {/* usePathname() is request-time data, so it streams in behind its own boundary. */}
        <Suspense>
          <NavMotion label={t.common.loading} slowLabel={t.common.slowNetwork} />
        </Suspense>
      </body>
    </html>
  );
}
