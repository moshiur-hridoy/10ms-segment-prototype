"use client";

import {
  BotMessageSquare,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  FileQuestion,
  Folder,
  Lightbulb,
  Lock,
  NotebookText,
  Play,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createContext, useRef, useState, type ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { IconButton } from "@/design-system/atoms/icon-button";
import { softTones, type Tone } from "@/design-system/foundations/tone";
import { Sample } from "@/components/landing/ui";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Locale } from "@/i18n/config";
import type { FreeShelfItem } from "@/lib/api";
import type { CatalogView } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";

type L = Dictionary["segment"];
type Kind = FreeShelfItem["kind"] | "suggestion" | "routine" | "exam" | "tenten";

const KINDS: { kind: Kind; Icon: LucideIcon; tone: Tone; label: (l: L) => string }[] = [
  { kind: "video", Icon: Play, tone: "danger", label: (l) => l.homeFreeVideo },
  { kind: "quiz", Icon: FileQuestion, tone: "warning", label: (l) => l.homeFreeQuiz },
  { kind: "note", Icon: NotebookText, tone: "info", label: (l) => l.homeFreeNote },
  { kind: "suggestion", Icon: Lightbulb, tone: "highlight", label: (l) => l.homeFreeSuggestion },
  // CT162 (v57): the fifth folder opens the full routine.
  { kind: "routine", Icon: CalendarDays, tone: "brand", label: (l) => l.homeFreeRoutine },
  // CT207 (v93): two folders that are links: exam practice opens SuperPrep, TenTen its chat.
  { kind: "exam", Icon: ClipboardCheck, tone: "brand", label: (l) => l.homeFreeExam },
  { kind: "tenten", Icon: BotMessageSquare, tone: "highlight", label: (l) => l.homeFreeTenTen },
];
const LINK_KINDS: Kind[] = ["exam", "tenten"];
/** While the sheet is open the page behind it stays still, as with the login pop-up. */
const lockScroll = (on: boolean) => void (document.documentElement.style.overflow = on ? "hidden" : "");
const kindOf = (k: Kind) => KINDS.find((x) => x.kind === k)!;
/** CT186 (v78): opens the sheet of new uploads; "আরও দেখো" beside "নতুন আপলোড" (in `FreeNow`, above the folders) calls it. */
export const OpenNewUploads = createContext<(() => void) | null>(null);
/** How many of the newest uploads the sheet lists. */
export const NEW_IN_SHEET = 12;

function KindIcon({ kind, big = false }: { kind: Kind; big?: boolean }) {
  const { Icon, tone } = kindOf(kind);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full", big ? "size-10 [&_svg]:size-5" : "size-7 [&_svg]:size-3.5", softTones[tone])}
    >
      <Icon className={cn(kind === "video" && "fill-current")} />
    </span>
  );
}

/**
 * CT120 (lab `segment-home` v27): "তোমার জন্য আরও ফ্রি" in place of "নতুন যা এসেছে". The free things are filed by
 * kind, a folder each (ভিডিও, কুইজ, নোট, সাজেশন), so a visitor who comes from a Facebook reel finds the full thing
 * quickly: a folder opens as a sheet (a dialog in the middle from `md`) with the stream's subjects to narrow it, newest first. Anyone may open a folder and
 * look; opening an item asks a guest to log in (the page's login pop-up), then lands on its paper's page. The items
 * are the batch's syllabus (real titles); which are free isn't in the data, hence the sample mark. No suggestions in
 * the data yet: that folder says it's coming. CT122 (v29): no search box (the designer's call), and a card on phones
 * too, so the folders read as their own block between the routine and the subject folders.
 */
export function FreeFolders({
  items,
  view,
  lang,
  segment,
  signedIn,
  fmt,
  l,
  top,
  routineHref,
  samples = true,
  noRule = false,
  phoneTwo = false,
  notesWithSuggestions = false,
  routineTop = false,
  newSheet = false,
  leftRow = false,
  practice,
  appIcons = false,
  moreFree = false,
  videoOnly = false,
}: {
  items: FreeShelfItem[];
  view: CatalogView;
  lang: Locale;
  segment: string;
  signedIn: boolean;
  fmt: Formatter;
  l: L;
  /**
   * CT161 (lab `segment-home` v56): the free offers (live classes, the demo) above the folders. With it, the section is
   * every free thing: the sample mark moves to the folders, and only the folders that hold something show.
   */
  top?: ReactNode;
  /** CT162 (v57): the full routine as the fifth folder; with it every folder shows, an empty one saying it's coming. */
  routineHref?: string;
  /** CT164 (v59): without the sample mark on the free content. */
  samples?: boolean;
  /** CT165 (v60): no rule between the offers and the folders. */
  noRule?: boolean;
  /** CT170 (v64): on phones two folders to a row (2, 2, 1), larger, the last one centred; one row of five from `sm`. */
  phoneTwo?: boolean;
  /** CT171 (v65): notes and suggestions in one folder, "নোট ও সাজেশন": four folders in all. */
  notesWithSuggestions?: boolean;
  /** CT185 (v78): the full routine as a secondary button beside the title, not a folder: three folders in all; no line under the title. */
  routineTop?: boolean;
  /**
   * CT186 (v78): the folders' sheet also lists the newest uploads, by day (আজ, গতকাল, then the date), opened from
   * "আরও দেখো" beside "নতুন আপলোড". Only videos carry a date in the data (section 9), so only they are listed.
   */
  newSheet?: boolean;
  /**
   * CT189 (v81): from `sm` the folders sit at the left, each in a fixed 112px column 16px apart, the rest of the row
   * empty; a new kind (suggestions, when the team has them) takes the next place. Phones keep three to a row.
   */
  leftRow?: boolean;
  /**
   * CT207 (v93): "এক্সাম প্র্যাকটিস" (to SuperPrep) and "TenTen" (to its chat; no chat page yet, so "#", section 9)
   * after the content folders.
   */
  practice?: { exam: string; tenten: string };
  /**
   * CT240 (segment-page v6): the two link folders drawn as their apps' marks. CT242: TenTen's own icon from its Figma
   * file, and SuperPrep's mark in the same rounded square, so both sit closer to the folders' shape.
   */
  appIcons?: boolean;
  /** CT245: the folders' heading "আরও যা ফ্রি থাকছে" in place of "ফ্রি কনটেন্ট". */
  moreFree?: boolean;
  /**
   * CT249 (segment-page v7): only the videos among the content folders (no quizzes, no notes and suggestions), drawn as
   * the dashboard's round free-class mark beside the two apps; on phones a full-width row like theirs.
   */
  videoOnly?: boolean;
}) {
  const subjects = [...view.stream.group, ...view.stream.compulsory];
  const mine = items.filter((i) => subjects.some((s) => s.id === i.subject));
  const [kind, setKind] = useState<Kind | "new">("video");
  const [subject, setSubject] = useState<string | null>(null);
  const sheet = useRef<HTMLDialogElement>(null);

  const page = (i: FreeShelfItem, keepAs: boolean) => `/${lang}/subject/${i.paperId}?${keepAs ? segment : segment.replace(/&as=[^&]*/, "")}`;
  // A guest's tap asks for the login (the page's pop-up catches the link), then goes to the item's paper.
  const hrefOf = (i: FreeShelfItem) => (signedIn ? page(i, true) : `/${lang}/login?next=${encodeURIComponent(page(i, false))}`);
  // The items come newest first; the dated ones lead.
  const ofKind = (k: Kind | "new") => (k === "new" ? mine.filter((i) => i.at).slice(0, NEW_IN_SHEET) : mine.filter((i) => i.kind === k));

  function open(k: Kind | "new") {
    setKind(k);
    setSubject(null);
    lockScroll(true);
    sheet.current?.showModal();
  }
  const close = () => sheet.current?.close();

  // With the offers on top, a folder with nothing in it (suggestions, until the team has them) stays out.
  const shown = (routineHref ? KINDS : KINDS.filter((k) => k.kind !== "routine" && (!top || ofKind(k.kind).length > 0))).filter(
    (k) =>
      (!notesWithSuggestions || k.kind !== "suggestion") &&
      !(routineTop && k.kind === "routine") &&
      (!!practice || !LINK_KINDS.includes(k.kind)) &&
      !(videoOnly && (k.kind === "quiz" || k.kind === "note" || k.kind === "suggestion")),
  );
  // CT171: the notes' folder holds the suggestions too (none in the data yet, so its count is the notes').
  const nameOf = (k: Kind) => (notesWithSuggestions && k === "note" ? l.homeFreeNoteSuggestion : kindOf(k).label(l));
  const two = phoneTwo && shown.length > 2;
  const inSheet = ofKind(kind).filter((i) => !subject || i.subject === subject);
  // The designer's call: the videos' sheet holds folders (the team's collections), not a list of single videos.
  const videoFolders = videoOnly && kind === "video" ? l.homeVideoFolders : null;
  const chip = (key: string, on: boolean, label: string, pick: () => void) => (
    <button
      key={key}
      type="button"
      aria-pressed={on}
      onClick={pick}
      className={cn(
        "h-8 shrink-0 rounded-full border px-3 text-sm font-semibold",
        on ? "border-brand bg-brand-soft text-brand-text" : "border-border bg-surface text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
  const sheetSubjects = videoFolders ? [] : subjects.filter((s) => ofKind(kind).some((i) => i.subject === s.id));

  // CT186: the new uploads under a line per day.
  const dayOf = (iso: string) => {
    const rel = fmt.relativeDay(iso);
    return rel === "today" ? l.homeOfferToday : rel === "yesterday" ? l.homeOfferYesterday : fmt.date(iso);
  };
  const rows =
    kind === "new"
      ? inSheet.flatMap((i, n) => {
          const day = dayOf(i.at!);
          return n === 0 || dayOf(inSheet[n - 1].at!) !== day
            ? [
                <li key={`day-${i.id}`} className="px-2 pt-3 pb-1 text-xs font-semibold text-subtle first:pt-1">
                  {day}
                </li>,
                row(i),
              ]
            : [row(i)];
        })
      : videoFolders
        ? videoFolders.map(folderRow)
        : inSheet.map(row);

  // As the "বার্ষিক পরীক্ষার Revision Class" upload row: a round, filled folder in the warning tint.
  function folderRow(name: string) {
    return (
      <li key={name} className="flex items-center gap-3 rounded-md px-2 py-2.5 sm:gap-4">
        <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full border border-warning/25 bg-warning-soft text-warning">
          <Folder className="size-6 fill-current" />
        </span>
        <span className="min-w-0 flex-1 font-semibold">{name}</span>
        <ChevronRight className="size-5 shrink-0 text-subtle" aria-hidden />
      </li>
    );
  }

  function row(i: FreeShelfItem) {
    return (
      <li key={i.id}>
        <Link href={hrefOf(i)} onClick={close} className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-raised">
          <KindIcon kind={i.kind} />
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="line-clamp-2 text-sm leading-snug font-semibold">{i.title}</span>
            <span className="text-xs text-subtle">
              {i.paper} · {fill(l.homeFreeChapter, { n: fmt.number(i.chapter) })}
            </span>
          </span>
          {!signedIn && <Lock className="mt-1 size-4 shrink-0 text-subtle" aria-label={l.homeFolderLocked} />}
        </Link>
      </li>
    );
  }

  return (
    <OpenNewUploads.Provider value={newSheet ? () => open("new") : null}>
      <Card as="section" aria-labelledby="home-free-title" className="grid content-start gap-5 p-5 sm:p-6">
        <header className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="home-free-title" className="type-title">
              {l.homeFreeTitle}
            </h2>
            {!top && <Sample>{l.homeSample}</Sample>}
            {routineTop && routineHref && (
              <Button href={routineHref} size="sm" variant="secondary" className="ml-auto">
                <CalendarDays className="size-4" aria-hidden />
                {l.homeFreeRoutine}
              </Button>
            )}
          </div>
          {!routineTop && <p className="text-sm text-muted">{top ? l.homeFreeLeadAll : l.homeFreeLead}</p>}
        </header>

        {top}
        {top && (
          <div className={cn("-mb-2 flex items-center gap-2", noRule ? "pt-1" : "border-t border-border pt-5")}>
            {/* CT245 (v6): "আরও যা ফ্রি থাকছে", what else is free after the classes and uploads above. */}
            <h3 className="text-sm font-semibold text-muted">{moreFree ? l.homeFreeMore : l.homeFreeContent}</h3>
            {samples && <Sample>{l.homeSample}</Sample>}
          </div>
        )}

        <ul
          className={cn(
            // CT189: fixed columns from the left, as many as fit before wrapping.
            leftRow
              ? "grid grid-cols-3 gap-3 sm:grid-cols-[repeat(auto-fill,7rem)] sm:gap-4"
              : // CT185: three folders sit in one row on phones too.
                two && shown.length === 3
                ? "grid grid-cols-3 gap-3 sm:gap-4"
                : two
                  ? cn("grid grid-cols-2 gap-x-4 gap-y-5 sm:gap-4", shown.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-4")
                  : cn(
                      "grid gap-2 sm:gap-4",
                      shown.length === 5 ? "grid-cols-5" : shown.length === 3 ? "grid-cols-3" : shown.length === 2 ? "grid-cols-2" : "grid-cols-4",
                    ),
          )}
        >
          {shown.map(({ kind: k }, i) => {
            const list = ofKind(k);
            // The odd one out at the end takes the row, centred.
            const lone = !leftRow && two && shown.length % 2 === 1 && shown.length !== 3 && i === shown.length - 1;
            return (
              <li
                key={k}
                className={cn(
                  lone && "max-sm:col-span-2 max-sm:mx-auto max-sm:w-1/2",
                  appIcons && practice && (k === "exam" || k === "tenten") && "max-sm:col-span-full",
                  videoOnly && k === "video" && "max-sm:col-span-full",
                )}
              >
                {practice && (k === "exam" || k === "tenten") ? (
                  <>
                    {/* CT243: on phones each app is a full-width row: its icon, the name, and a chevron, one under the other. */}
                    {appIcons && (
                      <AppRow
                        icon={APP_ICON[k]}
                        name={nameOf(k)}
                        badge={k === "exam" ? l.homeFreeExamBadge : l.homeFreeTenTenBadge}
                        href={practice[k]}
                        className="sm:hidden"
                      />
                    )}
                    <div className={cn(appIcons && "max-sm:hidden")}>
                      <TypeFolder
                        kind={k}
                        name={nameOf(k)}
                        badge={k === "exam" ? l.homeFreeExamBadge : l.homeFreeTenTenBadge}
                        href={practice[k]}
                        tight={!two && shown.length === 5}
                        big={two}
                        art={
                          appIcons ? (
                            // CT242: TenTen's own icon (Figma "TenTen", node 5120:20) and SuperPrep's mark in the same rounded square (40% corners).
                            <Image src={APP_ICON[k]} alt="" width={64} height={64} className="size-14 sm:size-16" />
                          ) : undefined
                        }
                      />
                    </div>
                  </>
                ) : k === "routine" ? (
                  <TypeFolder
                    kind={k}
                    name={nameOf(k)}
                    badge={l.homeFreeRoutineBadge}
                    href={routineHref}
                    tight={!two && shown.length === 5}
                    big={two}
                  />
                ) : videoOnly && k === "video" ? (
                  <>
                    {/* CT249: the videos as the dashboard's free-class mark (its side rail's "ফ্রি ক্লাস"); a row on phones like the apps'. */}
                    <AppRow
                      icon={FREE_CLASS_ICON}
                      name={nameOf(k)}
                      badge={fill(l.homeFreeCount, { n: fmt.number(l.homeVideoFolders.length) })}
                      onOpen={() => open(k)}
                      className="sm:hidden"
                    />
                    <div className="max-sm:hidden">
                      <TypeFolder
                        kind={k}
                        name={nameOf(k)}
                        badge={fill(l.homeFreeCount, { n: fmt.number(l.homeVideoFolders.length) })}
                        onOpen={() => open(k)}
                        art={<Image src={FREE_CLASS_ICON} alt="" width={64} height={64} className="size-14 sm:size-16" />}
                      />
                    </div>
                  </>
                ) : (
                  <TypeFolder
                    kind={k}
                    name={nameOf(k)}
                    badge={list.length ? fill(l.homeFreeCount, { n: fmt.number(list.length) }) : l.homeFreeSoon}
                    onOpen={list.length ? () => open(k) : undefined}
                    tight={!two && shown.length === 5}
                    big={two}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <dialog
          ref={sheet}
          aria-labelledby="home-free-sheet-title"
          // The page scrolls again unless another dialog (the login pop-up) is still open.
          onClose={() => !document.querySelector("dialog[open]") && lockScroll(false)}
          onClick={(e) => e.target === e.currentTarget && close()}
          className="mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-t-card border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/40 md:my-auto md:rounded-card"
        >
          <div className="flex max-h-[85dvh] flex-col">
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              {kind === "new" ? (
                <span aria-hidden className={cn("grid size-10 shrink-0 place-items-center rounded-full [&_svg]:size-5", softTones.brand)}>
                  <Sparkles />
                </span>
              ) : (
                <KindIcon kind={kind} big />
              )}
              <h3 id="home-free-sheet-title" className="type-subtitle">
                {kind === "new" ? l.homeOfferNew : nameOf(kind)}
                <span className="ml-2 text-sm font-semibold text-subtle">
                  {fill(l.homeFreeCount, { n: fmt.number(videoFolders?.length ?? inSheet.length) })}
                </span>
              </h3>
              <IconButton label={l.homeLoginClose} onClick={close} className="ml-auto">
                <X className="size-5" aria-hidden />
              </IconButton>
            </div>
            {sheetSubjects.length > 1 && (
              <div className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none]">
                {[{ id: null, name: l.homeFreeAll }, ...sheetSubjects].map((s) =>
                  chip(s.id ?? "all", subject === s.id, s.name, () => setSubject(s.id)),
                )}
              </div>
            )}
            <ul className="grid min-h-0 flex-1 content-start overflow-y-auto overscroll-contain border-t border-border px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {rows}
            </ul>
          </div>
        </dialog>
      </Card>
    </OpenNewUploads.Provider>
  );
}

const TONE_TEXT: Partial<Record<Tone, string>> = {
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  highlight: "text-highlight",
  brand: "text-brand-text",
};

/** CT242: the two apps' own icons, in the same rounded square. */
const APP_ICON = { exam: "/assets/superprep-app.svg", tenten: "/assets/tenten-app.svg" } as const;
/** CT249: the dashboard side rail's "ফ্রি ক্লাস" mark (`QuickRail`); CT250: in the apps' rounded square (corners 12 of 30), not a circle. */
const FREE_CLASS_ICON = "/assets/freeclass-app.svg";

/**
 * CT243: an app as a row on phones: its icon, the name and what it is, and a chevron saying it opens elsewhere. CT249:
 * with `onOpen` in place of `href`, a button (the videos' row opens their sheet).
 */
function AppRow({
  icon,
  name,
  badge,
  href,
  onOpen,
  className,
}: {
  icon: string;
  name: string;
  badge: string;
  href?: string;
  onOpen?: () => void;
  className?: string;
}) {
  const body = (
    <>
      <Image src={icon} alt="" width={40} height={40} className="size-10 shrink-0" />
      <span className="grid min-w-0 gap-0.5 text-start">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="truncate text-xs text-subtle">{badge}</span>
      </span>
      <ChevronRight className="ms-auto size-5 shrink-0 text-subtle" aria-hidden />
    </>
  );
  const cls = cn("flex w-full items-center gap-3 rounded-md border border-border bg-surface p-3 press hover:bg-raised", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={cls}>
      {body}
    </button>
  );
}

/**
 * A folder for one kind, as a file manager draws one (the designer's direction): a flat folder in the kind's colour with
 * its icon on the front, the name and count under it. Plain on purpose, so it doesn't echo the subject folders below.
 * On hover the front leans back a little, as if opening.
 */
function TypeFolder({
  kind,
  name,
  badge,
  onOpen,
  href,
  tight = false,
  big = false,
  art,
}: {
  kind: Kind;
  name: string;
  badge: string;
  onOpen?: () => void;
  /** CT162 (v57): a folder that is a link (the full routine). */
  href?: string;
  /** Five in a row: smaller names on phones. */
  tight?: boolean;
  /** CT170: as large on phones as from `sm`. */
  big?: boolean;
  /** CT240: an app's own mark in place of the folder, in the folder's box so the names line up. */
  art?: ReactNode;
}) {
  const { Icon, tone } = kindOf(kind);
  const active = Boolean(onOpen || href);
  const className = cn(
    "group/folder grid w-full justify-items-center gap-2 rounded-md px-1 py-2 text-center",
    active && "cursor-pointer hover:bg-raised",
  );
  const body = (
    <>
      <span
        aria-hidden
        className={cn(
          "relative block aspect-[6/5] w-full",
          big ? "max-w-24" : "max-w-20 sm:max-w-24",
          active ? TONE_TEXT[tone] : "text-subtle opacity-60",
        )}
      >
        {art && (
          <span className="absolute inset-0 grid place-items-center transition-transform duration-200 ease-out group-hover/folder:-translate-y-0.5 group-hover/folder:scale-105 motion-reduce:transition-none">
            {art}
          </span>
        )}
        <svg viewBox="0 0 60 50" className={cn("absolute inset-0 size-full overflow-visible", art && "hidden")}>
          {/* The back with its tab. */}
          <path
            d="M3 7a4 4 0 0 1 4-4h13.5a4 4 0 0 1 3 1.3L27 8h26a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"
            fill="currentColor"
            opacity="0.45"
          />
          {/* The front, leaning back on hover. */}
          <path
            d="M3 17a4 4 0 0 1 4-4h46a4 4 0 0 1 4 4v27a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"
            fill="currentColor"
            className="origin-bottom transition-transform duration-200 ease-out [transform-box:fill-box] group-hover/folder:[transform:skewX(-8deg)_scaleY(0.94)] motion-reduce:transition-none"
          />
        </svg>
        <Icon
          className={cn(
            art && "hidden",
            "absolute top-[62%] left-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 text-on-fill",
            kind === "video" && "fill-current",
          )}
        />
      </span>
      <span className="grid gap-0.5">
        <span className={cn("text-sm font-semibold", tight && "max-sm:text-xs")}>{name}</span>
        <span className="text-xs text-subtle">{badge}</span>
      </span>
    </>
  );
  if (href)
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  if (onOpen)
    return (
      <button type="button" onClick={onOpen} className={className}>
        {body}
      </button>
    );
  return <div className={className}>{body}</div>;
}
