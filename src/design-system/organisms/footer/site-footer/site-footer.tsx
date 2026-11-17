import { Phone } from "lucide-react";
import Link from "next/link";
import { FacebookMark } from "@/design-system/atoms/facebook-mark";
import { Logo } from "@/design-system/atoms/logo";
import { links } from "@/data/landing/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/**
 * The site's footer (CT32), first on the segment page. It follows the theme like the landing's footer (CT33): light
 * in light mode, dark in dark mode; the store buttons stay near-black (`ink`), as on the landing.
 * The app, then the hotline, the landing footer's links in three columns (real addresses, LP16), and the
 * copyright with Facebook and YouTube as marks. Every link and figure is the live site's (data/landing/site.ts).
 */
export function SiteFooter({ lang, t }: { lang: Locale; t: Dictionary }) {
  const f = t.footer;
  const cols = [
    {
      title: f.study,
      items: [
        [f.english, links.englishOnline],
        [f.skills, links.skills],
        [f.jobs, links.jobsPrep],
        [f.store, links.store],
      ],
    },
    {
      title: f.company,
      items: [
        [f.teach, links.teacher],
        [f.certificate, links.certificate],
      ],
    },
    {
      title: f.policy,
      items: [
        [f.privacy, links.privacy],
        [f.refund, links.refund],
        [f.terms, links.terms],
      ],
    },
  ] as const;
  const social =
    "grid size-10 place-items-center rounded-full bg-raised text-text ring-1 ring-border transition-colors ring-inset hover:ring-border-strong";
  const store = "inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-on-fill transition-opacity hover:opacity-90";

  return (
    <footer className="border-t border-border bg-surface text-text">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-14 sm:px-6 lg:py-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="grid max-w-md gap-4">
            <Link href={`/${lang}/hsc/hsc-28`} aria-label={t.nav.siteHome} className="w-fit">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted">{f.rating}</p>
            <div className="flex flex-wrap gap-2">
              <a href={links.playStore} className={store}>
                Google Play
              </a>
              <a href={links.appStore} className={store}>
                App Store
              </a>
            </div>
          </div>
          <a href={links.phone} className="group grid gap-1 rounded-lg bg-raised px-5 py-4 ring-1 ring-border ring-inset hover:ring-border-strong">
            <span className="text-sm text-muted">{f.call}</span>
            <span className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-on-primary">
                <Phone className="size-4" aria-hidden />
              </span>
              <span className="type-headline tabular-nums">16910</span>
              <span className="text-sm text-muted">· {f.hours}</span>
            </span>
          </a>
        </div>

        <nav aria-label={f.label} className="grid grid-cols-2 gap-8 border-t border-border pt-10 md:grid-cols-3">
          {cols.map((c) => (
            <div key={c.title} className="grid content-start gap-3">
              <p className="text-sm font-semibold text-subtle">{c.title}</p>
              <ul className="grid gap-2">
                {c.items.map(([label, href]) => (
                  <li key={label}>
                    <a href={href} className="text-sm text-muted transition-colors hover:text-text hover:underline">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-sm text-subtle">{f.copyright}</p>
          {/* The two social links, as marks. */}
          <div className="flex gap-2">
            <a href={links.facebook} aria-label="Facebook" className={social}>
              <FacebookMark className="size-5" />
            </a>
            <a href={links.youtube} aria-label="YouTube" className={social}>
              <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                <rect x="2" y="5" width="20" height="14" rx="4" className="fill-current" />
                <path d="M10 9v6l5-3z" className="fill-surface" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
