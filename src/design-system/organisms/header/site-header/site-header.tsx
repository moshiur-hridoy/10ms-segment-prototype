import { BookSaved, Element3, Graph } from "iconsax-react";
import { Phone, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/design-system/atoms/logo";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { ExploreMenu } from "@/design-system/organisms/header/explore-menu";

/**
 * Full-height tab; the active one sits on the header's bottom edge with a brand underline.
 * `cn` doesn't merge conflicting utilities, so the two states never share a colour class.
 */
const TAB = "relative inline-flex h-full items-center gap-2 px-4 text-sm font-medium whitespace-nowrap transition-colors";
const TAB_IDLE = "text-muted hover:text-text";
/** The tab style for a visitor's menus (`publicNav`), so they sit like the student's tabs. */
export const PUBLIC_TAB = `${TAB} gap-1 ${TAB_IDLE}`;
// iconsax-react sets its defaults via `defaultProps`, which React 19 ignores: always pass `color`.
const TAB_ACTIVE = "bg-linear-to-b from-transparent to-brand-soft text-brand-text";

type NavItem = { href: string; label: string; Icon: typeof BookSaved; active: boolean };

function NavTab({ href, label, Icon, active }: NavItem) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(TAB, active ? TAB_ACTIVE : TAB_IDLE)}>
      <Icon size={20} color="currentColor" variant={active ? "Bold" : "Linear"} aria-hidden />
      {label}
      {/* A real element, not ::after, so it can carry a view-transition name: when the page
          changes, the underline glides from the old tab to the new one (globals.css). */}
      {active && <span aria-hidden className="absolute inset-x-0 -bottom-px h-[3px] rounded-t-xs bg-brand [view-transition-name:nav-underline]" />}
    </Link>
  );
}

export type HeaderTab = "dashboard" | "courses" | "report" | "routine" | "practice" | "none";

/**
 * `current` marks where the student is, so a course page never reads as the dashboard. `none`: a page outside the tabs.
 * `routine` and `practice` have no tab here, only in the phones' bottom nav.
 * `actions` is the right end (inbox and profile), streamed in by the page.
 */
export function SiteHeader({
  lang,
  t,
  current = "dashboard",
  actions,
  guest = false,
  publicNav,
}: {
  lang: Locale;
  t: Dictionary;
  current?: HeaderTab;
  actions: ReactNode;
  /** A visitor who isn't signed in (the segment page, CT21): only এক্সপ্লোর, since the other tabs are the student's own. */
  guest?: boolean;
  /** A visitor's menus, as on the live site (ক্লাস ৫-১২, ইংলিশ, স্টোর, অন্যান্য; CT64), in place of the tabs and এক্সপ্লোর. */
  publicNav?: ReactNode;
}) {
  const courses = { label: t.nav.courses, Icon: BookSaved, active: current === "courses" };

  return (
    <header className="site-header sticky top-0 z-40 border-b border-border bg-header backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-page items-center gap-2 px-4 sm:gap-3 sm:px-6">
        {/* The logo opens the public home page (the landing); the ড্যাশবোর্ড tab beside it opens the dashboard. */}
        <Link href={`/${lang}/hsc/hsc-28`} aria-label={t.nav.siteHome} className="shrink-0 text-text">
          <Logo data-site-logo className="h-7 w-auto" />
        </Link>

        {publicNav ? (
          <div className="ml-4 hidden h-full lg:flex">{publicNav}</div>
        ) : (
          <nav aria-label={t.nav.primary} className="ml-4 hidden h-full items-stretch lg:flex">
            {!guest && (
              <>
                <NavTab href={`/${lang}`} label={t.nav.dashboard} Icon={Element3} active={current === "dashboard"} />
                <NavTab href={`/${lang}/report`} label={t.nav.report} Icon={Graph} active={current === "report"} />
                {/* The library: every batch, course and book the student has. */}
                <NavTab {...courses} href={`/${lang}/library`} />
              </>
            )}
            <ExploreMenu labels={t.nav} lang={lang} tabClassName={TAB} idleClassName={TAB_IDLE} />
          </nav>
        )}

        <div className="flex-1" />

        <label className="hidden h-10 w-56 items-center gap-2 rounded-full border border-border bg-field px-3.5 text-sm transition-[border-color,box-shadow] hover:border-border-strong focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20 md:flex">
          <Search className="size-4 shrink-0 text-subtle" aria-hidden />
          <input
            type="search"
            placeholder={t.nav.search}
            aria-label={t.nav.search}
            className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-subtle"
          />
        </label>

        <a
          href="tel:16910"
          aria-label={`${t.nav.hotline} 16910`}
          className="hidden h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-brand-text hover:bg-brand-soft xl:inline-flex"
        >
          <Phone className="size-4" aria-hidden />
          16910
        </a>

        {actions}
      </div>
    </header>
  );
}
