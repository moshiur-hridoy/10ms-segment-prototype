import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/design-system/atoms/logo";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Sticky glass header shared by every page. `children` fills the middle slot. */
export function TopBar({
  lang,
  t,
  children,
}: {
  lang: Locale;
  t: Dictionary;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-overlay backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-page items-center gap-4 px-4 sm:px-6">
        <Link href={`/${lang}/hsc/hsc-28`} className="text-text" aria-label={t.nav.siteHome}>
          <Logo data-site-logo className="h-7 w-auto" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
      </div>
    </header>
  );
}
