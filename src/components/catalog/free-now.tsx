"use client";

import { ArrowUpRight, CalendarDays, ChevronRight, FileText, Folder, Gift, Languages, Play } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { softTones, type Tone } from "@/design-system/foundations/tone";
import { LiveWaves } from "@/design-system/molecules/task-tile";
import { Sample } from "@/components/landing/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { BatchClass, FreeShelfItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { freeEachSubject } from "@/lib/guest";
import { freeOffers, offerTurns } from "@/data/segment-home";
import { links } from "@/data/landing/site";
import { dhakaDay } from "@/lib/time";
import { NEW_IN_SHEET, OpenNewUploads } from "./free-folders";
import { LoginButton } from "./segment";

type L = Dictionary["segment"];

/** How many of the coming free live classes the list shows (v56); the rest are on the full routine. */
const LIVE_ROWS = 3;
/** CT162 (v57): on the timeline, how many free classes of the coming days follow today's. */
const UPCOMING_ROWS = 2;
/**
 * CT203 (v92): sample ages, in hours, for the upload rows' time while the data can't give it: the snapshot dates only the
 * videos, a year back, and no sheet or exam (section 9, item 94). Unmarked on the page (CT204).
 */
/** CT251: the files in the sample folder upload (the designer's example). */
const FOLDER_SAMPLE_FILES = 12;
const SAMPLE_UPLOAD_AGE_H = [3, 26];

/**
 * CT161 (lab `segment-home` v56): the top of "তোমার জন্য ফ্রি", every free offer a guest can take now, as the routine's
 * rows: the next free live classes (some of every subject's are free after a login, CT146), then the demo class. Which
 * offers show, in what order and from when to when is `freeOffers` (data/segment-home.ts), so the team can bring one
 * forward for a season. A link to the full routine closes the list, the page's one way to it since the routine left (CT156).
 *
 * CT162 (v57, `timeline`): not the routine's rows. The newest free uploads first (the latest video, the latest PDF), then
 * the day as a timeline: today's free live classes by their time, the coming days' next ones, and the demo class at the
 * end, "whenever you like". The full routine is the fifth folder under it, so no link here.
 */
export function FreeNow({
  classes,
  now,
  fmt,
  l,
  lang,
  signedIn,
  joinHref,
  demoHref,
  fullHref,
  uploads = [],
  segment = "",
  timeline = false,
  slim = false,
  boxed = false,
  samples = true,
  soft = false,
  tiles = false,
  stacked = false,
  liveBand = false,
  classBand = false,
  spokenRow = false,
  turns = false,
  roomRight = false,
  sharedLinks = false,
  greyPulse = false,
  softPulse = false,
  calmHeads = false,
  moreBelow = false,
  uploadRows = false,
  oneLine = false,
  folderUpload = false,
  moreLink = false,
}: {
  classes: BatchClass[];
  now: number;
  fmt: Formatter;
  l: L;
  lang: Locale;
  signedIn: boolean;
  /** A signed-in student's way into a class: the full routine. */
  joinHref: string;
  demoHref: string;
  fullHref: string;
  /** CT162: the stream's free things, newest first; the latest video and the latest note (a PDF) lead the section. */
  uploads?: FreeShelfItem[];
  /** The class links' query (lab, viewer, segment), as the folders use it. */
  segment?: string;
  timeline?: boolean;
  /**
   * CT163 (v58): the timeline with three stops and no "আজ"/"আসছে": the next free live class, named by its subject and
   * topic, the demo class and a free trial; the newest uploads move under it.
   */
  slim?: boolean;
  /** CT164 (v59): each new upload in a box of its own, the whole box the link. */
  boxed?: boolean;
  /** CT164 (v59): without the sample marks (the designer's call); the open questions stay in section 9. */
  samples?: boolean;
  /** CT165 (v60): the upload boxes on a soft fill, no border. */
  soft?: boolean;
  /** CT166 (v61): no timeline; each offer its own row with the dashboard's 56px tile in front (time or icon, a coloured band). */
  tiles?: boolean;
  /** CT174 (v67): the two uploads one under the other at every width, so a name has the row's whole width. */
  stacked?: boolean;
  /**
   * CT175 (v68): the class's tile says it's a live class: the red "লাইভ" band at all times, the time on top until it
   * starts; while it's on, the live waves in place of the time and "এখন চলছে" first in the line under its name.
   * `?livenow=1` shows that state at any hour, for review.
   */
  liveBand?: boolean;
  /**
   * CT255 (segment-page v7): the band says "ক্লাস" on the class colour until the class starts, as the dashboard's class
   * tiles (`ClassTile`); "লাইভ" in red only while it is on. CT257: no "জয়েন করো" until then either.
   */
  classBand?: boolean;
  /**
   * CT258 (segment-page v7): Spoken English's free class at the English centre as a row after the demo, with "ফ্রি ক্লাস
   * বুক করো" to the centre's booking page (CT220's). The course stays in the English and skills list below too.
   */
  spokenRow?: boolean;
  /** CT176 (v69): the demo and the trial by turns, a day each (`offerTurns`), never both. */
  turns?: boolean;
  /** CT177 (v70): 20px on the upload boxes' right, so "দেখো" / "খোলো" don't hug the edge (12px on the other sides). */
  roomRight?: boolean;
  /**
   * CT180 (v73): an upload opened from a shared link (`#up-<item id>`) leads the new uploads, scrolls into view, wears a
   * "তোমার সাথে শেয়ার করা" tag, and for 20 seconds a dashed green ring turns around its box (still with reduced motion).
   */
  sharedLinks?: boolean;
  /** CT181 (v74): the shared item's mark is a grey border fading in and out (0 → 100% → 0, every 2s), not the green dashes. */
  greyPulse?: boolean;
  /** CT182 (v75): the grey border quieter, and on for 6 seconds (three breaths) instead of 20. */
  softPulse?: boolean;
  /** CT187 (v79): "নতুন আপলোড" in the same type as "ফ্রি কনটেন্ট", and "আরও দেখো" as a plain link. */
  calmHeads?: boolean;
  /**
   * CT199 (v91): the boxes without "খোলো" / "দেখো" (the whole box is the link), and "আরও দেখো" under them, at the
   * right, so the row isn't three buttons in a column.
   */
  moreBelow?: boolean;
  /**
   * CT200 (v92): the new uploads as rows like the offers above: no grey box, the kind's icon alone in a 56px circle of its
   * colour, the title and its paper; and a last row "+n" that opens the new uploads' sheet (CT186).
   */
  uploadRows?: boolean;
  /** CT244 (segment-page v6): a class's name on one line on phones too, cut with "…" rather than wrapping. */
  oneLine?: boolean;
  /**
   * CT251 (segment-page v7): the second new upload drawn as a folder the team uploaded, with how many files are in it:
   * the designer's example "বার্ষিক পরীক্ষার Revision Class", 12 files. The data has no folder uploads yet (section 9);
   * the row opens what the note it stands in for opened.
   */
  folderUpload?: boolean;
  /**
   * CT252 (segment-page v7): no row with a "+n" circle under the uploads. CT254: in its place "আরও nটা ›" at the heading's
   * right end (CT253's line of text under the rows moved up).
   */
  moreLink?: boolean;
}) {
  // CT175: `?livenow=1` draws the free class as if on now, so the live state can be reviewed at any hour.
  const params = useSearchParams();
  const openNew = useContext(OpenNewUploads);
  // CT180: the item a shared link points at (`#up-<id>`), and whether its 20 seconds of ring are over.
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const sharedId = sharedLinks && hash.startsWith("#up-") ? decodeURIComponent(hash.slice(4)) : null;
  const [ringDone, setRingDone] = useState<string | null>(null);
  useEffect(() => {
    if (!sharedId) return;
    const box = document.getElementById(`up-${sharedId}`);
    box?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    const t = window.setTimeout(() => setRingDone(sharedId), softPulse ? 6_000 : 20_000);
    return () => window.clearTimeout(t);
  }, [sharedId, softPulse]);
  const preview = params.get("livenow") === "1";
  // CT176: whose day it is, the demo's or the trial's; `?offer=` overrides it for review.
  const forced = offerTurns.kinds.find((k) => k === params.get("offer"));
  const days = Math.round((Date.parse(dhakaDay(now)) - Date.parse(offerTurns.from)) / 86_400_000);
  const turn = forced ?? offerTurns.kinds[((days % offerTurns.kinds.length) + offerTurns.kinds.length) % offerTurns.kinds.length];
  const offers = freeOffers.filter((o) => (!o.from || now >= Date.parse(o.from)) && (!o.to || now < Date.parse(o.to))).map((o) => o.kind);
  const nextIds = freeEachSubject(
    classes.filter((c) => c.kind !== "exam"),
    now,
  );
  const next = nextIds.map((id) => classes.find((c) => c.id === id)!).filter(Boolean);
  const day = (iso: string) => {
    const rel = fmt.relativeDay(iso);
    return rel === "today" ? l.homeOfferToday : rel === "tomorrow" ? l.homeOfferTomorrow : fmt.weekday(iso);
  };
  const join = signedIn ? (
    <Button href={joinHref} size="sm" variant="secondary">
      {l.homeJoin}
    </Button>
  ) : (
    <LoginButton lang={lang} label={l.homeJoin} variant="secondary" />
  );
  const book = (
    <Button href={demoHref} size="sm" variant="secondary">
      {l.homeOfferBook}
      <ArrowUpRight className="size-4" aria-hidden />
    </Button>
  );

  if (timeline) {
    const live = offers.includes("live") ? next : [];
    const today = slim ? [] : live.filter((c) => fmt.relativeDay(c.startsAt) === "today");
    const upcoming = slim ? [] : live.filter((c) => fmt.relativeDay(c.startsAt) !== "today").slice(0, UPCOMING_ROWS);
    const demoOn = offers.includes("demo");
    // A free trial needs the login to start; a student who's signed in is past it.
    const trialOn = slim && offers.includes("trial") && !signedIn;
    // CT176: with both on offer, only today's; when the trial can't show (signed in), the demo keeps its place.
    const both = turns && demoOn && trialOn;
    const demo = both ? turn === "demo" : demoOn;
    const trial = both ? turn === "trial" : trialOn;
    /*
     * CT163: the class's topic. The routine says only the subject (CT93), so the newest free class of that subject in the
     * syllabus stands in for what the batch is on now; it carries the sample mark until the routine has topics (section 9).
     */
    const topicOf = (subject: string) => uploads.find((i) => i.subject === subject && i.kind === "video")?.title ?? null;
    // CT163: one class, the next free one whose topic is known (else simply the next), whatever its day.
    const first = slim ? (live.find((c) => topicOf(c.subject)) ?? live[0] ?? null) : null;
    // The newest of each kind that leads: a video, and a note (the lecture sheets and slides, the PDFs).
    const latest = offers.includes("uploads")
      ? (["video", "note"] as const).map((k) => uploads.find((i) => i.kind === k)).filter((i): i is FreeShelfItem => !!i)
      : [];
    // CT180: a shared item leads, whatever its age; the newest of the other kinds stay beside it.
    const sharedItem = sharedId ? (uploads.find((i) => i.id === sharedId) ?? null) : null;
    const newest = sharedItem ? [sharedItem, ...latest.filter((i) => i.kind !== sharedItem.kind)] : latest;
    // CT200: how many more the new uploads' sheet lists (its twelve newest dated ones) beyond those shown here.
    const moreCount = uploads
      .filter((i) => i.at)
      .slice(0, NEW_IN_SHEET)
      .filter((i) => !newest.some((n) => n.id === i.id)).length;
    if (!today.length && !upcoming.length && !first && !demo && !trial && !newest.length) return null;

    // As the folders' items: a guest's tap asks for the login (the page's pop-up catches the link), then goes to the item's paper.
    const page = (i: FreeShelfItem, keepAs: boolean) => `/${lang}/subject/${i.paperId}?${keepAs ? segment : segment.replace(/&as=[^&]*/, "")}`;
    const hrefOf = (i: FreeShelfItem) => (signedIn ? page(i, true) : `/${lang}/login?next=${encodeURIComponent(page(i, false))}`);
    const when = (iso: string) => {
      const rel = fmt.relativeDay(iso);
      return rel === "today"
        ? l.homeOfferToday
        : rel === "yesterday"
          ? l.homeOfferYesterday
          : rel === "tomorrow"
            ? l.homeOfferTomorrow
            : fmt.dateCompact(iso);
    };
    const range = (c: BatchClass) => `${fmt.time(c.startsAt)} – ${fmt.time(c.endsAt)}`;

    const classRow = (c: BatchClass, upcomingRow: boolean) => {
      const start = Date.parse(c.startsAt);
      const on = now >= start && now < Date.parse(c.endsAt);
      const { period, clock } = fmt.timeParts(start);
      const topic = slim ? topicOf(c.subject) : null;
      return (
        <Stop
          key={c.id}
          sample={topic && samples ? l.homeSample : undefined}
          left={
            upcomingRow ? (
              <>
                <span className="block text-sm font-bold">{day(c.startsAt)}</span>
                <span className="block text-xs text-subtle tabular-nums">{clock}</span>
              </>
            ) : (
              <>
                <span className="block text-base font-bold tabular-nums">{clock}</span>
                <span className="block text-xs text-subtle">{period}</span>
              </>
            )
          }
          dot={on ? "live" : upcomingRow ? "later" : "today"}
          title={topic ? `${c.subjectName} · ${topic}` : c.subjectName}
          pill={on ? { tone: "danger", text: l.homeOfferLiveNow } : { tone: "brand", text: l.homeOfferLiveFree, quiet: true }}
          meta={range(c)}
          action={join}
          live={on}
        />
      );
    };

    const uploadsBlock = newest.length > 0 && (
      <section aria-labelledby="free-new-title" className="grid gap-2">
        <div className="flex items-center gap-2">
          {/* CT187 (v79): the same heading as "ফ্রি কনটেন্ট" below. */}
          <h3 id="free-new-title" className={calmHeads ? "text-sm font-semibold text-muted" : "text-xs font-semibold text-subtle"}>
            {l.homeOfferNew}
          </h3>
          {/* CT204: no marker for the rows' sample times either; the designer keeps the section clean (CT164). */}
          {samples && <Sample>{l.homeSample}</Sample>}
          {/* CT186: more of the new uploads, in the folders' sheet. */}
          {openNew && moreLink && moreCount > 0 && (
            // CT254: the count beside the heading, as a plain link; the heading already says what they are.
            <button
              type="button"
              onClick={openNew}
              className="-my-1 ml-auto inline-flex items-center gap-0.5 rounded-sm py-1 text-sm font-semibold text-brand-text hover:underline"
            >
              {fill(l.homeOfferMoreCount, { n: fmt.number(moreCount) })}
              <ChevronRight className="size-4" aria-hidden />
            </button>
          )}
          {openNew && !moreBelow && (
            <button
              type="button"
              onClick={openNew}
              className={cn(
                "ml-auto inline-flex items-center gap-0.5 font-semibold text-brand-text",
                // CT187 (v79): a plain link, not a pill.
                calmHeads
                  ? "-my-1 rounded-sm py-1 text-sm hover:underline"
                  : "h-7 rounded-full border border-border-strong pr-2 pl-3 text-xs hover:bg-raised",
              )}
            >
              {l.homeOfferMore}
              <ChevronRight className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
        {uploadRows ? (
          <ul className="grid gap-2">
            {newest.map((i, n) => {
              const video = i.kind === "video";
              const shared = i.id === sharedItem?.id;
              const folder = folderUpload && n === 1 && i.kind === "note";
              const title = folder ? l.homeOfferFolderSample : i.title;
              const paper = folder ? `${i.paper} · ${fill(l.homeOfferFolderFiles, { n: fmt.number(FOLDER_SAMPLE_FILES) })}` : i.paper;
              // CT203: when it was uploaded, as the dashboard's recent list: a dot and dark type for the last day's.
              const at = fmt.now - (SAMPLE_UPLOAD_AGE_H[n] ?? 48) * 3_600_000;
              const ago = fmt.ago(at);
              const fresh = fmt.now - at < 86_400_000;
              return (
                <li key={i.id} id={`up-${i.id}`} className="relative -mx-2 scroll-mt-24">
                  {shared && ringDone !== i.id && <span aria-hidden className={cn("shared-pulse", softPulse && "shared-pulse-soft")} />}
                  <Link href={hrefOf(i)} className="group/up flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-raised sm:gap-4">
                    <span
                      aria-hidden
                      className={cn(
                        // CT202: the grey border vanished on the tints, so each circle's border is its own colour, faint.
                        "grid size-14 shrink-0 place-items-center rounded-full border",
                        video
                          ? "border-danger/25 bg-danger-soft text-danger"
                          : folder
                            ? "border-warning/25 bg-warning-soft text-warning"
                            : "border-info/25 bg-info-soft text-info",
                      )}
                    >
                      {video ? (
                        <Play className="size-6 fill-current" />
                      ) : folder ? (
                        // CT251: a filled folder, so it reads as a folder of files, not a single sheet.
                        <Folder className="size-6 fill-current" />
                      ) : (
                        <FileText className="size-6" />
                      )}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      {/* CT201: no "তোমার সাথে শেয়ার করা" tag on the rows; the grey pulse alone marks the shared upload. */}
                      <Clip text={title} className="truncate font-semibold" on="up" />
                      {/* Phones: the time joins this line instead of taking a column. */}
                      <Clip text={`${paper} · ${ago}`} className="truncate text-sm text-muted sm:hidden" on="up" />
                      <Clip text={paper} className="truncate text-sm text-muted max-sm:hidden" on="up" />
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm whitespace-nowrap text-subtle max-sm:hidden">
                      {fresh && <span aria-hidden className="size-2 rounded-full bg-brand" />}
                      <span className={cn(fresh && "font-medium text-text")}>{ago}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
            {openNew && moreCount > 0 && !moreLink && (
              <li className="-mx-2">
                <button
                  type="button"
                  onClick={openNew}
                  className="group/up flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-raised sm:gap-4"
                >
                  <span
                    aria-hidden
                    className="grid size-14 shrink-0 place-items-center rounded-full border border-border-strong bg-raised font-bold text-brand-text tabular-nums"
                  >
                    +{fmt.number(moreCount)}
                  </span>
                  {/* CT202: the chevron follows the text, not pushed to the row's far end. */}
                  <span className="flex min-w-0 flex-1 items-center gap-1 font-semibold">
                    <span className="truncate">{fill(l.homeOfferMoreRow, { n: fmt.number(moreCount) })}</span>
                    <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
                  </span>
                </button>
              </li>
            )}
          </ul>
        ) : (
          <ul className={cn("grid", !stacked && "sm:grid-cols-2", boxed ? (stacked ? "gap-2" : "gap-3") : "gap-1 sm:gap-x-6")}>
            {newest.map((i) => {
              const video = i.kind === "video";
              const shared = i.id === sharedItem?.id;
              const kindLabel = video ? l.homeOfferNewVideo : i.kind === "quiz" ? l.homeFreeQuiz : l.homeOfferNewPdf;
              return (
                <li key={i.id} id={`up-${i.id}`} className="relative scroll-mt-24">
                  {/* CT180: the shared item's ring, outside the box so nothing moves; it fades when its 20 seconds are up. */}
                  {shared &&
                    (greyPulse ? (
                      // CT181: gone once its 20 seconds are up.
                      ringDone !== i.id && <span aria-hidden className={cn("shared-pulse", softPulse && "shared-pulse-soft")} />
                    ) : (
                      <svg aria-hidden className={cn("shared-ring transition-opacity duration-700", ringDone === i.id && "opacity-0")}>
                        <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="19" />
                      </svg>
                    ))}
                  <Link
                    href={hrefOf(i)}
                    className={cn(
                      "group/up flex items-center gap-3 rounded-md",
                      boxed
                        ? soft
                          ? cn("h-full rounded-lg bg-raised p-3 transition-colors hover:bg-border/60", roomRight && "pr-5")
                          : "h-full rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-raised"
                        : "-mx-2 p-2 hover:bg-raised",
                    )}
                  >
                    {/* The data has no picture for a sheet or a video (section 9), so the kind's glyph stands on its tile. */}
                    <span
                      aria-hidden
                      className={cn(
                        "grid aspect-video w-16 shrink-0 place-items-center rounded-md sm:w-24",
                        video ? "bg-danger-soft text-danger" : "bg-info-soft text-info",
                      )}
                    >
                      {video ? <Play className="size-5 fill-current sm:size-6" /> : <FileText className="size-5 sm:size-6" />}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="flex min-w-0 items-center gap-2">
                        {/* CT165: a long name is cut; hovering shows it whole. */}
                        <Clip text={i.title} className="truncate font-semibold" on="up" />
                        <Pill tone={video ? "danger" : "info"} className="max-sm:hidden">
                          {kindLabel}
                        </Pill>
                        {shared && (
                          <Pill tone="brand" className="max-sm:hidden">
                            {l.homeOfferShared}
                          </Pill>
                        )}
                      </span>
                      {/* On phones the title takes the first line whole; the kind starts the second. */}
                      <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
                        <Pill tone={shared ? "brand" : video ? "danger" : "info"} className="sm:hidden">
                          {shared ? l.homeOfferShared : kindLabel}
                        </Pill>
                        <Clip text={`${i.paper}${i.at ? ` · ${when(i.at)}` : ""}`} className="truncate" on="up" />
                      </span>
                    </span>
                    {!moreBelow && (
                      <span className="shrink-0 text-sm font-semibold text-brand-text group-hover/up:underline">
                        {video ? l.homeOfferWatch : l.homeOfferOpen}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {openNew && moreBelow && !uploadRows && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-0.5 justify-self-end rounded-sm py-1 text-sm font-semibold text-brand-text hover:underline"
          >
            {l.homeOfferMore}
            <ChevronRight className="size-3.5" aria-hidden />
          </button>
        )}
      </section>
    );

    return (
      <div className="grid gap-5">
        {!slim && uploadsBlock}
        {tiles && (first || demo || trial || spokenRow) && (
          <ul className="grid gap-2">
            {first &&
              (() => {
                const start = Date.parse(first.startsAt);
                const on = (now >= start && now < Date.parse(first.endsAt)) || (liveBand && preview);
                const { period, clock } = fmt.timeParts(start);
                const topic = topicOf(first.subject);
                return (
                  <Row
                    oneLine={oneLine}
                    key={first.id}
                    tile={
                      on ? (
                        <LiveWaves className="size-7 text-live" />
                      ) : (
                        <span className="grid">
                          <span className="text-xs leading-none font-medium text-subtle">{period}</span>
                          <span className="mt-0.5 text-sm leading-none font-bold tabular-nums">{clock}</span>
                        </span>
                      )
                    }
                    band={on || (liveBand && !classBand) ? l.homeOfferLive : classBand ? l.homeOfferClassBand : l.routineFree}
                    bandClass={on || (liveBand && !classBand) ? "bg-class-band-live" : "bg-class-band-class"}
                    title={topic ? `${first.subjectName} · ${topic}` : first.subjectName}
                    meta={liveBand && on ? `${l.homeOfferLiveNow} · ${range(first)}` : `${day(first.startsAt)} · ${range(first)}`}
                    // CT257: a class that hasn't started has no "জয়েন করো"; the button comes back while it is on.
                    action={classBand && !on ? null : join}
                    live={on}
                  />
                );
              })()}
            {demo && (
              <Row
                oneLine={oneLine}
                key="demo"
                tile={<Play className="size-6 fill-current text-class-band-free" aria-hidden />}
                band={l.homeOfferDemoBand}
                bandClass="bg-class-band-free"
                title={l.homeDemoShort}
                meta={l.homeOfferDemoNote}
                action={book}
              />
            )}
            {trial && (
              <Row
                oneLine={oneLine}
                key="trial"
                tile={<Gift className="size-6 text-highlight" aria-hidden />}
                band={l.homeOfferTrialBand}
                bandClass="bg-class-band-exam"
                title={l.homeOfferTrial}
                meta={l.homeOfferTrialNote}
                action={<LoginButton lang={lang} label={l.homeOfferStart} variant="secondary" />}
              />
            )}
            {spokenRow && (
              <Row
                oneLine={oneLine}
                key="spoken"
                tile={<Languages className="size-6 text-class-band-free" aria-hidden />}
                band={l.homeOfferEnglishBand}
                bandClass="bg-class-band-free"
                title="Spoken English"
                meta={l.homeOfferSpokenNote}
                action={
                  <Button href={links.englishCentreFreeClass} size="sm" variant="secondary">
                    {/* On phones "বুক করো" as the demo's, so the course's name keeps its room; "ফ্রি ক্লাস বুক করো" from `sm`. */}
                    <span className="sm:hidden">{l.homeOfferBook}</span>
                    <span className="max-sm:hidden">{l.homeEnglishBook}</span>
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Button>
                }
              />
            )}
          </ul>
        )}
        {!tiles && (today.length > 0 || upcoming.length > 0 || first || demo || trial) && (
          <ol className="relative grid">
            {/* The day's line, through the dots. */}
            <span
              aria-hidden
              className="absolute top-3 bottom-3 left-[calc(2.75rem+0.625rem+0.375rem-1px)] w-0.5 rounded-full bg-border sm:left-[calc(3.5rem+1rem+0.5rem-1px)]"
            />
            {today.length > 0 && <Label>{l.homeOfferToday}</Label>}
            {today.map((c) => classRow(c, false))}
            {upcoming.length > 0 && <Label>{l.homeOfferUpcoming}</Label>}
            {upcoming.map((c) => classRow(c, true))}
            {first && classRow(first, fmt.relativeDay(first.startsAt) !== "today")}
            {demo && (
              <Stop
                key="demo"
                left={<span className="block text-xs leading-tight font-semibold text-subtle">{l.homeOfferAnytime}</span>}
                dot="later"
                title={l.homeDemoShort}
                pill={{ tone: "brand", text: l.routineFree }}
                meta={l.homeOfferDemoNote}
                action={book}
              />
            )}
            {trial && (
              <Stop
                key="trial"
                left={<span className="block text-xs leading-tight font-semibold text-subtle">{l.homeOfferNow}</span>}
                dot="later"
                title={l.homeOfferTrial}
                sample={samples ? l.homeSample : undefined}
                pill={{ tone: "brand", text: l.routineFree }}
                meta={l.homeOfferTrialNote}
                action={<LoginButton lang={lang} label={l.homeOfferStart} variant="secondary" />}
              />
            )}
          </ol>
        )}
        {slim && uploadsBlock}
      </div>
    );
  }

  const rows: ReactNode[] = [];
  for (const kind of offers) {
    if (kind === "live")
      for (const c of next.slice(0, LIVE_ROWS)) {
        const start = Date.parse(c.startsAt);
        const on = now >= start && now < Date.parse(c.endsAt);
        const { period, clock } = fmt.timeParts(start);
        rows.push(
          <Row
            oneLine={oneLine}
            key={c.id}
            tile={
              <span className="grid">
                <span className="text-xs leading-none font-medium text-subtle">{period}</span>
                <span className="mt-0.5 text-sm leading-none font-bold tabular-nums">{clock}</span>
              </span>
            }
            band={on ? l.homeOfferLive : l.routineFree}
            bandClass={on ? "bg-class-band-live" : "bg-brand"}
            title={c.subjectName}
            meta={`${day(c.startsAt)} · ${fmt.time(c.startsAt)} – ${fmt.time(c.endsAt)}`}
            live={on}
            action={join}
          />,
        );
      }
    if (kind === "demo")
      rows.push(
        <Row
          oneLine={oneLine}
          key="demo"
          tile={<Play className="size-5 fill-current text-brand-text" aria-hidden />}
          band={l.homeOfferDemoBand}
          bandClass="bg-class-band-class"
          title={l.homeDemoShort}
          meta={l.homeOfferDemoNote}
          action={book}
        />,
      );
  }
  if (!rows.length) return null;

  return (
    <div className="grid gap-2">
      <ul className="grid gap-1">{rows}</ul>
      <Link href={fullHref} className="inline-flex w-fit items-center gap-1.5 rounded-sm py-1 text-sm font-semibold text-brand-text hover:underline">
        <CalendarDays className="size-4" aria-hidden />
        {l.homeOfferRoutine}
      </Link>
    </div>
  );
}

/* ---------- CT162: the timeline ---------- */

/** The timeline's columns: the time or day, the dot on the line, what and when, and the action (under the text on phones). */
// On phones too the action stays at the end of the row, so a stop doesn't grow a third line.
const STOP = "grid grid-cols-[2.75rem_0.75rem_minmax(0,1fr)_auto] items-center gap-x-2.5 sm:grid-cols-[3.5rem_1rem_minmax(0,1fr)_auto] sm:gap-x-4";

function Label({ children }: { children: ReactNode }) {
  return (
    <li className={STOP} aria-hidden>
      <span className="col-start-3 pt-3 pb-1 text-xs font-semibold text-subtle">{children}</span>
    </li>
  );
}

function Pill({ tone, className, children }: { tone: Tone; className?: string; children: ReactNode }) {
  return <span className={cn("shrink-0 rounded-full px-2 py-px text-xs font-semibold", softTones[tone], className)}>{children}</span>;
}

/** One stop on the day: red and beating while the class is on, green for today's, hollow for the days ahead. */
function Stop({
  left,
  dot,
  title,
  pill,
  meta,
  action,
  live = false,
  sample,
}: {
  left: ReactNode;
  dot: "live" | "today" | "later";
  title: string;
  /** `quiet`: left out on phones, where the room is the action's (the section's lead already says it's all free). */
  pill: { tone: Tone; text: string; quiet?: boolean };
  meta: string;
  action: ReactNode;
  live?: boolean;
  /** CT163: the sample mark, for a part of the stop the data doesn't confirm yet. */
  sample?: string;
}) {
  return (
    <li className={cn(STOP, "gap-y-2 rounded-md py-2.5", live && "-mx-2 bg-danger-soft/60 px-2")}>
      <span className="text-right leading-tight">{left}</span>
      <span
        aria-hidden
        className={cn(
          "relative size-3 justify-self-center rounded-full ring-4 ring-surface",
          dot === "live" ? "bg-live motion-safe:animate-pulse" : dot === "today" ? "bg-brand" : "border-2 border-brand bg-surface",
        )}
      />
      <span className="grid min-w-0 gap-0.5">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{title}</span>
          <Pill tone={pill.tone} className={pill.quiet ? "max-sm:hidden" : undefined}>
            {pill.text}
          </Pill>
          {sample && <Sample>{sample}</Sample>}
        </span>
        <span className="text-sm text-muted">{meta}</span>
      </span>
      <span className="col-start-4">{action}</span>
    </li>
  );
}

/* ---------- v56: the routine's rows ---------- */

/** One offer: the routine's 56px tile (what and when on top, the band naming the kind), the name and when, the action. */
function Row({
  tile,
  band,
  bandClass,
  title,
  meta,
  action,
  live = false,
  oneLine = false,
}: {
  tile: ReactNode;
  band: string;
  bandClass: string;
  title: string;
  meta: string;
  action?: ReactNode;
  live?: boolean;
  oneLine?: boolean;
}) {
  return (
    <li className={cn("group/row -mx-2 flex items-center gap-3 rounded-md p-2 sm:gap-4", live && "bg-danger-soft/60")}>
      <Card as="div" radius="md" aria-hidden className="grid size-14 shrink-0 grid-rows-[1fr_auto] overflow-hidden text-center">
        <div className="grid place-items-center">{tile}</div>
        <div className={cn("truncate px-1 py-0.5 text-xs leading-4 font-bold text-on-fill", bandClass)}>{band}</div>
      </Card>
      <div className="grid min-w-0 flex-1 gap-0.5">
        {/* CT166: on phones a long name (a subject and its topic) wraps to two lines; from `sm` it is cut, whole on hover. */}
        <Clip text={title} className={cn("font-semibold", oneLine ? "truncate" : "max-sm:line-clamp-2 sm:truncate")} on="row" />
        {/* On phones the button leaves the line little room: it wraps to a second line rather than losing the end time. */}
        <p className="text-sm text-muted max-sm:line-clamp-2 sm:truncate">{meta}</p>
      </div>
      {action && <span className="shrink-0">{action}</span>}
    </li>
  );
}

/** Which box's hover shows the bubble: an upload's link (`group/up`) or an offer's row (`group/row`). */
const SHOW = { up: "group-hover/up:block", row: "group-hover/row:block" } as const;

/**
 * CT167: text that may be cut short (truncated, or clamped on phones). When it is cut, hovering anywhere on its box shows
 * the whole text at once in a small dark bubble over it; the browser's own `title` tooltip was slow to come or didn't
 * come at all. Whether it is cut is measured on load and whenever its width changes. The full text is in the page either
 * way, so a screen reader reads it whole.
 */
function Clip({ text, className, on }: { text: string; className?: string; on: keyof typeof SHOW }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  return (
    <span className="relative min-w-0">
      <span ref={ref} className={cn("block", className)}>
        {text}
      </span>
      {cut && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-max max-w-xs rounded-md bg-text px-2.5 py-1.5 text-xs leading-snug font-medium whitespace-normal text-surface shadow-pop",
            SHOW[on],
          )}
        >
          {text}
        </span>
      )}
    </span>
  );
}

/** CT180: the URL's hash as an external store, so a shared link's `#up-…` is read without a render of its own. */
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
