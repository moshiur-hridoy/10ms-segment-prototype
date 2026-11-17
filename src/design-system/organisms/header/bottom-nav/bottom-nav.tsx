import { BookSaved, Calendar1, Element3, Graph, HambergerMenu, Notification, TaskSquare, Tree } from "iconsax-react";
import { ChevronRight, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BottomSheet } from "@/design-system/molecules/bottom-sheet";
import { EXPLORE_ITEMS } from "@/design-system/organisms/header/explore-menu";
import type { HeaderTab } from "@/design-system/organisms/header/site-header";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type Tab = "home" | "routine" | "library" | "practice" | "more";

/** Which tab a page belongs to. The report lives under "আরও". */
const TAB_OF: Partial<Record<HeaderTab, Tab>> = { dashboard: "home", routine: "routine", courses: "library", practice: "practice", report: "more" };

const TAB = "relative grid h-full min-w-0 place-items-center content-center gap-1 text-xs font-medium transition-colors";

/** The icon on a pill in the brand tint when its tab is open. */
function TabFace({ Icon, label, active, badge }: { Icon: typeof Element3; label: string; active: boolean; badge?: ReactNode }) {
  return (
    <>
      <span className={cn("relative grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-brand-soft")}>
        {/* iconsax-react ignores its defaultProps under React 19: always pass `color`. */}
        <Icon size={22} color="currentColor" variant={active ? "Bold" : "Linear"} aria-hidden />
        {badge}
      </span>
      <span className="max-w-full truncate px-1">{label}</span>
    </>
  );
}

const ROW = "flex min-h-12 items-center gap-3 rounded-md px-2 text-sm font-medium transition-colors hover:bg-raised active:bg-raised";
const ROW_ICON = "grid size-10 shrink-0 place-items-center rounded-md border border-border bg-raised";

/**
 * The phone and tablet nav (below `lg`, where the header's tabs are hidden): five tabs fixed to
 * the bottom edge. হোম · রুটিন · লাইব্রেরি · প্র্যাকটিস (SuperPrep) · আরও, a sheet with the learning
 * report, notices, the garden, the catalogue and the hotline. The profile stays in the header.
 * `routineBadge` streams in a red dot while a class is live. The page leaves room for the bar
 * (globals.css); a page with its own bottom bar marks itself `data-no-bottom-nav` and the bar steps aside.
 * `preview`: drawn in place at any width, for the style guide.
 */
export function BottomNav({ lang, t, current, routineBadge, preview }: { lang: Locale; t: Dictionary; current?: HeaderTab; routineBadge?: ReactNode; preview?: boolean }) {
  const b = t.nav.bottom;
  const active = current ? TAB_OF[current] : undefined;
  const tabs = [
    { key: "home", href: `/${lang}`, label: b.home, Icon: Element3 },
    { key: "routine", href: `/${lang}/routine`, label: b.routine, Icon: Calendar1, badge: routineBadge },
    { key: "library", href: `/${lang}/library`, label: b.library, Icon: BookSaved },
    { key: "practice", href: `/${lang}/superprep`, label: b.practice, Icon: TaskSquare },
  ] as const;
  const learning = [
    { key: "report", href: `/${lang}/report`, label: t.nav.report, Icon: Graph },
    { key: "notices", href: `/${lang}/notices`, label: t.notices.title, Icon: Notification },
    { key: "garden", href: `/${lang}/garden`, label: t.garden.title, Icon: Tree },
  ] as const;

  return (
    <nav
      aria-label={t.nav.primary}
      className={cn(
        "border-t border-border bg-overlay backdrop-blur-xl backdrop-saturate-150",
        !preview && "bottom-nav fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden",
      )}
    >
      <ul className="mx-auto grid h-16 max-w-2xl grid-cols-5">
        {tabs.map(({ key, href, label, Icon, ...rest }) => (
          <li key={key}>
            <Link href={href} aria-current={active === key ? "page" : undefined} className={cn(TAB, active === key ? "text-brand-text" : "text-muted active:text-text")}>
              <TabFace Icon={Icon} label={label} active={active === key} badge={"badge" in rest ? rest.badge : undefined} />
            </Link>
          </li>
        ))}
        <li>
          <BottomSheet
            title={b.more}
            closeLabel={b.close}
            closeOn="a"
            triggerClassName={cn(TAB, "w-full", active === "more" ? "text-brand-text" : "text-muted active:text-text")}
            trigger={<TabFace Icon={HambergerMenu} label={b.more} active={active === "more"} />}
          >
            <div className="grid gap-5">
              <section className="grid gap-1">
                <h3 className="px-2 text-xs font-semibold text-subtle">
                  {t.profileMenu.learning}
                </h3>
                <ul>
                  {learning.map(({ key, href, label, Icon }) => (
                    <li key={key}>
                      <Link href={href} aria-current={key === "report" && current === "report" ? "page" : undefined} className={ROW}>
                        <span className={cn(ROW_ICON, "text-brand-text")}>
                          <Icon size={20} color="currentColor" variant="Linear" aria-hidden />
                        </span>
                        <span className="flex-1">{label}</span>
                        <ChevronRight className="size-4 text-subtle" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="grid gap-1">
                <h3 className="px-2 text-xs font-semibold text-subtle">
                  {t.nav.explore}
                </h3>
                <ul>
                  {EXPLORE_ITEMS.map((item) => {
                    const { key, Icon, tone } = item;
                    return (
                      <li key={key}>
                        <a href={"local" in item ? `/${lang}${item.local}` : item.href} className={ROW}>
                          <span className={ROW_ICON}>
                            <Icon className={cn("size-5", tone)} aria-hidden />
                          </span>
                          <span className="flex-1">{t.nav.exploreItems[key]}</span>
                          <ChevronRight className="size-4 text-subtle" aria-hidden />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="border-t border-border pt-3">
                <a href="tel:16910" className={cn(ROW, "font-semibold text-brand-text")}>
                  <span className={ROW_ICON}>
                    <Phone className="size-5" aria-hidden />
                  </span>
                  {t.nav.hotline} 16910
                </a>
              </div>
            </div>
          </BottomSheet>
        </li>
      </ul>
    </nav>
  );
}

/** The routine tab's badge while a class is live. */
export function LiveDot({ label }: { label: string }) {
  return (
    <span className="absolute top-0.5 right-3 size-2.5 rounded-full bg-live ring-2 ring-surface">
      <span className="sr-only">{label}</span>
    </span>
  );
}
