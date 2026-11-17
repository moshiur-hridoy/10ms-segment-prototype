"use client";

import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  BotMessageSquare,
  Calculator,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Ellipsis,
  Lock,
  NotebookText,
  Play,
  Radio,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BOOK_COLOR, type BookFamily } from "@/design-system/foundations/book";
import { Avatar } from "@/design-system/atoms/avatar";
import { Button } from "@/design-system/atoms/button";
import { loginFor } from "./login-for";
import { Card } from "@/design-system/atoms/card";
import { Receipt } from "@/design-system/molecules/receipt";
import { SheetDialog } from "@/design-system/molecules/bottom-sheet";
import { pageFor, useVisitor, type Preset } from "@/features/segment/visitor";
import type { ClassId } from "@/features/onboarding/steps";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { nudgeFor, planFor, type CatalogView } from "@/lib/api/catalog";
import type { BatchClass, FreeClass, LiveSoon } from "@/lib/api";
import type { CatalogProduct, CatalogSubject } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { BatchRoutine } from "./batch-routine";
import { ForYou } from "./for-you";
import { FreeVsPaid } from "./free-vs-paid";
import { SinglesRail } from "./singles-rail";
import { STREAM_ICON } from "./stream-icons";
import { SECTION_TITLE_BIG } from "./section-title";
import { LIVE_PASSES } from "@/lib/guest";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { setCourses } from "@/lib/cart";
import { paths } from "@/data/landing/site";
import { dayDiff, dhakaDay } from "@/lib/time";

/*
 * Lab `segment` (CT21–CT27): the segment page as the guest's first page in the app.
 *   Guest:  the filter (or "set up for you" when onboarding already told us) → the free course,
 *           three classes without logging in, the fourth asks for a login → the three plans.
 *   Member: the plans first, the free course after them.
 * The server keeps drawing what follows (what the 16 months teach, features, reviews, FAQ).
 */

type L = Dictionary["segment"];
type CatalogLabels = Dictionary["catalog"];

// The onboarding's group ids against the catalogue's stream ids.
const GROUP_OF: Record<string, string> = { science: "science", "business-studies": "business", humanities: "humanities" };
const OTHER_CLASSES_URL = "https://10minuteschool.com/";
/** Our cart (LP34): the courses chosen here, then login and payment. */
const CART = paths.cart;
/** The page's width and side padding, on each section (the body itself runs full width, CT44). */
const W = "mx-auto grid w-full max-w-page grid-cols-1 px-4 sm:px-6";
/** CT55: a section's title at the headline size from `sm` (24px bold, as "কেন ১০ মিনিট স্কুল?"), 20px on phones; its lead 16px from `sm`. */
const TITLE = cn("type-title", SECTION_TITLE_BIG);
const LEAD = "text-sm text-muted sm:text-base";

export function SegmentBody({
  view,
  lang,
  now,
  guest,
  preset,
  streamAsked,
  classes,
  live,
  liveIn,
  streamTabs,
  enrolled,
  otherWays,
  l,
  c,
  segment,
  forYou = null,
  routine = null,
  planCovers = true,
  compare = false,
  singlesRail = false,
  heroStreams = false,
  lockSheet = false,
  cleanFree = false,
}: {
  view: CatalogView;
  lang: Locale;
  now: number;
  guest: boolean;
  preset: Preset;
  /** The URL named a stream; without one, a known visitor is taken to their own. */
  streamAsked: boolean;
  classes: FreeClass[];
  /** CT54: the batch's live classes now or within two days (guests only). */
  live: LiveSoon[];
  /** CT59 review switch `?livein=`: seconds until the next live class starts (it then runs as long). */
  liveIn: number | null;
  streamTabs: ReactNode;
  /** CT50: what the student already has here, with its course home; the plans below leave it out. */
  enrolled: ReactNode;
  /** Recorded and last-minute batches (server-drawn, with covers), after the single subjects. */
  otherWays: ReactNode;
  l: L;
  c: CatalogLabels;
  /** The query each class link carries to the class page (CT28): the lab, `?as=` and the way back here. */
  segment: string;
  /** OB15: a signed-in student arriving from onboarding: "তোমার জন্য সাজানো" on top; `added` once kept on the dashboard. */
  forYou?: { added: boolean } | null;
  /** CT74 (lab `free-routine`): the paid batch's live classes in this stream, and the full routine's link, for a guest. */
  routine?: { classes: BatchClass[]; fullHref: string } | null;
  /** CT76 (lab `free-routine` v3): false leaves the course covers off the plan cards. */
  planCovers?: boolean;
  /** CT78 (lab `free-routine` v5): the free against paid table before the plans, for a guest. */
  compare?: boolean;
  /** CT80 (lab `free-routine` v7): one subject at a time as a rail of books, not cards with covers and a receipt. */
  singlesRail?: boolean;
  /** CT84 (lab `free-routine` v11): the streams are in the hero, so no stream band here. */
  heroStreams?: boolean;
  /** CT87 (lab `free-routine` v14): a locked class opens a login sheet here instead of the class page; no lead line under the free classes' title. */
  lockSheet?: boolean;
  /** CT88 (lab `free-routine` v15): no "what logging in opens" box under the free classes. */
  cleanFree?: boolean;
}) {
  const fmt = useMemo(() => createFormatter(lang, now), [lang, now]);
  const visitor = useVisitor(preset);
  const router = useRouter();
  // CT65: every "ভর্তি হও" on this page puts its courses in our cart (LP34) and opens it: one checkout for all of them.
  const buy = (products: CatalogProduct[]) => {
    const unit = view.billing ? c.perCycle : undefined;
    setCourses({
      items: products.map((p) => ({ id: p.id, title: p.title, img: p.thumbnailUrl ?? null, price: p.price.final, list: p.price.original, unit })),
      back: location.pathname + location.search,
      backLabel: view.batch.name,
    });
    router.push(CART);
  };

  const here = { batch: view.batch.id, stream: view.stream.id };
  const known = visitor?.known ?? null;
  const target = known ? pageFor(known) : null;
  const matches = Boolean(target && target.batch === here.batch && (target.stream ?? here.stream) === here.stream);

  const go = (batch: string, stream: string | null) => {
    const params = new URLSearchParams(location.search);
    if (stream) params.set("stream", stream);
    router.push(`/${lang}/hsc/${batch}?${params}`, { scroll: false });
  };

  // Opened without a stream (the app's first page): a visitor we know goes straight to their own page.
  useEffect(() => {
    if (guest && !streamAsked && target && !matches) go(target.batch, target.stream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest, streamAsked, target?.batch, target?.stream, matches]);

  const hard = known?.hard ?? [];
  /** The filter's choice: remembered, and the page for that class and stream loaded below it (CT61). */
  const pickPage = (cls: ClassId, stream: string) => {
    visitor?.pick({ cls, group: GROUP_OF[stream] ?? null, hard: known?.hard ?? [] });
    const batch = cls === "12" ? "hsc-27" : "hsc-28";
    if (batch !== here.batch || stream !== here.stream) go(batch, stream);
  };
  const free = (
    <FreeCourse
      key={view.stream.id}
      view={view}
      classes={classes}
      live={live}
      liveIn={liveIn}
      liveCard={!routine}
      lockSheet={lockSheet}
      cleanFree={cleanFree}
      hard={hard}
      guest={guest}
      segment={segment}
      lang={lang}
      now={now}
      fmt={fmt}
      l={l}
      c={c}
    />
  );
  // CT30: the plans, then one subject at a time, then the other ways to study (recorded, last-minute), all on one page.
  // CT43: the sections stand apart (56px, 64px from `sm`); a section's own parts (the plans and their facts) stay close.
  // CT44: the body runs full width; each section keeps the page's width (W), and the single subjects sit on a white
  // band across the screen with a hairline above and below, as the landing does.
  const plans = (
    <>
      <div className={cn(W, "gap-4")}>
        <Plans view={view} fmt={fmt} guest={guest} covers={planCovers} l={l} c={c} buy={buy} />
        <Facts view={view} fmt={fmt} l={l} c={c} />
      </div>
      {/* CT62: the white band only when there are single subjects to buy (HSC 28 has none in the data, Q69). */}
      {singlesToBuy(view.stream).length > 0 && (
        <div className="border-y border-border bg-surface py-12 sm:py-14">
          <div className={W}>
            {singlesRail ? <SinglesRail view={view} fmt={fmt} l={l} c={c} buy={buy} /> : <Singles view={view} fmt={fmt} l={l} c={c} buy={buy} />}
          </div>
        </div>
      )}
    </>
  );
  // CT52: a member sees the free classes before the other ways to study (recorded, last-minute); a guest after them.
  const others = <div className={W}>{otherWays}</div>;
  const sections = "grid grid-cols-1 gap-14 pt-4 sm:gap-16";
  const freeBlock = <div className={W}>{free}</div>;

  if (!guest) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6">
        <div className={cn(W, "gap-6")}>
          {forYou && <ForYou view={view} classes={classes} hard={hard} live={live} added={forYou.added} lang={lang} fmt={fmt} l={l} />}
          {enrolled}
          {streamTabs}
        </div>
        <div className={sections}>
          {plans}
          {freeBlock}
          {others}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-6">
      {/* CT61: the filter stays on the page; a click swaps what is below it (that class's and stream's subjects and
          courses) and the filter shows the new choice. Keyed by the page so its chips follow the page. */}
      {/* CT83 (lab `free-routine` v10): with the routine, the class is the hero's batch switch, so only the three streams
          remain, as tabs on a band that sticks under the site header while the page scrolls. A direct child of this grid,
          so it stays stuck through every section below. */}
      {routine && !heroStreams && (
        <StreamBar
          key={`${here.batch}.${here.stream}`}
          view={view}
          l={l}
          onPick={(stream) => pickPage(view.batch.id === "hsc-27" ? "12" : "11", stream)}
        />
      )}
      <div className={W}>
        {/* CT74: with the lab, the paid batch's routine; CT81: at full width. */}
        <div className="grid grid-cols-1 gap-4">
          {!routine && <Filter key={`${here.batch}.${here.stream}`} view={view} l={l} onPick={pickPage} />}
          {routine && (
            <BatchRoutine
              key={`routine.${here.batch}.${here.stream}`}
              classes={routine.classes}
              hard={hard}
              now={now}
              fmt={fmt}
              l={l}
              fullHref={hard.length ? `${routine.fullHref}&hard=${hard.join(",")}` : routine.fullHref}
              login={<LoginButton lang={lang} label={l.login} />}
              joinLogin={<LoginButton lang={lang} label={l.liveJoin} />}
            />
          )}
        </div>
      </div>
      <div className={sections}>
        {freeBlock}
        {compare && (
          <div className={W}>
            <FreeVsPaid view={view} fmt={fmt} l={l} unit={view.billing ? c.perCycle : undefined} />
          </div>
        )}
        {plans}
        {others}
      </div>
    </div>
  );
}

/* ---------- the filter ---------- */

/**
 * CT61: the class and stream filter, always on the page for a guest (it no longer folds into a "তোমার জন্য সাজানো"
 * bar). The pressed chips are the page's own class and stream; a click presses the new chip at once and loads that
 * page below, the filter staying where it is.
 */
function Filter({ view, l, onPick }: { view: CatalogView; l: L; onPick: (cls: ClassId, stream: string) => void }) {
  const [sel, setSel] = useState<{ cls: ClassId; stream: string }>({ cls: view.batch.id === "hsc-27" ? "12" : "11", stream: view.stream.id });
  const pick = (next: { cls: ClassId; stream: string }) => {
    setSel(next);
    onPick(next.cls, next.stream);
  };
  const chip = (on: boolean) =>
    cn(
      "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-base font-semibold transition-colors active:scale-[0.98]",
      on ? "border-brand bg-brand-soft text-brand-text" : "border-border-strong bg-surface text-text hover:bg-raised",
    );

  return (
    <Card as="section" aria-labelledby="ask-title" className="grid gap-5 p-5 sm:p-6">
      <div className="grid gap-1">
        <h2 id="ask-title" className="type-title">
          {l.askTitle}
        </h2>
        <p className="text-sm text-muted">{l.askLead}</p>
      </div>

      <fieldset className="grid gap-2.5">
        <legend className="mb-2.5 text-sm font-semibold text-muted">{l.askClass}</legend>
        <div className="flex flex-wrap gap-2">
          {(["11", "12"] as const).map((id) => (
            <button key={id} type="button" aria-pressed={sel.cls === id} onClick={() => pick({ ...sel, cls: id })} className={chip(sel.cls === id)}>
              {sel.cls === id && <Check className="size-4" aria-hidden />}
              {id === "11" ? l.cls11 : l.cls12}
              <span className="text-sm font-normal text-subtle">{id === "11" ? "HSC 28" : "HSC 27"}</span>
            </button>
          ))}
          <a href={OTHER_CLASSES_URL} className={chip(false)}>
            {l.clsOther}
            <span className="text-sm font-normal text-subtle">{l.clsOtherNote}</span>
            <ArrowUpRight className="size-4 text-subtle" aria-hidden />
          </a>
        </div>
      </fieldset>

      <fieldset className="grid gap-2.5">
        <legend className="mb-2.5 text-sm font-semibold text-muted">{l.askStream}</legend>
        <div className="flex flex-wrap gap-2">
          {view.streams.map((s) => {
            const on = sel.stream === s.id;
            const Icon = STREAM_ICON[s.id];
            return (
              <button key={s.id} type="button" aria-pressed={on} onClick={() => pick({ ...sel, stream: s.id })} className={chip(on)}>
                {Icon ? (
                  <Icon size={18} color="currentColor" variant={on ? "Bold" : "Linear"} aria-hidden />
                ) : (
                  on && <Check className="size-4" aria-hidden />
                )}
                {s.name}
              </button>
            );
          })}
        </div>
      </fieldset>
    </Card>
  );
}

/**
 * CT83 (lab `free-routine` v10): the streams as tabs on a band under the site header, sticking there while the page
 * scrolls (the class is chosen in the hero's batch switch). The signed-in student's stream tabs' look (StreamTabs with
 * icons): a grey pill, the current stream filled green; on phones the three share the row in equal parts. A tap
 * remembers the choice and loads that stream below, the tab turning at once.
 */
function StreamBar({ view, l, onPick }: { view: CatalogView; l: L; onPick: (stream: string) => void }) {
  const [current, setCurrent] = useState(view.stream.id);
  return (
    <nav aria-label={l.askStream} className="sticky top-16 z-30 border-y border-border bg-overlay backdrop-blur-xl backdrop-saturate-150">
      <div className={W}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
          <span className="text-sm font-semibold text-muted max-sm:hidden">{l.askStream}</span>
          <div className="grid w-full grid-cols-3 gap-1 rounded-full bg-raised p-1 ring-1 ring-border ring-inset sm:inline-flex sm:w-auto">
            {view.streams.map((s) => {
              const on = s.id === current;
              const Icon = STREAM_ICON[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    if (on) return;
                    setCurrent(s.id);
                    onPick(s.id);
                  }}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold whitespace-nowrap transition-colors sm:gap-2 sm:pr-5 sm:pl-4 sm:text-base",
                    on ? "bg-primary text-on-primary shadow-raised" : "text-muted hover:text-text",
                  )}
                >
                  {Icon && <Icon size={16} color="currentColor" variant={on ? "Bold" : "Linear"} aria-hidden className="shrink-0 sm:size-[18px]" />}
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ---------- the free course ---------- */

function FreeCourse({
  view,
  classes,
  live,
  liveIn,
  liveCard,
  lockSheet = false,
  cleanFree = false,
  hard,
  guest,
  segment,
  lang,
  now,
  fmt,
  l,
  c,
}: {
  view: CatalogView;
  classes: FreeClass[];
  live: LiveSoon[];
  liveIn: number | null;
  /** CT87: locked classes open the login sheet; the lead line under the title goes. */
  lockSheet?: boolean;
  /** CT88: no "what logging in opens" box under the classes. */
  cleanFree?: boolean;
  /** CT75 (lab `free-routine` v2): off when the paid batch's routine is on the page, which already shows the live class. */
  liveCard: boolean;
  hard: string[];
  guest: boolean;
  /** The query a class link carries, so the class page keeps the lab and finds its way back here (CT28). */
  segment: string;
  lang: Locale;
  now: number;
  fmt: Formatter;
  l: L;
  c: CatalogLabels;
}) {
  const product = view.stream.recorded && view.stream.recorded.price.final === 0 ? view.stream.recorded : null;
  const names = new Map([...view.stream.group, ...view.stream.compulsory].map((s) => [s.id, s.name]));
  // CT52: a member is shown the free classes of the subjects they don't have yet; their own are in their course.
  const mine = classes.filter((k) => names.has(k.subject) && (guest || !view.stream.owned.includes(k.subject)));
  const covers = new Map(
    view.stream.live.flatMap((p) => (p.subjects.length === 1 && p.thumbnailUrl ? [[p.subjects[0], p.thumbnailUrl] as const] : [])),
  );

  // The student's hard subjects first, then the group's order.
  const subjects = view.stream.group
    .map((s) => s.id)
    .filter((id) => mine.some((k) => k.subject === id))
    .sort((a, b) => Number(hard.includes(b)) - Number(hard.includes(a)));

  const [tab, setTab] = useState<string>("all");
  // CT87: the locked class whose login sheet is open.
  const [lockedOn, setLockedOn] = useState<FreeClass | null>(null);
  // CT60: a guest always gets this section, in the same place on every stream (the live class and what logging in
  // opens), even where the data has no free class videos for the stream's subjects (business studies, humanities).
  if (!guest && !product && !mine.length) return null;

  // Under সব: the free classes first (what a guest can watch now), then two of each subject.
  const free = mine.filter((k) => k.free);
  const tiles = free.length > 0;
  const shown =
    tab === "all"
      ? [...free, ...subjects.flatMap((id) => mine.filter((k) => k.subject === id && !k.free).slice(0, 2))]
      : mine.filter((k) => k.subject === tab).sort((a, b) => Number(b.free) - Number(a.free));
  const list = shown.slice(0, 8);
  const rest = (tab === "all" ? mine.length : shown.length) - list.length;
  const liveSubject = hard.find((id) => names.has(id));
  const href = (k: FreeClass) => `/${lang}/subject/${k.paperId}?${segment}${segment ? "&" : ""}item=${k.id}#player`;
  // CT52: "more classes" opens the class page of the next class not shown, where every chapter is listed.
  const next = (tab === "all" ? mine : shown).find((k) => !list.includes(k));

  return (
    <section aria-labelledby="free-course-title" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid max-w-2xl gap-1">
          {/* CT68: no separate "ফ্রি" tag over the title (the title, the live card and the tiles say it); the free batch's
              name, where there is one, stays as a small grey line. */}
          {product && <span className="text-sm text-subtle">{product.title}</span>}
          <h2 id="free-course-title" className={TITLE}>
            {guest ? (tiles ? l.freeTitle : l.freeTitleNoTiles) : l.freeTitleMember}
          </h2>
          {/* CT87: with the lab, a guest gets no line here (the lock on each class says it). */}
          {!(guest && lockSheet) && (
            <p className={LEAD}>
              {guest
                ? tiles
                  ? fill(l.freeLeadGuest, { n: fmt.number(free.length) })
                  : l.freeLeadNoTiles
                : view.stream.owned.length
                  ? l.freeLeadMemberRest
                  : l.freeLeadMember}
            </p>
          )}
        </div>
        {guest && free.length > 0 && (
          <p className="flex items-center gap-2 rounded-full bg-success-soft py-1.5 pr-3.5 pl-3 text-sm font-semibold text-success">
            <Play className="size-3.5 fill-current" aria-hidden />
            {fill(l.freeCount, { n: fmt.number(free.length) })}
          </p>
        )}
      </div>

      {/* CT69: the live class sits inside this section, under its title and above the recorded classes. */}
      {guest && liveCard && <LiveCard live={live} liveIn={liveIn} names={names} hard={hard} lang={lang} now={now} fmt={fmt} l={l} />}
      {subjects.length > 1 && (
        <div role="tablist" aria-label={l.freeTitle} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {["all", ...subjects].map((id) => {
            const on = tab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
                  on ? "bg-text text-surface" : "bg-raised text-muted hover:text-text",
                )}
              >
                {id === "all" ? l.all : names.get(id)}
                {hard.includes(id) && <span title={l.hard} className={cn("size-1.5 rounded-full", on ? "bg-surface" : "bg-highlight")} />}
              </button>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        // CT52: on phones a sideways rail, so eight tiles don't stack into a long column.
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {list.map((k, i) => (
            <li key={k.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <ClassTile
                item={k}
                href={href(k)}
                subject={names.get(k.subject) ?? ""}
                cover={covers.get(k.subject) ?? null}
                hard={hard.includes(k.subject)}
                locked={guest && !k.free}
                onLocked={guest && lockSheet && !k.free ? () => setLockedOn(k) : undefined}
                markFree={guest}
                priority={i < 4}
                lang={lang}
                fmt={fmt}
                l={l}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {rest > 0 && next && (
          <Link
            href={`/${lang}/subject/${next.paperId}?${segment}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
          >
            {fill(guest ? l.more : l.moreMember, { n: fmt.number(rest) })}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {product && (
            <a href={product.url} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
              {l.freeBatch}
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          )}
          {view.freeClassUrl && (
            <a href={view.freeClassUrl} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
              {c.freeClass}
              <ArrowUpRight className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </div>

      {/* CT88 (lab `free-routine` v15): gone with the lab; the lock sheet (CT87) says what logging in opens. */}
      {guest && !cleanFree && <Unlocks subject={liveSubject ? names.get(liveSubject) : undefined} lang={lang} fmt={fmt} l={l} />}
      {/* CT87: a locked class asks for a login right here, so the student isn't taken into the class page and back. */}
      {lockSheet && (
        <SheetDialog open={lockedOn !== null} onClose={() => setLockedOn(null)} labelledBy="lock-title" closeLabel={l.close}>
          {lockedOn && (
            <div className="grid gap-4 p-1 sm:p-2">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-raised text-text">
                  <Lock className="size-5" aria-hidden />
                </span>
                <div className="grid min-w-0 gap-1">
                  <h2 id="lock-title" className="type-title">
                    {l.lockTitle}
                  </h2>
                  <p className="line-clamp-2 text-sm text-muted">
                    {lockedOn.paper} · {lockedOn.title}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted">{fill(l.lockLead, { n: fmt.number(free.length) })}</p>
              <UnlockList subject={liveSubject ? names.get(liveSubject) : undefined} n={fmt.number(LIVE_PASSES)} l={l} />
              <div className="grid gap-2 sm:flex">
                <span className="grid sm:flex-1 [&>a]:w-full">
                  <LoginButton lang={lang} label={l.login} size="lg" />
                </span>
                <Button variant="secondary" size="lg" onClick={() => setLockedOn(null)} className="sm:flex-1">
                  {l.close}
                </Button>
              </div>
            </div>
          )}
        </SheetDialog>
      )}
    </section>
  );
}

/**
 * CT54: the batch's next live class for a guest, as a line of the routine (the time in the margin, EntryRow):
 * "আজ রাত ৮:০০ · ম্যাথ", how long until it starts, and a login so they can join. The student's hard subject
 * comes first, else the earliest. During the class it is lit, as the routine lights a live class.
 */
function LiveCard({
  live,
  liveIn,
  names,
  hard,
  lang,
  now,
  fmt,
  l,
}: {
  live: LiveSoon[];
  liveIn: number | null;
  names: Map<string, string>;
  hard: string[];
  lang: Locale;
  now: number;
  fmt: Formatter;
  l: L;
}) {
  const [tick, setTick] = useState(now);
  useEffect(() => {
    // CT56: the countdown runs in seconds; CT59: and catches up at once when the tab comes back.
    const sync = () => setTick(Date.now());
    const id = setInterval(sync, 1_000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  // CT60: the next class within the week not yet over (business studies and humanities have only বাংলা, once a
  // week); the hard subject first if it has one today or tomorrow, else the earliest.
  const ahead = (x: LiveSoon, at: number) => dayDiff(dhakaDay(Date.parse(x.startsAt)), dhakaDay(at));
  const pick = (list: LiveSoon[], at: number) => {
    const open = list.filter((x) => names.has(x.subject) && Date.parse(x.endsAt) > at && ahead(x, at) <= 6);
    return open.find((x) => hard.includes(x.subject) && ahead(x, at) <= 1) ?? open[0];
  };
  // CT59 review switch: move the schedule so the class picked at load starts `liveIn` seconds later and runs as long.
  const first = liveIn === null ? undefined : pick(live, now);
  const by = first ? now + liveIn! * 1_000 - Date.parse(first.startsAt) : 0;
  const at = (iso: string, extra = 0) => new Date(Date.parse(iso) + by + extra).toISOString();
  const schedule = first
    ? live.map((x) => ({ ...x, startsAt: at(x.startsAt), endsAt: x === first ? at(x.startsAt, liveIn! * 1_000) : at(x.endsAt) }))
    : live;
  // CT59: when a class ends the card moves on to the next one, and its countdown starts again.
  const k = pick(schedule, tick);
  if (!k) return null;
  const days = ahead(k, tick);
  const day = days <= 0 ? l.liveToday : days === 1 ? l.liveTomorrow : fmt.weekday(k.startsAt);

  const on = Date.parse(k.startsAt) <= tick;
  const secs = Math.max(0, Math.ceil((Date.parse(k.startsAt) - tick) / 1_000));
  const hms = { h: fmt.number(Math.floor(secs / 3600)), m: fmt.number(Math.floor((secs % 3600) / 60)), s: fmt.number(secs % 60) };
  const left =
    secs >= 86_400
      ? fill(l.liveDays, { ...hms, d: fmt.number(Math.floor(secs / 86_400)), h: fmt.number(Math.floor((secs % 86_400) / 3600)) })
      : secs >= 3600
        ? fill(l.liveHours, hms)
        : secs >= 60
          ? fill(l.liveMinutes, hms)
          : fill(l.liveSeconds, hms);
  const { period, clock } = fmt.timeParts(k.startsAt);
  // The line under the title names the day once the class isn't today: "কাল সকাল ৯:৩০-এ", "বুধবার ১১ নভেম্বর বিকেল ৩:৩০-এ".
  const when = days <= 0 ? null : days === 1 ? l.liveTomorrow : fmt.dayTitle(dhakaDay(Date.parse(k.startsAt))).split(",")[0];
  const time = when ? `${when} ${fmt.time(k.startsAt)}` : fmt.time(k.startsAt);

  return (
    <Card as="div" className={cn("mb-2 flex items-stretch overflow-hidden p-0", on && "bg-danger-soft/60")}>
      {/* CT57: the margin is one calendar-page tile: a red strip "(()) লাইভ" over the day and time, no taller than the text beside it. */}
      <div className="flex shrink-0 items-start py-3.5 pl-3 sm:items-center sm:py-3 sm:pl-4">
        <span className="grid w-[4.25rem] overflow-hidden rounded-md bg-surface text-center shadow-card ring-1 ring-live/25 tabular-nums">
          <span className="flex items-center justify-center gap-1 bg-live py-1 text-xs leading-none font-semibold text-on-fill">
            <Radio className="size-3.5" aria-hidden />
            {l.liveBadge}
          </span>
          <span className="pt-1.5 text-xs leading-none whitespace-nowrap text-subtle">
            {day} {period}
          </span>
          <span className="pt-1 pb-1.5 text-lg leading-none font-bold">{clock}</span>
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3 py-3.5 pr-4 pl-3 sm:pl-4">
        <div className="grid min-w-0 flex-1 basis-64 gap-0.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
            {/* CT58: the solid green "ফ্রি" of the free class tiles below; the red tile says live, the green tag says free. */}
            <span className="rounded-full bg-success px-2 py-0.5 text-xs leading-none font-semibold text-on-fill">{l.freeBadge}</span>
            {on && <span aria-hidden className="size-2 rounded-full bg-live motion-safe:animate-pulse-live" />}
            {on ? l.liveNow : l.liveKind}
            <span aria-hidden>·</span>
            <span className="font-normal">{names.get(k.subject)}</span>
          </p>
          <p className="line-clamp-2 leading-snug font-semibold">{k.title}</p>
          <p className="text-sm text-muted">
            {on ? (
              l.liveLeadNow
            ) : (
              <>
                <span className="font-semibold text-live tabular-nums">{fill(l.liveIn, { left })}</span>
                {" · "}
                {fill(l.liveLead, { time })}
              </>
            )}
          </p>
        </div>
        <LoginButton lang={lang} label={on ? l.liveJoin : l.login} size="md" />
      </div>
    </Card>
  );
}

/** h:mm:ss in the page's digits, as on a video's thumbnail. */
function clock(sec: number, lang: Locale) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const text = `${h ? `${h}:` : ""}${h ? String(m).padStart(2, "0") : m}:${String(s).padStart(2, "0")}`;
  return lang === "bn" ? text.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]) : text;
}

/** A class as a video tile. Free ones (CT28) carry a green ring and "ফ্রি"; for a guest the rest are dimmed behind a lock. Both open the class page. */
function ClassTile({
  item: k,
  href,
  subject,
  cover,
  hard,
  locked,
  onLocked,
  markFree,
  priority,
  lang,
  fmt,
  l,
}: {
  item: FreeClass;
  /** CT87: a locked class opens the login sheet instead of following its link. */
  onLocked?: () => void;
  href: string;
  subject: string;
  /** The subject's own course cover (its single-subject batch), when the stream sells one. */
  cover: string | null;
  hard: boolean;
  locked: boolean;
  /** A guest sees which classes are free (CT28); for a member every class is open, so none is marked. */
  markFree: boolean;
  /** The first row: for a guest the page's largest picture (LCP). */
  priority: boolean;
  lang: Locale;
  fmt: Formatter;
  l: L;
}) {
  const plain = !k.youtubeId && !cover;
  const free = markFree && k.free;
  return (
    <Link
      href={href}
      onClick={
        onLocked &&
        ((e) => {
          e.preventDefault();
          onLocked();
        })
      }
      className="group grid w-full gap-2.5 text-left"
    >
      <span
        className={cn(
          "relative block aspect-video overflow-hidden rounded-md bg-raised bg-cover bg-center ring-inset",
          free ? "ring-2 ring-success" : "ring-1 ring-border",
        )}
        style={k.youtubeId ? { backgroundImage: `url(https://i.ytimg.com/vi/${k.youtubeId}/mqdefault.jpg)` } : undefined}
      >
        {/* No demo video (CT49): the subject's own course cover, whole on a blurred copy of itself; without one, plain
            white with the subject and chapter in its corner, clear of the play button. */}
        {!k.youtubeId &&
          (cover ? (
            <span className="absolute inset-0">
              <Image src={cover} alt="" fill sizes="10vw" priority={priority} aria-hidden className="scale-125 object-cover opacity-60 blur-2xl" />
              <Image src={cover} alt="" fill sizes="(min-width: 1024px) 20vw, 50vw" priority={priority} className="object-contain p-2" />
            </span>
          ) : (
            <span className="absolute inset-0 bg-surface p-3">
              <span className="grid gap-0.5">
                <span className="text-sm font-semibold text-text">{subject}</span>
                <span className="text-xs text-muted">{fill(l.chapter, { n: fmt.number(k.chapter) })}</span>
              </span>
            </span>
          ))}
        {/* CT52: the play button sits in the bottom-left corner, clear of the cover's own title; a lock stays centred. */}
        <span
          className={cn(
            "absolute inset-0 grid transition-colors",
            locked ? "place-items-center" : "items-end justify-start p-2",
            // A white tile stays white behind its lock (CT49); a picture dims.
            locked ? (plain ? "bg-transparent" : "bg-text/45") : "bg-text/0 group-hover:bg-text/15",
          )}
        >
          <span
            className={cn(
              "grid place-items-center rounded-full shadow-raised transition-transform group-hover:scale-105",
              locked ? "size-11" : "size-9",
              locked
                ? plain
                  ? "bg-raised text-muted ring-1 ring-border"
                  : "bg-surface text-text"
                : free
                  ? "bg-success text-on-fill"
                  : "bg-surface/95 text-brand-text",
            )}
          >
            {locked ? <Lock className="size-5" aria-hidden /> : <Play className="size-4 translate-x-px fill-current" aria-hidden />}
          </span>
        </span>
        {free && (
          <span className="absolute top-1.5 left-1.5 rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-on-fill">{l.freeBadge}</span>
        )}
        {k.durationSec !== null && (
          <span className="absolute right-1.5 bottom-1.5 rounded-xs bg-text/80 px-1.5 py-0.5 text-xs font-semibold text-surface tabular-nums">
            {clock(k.durationSec, lang)}
          </span>
        )}
      </span>
      <span className="grid gap-0.5">
        <span className={cn("line-clamp-2 text-sm leading-snug font-semibold group-hover:text-brand-text", locked && "text-muted")}>{k.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          {hard && <span className="size-1.5 shrink-0 rounded-full bg-highlight" title={l.hard} />}
          {k.paper} · {fill(l.chapter, { n: fmt.number(k.chapter) })}
        </span>
      </span>
    </Link>
  );
}

/** What logging in opens (CT24), here under the classes and on a locked class (CT28). */
/**
 * What a login unlocks. `more` (CT128, lab `segment-home` v34): the full list the designer gave: the free exams from
 * the question bank, then each material on a line of its own with its own icon (CT129, v35: bullets, not chips), and
 * "আরও অনেক কিছু", before the last line (only a phone number).
 */
/**
 * CT129: one icon per material, in `unlockMaterials`' order. CT209: notes, slides and suggestions share one line (the
 * notes' icon), then chapter explainers and the exercise solver.
 */
const MATERIAL_ICONS = [NotebookText, BookOpenText, Calculator];
/** CT238: chapter explainers and the exercise solver on one line, then TenTen AI (the free folders' TenTen icon). */
const MATERIAL_ICONS_TENTEN = [NotebookText, BookOpenText, BotMessageSquare];
export function UnlockList({
  subject,
  n,
  l,
  more = false,
  each = false,
  wide = false,
  tenten = false,
}: {
  subject?: string;
  /** LIVE_PASSES in the page's digits. */ n: string;
  l: L;
  more?: boolean;
  /** CT146 (lab `segment-home` v51): some classes of every subject free, and unlimited exams (no bank size). */
  each?: boolean;
  /** CT156 (lab `segment-home` v54): two columns from `sm`, in the page's one wide column. */
  wide?: boolean;
  /** CT238 (segment-page v6): `unlockMaterialsTenTen` in place of `unlockMaterials`. */
  tenten?: boolean;
}) {
  const materials = tenten ? l.unlockMaterialsTenTen : l.unlockMaterials;
  const icons = tenten ? MATERIAL_ICONS_TENTEN : MATERIAL_ICONS;
  const items = [
    { Icon: CheckCircle2, text: l.unlockAll },
    { Icon: Radio, text: each ? l.unlockLiveEach : subject ? fill(l.unlockLive, { subject, n }) : fill(l.unlockLiveAny, { n }) },
    ...(more
      ? [
          { Icon: ClipboardCheck, text: each ? l.unlockExamsUnlimited : l.unlockExams },
          ...materials.map((text, i) => ({ Icon: icons[i] ?? CheckCircle2, text })),
          { Icon: Ellipsis, text: l.unlockMore },
        ]
      : []),
    { Icon: Sparkles, text: l.unlockFree },
  ];
  return (
    <ul className={cn("grid gap-2 text-sm", wide && "sm:grid-cols-2 sm:gap-x-8")}>
      {items.map(({ Icon, text }) => (
        <li key={text} className="flex items-start gap-2.5">
          <Icon className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );
}

function Unlocks({ subject, lang, fmt, l }: { subject?: string; lang: Locale; fmt: Formatter; l: L }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-md border border-dashed border-border-strong px-4 py-4 sm:px-5">
      <div className="grid min-w-0 flex-1 basis-72 gap-2.5">
        <p className="text-sm font-semibold">{l.unlockTitle}</p>
        <UnlockList subject={subject} n={fmt.number(LIVE_PASSES)} l={l} />
      </div>
      <LoginButton lang={lang} label={l.login} size="md" variant="secondary" />
    </div>
  );
}

/**
 * Log in and come back to this same page (the login page reads `next`), signed in: the review switch `?as=`
 * (CT26) is left out of `next`, as `?as=new` would show the page to a guest again (CT73).
 */
export function LoginButton({
  lang,
  label,
  size = "sm",
  variant = "primary",
  next: then,
  tapped,
}: {
  lang: Locale;
  label: string;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
  /** Where to go once signed in, in place of this page (a live class's join). */
  next?: string;
  /** What was tapped, for the page's login pop-up (`loginFor`). */
  tapped?: ReturnType<typeof loginFor>;
}) {
  const path = usePathname();
  const params = new URLSearchParams(useSearchParams());
  params.delete("as");
  const query = params.toString();
  const next = then ?? path + (query ? `?${query}` : "");
  return (
    <Button href={`/${lang}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} size={size} variant={variant} {...tapped}>
      {label}
    </Button>
  );
}

/* ---------- the plans ---------- */

type PlanCard = {
  id: string;
  title: string;
  note: string;
  subjects: CatalogSubject[];
  products: CatalogProduct[];
  /** What is still to buy; empty when the student owns all of it. */
  buy: CatalogProduct[];
  owned: CatalogProduct[];
  full?: boolean;
};

/**
 * CT197: a plan's picture as a fixed square: one cover filling it, or two (the full plan) stacked a little apart,
 * the back one up and left, the front one down and right.
 */
function SquareThumb({ srcs }: { srcs: string[] }) {
  const pair = srcs.length > 1;
  return (
    <div className="relative size-28 shrink-0 overflow-hidden rounded-md bg-raised sm:size-44">
      {srcs.slice(0, 2).map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={360}
          height={360}
          sizes="(min-width: 640px) 176px, 112px"
          className={cn(
            "absolute object-cover",
            pair ? cn("size-[78%] rounded-sm shadow-raised", i === 0 ? "top-[6%] left-[6%]" : "right-[6%] bottom-[6%]") : "inset-0 size-full",
          )}
        />
      ))}
    </div>
  );
}

/** CT195: the thumbnail's column at the card's left, the rest beside it (the thumbnail spans the card's three rows). */
const SIDE_THUMB_CARD = "grid-cols-[7rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-x-5";
/** CT197: the column as wide as the square. */
const SQUARE_THUMB_CARD = "grid-cols-[7rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-5";

/**
 * A plan's cover (CT37): the course's own thumbnail inside a 16:9 frame on a blurred copy of itself, so square
 * (HSC 27) and wide (HSC 28) covers both show whole. The full plan fans its two covers side by side.
 */
function PlanCover({
  products,
  srcs: given,
  small = false,
  priority = false,
}: {
  products: CatalogProduct[];
  /** CT194: pictures given directly (the last-minute sample), in place of the products' thumbnails. */
  srcs?: string[];
  /** CT195: a small thumbnail at the card's side: less room around the picture, and from `sm` the card's full height. */
  small?: boolean;
  /** A member sees the plans first, so their covers are the largest picture (LCP); a guest's are lower down. */ priority?: boolean;
}) {
  const srcs = given ?? products.flatMap((p) => p.thumbnailUrl ?? []);
  const pair = srcs.length > 1;
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-md bg-raised", small && "sm:aspect-auto sm:h-full")}>
      {srcs[0] && (
        <Image src={srcs[0]} alt="" fill sizes="10vw" priority={priority} aria-hidden className="scale-125 object-cover opacity-60 blur-2xl" />
      )}
      <div className={cn("absolute inset-0 flex items-center justify-center", small ? "p-1.5" : "p-3", pair && "gap-0")}>
        {srcs.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={640}
            height={640}
            sizes="(min-width: 768px) 20vw, 60vw"
            priority={priority}
            className={cn(
              "h-full w-auto max-w-full rounded-md object-contain shadow-raised",
              pair && "h-[86%] max-w-[56%]",
              pair &&
                (i === 0
                  ? small
                    ? "translate-x-1 -rotate-3"
                    : "translate-x-2 -rotate-3"
                  : small
                    ? "z-10 -translate-x-1 rotate-3"
                    : "z-10 -translate-x-2 rotate-3"),
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * CT37: the plans as a pricing section. Each card: its cover, the plan's name, the price large with the button
 * right under it, then every subject of the stream in the same order on every card (ticked when included,
 * greyed when not) so the rows line up across the cards, the course's own facts, and its teachers. The cards
 * share their rows (subgrid), so a short card never shifts its neighbours. The full plan wears a green band
 * on top and the filled button.
 */
export function Plans({
  view,
  fmt,
  guest,
  covers,
  titled = true,
  bookColors = false,
  clean = false,
  faces = false,
  ink = false,
  gold = false,
  simple = false,
  rows = false,
  thumbs = false,
  thumbSide = false,
  squares,
  lastMinute,
  l,
  c,
  buy,
}: {
  view: CatalogView;
  fmt: Formatter;
  guest: boolean;
  /** CT76: the course covers on top of each card; off in lab `free-routine` v3, the card starting with its name. */
  covers: boolean;
  /** CT97: false under a title of the page's own (lab `segment-home` v7); the title and lead stay for screen readers. */
  titled?: boolean;
  /** CT117 (lab `segment-home` v25): each subject pill in its book's colour, as the subject books above. */
  bookColors?: boolean;
  /**
   * CT141 (lab `segment-home` v46): the cards cleaned up so the eye has one path. No subject pills (the line under the name
   * names them), no teachers' faces (their count stays), and the facts every plan shares said once under the cards, with the
   * batch's facts; a card keeps only what sets it apart. Each single-batch plan says how many are studying in it.
   */
  clean?: boolean;
  /** CT142 (v47): with `clean`, the teachers' faces small, before their count. */
  faces?: boolean;
  /** CT143 (v48): with `clean`, the full plan's band and border in the text's dark instead of green. */
  ink?: boolean;
  /** CT145 (v50): with `clean`, the full plan's band in the masterbook ribbon's gold, its border the gold's edge. */
  gold?: boolean;
  /**
   * CT147 (v51): with `clean`, no price and no buying here: the card says what the plan is and who is in it, and
   * "বিস্তারিত দেখো" opens its batch's product page, where it's bought. The facts that only some plans have go there too.
   */
  simple?: boolean;
  /**
   * CT160 (lab `segment-home` v55): with `simple`, every card in the same three rows (name, people, button), so the
   * buttons line up: who is studying on one line, the teachers on the next; the full plan says how many are in the batch.
   */
  rows?: boolean;
  /**
   * CT193 (lab `segment-home` v85): with `rows`, four cards two by two: the three plans and "শেষ মুহূর্তের প্রস্তুতি"
   * (a sample from HSC 27 until the team gives HSC 28's). No plan is singled out: no band or coloured border, every
   * button secondary.
   */
  lastMinute?: { url: string; thumb: string; facts: [string, string]; title: string; note: string; sample: ReactNode };
  /** CT194 (v86): with `rows`, each card opens with its course's thumbnail (the full plan's two side by side). */
  thumbs?: boolean;
  /**
   * CT195 (v87): with `thumbs`, the thumbnail small at the card's left (12rem, 7rem on phones), the name, people and
   * button to its right.
   */
  thumbSide?: boolean;
  /**
   * CT197 (v89): with `thumbSide`, every picture square in one fixed frame (176px, 112px on phones), from these square
   * covers by product id; the full plan's two stacked. Nothing is letterboxed or cut.
   */
  squares?: Record<string, string>;
  l: L;
  c: CatalogLabels;
  buy: (products: CatalogProduct[]) => void;
}) {
  const { stream, billing } = view;
  const four = Boolean(lastMinute && rows);
  const everySubject = [...stream.group, ...stream.compulsory];
  const subjectsOf = (ps: CatalogProduct[]) => {
    const ids = new Set(ps.flatMap((p) => p.subjects));
    return everySubject.filter((s) => ids.has(s.id));
  };
  const isOwned = (p: CatalogProduct) => p.subjects.every((s) => stream.owned.includes(s));
  const card = (id: string, title: string, ps: CatalogProduct[], full = false): PlanCard => ({
    id,
    title,
    note: full ? fill(l.planFullNote, { n: fmt.number(subjectsOf(ps).length) }) : fmt.list(subjectsOf(ps).map((s) => s.name)),
    subjects: subjectsOf(ps),
    products: ps,
    buy: ps.filter((p) => !isOwned(p)),
    owned: ps.filter(isOwned),
    full,
  });

  const main = stream.main;
  // The other bundle (বাংলা, ইংরেজি, ICT); single subjects have their own section (CT30).
  const extra = stream.addOns.find((p) => p.subjects.length > 1) ?? null;
  // CT50: a plan the student already has leaves the cards (the enrolled note under the hero says so, with the course
  // home), and two plans that would sell the same courses become one, the first: once the group half is owned, the full
  // plan and the compulsory plan both sell the compulsory batch, at one price.
  const key = (p: PlanCard) =>
    p.buy
      .map((x) => x.id)
      .sort()
      .join();
  const cards = [
    main && card("group", l.planGroup, [main]),
    main && extra && card("full", l.planFull, [main, extra], true),
    extra && card("compulsory", l.planCompulsory, [extra]),
  ]
    .filter((x): x is PlanCard => Boolean(x && x.buy.length > 0))
    .filter((p, i, all) => all.findIndex((x) => key(x) === key(p)) === i);
  if (!cards.length) return null;
  const one = cards.length === 1;

  const taka = (n: number) => `৳${fmt.number(n)}`;
  const unit = billing ? c.perCycle : undefined;
  // The course's own facts, minus the ones that only list its subjects again (the checklist says that).
  const factsOf = (ps: CatalogProduct[]) =>
    [...new Set(ps.flatMap((p) => p.facts))]
      .filter((f) => !everySubject.filter((s) => f.includes(s.name)).length || !/প্রস্তুতি|preparation/i.test(f))
      .slice(0, 3);

  // CT141: the facts on every card, said once under them.
  const shared = clean ? factsOf(cards[0].buy).filter((f) => cards.every((p) => factsOf(p.buy).includes(f))) : [];

  return (
    <section id="plans" aria-labelledby="plans-title" className="grid scroll-mt-24 gap-4">
      <div className={cn("grid gap-1", !titled && "sr-only")}>
        <h2 id="plans-title" className={TITLE}>
          {guest ? l.plansTitleGuest : fill(l.plansTitle, { stream: stream.name })}
        </h2>
        <p className={LEAD}>{l.plansLead}</p>
      </div>
      {/* Room above for the full plan's band (from `md`; on phones the full plan comes first and makes its own room, CT117). Six shared rows: cover,
          name, price and button, subjects, facts, teachers (five without covers). */}
      <ul
        className={cn(
          "grid gap-4",
          four ? "md:grid-cols-2" : cn("md:pt-7", cards.length === 3 && "md:grid-cols-3", cards.length === 2 && "md:grid-cols-2"),
        )}
      >
        {cards.map((p) => {
          const price = p.buy.reduce((sum, x) => sum + x.price.final, 0);
          // CT50: part of the plan already owned: say so in one line; the subjects, facts and teachers are only what is left to buy.
          const have = subjectsOf(p.owned);
          const left = p.subjects.filter((s) => !have.some((h) => h.id === s.id));
          const teachers = [...new Map(left.flatMap((s) => s.teachers).map((t) => [t.name, t])).values()];
          const facts = factsOf(p.buy);
          if (clean) {
            const learners = p.buy.length === 1 ? p.buy[0].enrolledCount : null;
            const own = facts.filter((f) => !shared.includes(f));
            if (simple && rows) {
              // CT193: with four cards, the full plan looks like the others.
              const lead = p.full && !four;
              // The full plan is both batches; a learner may be in both, so the batch has at least the larger count, to the hundred below.
              const most = Math.max(0, ...p.buy.map((x) => x.enrolledCount ?? 0));
              const people = p.full
                ? most >= 100
                  ? fill(l.planLearnersBatch, { n: fmt.number(Math.floor(most / 100) * 100) })
                  : null
                : learners !== null
                  ? fill(l.planLearners, { n: fmt.number(learners) })
                  : null;
              return (
                <Card
                  as="li"
                  key={p.id}
                  className={cn(
                    // The full plan's border is 2px: a pixel less padding keeps its rows level with the other cards'.
                    "relative grid content-start gap-4",
                    lead ? "p-[15px] sm:p-[19px]" : "p-4 sm:p-5",
                    !one && (thumbs && !thumbSide ? "md:row-span-4 md:grid-rows-subgrid" : "md:row-span-3 md:grid-rows-subgrid"),
                    thumbSide && (squares ? SQUARE_THUMB_CARD : SIDE_THUMB_CARD),
                    lead && "rounded-t-none border-2 shadow-raised max-md:order-first max-md:mt-7",
                    lead && (gold ? "border-(--plan-gold-edge)!" : ink ? "border-text" : "border-brand"),
                  )}
                >
                  {lead && (
                    <span
                      className={cn(
                        "absolute -inset-x-0.5 -top-7 flex h-7 items-center justify-center gap-1.5 rounded-t-lg text-sm font-semibold",
                        gold ? "bg-[image:var(--plan-gold)] text-[var(--amber-950)]" : ink ? "bg-text text-surface" : "bg-brand text-on-primary",
                      )}
                    >
                      <Sparkles className="size-3.5" aria-hidden />
                      {l.planFullTag}
                    </span>
                  )}
                  {thumbs &&
                    (thumbSide ? (
                      squares ? (
                        <div className="row-span-2 self-start sm:row-span-3">
                          <SquareThumb srcs={p.buy.flatMap((x) => squares[x.id] ?? x.thumbnailUrl ?? [])} />
                        </div>
                      ) : (
                        <div className="row-span-2 self-start sm:row-span-3 sm:self-stretch">
                          <PlanCover products={p.buy} small />
                        </div>
                      )
                    ) : (
                      <PlanCover products={p.buy} />
                    ))}
                  <div className="grid content-start gap-1">
                    <h3 className="type-subtitle">{p.title}</h3>
                    <p className="text-sm text-muted">
                      {have.length ? fill(l.planLeft, { n: fmt.number(left.length), subjects: fmt.list(left.map((s) => s.name)) }) : p.note}
                    </p>
                  </div>
                  <div className="grid content-start gap-1.5 text-sm text-muted">
                    {people && (
                      <p className="flex items-center gap-1.5">
                        <Users className="size-4 shrink-0 text-subtle" aria-hidden />
                        <span className="font-semibold text-text">{people}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5">
                      {faces && teachers.length > 0 && (
                        <span className="flex -space-x-1.5 pr-0.5">
                          {teachers.slice(0, 5).map((t) => (
                            <Avatar key={t.name} src={t.imageUrl} name={t.name} size={22} className="ring-2 ring-surface" />
                          ))}
                        </span>
                      )}
                      {fill(c.teacherCount, { n: fmt.number(teachers.length) })}
                    </p>
                  </div>
                  {/* The full plan is two batches with no page of its own; its button opens the stream's own batch (section 9). */}
                  <Button
                    size="lg"
                    shape="button"
                    variant={lead ? "primary" : "secondary"}
                    href={p.buy[0].url}
                    className={cn("w-full self-end", thumbSide && "max-sm:col-span-2")}
                  >
                    {l.homePlanDetails}
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Card>
              );
            }
            return (
              <Card
                as="li"
                key={p.id}
                className={cn(
                  "relative grid content-start gap-4 p-4 sm:p-5",
                  !one && (simple ? "md:row-span-2 md:grid-rows-subgrid" : "md:row-span-3 md:grid-rows-subgrid"),
                  p.full && "rounded-t-none border-2 shadow-raised max-md:order-first max-md:mt-7",
                  p.full && (gold ? "border-(--plan-gold-edge)!" : ink ? "border-text" : "border-brand"),
                )}
              >
                {/* CT143 (v48): with `ink` the band and border are the text's dark, so green is left to the button alone. */}
                {p.full && (
                  <span
                    className={cn(
                      "absolute -inset-x-0.5 -top-7 flex h-7 items-center justify-center gap-1.5 rounded-t-lg text-sm font-semibold",
                      gold ? "bg-[image:var(--plan-gold)] text-[var(--amber-950)]" : ink ? "bg-text text-surface" : "bg-brand text-on-primary",
                    )}
                  >
                    <Sparkles className="size-3.5" aria-hidden />
                    {l.planFullTag}
                  </span>
                )}
                <div className="grid content-start gap-1">
                  <h3 className="type-subtitle">{p.title}</h3>
                  <p className="text-sm text-muted">
                    {have.length ? fill(l.planLeft, { n: fmt.number(left.length), subjects: fmt.list(left.map((s) => s.name)) }) : p.note}
                  </p>
                </div>
                <div className={cn("grid content-start gap-3", one && "md:max-w-sm")}>
                  {!simple && (
                    <p className="tabular-nums">
                      <span className="type-display">{taka(price)}</span>
                      {unit && <span className="text-sm text-subtle"> {unit}</span>}
                    </p>
                  )}
                  <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
                    {(learners !== null || !faces) && <Users className="size-4 shrink-0 text-subtle" aria-hidden />}
                    {learners !== null && (
                      <>
                        <span className="font-semibold text-text">{fill(l.planLearners, { n: fmt.number(learners) })}</span>
                        <span aria-hidden>·</span>
                      </>
                    )}
                    {/* CT142 (v47): the teachers' faces, small, before their count. */}
                    {faces && teachers.length > 0 && (
                      <span className="flex -space-x-1.5 pr-0.5">
                        {teachers.slice(0, 5).map((t) => (
                          <Avatar key={t.name} src={t.imageUrl} name={t.name} size={22} className="ring-2 ring-surface" />
                        ))}
                      </span>
                    )}
                    {fill(c.teacherCount, { n: fmt.number(teachers.length) })}
                  </p>
                  {simple ? (
                    // The full plan is two batches with no page of its own; its button opens the stream's own batch (section 9).
                    <Button size="lg" shape="button" variant={p.full ? "primary" : "secondary"} href={p.buy[0].url} className="w-full">
                      {l.homePlanDetails}
                      <ArrowRight className="size-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button size="lg" variant={p.full ? "primary" : "secondary"} onClick={() => buy(p.buy)} className="w-full">
                      {c.buy}
                    </Button>
                  )}
                </div>
                <ul className={cn("grid content-start gap-2 text-sm text-muted empty:hidden", simple && "hidden")}>
                  {own.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          }
          return (
            <Card
              as="li"
              key={p.id}
              className={cn(
                "relative grid content-start gap-4 p-4",
                // One card left (CT50): the cover beside the rest, so a lone card doesn't stretch across the page.
                one
                  ? covers && "md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-x-8 md:p-5"
                  : cn("md:grid-rows-subgrid", covers ? "md:row-span-6" : "md:row-span-5"),
                // CT45: one 2px green border, and the band sits exactly over it (no ring outside the border to misalign the corners).
                p.full && "rounded-t-none border-2 border-brand shadow-raised max-md:order-first max-md:mt-7",
              )}
            >
              {p.full && (
                <span className="absolute -inset-x-0.5 -top-7 flex h-7 items-center justify-center gap-1.5 rounded-t-lg bg-brand text-sm font-semibold text-on-primary">
                  <Sparkles className="size-3.5" aria-hidden />
                  {l.planFullTag}
                </span>
              )}
              {covers && (
                <div className={cn(one && "md:row-span-5")}>
                  <PlanCover products={p.products} priority={!guest} />
                </div>
              )}

              <div className="grid content-start gap-1 px-1">
                <h3 className="type-subtitle">{p.title}</h3>
                <p className="text-sm text-muted">
                  {have.length ? fill(l.planLeft, { n: fmt.number(left.length), subjects: fmt.list(left.map((s) => s.name)) }) : p.note}
                </p>
                {have.length > 0 && (
                  <p className="flex items-start gap-1.5 text-sm font-medium text-success">
                    <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} aria-hidden />
                    {fill(l.planHave, { subjects: fmt.list(have.map((s) => s.name)) })}
                  </p>
                )}
              </div>

              <div className={cn("grid content-start gap-3 px-1", one && "md:max-w-sm")}>
                <p className="tabular-nums">
                  <span className="type-display">{taka(price)}</span>
                  {unit && <span className="text-sm text-subtle"> {unit}</span>}
                </p>
                <Button size="lg" variant={p.full ? "primary" : "secondary"} onClick={() => buy(p.buy)} className="w-full">
                  {c.buy}
                </Button>
              </div>

              {/* CT71: only the subjects the plan includes, as green pills with a tick (the dashed pills for the subjects it
                  leaves out could be read as included; CT38's dashed half is gone). */}
              <ul className="flex flex-wrap content-start gap-1.5 border-t border-border px-1 pt-4 text-sm" aria-label={l.planIncludes}>
                {left.map((s) => {
                  const book = bookColors ? BOOK_COLOR[(BOOK_FAMILIES as string[]).includes(s.id) ? (s.id as BookFamily) : "other"] : null;
                  return (
                    <li
                      key={s.id}
                      className={cn("inline-flex h-7 items-center gap-1 rounded-full px-2.5 font-medium", !book && "bg-success-soft text-success")}
                      style={
                        book ? { backgroundColor: `color-mix(in oklab, ${book} 14%, var(--color-surface))`, color: "var(--color-text)" } : undefined
                      }
                    >
                      <Check className="size-3.5" strokeWidth={3} style={book ? { color: book } : undefined} aria-hidden />
                      {s.name}
                    </li>
                  );
                })}
              </ul>

              <ul className="grid content-start gap-2 px-1 text-sm text-muted">
                {facts.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 self-end border-t border-border px-1 pt-4">
                {teachers.length > 0 && (
                  <>
                    <span className="flex -space-x-1.5">
                      {teachers.slice(0, 6).map((t) => (
                        <Avatar key={t.name} src={t.imageUrl} name={t.name} size={28} className="ring-2 ring-surface" />
                      ))}
                    </span>
                    <span className="text-xs text-subtle">{fill(c.teacherCount, { n: fmt.number(teachers.length) })}</span>
                  </>
                )}
              </div>
            </Card>
          );
        })}
        {four && lastMinute && (
          // CT193: the same three rows as the plans: name and what it is, two facts, the button.
          <Card
            as="li"
            key="last-minute"
            className={cn(
              "relative grid content-start gap-4 p-4 sm:p-5 md:grid-rows-subgrid",
              thumbs && !thumbSide ? "md:row-span-4" : "md:row-span-3",
              thumbSide && (squares ? SQUARE_THUMB_CARD : SIDE_THUMB_CARD),
            )}
          >
            {thumbs &&
              (thumbSide ? (
                squares ? (
                  <div className="row-span-2 self-start sm:row-span-3">
                    <SquareThumb srcs={[lastMinute.thumb]} />
                  </div>
                ) : (
                  <div className="row-span-2 self-start sm:row-span-3 sm:self-stretch">
                    <PlanCover products={[]} srcs={[lastMinute.thumb]} small />
                  </div>
                )
              ) : (
                <PlanCover products={[]} srcs={[lastMinute.thumb]} />
              ))}
            <div className="grid content-start gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="type-subtitle">{lastMinute.title}</h3>
                {lastMinute.sample}
              </div>
              <p className="text-sm text-muted">{lastMinute.note}</p>
            </div>
            <div className="grid content-start gap-1.5 text-sm text-muted">
              {/* CT205: one line each; a narrow card cuts the fact rather than wrapping it under its icon. */}
              <p className="flex min-w-0 items-center gap-1.5">
                <Radio className="size-4 shrink-0 text-subtle" aria-hidden />
                <span className="truncate font-semibold text-text">{lastMinute.facts[0]}</span>
              </p>
              <p className="flex min-w-0 items-center gap-1.5">
                <ClipboardCheck className="size-4 shrink-0 text-subtle" aria-hidden />
                <span className="truncate">{lastMinute.facts[1]}</span>
              </p>
            </div>
            <Button size="lg" shape="button" variant="secondary" href={lastMinute.url} className={cn("w-full self-end", thumbSide && "max-sm:col-span-2")}>
              {l.homePlanDetails}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </Card>
        )}
      </ul>
      {/* CT147: without prices the row of facts under the cards goes too; the product page has them. */}
      {clean && !simple && <FactList facts={[...shared, ...factLines(view, fmt, l, c)]} />}
    </section>
  );
}

/* ---------- single subjects ---------- */

/** The stream's single-subject courses, and those the student doesn't have yet (CT51). */
const singlesOf = (stream: CatalogView["stream"]) => stream.live.filter((p) => p.subjects.length === 1);
export const singlesToBuy = (stream: CatalogView["stream"]) => singlesOf(stream).filter((p) => !stream.owned.includes(p.subjects[0]));

/**
 * CT30: one subject at a time, below the plans. Each single is a small card with its own cover (the teachers'
 * faces); the picked ones add up to the cheapest way to buy them (a bundle when it costs less), with the
 * existing "add these too" nudge. Owned subjects can't be picked.
 */
function Singles({ view, fmt, l, c, buy }: { view: CatalogView; fmt: Formatter; l: L; c: CatalogLabels; buy: (products: CatalogProduct[]) => void }) {
  const { stream, billing } = view;
  // CT51: subjects the student already has fold into one line above the list; the list holds only what can be bought.
  const singles = singlesToBuy(stream);
  const have = singlesOf(stream).filter((p) => stream.owned.includes(p.subjects[0]));
  const [picked, setPicked] = useState<string[]>([]);
  const plan = useMemo(() => planFor(picked, stream.live, stream.owned), [picked, stream.live, stream.owned]);
  // Phones: the slim total hides while the receipt itself is on screen, so the two never show together.
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptSeen, setReceiptSeen] = useState(false);
  useEffect(() => {
    const el = receiptRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setReceiptSeen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  if (!singles.length) return null;

  const nudge = nudgeFor(picked, stream.live, stream.owned, plan);
  const names = new Map([...stream.group, ...stream.compulsory].map((s) => [s.id, s.name]));
  const list = (ids: string[]) => fmt.list(ids.map((id) => names.get(id) ?? id));
  const papersOf = (id: string) => [...stream.group, ...stream.compulsory].find((s) => s.id === id)?.papers ?? 2;
  const unit = billing ? c.perCycle : undefined;
  const taka = (n: number) => `৳${fmt.number(n)}`;
  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <section aria-labelledby="singles-title" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="singles-title" className={TITLE}>
          {l.singlesTitle}
        </h2>
        <p className={LEAD}>{l.singlesLead}</p>
        {have.length > 0 && (
          <p className="mt-1 flex items-start gap-1.5 text-sm font-medium text-success">
            <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} aria-hidden />
            {fill(l.planHave, { subjects: list(have.map((p) => p.subjects[0])) })}
          </p>
        )}
      </div>

      {/* CT42: the subjects two to a row on the left; the receipt beside them fills in as they are picked. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {singles.map((p) => {
            const id = p.subjects[0];
            const on = picked.includes(id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-2.5 pr-3.5 text-left transition-colors",
                    on ? "border-brand bg-brand-soft ring-1 ring-brand" : "border-border bg-surface hover:border-border-strong",
                  )}
                >
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-raised">
                    {p.thumbnailUrl && <Image src={p.thumbnailUrl} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-semibold">{names.get(id) ?? p.title}</span>
                    {/* CT40, CT41: every subject says which papers it covers; the price sits on the right. */}
                    <span className="text-sm text-muted">{papersOf(id) === 1 ? l.paperOne : l.paperTwo}</span>
                  </span>
                  <span className="grid shrink-0 justify-items-end tabular-nums">
                    <span className="font-semibold">{taka(p.price.final)}</span>
                    {unit && <span className="text-xs text-subtle">{unit}</span>}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
                      on ? "border-brand bg-brand text-on-primary" : "border-border-strong text-transparent",
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* CT46: on the white band the cream paper vanished, so the receipt itself takes the page's grey (no tray). */}
        {/* CT51: on phones an empty receipt stays hidden (the slim total takes over once something is picked). */}
        <div ref={receiptRef} className={cn("lg:sticky lg:top-20", plan.items.length === 0 && "max-lg:hidden")}>
          <Receipt
            tone="page"
            title={l.receipt}
            lines={plan.items.map((x) => ({ id: x.id, label: list(x.subjects), value: taka(x.price.final) }))}
            empty={l.singlesEmpty}
            totalLabel={l.receiptTotal}
            total={`${taka(plan.total)}${unit ? ` ${unit}` : ""}`}
            note={
              plan.saving > 0 && plan.separateTotal !== null
                ? fill(l.receiptSaving, { saving: taka(plan.saving), separate: taka(plan.separateTotal) })
                : undefined
            }
          >
            {plan.bonus.length > 0 && <p className="text-sm text-muted">{fill(c.bonus, { subjects: list(plan.bonus) })}</p>}
            {nudge && (
              <p className="flex flex-wrap items-center gap-x-2 rounded-md bg-highlight-soft px-3 py-2 text-sm text-text">
                <Sparkles className="size-4 shrink-0 text-highlight" aria-hidden />
                {fill(c.nudge, { extra: taka(nudge.extra), subjects: list(nudge.add) })}
                <button
                  type="button"
                  onClick={() => setPicked((cur) => [...cur, ...nudge.add])}
                  className="font-semibold text-brand-text hover:underline"
                >
                  {c.nudgeAdd}
                </button>
              </p>
            )}
            <Button
              size="lg"
              className="w-full disabled:bg-border disabled:text-subtle disabled:opacity-100 disabled:shadow-none"
              disabled={plan.items.length === 0}
              onClick={() => buy(plan.items)}
            >
              {c.buy}
            </Button>
          </Receipt>
        </div>
      </div>

      {/* Phones: the receipt sits below a long list, so a slim total stays at the bottom while something is picked. */}
      {plan.items.length > 0 && !receiptSeen && (
        <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-full border border-brand bg-surface py-2 pr-2 pl-4 shadow-pop lg:hidden">
          <p className="min-w-0 flex-1 truncate tabular-nums">
            <span className="font-semibold">{fill(l.singlesCount, { n: fmt.number(picked.length) })}</span>
            <span className="text-muted"> · </span>
            <span className="font-semibold">{taka(plan.total)}</span>
          </p>
          <Button size="sm" onClick={() => buy(plan.items)}>
            {c.buy}
          </Button>
        </div>
      )}
    </section>
  );
}

/** The three facts that answer "when, how long, is it too late", said once beside the plans. */
const factLines = (view: CatalogView, fmt: Formatter, l: L, c: CatalogLabels) =>
  [
    view.highlights[0],
    view.billing && fill(l.factCycle, { months: fmt.number(view.billing.cycleMonths), cycles: fmt.number(view.billing.cycles) }),
    view.billing && c.joinAnytime,
  ].filter((f): f is string => Boolean(f));

export function Facts({ view, fmt, l, c }: { view: CatalogView; fmt: Formatter; l: L; c: CatalogLabels }) {
  return <FactList facts={factLines(view, fmt, l, c)} />;
}

function FactList({ facts }: { facts: string[] }) {
  if (!facts.length) return null;
  return (
    <ul className="-mt-1 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
      {facts.map((f) => (
        <li key={f} className="flex items-start gap-1.5">
          <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  );
}

/** The subjects with a book colour of their own (`BOOK_COLOR`); any other subject takes the neutral one. */
const BOOK_FAMILIES: BookFamily[] = ["physics", "chemistry", "biology", "math", "ict", "bangla", "english"];
