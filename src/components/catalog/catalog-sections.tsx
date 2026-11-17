import { ArrowUpRight, CalendarDays, Check, ChevronDown, ChevronRight, Trophy, UserRound, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/design-system/atoms/badge";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { SectionCard } from "@/design-system/molecules/section-card";
import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { CatalogView } from "@/lib/api";
import type { CatalogProduct } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { BatchMenu, HeroStreamTabs } from "./hero-controls";
import { STREAM_ICON } from "./stream-icons";
import { SECTION_TITLE_BIG } from "./section-title";
import { fill, type Formatter } from "@/lib/format";

type Props = { view: CatalogView; lang: Locale; fmt: Formatter; t: Dictionary };

const streamHref = (lang: Locale, batch: string, stream: string) => `/${lang}/hsc/${batch}?stream=${stream}`;

/**
 * CT154 (lab `segment-home` v52): the page's header without the green hero, the batch menu or the stream tabs. The visitor
 * chose the class and the stream before coming here, so the page says what they chose, in the page's own colours: the
 * path in small grey ("এইচএসসি › ২৮ › বিজ্ঞান"; its first step goes back to where the class is picked), the batch as the
 * title, and the line said to the student under it.
 */
export function SegmentTitle({
  view,
  t,
  up,
  audience,
  boxed = false,
  yearLabel,
  welcome,
  streamNode,
  pathEnd,
}: {
  view: CatalogView;
  t: Dictionary;
  up: string;
  /** CT218: the path's last step drawn by the page (the stream as a button that opens the stream pop-up). */
  streamNode?: ReactNode;
  /** CT227: at the path's right end, on the same line (the "ইংলিশ শিখতে এসেছি" jump). */
  pathEnd?: ReactNode;
  audience?: string;
  /** CT179 (v72): the path's middle step in full ("ব্যাচ ২০২৮"), in place of the name's last word ("২৮"). */
  yearLabel?: string;
  /** CT155 (v53): in a card shaped like the dashboard's welcome card, without its picture: the title, and the path in grey under it. */
  boxed?: boolean;
  /**
   * CT191 (v83): the dashboard's welcome card for someone not logged in: the path above the card; in it a blank picture
   * (a grey circle with a figure, no green ring), the batch as the title and the time's greeting under it, with
   * "লগইন করো ›" for a guest (the page's login pop-up catches the link). Nothing on the right: no batch switch here (CT154).
   */
  welcome?: {
    greeting: string;
    login?: { label: string; href: string };
    /** CT196 (v88): the designer's picture in the blank circle (a soft figure on pale blue), not the grey icon. */
    avatar?: boolean;
    /** CT256 (segment-page v7): the title on one line: 16px on phones, cut with "…" if a longer name still doesn't fit. */
    oneLine?: boolean;
  };
}) {
  const name = view.batch.name.trim();
  const cut = name.lastIndexOf(" ");
  const [level, year] = cut > 0 ? [name.slice(0, cut), name.slice(cut + 1)] : [name, ""];
  const path = (
    <Breadcrumb
      label={t.catalog.crumbs}
      items={[
        { label: level, href: up },
        ...(yearLabel || year ? [{ label: yearLabel ?? year }] : []),
        { label: view.stream.name, node: streamNode },
      ]}
    />
  );
  const title = fill(t.segment.homeYourBatch, { batch: name, stream: view.stream.name });
  if (welcome)
    return (
      <header aria-labelledby="catalog-title" className="grid gap-3">
        {pathEnd ? (
          <div className="flex min-w-0 items-center justify-between gap-3">
            {path}
            {pathEnd}
          </div>
        ) : (
          path
        )}
        <Card className={cn("flex items-center gap-4 p-4 sm:p-5", welcome.oneLine && "max-sm:gap-3")}>
          {welcome.avatar ? (
            <Image
              src="/img/home/avatar-guest.png"
              alt=""
              width={52}
              height={52}
              // CT256: 44px on phones, so the one-line title has room on a 360px screen.
              className={cn("size-13 shrink-0 rounded-full", welcome.oneLine && "max-sm:size-11")}
            />
          ) : (
            <span aria-hidden className="grid size-13 shrink-0 place-items-center rounded-full bg-raised text-subtle">
              <UserRound className="size-6" />
            </span>
          )}
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h1
              id="catalog-title"
              title={welcome.oneLine ? title : undefined}
              className={cn("type-subtitle sm:type-title", welcome.oneLine && "truncate max-sm:text-base")}
            >
              {title}
            </h1>
            <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
              {welcome.greeting}
              {welcome.login && (
                <Link href={welcome.login.href} className="inline-flex items-center gap-0.5 font-semibold text-brand-text hover:underline">
                  {welcome.login.label}
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              )}
            </p>
          </div>
        </Card>
      </header>
    );
  if (boxed)
    return (
      <Card as="header" aria-labelledby="catalog-title" className="grid gap-1 p-4 sm:p-5">
        <h1 id="catalog-title" className="type-subtitle sm:type-title">
          {title}
        </h1>
        {path}
      </Card>
    );
  return (
    <header aria-labelledby="catalog-title" className="grid gap-2">
      {path}
      <h1 id="catalog-title" className="type-display text-text">
        {title}
      </h1>
      {audience && <p className="text-base text-muted">{audience}</p>}
    </header>
  );
}

/**
 * The page's one header: batch name, what the page does in a sentence, two proof points, and the
 * batch switch (HSC 26 and 28 still live on the main site). Brand mesh, like the course home.
 */
/** `compact` (lab `segment`, CT25): no lead, and only the start date and the toppers, so the free course shows on a phone's first screen. */
export function CatalogHero({
  view,
  lang,
  fmt,
  t,
  compact = false,
  keep,
  controls = false,
  toppers = true,
  dates = true,
  audience,
}: Props & {
  compact?: boolean;
  keep?: string;
  /** CT84 (lab `free-routine` v11): the title is a batch menu, and the streams sit in the hero. */ controls?: boolean;
  /** CT101 (lab `segment-home` v10): without the toppers badge. */
  toppers?: boolean;
  /** CT117 (lab `segment-home` v25): without the start date ("ক্লাস শুরু …"); the routine under it already says when classes run. */
  dates?: boolean;
  /** CT153 (lab `segment-home` v51): the line over the title in the page's own words ("SSC 2026 দিয়েছ? এটাই তোমার ব্যাচ"). */
  audience?: string;
}) {
  const l = t.catalog;
  const highlights = !dates ? [] : compact ? view.highlights.slice(0, 1) : view.highlights;
  // CT117: with no badge left (lab `segment-home`), no empty box either: on phones it wrapped to a line of its own and padded the hero's bottom.
  const hasBadges = highlights.length > 0 || (toppers && view.toppers !== null) || (!compact && view.stream.learners !== null);
  const badges = (
    <div className={cn("flex flex-wrap gap-1.5", controls ? "sm:justify-end" : "mt-1")}>
      {highlights.map((h) => (
        <Badge key={h} tone="onHero" className="gap-1.5">
          <CalendarDays className="size-3.5" aria-hidden />
          {h}
        </Badge>
      ))}
      {toppers && view.toppers !== null && (
        <Badge tone="onHero" className="gap-1.5">
          <Trophy className="size-3.5" aria-hidden />
          {fill(l.toppers, { n: fmt.number(view.toppers) })}
        </Badge>
      )}
      {!compact && view.stream.learners !== null && (
        <Badge tone="onHero" className="gap-1.5">
          <Users className="size-3.5" aria-hidden />
          {fill(l.learners, { n: fmt.number(view.stream.learners) })}
        </Badge>
      )}
    </div>
  );
  return (
    <section
      aria-labelledby="catalog-title"
      // CT84: with the batch menu, the hero doesn't clip (the menu hangs below it); the dots clip themselves to the corners.
      className={cn("relative isolate rounded-lg text-on-hero", !controls && "overflow-hidden")}
      style={{ backgroundImage: "var(--hero-mesh)", backgroundColor: "var(--color-hero)" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-lg [mask-image:linear-gradient(to_left,black_10%,transparent_75%)]"
        style={{ background: "var(--hero-dots)" }}
      />
      <div className={cn("flex flex-wrap justify-between gap-5 p-5 sm:p-6", controls ? "items-start" : "items-end")}>
        <div className={cn("grid max-w-2xl gap-2", controls && "max-sm:w-full")}>
          <p className="text-sm font-semibold opacity-85">{audience ?? view.audience ?? l.eyebrow}</p>
          {controls ? (
            <BatchMenu view={view} lang={lang} keep={keep ?? ""} label={l.batch} external={l.external} />
          ) : (
            <h1 id="catalog-title" className="type-display">
              {view.batch.name}
            </h1>
          )}
          {!compact && <p className="text-base opacity-90">{view.layout === "bundle" ? l.leadBundle : l.lead}</p>}
          {/* CT85: the streams right under the title, no label (the tabs say what they are), on the hero's own glass. */}
          {controls && (
            <div className="mt-2">
              <HeroStreamTabs view={view} lang={lang} keep={keep ?? ""} label={t.segment.askStream} />
            </div>
          )}
          {!controls && badges}
        </div>

        {/* CT85: with the batch menu in the title, the pills go and the facts take their place on the right. */}
        {controls ? (
          hasBadges && <div className="sm:self-start">{badges}</div>
        ) : (
          <nav aria-label={l.batch} className="inline-flex rounded-full bg-on-hero/10 p-1 ring-1 ring-on-hero/20 ring-inset">
            {view.batches.map((b) => {
              const current = b.id === view.batch.id;
              const tab = "inline-flex h-8 items-center gap-1 rounded-full px-3.5 text-sm font-semibold transition-colors";
              if (!current && b.here) {
                return (
                  // CT66: with `keep`, the other batch opens in the same stream, viewer and lab.
                  <Link
                    key={b.id}
                    href={keep === undefined ? `/${lang}/hsc/${b.id}` : `${streamHref(lang, b.id, view.stream.id)}${keep}`}
                    className={cn(tab, "text-on-hero/85 hover:text-on-hero")}
                  >
                    {b.label}
                  </Link>
                );
              }
              return current ? (
                <span
                  key={b.id}
                  aria-current="page"
                  className="inline-flex h-8 items-center rounded-full bg-on-hero px-3.5 text-sm font-semibold text-hero"
                >
                  {b.label}
                </span>
              ) : (
                <a
                  key={b.id}
                  href={b.url}
                  className="inline-flex h-8 items-center gap-1 rounded-full px-3.5 text-sm font-semibold text-on-hero/85 transition-colors hover:text-on-hero"
                >
                  {b.label}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                  <span className="sr-only">{l.external}</span>
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}

/**
 * One choice that decides everything below it, so it gets the full width and real tab weight.
 * `icons` (lab `segment`, CT35): each stream with its icon, and the chosen one filled in the brand green.
 */
export function StreamTabs({ view, lang, t, keep = "", icons = false }: Props & { keep?: string; icons?: boolean }) {
  return (
    <nav aria-label={t.catalog.stream} className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-muted">{t.catalog.stream}</span>
      {/* Lab `segment` (CT53): on phones the three streams share one row in equal parts instead of wrapping inside the pill. */}
      <div
        className={cn(
          "gap-1 rounded-full bg-raised p-1 ring-1 ring-border ring-inset",
          icons ? "grid w-full grid-cols-3 sm:inline-flex sm:w-auto" : "inline-flex flex-wrap",
        )}
      >
        {view.streams.map((s) => {
          const current = s.id === view.stream.id;
          const Icon = icons ? STREAM_ICON[s.id] : undefined;
          return (
            <Link
              key={s.id}
              href={streamHref(lang, view.batch.id, s.id) + keep}
              scroll={false}
              aria-current={current ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full px-5 text-base font-semibold transition-colors",
                Icon && "justify-center gap-1.5 px-2 text-sm whitespace-nowrap sm:gap-2 sm:pr-5 sm:pl-4 sm:text-base",
                current ? (icons ? "bg-primary text-on-primary shadow-raised" : "bg-surface text-text shadow-card") : "text-muted hover:text-text",
              )}
            >
              {Icon && <Icon size={16} color="currentColor" variant={current ? "Bold" : "Linear"} aria-hidden className="shrink-0 sm:size-[18px]" />}
              {s.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Already enrolled here: say so once, and offer the course home instead of a second purchase. */
export function EnrolledNote({ view, lang, t }: Props) {
  if (!view.enrolled.length) return null;
  return (
    <div className="grid gap-2">
      {view.enrolled.map(({ product, courseId }) => (
        <div key={product.id} className="flex flex-wrap items-center gap-3 rounded-md bg-success-soft px-4 py-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-on-fill">
            <Check className="size-4" aria-hidden />
          </span>
          <p className="min-w-0 flex-1 basis-60 text-sm text-text">{fill(t.catalog.enrolled, { title: product.title })}</p>
          <Button href={`/${lang}/course/${courseId}`} variant="secondary" size="sm">
            {t.common.courseHome}
          </Button>
        </div>
      ))}
    </div>
  );
}

/**
 * Recorded and final-prep batches: different ways to study, so they sit apart from the live picker.
 * `covers` (lab `segment`, CT30): each card leads with the product's own cover, as they are distinct products.
 */
export function OtherWays({ view, fmt, t, covers = false, big = false }: Props & { covers?: boolean; big?: boolean }) {
  const l = t.catalog;
  const ways = [
    view.stream.recorded && view.stream.recorded.price.final > 0 && { product: view.stream.recorded, title: l.recorded, note: l.recordedNote },
    view.stream.finalPrep && { product: view.stream.finalPrep, title: l.finalPrep, note: l.finalPrepNote },
  ].filter((w): w is { product: CatalogProduct; title: string; note: string } => Boolean(w));
  if (!ways.length) return null;

  return (
    <section aria-labelledby="other-title" className="grid gap-4">
      <h2 id="other-title" className={cn("type-title", big && SECTION_TITLE_BIG)}>
        {l.otherTitle}
      </h2>
      <div className={cn("grid gap-4", ways.length > 1 && "md:grid-cols-2")}>
        {ways.map(({ product, title, note }) => {
          const owned = view.ownedProducts.includes(product.id);
          return (
            <Card
              key={product.id}
              as="article"
              className={cn(
                "grid grid-cols-1 content-start gap-3 p-5",
                covers && product.thumbnailUrl && "sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-5",
              )}
            >
              {covers && product.thumbnailUrl && (
                <div className="relative aspect-video overflow-hidden rounded-md bg-raised sm:row-span-3 sm:aspect-square">
                  <Image src={product.thumbnailUrl} alt="" fill sizes="(min-width: 640px) 144px, 90vw" className="object-cover" />
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="type-subtitle">{title}</h3>
                  <p className="text-sm text-muted">{note}</p>
                </div>
                {owned ? (
                  <Badge tone="success">{l.owned}</Badge>
                ) : (
                  <p className="type-subtitle shrink-0 tabular-nums">৳{fmt.number(product.price.final)}</p>
                )}
              </div>
              <ul className="grid gap-1.5 text-sm text-muted">
                {product.facts.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={product.url} className="mt-1 inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
                {l.details}
                <ArrowUpRight className="size-4" aria-hidden />
                <span className="sr-only">
                  {" "}
                  {product.title} {l.external}
                </span>
              </a>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

/**
 * HSC 28's 16 months at a glance: the college year it runs beside (from the page's timeline), then
 * what each cycle teaches, subject by subject, folded so the page stays short.
 */
export function Journey({ view, fmt, t }: Props) {
  const l = t.catalog;
  const { billing, timeline } = view;
  const cycles = view.stream.main?.cycles ?? [];
  // The cycle length alone is already in the plan card; the section needs steps or chapters to earn its place.
  if (!timeline.length && !cycles.length) return null;
  const names = new Map([...view.stream.group, ...view.stream.compulsory].map((s) => [s.id, s.name]));
  const months = billing ? fmt.number(billing.cycleMonths * billing.cycles) : null;

  return (
    <SectionCard title={months ? fill(l.journeyTitle, { months }) : l.journeyTitleShort} titleId="journey-title">
      {billing && (
        <p className="-mt-2 text-sm text-muted">
          {fill(cycles.length ? l.journeyLead : l.journeyLeadShort, { months: fmt.number(billing.cycleMonths), cycles: fmt.number(billing.cycles) })}
        </p>
      )}

      {timeline.length > 0 && (
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold text-muted">{l.collegeYear}</h3>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {timeline.map((step, i) => (
              <li key={`${step.when}-${step.what}`} className="relative grid gap-0.5 rounded-md bg-raised px-3 py-2.5">
                <span className="text-xs font-semibold text-subtle tabular-nums">{fmt.number(i + 1)}</span>
                <span className="font-semibold">{step.what}</span>
                <span className="text-sm text-muted">{step.when}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {cycles.length > 0 && (
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold text-muted">{l.cycleChapters}</h3>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cycles.map((c) => (
              <Card as="li" radius="md" key={c.name} className="grid content-start gap-1 p-3">
                <span className="px-1 pb-1 font-semibold">{c.name}</span>
                {c.subjects.map((s) => (
                  <details key={s.subject} className="group rounded-sm">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-sm hover:bg-raised [&::-webkit-details-marker]:hidden">
                      <span className="font-medium">{names.get(s.subject) ?? s.subject}</span>
                      <span className="flex items-center gap-1 text-subtle">
                        {fill(l.chapters, { n: fmt.number(s.chapters.length) })}
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                      </span>
                    </summary>
                    <ul className="grid gap-1 px-1 pt-1 pb-2 text-sm text-muted">
                      {s.chapters.map((ch) => (
                        <li key={ch}>{ch}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </Card>
            ))}
          </ol>
        </div>
      )}
    </SectionCard>
  );
}

export function Faq({ view, t, big = false }: Props & { big?: boolean }) {
  if (!view.faq.length) return null;
  return (
    <SectionCard title={t.catalog.faqTitle} titleId="faq-title" titleClassName={big ? SECTION_TITLE_BIG : undefined}>
      <div className="grid divide-y divide-border">
        {view.faq.map((q) => (
          <details key={q.question} className="group py-3 first:pt-0 last:pb-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold [&::-webkit-details-marker]:hidden">
              {q.question}
              <ChevronDown className="size-4 shrink-0 text-subtle transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 text-sm whitespace-pre-line text-muted">{q.answer}</p>
          </details>
        ))}
      </div>
    </SectionCard>
  );
}

/**
 * CT178 (lab `segment-home` v71): the loading shape of the page as it is now, so nothing jumps when it arrives: one 960px
 * column, 24px under the site's header; the header box; 16px on, "তোমার জন্য ফ্রি" (two offer rows with their 56px tiles
 * and buttons, two upload boxes, four folders: two by two on phones); then the subject racks (three to a row, two rows
 * scrolling on phones) and the login card, 24px apart (40px on phones).
 */
export function SegmentSkeleton({
  label,
  books = false,
  shelf = false,
  routineTop = false,
  calm = false,
  course = false,
  leftRow = false,
  welcome = false,
  inset = false,
  moreBelow = false,
  uploadRows = false,
}: {
  label: string;
  /** CT183 (v76): the subjects as one book each, not racks. */
  books?: boolean;
  /** CT184 (v77): two small shelves, the papers as books over the subjects' names. */
  shelf?: boolean;
  /** CT185 (v78): the full routine as a button beside the title, three folders in one row. */
  routineTop?: boolean;
  /** CT187 (v79): the uploads' heading in the folders' type, "আরও দেখো" as a link. */
  calm?: boolean;
  /** CT188 (v80): the login card as a free course, a picture beside (above, on phones) the list. */
  course?: boolean;
  /** CT189 (v81): the folders in fixed 112px columns from the left, 16px apart, from `sm`. */
  leftRow?: boolean;
  /** CT191 (v83): the path above a welcome card with a blank picture; the title wraps to two lines on a phone. */
  welcome?: boolean;
  /** CT192 (v84): the free course's picture 4px inside the card's edges. */
  inset?: boolean;
  /** CT199 (v91): "আরও দেখো" under the upload boxes, not beside the heading. */
  moreBelow?: boolean;
  /** CT200 (v92): the uploads as 72px rows (a 56px circle, two lines), then the "+n" row. */
  uploadRows?: boolean;
}) {
  const card = "rounded-lg border border-border bg-surface";
  // A section's title and its line under it, 52px as on the page.
  const head = (w: string) => (
    <div className="grid gap-2">
      <Skeleton className={cn("h-7", w)} />
      <Skeleton className="h-4 w-56 max-w-full" />
    </div>
  );
  return (
    <SkeletonGroup label={label} className="mx-auto mt-2 grid w-full max-w-column grid-cols-1 gap-4 px-4 sm:px-6">
      {welcome ? (
        <div className="grid grid-cols-1 gap-3">
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-44" />
          </div>
          <div className={cn(card, "flex h-[112px] items-center gap-4 p-4 sm:h-[94px] sm:p-5")}>
            <Skeleton radius="full" className="size-13 shrink-0" />
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
              <Skeleton className="h-7 w-64 max-w-full sm:w-80" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>
      ) : (
        <div className={cn(card, "grid grid-cols-1 gap-2 p-4 sm:p-5")}>
          <Skeleton className="h-7 w-64 max-w-full sm:w-80" />
          <Skeleton className="h-4 w-36" />
        </div>
      )}

      <div className={cn(card, "grid grid-cols-1 gap-5 p-5 sm:p-6")}>
        {routineTop ? (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton radius="full" className="h-9 w-28 shrink-0" />
            </div>
          </div>
        ) : (
          head("w-40")
        )}
        {/* The offers: a 56px tile, two lines, a button; 72px a row. One column that may shrink, so a row never widens the phone. */}
        <div className="grid grid-cols-1 gap-2">
          {[0, 1].map((i) => (
            // On phones a row's name and time wrap, so a row there is taller (94px on average).
            <div key={i} className="flex items-center gap-3 py-2 max-sm:min-h-[94px] sm:gap-4">
              <Skeleton radius="md" className="size-14 shrink-0" />
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
                <Skeleton className="h-4 w-56 max-w-full" />
                <Skeleton className="h-3.5 w-40 max-w-full" />
              </div>
              <Skeleton radius="full" className="h-9 w-24 shrink-0" />
            </div>
          ))}
        </div>
        {/* The new uploads, two boxes one under the other. */}
        <div className="grid gap-2">
          {/* CT186: "আরও দেখো" beside the heading makes the row 28px. */}
          {moreBelow ? (
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-24" />
            </div>
          ) : calm ? (
            <div className="flex h-5 items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ) : routineTop ? (
            <div className="flex h-7 items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton radius="full" className="h-7 w-20" />
            </div>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
          {uploadRows
            ? [0, 1, 2].map((i) => (
                <div key={i} className="flex h-[72px] items-center gap-3 sm:gap-4">
                  <Skeleton radius="full" className="size-14 shrink-0" />
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
                    <Skeleton className={cn("h-4 max-w-full", i === 2 ? "w-40" : "w-56")} />
                    {i < 2 && <Skeleton className="h-3.5 w-40 max-w-full" />}
                  </div>
                </div>
              ))
            : [0, 1].map((i) => <Skeleton key={i} radius="lg" className="h-[70px] sm:h-[78px]" />)}
          {moreBelow && !uploadRows && (
            <div className="flex h-7 items-center justify-end">
              <Skeleton className="h-3.5 w-16" />
            </div>
          )}
        </div>
        {/* The four folders: two by two on phones, one row from `sm`. */}
        <div className="grid gap-3">
          <div className="flex h-6 items-end">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div
            className={
              leftRow
                ? "grid grid-cols-3 gap-3 sm:grid-cols-[repeat(auto-fill,7rem)] sm:gap-4"
                : routineTop
                  ? "grid grid-cols-3 gap-3 sm:gap-4"
                  : "grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4 sm:gap-4"
            }
          >
            {(routineTop ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => (
              // CT185: on phones "নোট ও সাজেশন" wraps under its folder, so the row is 156px tall there.
              <div key={i} className={cn("grid content-start justify-items-center gap-2 py-2", routineTop && "max-sm:min-h-[156px]")}>
                <Skeleton radius="md" className="aspect-[6/5] w-24 max-w-full" />
                <div className="grid justify-items-center gap-0.5">
                  <Skeleton className="my-0.5 h-4 w-16" />
                  <Skeleton className="my-0.5 h-3 w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The subject racks: as many as the stream has (seven), at the page's own breakpoints; two rows scrolling on phones. */}
      <div className={cn(card, "mt-6 grid grid-cols-1 gap-4 p-5 max-sm:border-0 max-sm:bg-transparent max-sm:p-0 sm:mt-2 sm:p-6")}>
        {head("w-44")}
        {shelf ? (
          <div className="-mx-4 overflow-hidden px-4 pb-1 sm:mx-0 sm:px-0">
            <div className="grid w-max min-w-full gap-5">
              {[
                [2, 2, 2, 2],
                [2, 2, 1],
              ].map((row, r) => (
                <div key={r} className="relative flex items-end gap-6 px-4 pt-3 sm:gap-8 sm:px-5">
                  <div className="absolute inset-x-0 bottom-0 h-8 rounded-sm bg-raised" />
                  {row.map((n, g) => (
                    <div key={g} className="relative grid justify-items-center">
                      <div className="flex items-end gap-2">
                        {Array.from({ length: n }, (_, i) => (
                          <Skeleton key={i} radius="md" className="aspect-[3/4] w-18 sm:w-20" />
                        ))}
                      </div>
                      <div className="h-8" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : books ? (
          <div className="@container">
            <div className="-mx-4 grid auto-cols-[8.5rem] grid-flow-col grid-rows-2 gap-x-4 gap-y-6 overflow-hidden px-4 pt-2 pb-2 sm:mx-0 sm:grid-flow-row sm:grid-cols-2 sm:grid-rows-none sm:gap-x-6 sm:gap-y-8 sm:px-0 sm:pt-0 sm:pb-0 @md:sm:grid-cols-3 @2xl:sm:grid-cols-4">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} radius="md" className="aspect-[3/4] w-full max-w-44" />
              ))}
            </div>
          </div>
        ) : (
          <div className="@container">
            <div className="-mx-4 grid auto-cols-[15rem] grid-flow-col grid-rows-2 gap-x-4 gap-y-6 overflow-hidden px-4 sm:mx-0 sm:grid-flow-row sm:grid-cols-1 sm:grid-rows-none sm:px-0 @md:sm:grid-cols-2 @2xl:sm:grid-cols-3">
              {Array.from({ length: 7 }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-border">
                  <div className="flex items-end justify-center gap-4 px-4 pt-6">
                    <Skeleton radius="md" className="aspect-[3/4] w-24 sm:w-26" />
                    {i < 6 && <Skeleton radius="md" className="aspect-[3/4] w-24 sm:w-26" />}
                  </div>
                  <div className="h-10 bg-raised" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {course ? (
        // The picture (200px on a phone, the left two fifths from `sm`), then the title, ten lines and the button.
        <div className={cn(card, "mt-6 grid grid-cols-1 overflow-hidden sm:mt-2 sm:h-[426px] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
          {/* Square inside the card, which rounds its outer corners. */}
          <div className={cn("shimmer bg-raised", inset ? "m-1 h-[196px] rounded-md sm:h-auto" : "h-[200px] sm:h-full")} />
          <div className="grid h-[456px] content-start gap-4 p-5 sm:h-auto sm:p-6">
            <Skeleton className="h-7 w-48" />
            <div className="grid gap-2.5 max-sm:gap-3">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className={cn("h-4", i % 3 === 0 ? "w-64 max-w-full" : i % 3 === 1 ? "w-44" : "w-56 max-w-full")} />
              ))}
            </div>
            <Skeleton radius="full" className="h-11 w-full sm:w-40" />
          </div>
        </div>
      ) : (
        // The login card: its list in one column on phones, two from `sm`.
        <Skeleton radius="lg" className="mt-6 h-[458px] sm:mt-2 sm:h-72" />
      )}
    </SkeletonGroup>
  );
}

export function CatalogSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid gap-5">
      <Skeleton className="h-4 w-48" />
      <Skeleton radius="lg" className="h-44" />
      <Skeleton radius="full" className="h-12 w-96 max-w-full" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton radius="lg" className="h-[32rem]" />
        <Skeleton radius="lg" className="h-80" />
      </div>
    </SkeletonGroup>
  );
}
