import { CloudRain, Droplet, Lock, X } from "lucide-react";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import type { ReactNode } from "react";
import { DashboardHeader } from "@/features/header/dashboard-header";
import { ORCHARD_CAPACITY, Orchard } from "@/components/garden/orchard";
import { TreeScene } from "@/design-system/atoms/tree-art";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { Card } from "@/design-system/atoms/card";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";
import { StatTile } from "@/design-system/molecules/stat-tile";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { createDataContext, getGarden, HISTORY_WEEKS, type DataContext, type GardenBadge, type GardenView } from "@/lib/api";
import { cn } from "@/lib/cn";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { dhakaMinutes } from "@/lib/sky";
import { DAY_MS } from "@/lib/time";

/** A badge earned this recently is marked new. */
const NEW_DAYS = 7;

/*
 * The streak's orchard ("বিস্তারিত দেখো" on the streak card): every tree taken to fruit standing in
 * one landscape with the tree growing now, the numbers that add up to it, the badges, the fruit
 * trees collected and the last weeks of watering. Desktop first.
 */
export default async function GardenPage({ searchParams }: PageProps<"/[lang]/garden">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);

  return (
    <>
      <DashboardHeader ctx={ctx} lang={lang} t={t} current="none" />
      <PageMotion>
        <main className="mx-auto grid max-w-page grid-cols-1 gap-6 px-4 pt-4 pb-12 sm:px-6">
          <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
            <Reveal fallback={<GardenSkeleton label={t.common.loading} />}>
              <GardenBody ctx={ctx} lang={lang} t={t} />
            </Reveal>
          </SectionErrorBoundary>
        </main>
      </PageMotion>
    </>
  );
}

async function GardenBody({ ctx, lang, t }: { ctx: Promise<DataContext>; lang: Locale; t: Dictionary }) {
  const c = await ctx;
  const view = await getGarden(c);
  const fmt = createFormatter(lang, c.now);
  const g = t.garden;
  const treeName = (sp: GardenView["current"]["species"]) => fill(t.streak.stage["8"], { fruit: t.trees.name[sp] });
  const stageName = fill(t.streak.stage[String(view.current.stage) as keyof Dictionary["streak"]["stage"]], { of: t.trees.of[view.current.species], fruit: t.trees.name[view.current.species] });
  const hidden = Math.max(0, view.trees.length - ORCHARD_CAPACITY);

  return (
    <div className="grid gap-6">
      <Breadcrumb label={g.crumbs} items={[{ label: t.nav.dashboard, href: `/${lang}` }, { label: g.title }]} />
      <header className="grid gap-1">
        <h1 className="type-headline">{g.title}</h1>
        <p className="max-w-2xl text-muted">{g.intro}</p>
      </header>

      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label={g.stats.watered} value={fill(g.days, { n: fmt.number(view.totals.watered) })} empty="" />
        <StatTile label={g.stats.best} value={fill(g.days, { n: fmt.number(view.totals.best) })} empty="" />
        <StatTile label={g.stats.grown} value={fill(g.count, { n: fmt.number(view.totals.grown) })} empty="" />
        <StatTile label={g.stats.harvested} value={fill(g.count, { n: fmt.number(view.totals.harvested) })} empty="" />
      </ul>

      {/* The orchard itself. */}
      <Card className="relative overflow-hidden p-0">
        <Orchard
          label={fill(g.orchard, { n: fmt.number(view.trees.length) })}
          nextPlot={g.nextPlot}
          minutes={dhakaMinutes(c.now)}
          current={view.current}
          grown={view.trees.map((tr) => ({
            id: tr.id,
            species: tr.species,
            tip: fill(g.treeTip, { tree: treeName(tr.species), planted: fmt.date(`${tr.plantedDate}T12:00:00+06:00`), fruited: fmt.date(`${tr.fruitedDate}T12:00:00+06:00`), n: fmt.number(tr.longest) }),
          }))}
        />
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-sm font-semibold whitespace-nowrap shadow-raised backdrop-blur">
          {fill(g.now, { stage: stageName, n: fmt.number(view.current.growth) })}
        </p>
        {hidden > 0 && (
          <p className="absolute top-3 right-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold shadow-raised backdrop-blur">{fill(g.more, { n: fmt.number(hidden) })}</p>
        )}
      </Card>
      {view.totals.lost > 0 && <p className="-mt-3 text-sm text-subtle">{fill(g.lost, { n: fmt.number(view.totals.lost) })}</p>}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <Panel title={g.badges} id="badges-title">
            <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">
              {view.badges.map((b) => (
                <Badge key={b.id} badge={b} now={c.now} fmt={fmt} t={t} />
              ))}
            </ul>
          </Panel>

          <Panel title={g.treesTitle} id="trees-title">
            {view.trees.length === 0 ? (
              <p className="text-muted">{g.empty}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {[...view.trees].reverse().map((tr) => (
                  <li key={tr.id} className="flex items-center gap-3 rounded-md bg-raised p-3">
                    <TreeScene stage={8} species={tr.species} className="size-14 shrink-0" />
                    <div className="grid min-w-0">
                      <span className="font-semibold">{treeName(tr.species)}</span>
                      <span className="text-sm text-muted">
                        {fill(g.treeLine, { planted: fmt.date(`${tr.plantedDate}T12:00:00+06:00`), fruited: fmt.date(`${tr.fruitedDate}T12:00:00+06:00`) })}
                      </span>
                      <span className="text-xs text-subtle">{fill(g.treeLongest, { n: fmt.number(tr.longest) })}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title={g.collection} id="collection-title">
            <ul className="grid gap-3">
              {view.collection.map((col) => {
                const growing = col.species === view.current.species;
                return (
                  <li key={col.species} className={cn("flex items-center gap-3", !col.unlocked && "opacity-60")}>
                    <span className="relative shrink-0">
                      <TreeScene stage={8} species={col.species} className={cn("size-12", !col.unlocked && "grayscale")} />
                      {!col.unlocked && (
                        <span className="absolute inset-0 grid place-items-center">
                          <Lock className="size-4 text-text" aria-hidden />
                        </span>
                      )}
                    </span>
                    <div className="grid min-w-0">
                      <span className="font-semibold">{treeName(col.species)}</span>
                      <span className="text-xs text-muted">
                        {col.count > 0 ? fill(g.collectionGrown, { n: fmt.number(col.count) }) : growing ? g.collectionGrowing : g.collectionLocked}
                        {col.count > 0 && growing && ` · ${g.collectionGrowing}`}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title={g.history} id="history-title" note={fill(g.historyHint, { n: fmt.number(HISTORY_WEEKS) })}>
            <History view={view} fmt={fmt} t={t} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, id, note, children }: { title: string; id: string; note?: string; children: ReactNode }) {
  return (
    <Card aria-labelledby={id} className="grid gap-4 p-5">
      <header className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="type-title">
          {title}
        </h2>
        {note && <span className="text-sm text-subtle">{note}</span>}
      </header>
      {children}
    </Card>
  );
}

/** A badge: the stage's tree on a disc (or a watering medallion), in colour once earned, faded with what's left until then. */
function Badge({ badge, now, fmt, t }: { badge: GardenBadge; now: number; fmt: Formatter; t: Dictionary }) {
  const g = t.garden;
  const earned = badge.earnedDate !== null;
  const fresh = earned && now - Date.parse(`${badge.earnedDate}T12:00:00+06:00`) < NEW_DAYS * DAY_MS;
  return (
    <li className="grid justify-items-center gap-1.5 text-center" title={fill(g.badgeHint[badge.kind], { n: fmt.number(badge.need) })}>
      <span className={cn("relative grid size-20 place-items-center rounded-full p-1", earned ? "bg-[var(--tree-sparkle)]/40 ring-2 ring-[var(--tree-sparkle)]" : "bg-raised")}>
        {badge.kind === "stage" ? (
          <TreeScene stage={badge.stage} className={cn("size-full", !earned && "opacity-50 grayscale")} />
        ) : (
          <span className={cn("grid size-full place-content-center rounded-full bg-[var(--tree-water)] text-on-fill", !earned && "opacity-40 grayscale")}>
            <Droplet className="mx-auto size-5 fill-current" aria-hidden />
            <span className="text-sm leading-tight font-bold tabular-nums">{fmt.number(badge.need)}</span>
          </span>
        )}
        {!earned && (
          <span className="absolute -right-0.5 -bottom-0.5 grid size-6 place-items-center rounded-full bg-surface shadow-raised">
            <Lock className="size-3 text-muted" aria-hidden />
          </span>
        )}
        {fresh && <span className="absolute -top-1 -right-2 rounded-full bg-success px-1.5 py-0.5 text-xs font-bold text-on-fill shadow-raised">{g.badgeNew}</span>}
      </span>
      <span className={cn("text-sm leading-tight font-semibold", !earned && "text-muted")}>{g.badge[badge.id]}</span>
      <span className="text-xs text-subtle">
        {earned ? fill(g.badgeEarned, { date: fmt.date(`${badge.earnedDate}T12:00:00+06:00`) }) : fill(g.badgeLeft, { n: fmt.number(badge.left) })}
      </span>
    </li>
  );
}

/** The last weeks of watering, Saturday first: a drop for watered, a cloud for rain-saved, a cross for missed. */
function History({ view, fmt, t }: { view: GardenView; fmt: Formatter; t: Dictionary }) {
  const g = t.garden;
  const status = (s: string | null) => (s === "watered" ? g.legend.watered : s === "rained" ? g.legend.rained : s === "missed" ? g.legend.missed : "");
  return (
    <div className="grid gap-3">
      <table className="w-full table-fixed border-separate border-spacing-1">
        <thead>
          <tr>
            {view.weeks[0].map((d) => (
              <th key={d.date} scope="col" className="text-xs font-semibold text-subtle">
                {fmt.weekday(d.date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.weeks.map((week) => (
            <tr key={week[0].date}>
              {week.map((d) => (
                <td key={d.date} className="p-0">
                  <span
                    aria-label={d.status ? fill(g.dayLabel, { date: fmt.date(`${d.date}T12:00:00+06:00`), status: status(d.status) }) : undefined}
                    className={cn(
                      "mx-auto grid size-8 place-items-center rounded-full",
                      d.status === "watered" && "bg-[var(--tree-water-soft)]",
                      d.status === "rained" && "bg-raised",
                      d.status === "missed" && "bg-raised",
                      d.today && "ring-2 ring-[var(--tree-water)]",
                      d.future && "opacity-40",
                    )}
                  >
                    {d.status === "watered" && <Droplet className="size-3.5 fill-[var(--tree-water)] text-[var(--tree-water)]" aria-hidden />}
                    {d.status === "rained" && <CloudRain className="size-3.5 text-[var(--tree-can)]" aria-hidden />}
                    {d.status === "missed" && <X className="size-3 text-subtle" aria-hidden />}
                    {!d.status && <span aria-hidden className="text-xs text-subtle tabular-nums">{fmt.dayNumber(d.date)}</span>}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1.5">
          <Droplet className="size-3 fill-[var(--tree-water)] text-[var(--tree-water)]" aria-hidden />
          {g.legend.watered}
        </li>
        <li className="flex items-center gap-1.5">
          <CloudRain className="size-3 text-[var(--tree-can)]" aria-hidden />
          {g.legend.rained}
        </li>
        <li className="flex items-center gap-1.5">
          <X className="size-3 text-subtle" aria-hidden />
          {g.legend.missed}
        </li>
      </ul>
    </div>
  );
}

function GardenSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid gap-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} radius="lg" className="h-24" />
        ))}
      </div>
      <Skeleton radius="lg" className="aspect-[1000/310] w-full" />
    </SkeletonGroup>
  );
}
