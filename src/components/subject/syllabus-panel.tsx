"use client";

import { ChevronDown, ClipboardCheck, History, List, Lock, MonitorPlay, Search, X } from "lucide-react";
import Link from "next/link";
import { flushSync } from "react-dom";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Segmented } from "@/design-system/molecules/segmented";
import { IconButton } from "@/design-system/atoms/icon-button";
import { Badge } from "@/design-system/atoms/badge";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { useLabAt } from "@/lib/lab";
import { ClassBadges } from "./class-badges";
import { ItemIcon, NowPlaying, SourceTag, StatusMark } from "./item-icon";
import { matchesFilter, scopeChapter } from "./filters";
import { itemHref, type Filter, type PanelChapter, type PanelClass, type PanelPair, type PanelRow } from "./types";

type Labels = Dictionary["syllabus"];

type Props = {
  chapters: PanelChapter[];
  currentId: string | null;
  /** Page path, and the query string to keep on item links. */
  path: string;
  keep: string;
  lang: Locale;
  /** "৮/১২০ সম্পন্ন" for the whole paper. */
  paperDone: string;
  labels: Labels;
  /** Inside the phone's playlist sheet: a close button, its own scrolling, and links that close it. */
  sheet?: { onClose: () => void; closeLabel: string };
  /** `page`: the whole page when nothing is open yet (no sticky box, no inner scroll). `rail`: beside the player. */
  layout?: "rail" | "page";
  id?: string;
  className?: string;
};

/** The same marks the list's rows use: the live tag's red dot, the archive tag's clock, the exam clipboard. */
/** Under the phone's back-and-title bar (FocusBar): 56px plus the notch. */
const UNDER_FOCUS_BAR = "top-[calc(3.5rem+env(safe-area-inset-top))]";

const filterIcons: Record<Filter, ReactNode> = {
  all: <List className="size-4" aria-hidden />,
  live: <span aria-hidden className="mx-1 size-2 rounded-full bg-live" />,
  archive: <History className="size-4" aria-hidden />,
  material: <ClipboardCheck className="size-4" aria-hidden />,
};

const chapterRows = (c: PanelChapter): PanelRow[] => [...c.notes, ...c.pairs.flatMap((p) => [...p.classes, ...p.materials]), ...c.others];
const chapterOf = (chapters: PanelChapter[], id: string | null) => (id ? chapters.find((c) => chapterRows(c).some((r) => r.id === id)) : undefined);

/*
 * The syllabus beside the player.
 *  - One chapter open at a time; its header sticks while you scroll, so you always know
 *    where you are, and the chapters after it stay one tap away.
 *  - In "সব", a class shows its slide and exam indented beneath it. A type filter or a
 *    search switches to flat lists (a slide without its class needs its full title).
 *  - Live and archive classes share one list: last year's recording of a topic sits right under
 *    this batch's class on it, and the two share one thread of materials. Every class row
 *    carries a live or archive tag and archive videos have a grey icon, so the two never look
 *    alike; archive materials carry the tag too.
 */
export function SyllabusPanel({ chapters, currentId, path, keep, lang, paperDone, labels: s, sheet, layout = "rail", id, className }: Props) {
  const fmt = createFormatter(lang, 0);
  // Lab `class` v24 (P117): lighter rows (no live tag) and the filter as সব · অনলাইন · আর্কাইভ.
  const light = useLabAt("class", 24);
  // Lab `class` v28 (P121): a class row's state as pills on its date line instead of the mark at its end.
  const badges = useLabAt("class", 28);
  // Lab `class` v33 (P126): no tick or circle at any row's end; a class's state is in its pills.
  const noMarks = useLabAt("class", 33);
  // Lab `class` v42 (P135): the chapters' notes move up, into the paper's other resources (PaperGroups).
  const notesUp = useLabAt("class", 42);
  // Lab `class` v47 (P140): under অনলাইন each class keeps its lecture slide and exam.
  const liveMaterials = useLabAt("class", 47);
  const focusBar = useLabAt("class", 48);
  // Lab `concept` v18 (P171): how many classes a chapter has (by the chevron since v19, P172). Since v20 (P173):
  // সব counts the batch's and the archive's together, অনলাইন only the batch's, আর্কাইভ only the archive's.
  const classCount = useLabAt("concept", 18);
  const examsUp = useLabAt("concept", 22);
  const counts = (r: PanelClass) => (filter === "all" ? true : filter === "live" ? !r.archive : filter === "archive" ? r.archive : false);
  const classesIn = (c: PanelChapter) => c.pairs.reduce((n, p) => n + p.classes.filter(counts).length, 0);
  const currentChapter = chapterOf(chapters, currentId);
  // Every chapter starts closed, so the student picks one; with an item open, its chapter is open.
  const [open, setOpen] = useState<string | null>(currentChapter?.id ?? null);
  const [filter, setFilter] = useState<Filter>("all");
  const page = layout === "page" && !sheet;
  const [search, setSearch] = useState("");
  // Search matters less than the type filter, so it sits beside the chips: a field on the wide list
  // page, a search icon where room is short (beside the player, the phone's sheet, phones). The
  // icon opens the field across the row in place of the chips; it stays open while it holds text.
  const [searching, setSearching] = useState(false);
  const searchOpen = searching || search !== "";
  const inputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);
  // The page and the phone's sheet can both show the panel, so ids are per instance.
  const uid = useId();
  const searchId = `${uid}search`;
  const titleId = `${uid}title`;

  // Following a link elsewhere on the page (e.g. "পরের ক্লাস") opens that item's chapter.
  const [shownId, setShownId] = useState(currentId);
  if (shownId !== currentId) {
    setShownId(currentId);
    if (currentChapter) setOpen(currentChapter.id);
  }

  // Bring the open item into view inside the panel (desktop and the sheet, where the panel scrolls on its own).
  useEffect(() => {
    const box = scrollRef.current;
    const el = currentRef.current;
    if (!box || !el || box.scrollHeight <= box.clientHeight) return;
    const offset = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (offset < 64 || offset > box.clientHeight - 64) box.scrollTop += offset - box.clientHeight / 3;
  }, [currentId]);

  const openSearch = () => {
    setSearching(true);
    // The field mounts (or shows) on this render; focus it on the next frame.
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const closeSearch = () => {
    setSearch("");
    setSearching(false);
    // Back to the icon; on the wide list page (no icon there) the field keeps focus.
    requestAnimationFrame(() => {
      const icon = searchButtonRef.current;
      (icon?.offsetParent ? icon : inputRef.current)?.focus();
    });
  };

  // Opening or closing a chapter keeps its header where it was clicked: closing a long chapter (or
  // opening one below an open one) would otherwise pull the page up and lose the student's place.
  // The list scrolls on its own beside the player on wide screens; elsewhere the page scrolls.
  const toggleChapter = (header: HTMLElement, next: string | null) => {
    const before = header.getBoundingClientRect().top;
    flushSync(() => setOpen(next));
    const shift = header.getBoundingClientRect().top - before;
    if (Math.abs(shift) < 1) return;
    const box = scrollRef.current;
    const scroller = box && getComputedStyle(box).overflowY === "auto" ? box : window;
    scroller.scrollBy({ top: shift, behavior: "instant" });
  };

  const q = search.trim().toLowerCase();
  // Exams and notes, or a search, list flat; the source filters keep the chapter layout.
  const flat = filter === "material" || q !== "";
  const matches = (r: PanelRow) => matchesFilter(r, filter, q, liveMaterials);

  const href = (id: string) => itemHref(path, keep, id);
  // Opening an item from the list adds one history entry; switching items replaces it, so the
  // browser's back goes from any item to the list, then to where the student came from.
  const replace = currentId !== null;

  const row = (r: PanelRow, variant: "class" | "material" | "flat") => {
    const current = r.id === currentId;
    const material = variant === "material";
    const pills = badges && r.kind === "video" && !material && !r.access;
    // Outside the batch: the free class stands out in green with its tag where the others carry a lock (a class to buy or a
    // material to log in for).
    const locked = r.access === "buy" || r.access === "login";
    const free = r.access === "free";
    const freeTag = free && (
      <Badge tone="success" size="sm" className="shrink-0">
        {s.freeBadge}
      </Badge>
    );
    return (
      <Link
        ref={current ? currentRef : undefined}
        href={href(r.id)}
        replace={replace}
        aria-current={current ? "page" : undefined}
        onClick={sheet?.onClose}
        title={material ? r.title : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-2 transition-colors",
          material ? "min-h-10 py-1.5" : "min-h-14 py-2",
          current ? "bg-brand-soft" : free ? "bg-success-soft hover:brightness-95" : "hover:bg-raised",
        )}
      >
        {material ? <ItemIcon kind={r.kind} size="sm" /> : <ItemIcon kind={r.kind} archive={r.archive} />}
        <span className="grid min-w-0 flex-1">
          {variant === "class" && (
            <span className={cn("line-clamp-2 text-sm font-semibold", current && "text-brand-text", locked && "text-muted")}>
              {/* The archive numbers its classes on its own, so its "ক্লাস ১" would clash with the live one; the tag says enough. */}
              {!r.archive && <span className="text-subtle">{(r as PanelClass).label}: </span>}
              {r.title}
            </span>
          )}
          {material && (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className={cn("truncate text-sm", current ? "font-semibold text-brand-text" : "text-muted")}>
                {r.kindLabel}
                {r.meta && <span className="text-subtle"> · {r.meta}</span>}
              </span>
              {r.archive && <SourceTag archive label={s.archiveBadge} className="shrink-0" />}
            </span>
          )}
          {variant === "flat" && <span className={cn("line-clamp-2 text-sm font-semibold", current && "text-brand-text")}>{r.title}</span>}
          {!material && (
            <span className={cn("flex min-w-0 items-center gap-1.5 text-xs text-subtle", pills && "flex-wrap gap-y-1")}>
              {/* Every class says where it comes from ("লাইভ ক্লাস" names the class itself, so materials only get the archive tag). */}
              {(r.archive || (r.kind === "video" && !light)) && <SourceTag archive={r.archive} label={r.archive ? s.archiveBadge : s.liveBadge} />}
              <span className="truncate">
                {variant === "flat" && r.kind !== "video" && (
                  <>
                    {r.kindLabel}
                    {r.meta && " · "}
                  </>
                )}
                {r.meta}
              </span>
              {pills && <ClassBadges id={r.id} status={r.status} progress={r.progress} labels={s.badges} />}
            </span>
          )}
        </span>
        {current ? (
          <NowPlaying label={s.nowPlaying} />
        ) : locked ? (
          <Lock className="size-4 shrink-0 text-subtle" role="img" aria-label={r.access === "buy" ? s.lockedBuyLabel : s.lockedLabel} />
        ) : free ? (
          freeTag
        ) : (
          !pills && !noMarks && <StatusMark status={r.status} progress={r.progress} label={r.statusLabel} />
        )}
      </Link>
    );
  };

  /**
   * A lesson (one topic): the live class with its own materials on a thin line under it, then
   * last year's recording(s) of the same topic, each with its own materials. Lessons are
   * separated by a divider, so what belongs together reads without boxes.
   */
  const pairBlock = (p: PanelPair) => (
    <li key={p.id} className="grid gap-0.5 py-1.5">
      {p.classes.map((c) => (
        <div key={c.id}>
          {row(c, "class")}
          {c.materials.length > 0 && (
            // Joined to its class by a thin line: always visible, but clearly secondary.
            <ul className="mb-1 ml-[23px] border-l border-border pl-2">
              {c.materials.map((m) => (
                <li key={m.id}>{row(m, "material")}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </li>
  );

  const subList = (heading: string, rows: PanelRow[]) =>
    rows.length > 0 && (
      <section className="grid gap-0.5">
        <h4 className="px-2 pt-1 text-xs font-semibold text-subtle">{heading}</h4>
        <ul className="grid gap-0.5">
          {rows.map((r) => (
            <li key={r.id}>{row(r, "flat")}</li>
          ))}
        </ul>
      </section>
    );

  const chapterBody = (chapter: PanelChapter) => {
    if (flat) {
      const rows = chapterRows(chapter).filter(matches);
      return (
        <ul className="grid gap-0.5">
          {rows.map((r) => (
            <li key={r.id}>{row(r, "flat")}</li>
          ))}
        </ul>
      );
    }
    const c = scopeChapter(chapter, filter, liveMaterials);
    if (chapterRows(c).length === 0) {
      const empty = filter === "live" ? s.liveNone : filter === "archive" ? s.archiveNone : s.chapterEmpty;
      return <p className="px-2 py-3 text-sm text-muted">{empty}</p>;
    }
    return (
      <div className="grid gap-2">
        {!notesUp && subList(s.chapterNotes, c.notes)}
        {filter === "all" && c.liveCount === 0 && c.pairs.length > 0 && <p className="px-2 text-sm text-muted">{s.liveNone}</p>}
        {c.pairs.length > 0 && <ul className="divide-y divide-border">{c.pairs.map(pairBlock)}</ul>}
        {/* Lab `concept` v22 (P175): the chapter's own exams moved to "এই বিষয়ের অন্যান্য রিসোর্স"; anything else stays here. */}
        {subList(s.others, examsUp ? c.others.filter((r) => r.kind !== "exam") : c.others)}
      </div>
    );
  };

  const visible = flat
    ? chapters.map((c) => ({ c, n: chapterRows(c).filter(matches).length })).filter((x) => x.n > 0)
    : chapters.map((c) => ({ c, n: 0 }));

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col bg-surface",
        sheet
          ? "h-full min-h-0"
          : page
            ? "rounded-card border border-border"
            : "rounded-card border border-border lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]",
        className,
      )}
    >
      <div className="grid gap-3 border-b border-border p-4">
        {/* The title row also holds the search: a field on the wide list page, an icon where room is
            short, which opens the field across this row (the title stays for screen readers). */}
        <div className="flex min-h-10 items-center gap-3">
          <h2 id={titleId} className={cn("type-subtitle", searchOpen && (page ? "max-sm:sr-only" : "sr-only"))}>
            {s.title}
          </h2>
          {/* On the list page the header right above already shows the paper's progress. */}
          {!page && !searchOpen && <span className="text-sm text-subtle tabular-nums">{paperDone}</span>}
          {!searchOpen && (
            <IconButton
              ref={searchButtonRef}
              label={s.search}
              variant="subtle"
              size="md"
              onClick={openSearch}
              className={cn("ml-auto shrink-0", page && "sm:hidden", sheet && "-mr-1")}
            >
              <Search className="size-5" aria-hidden />
            </IconButton>
          )}
          <label
            htmlFor={searchId}
            className={cn(
              "h-10 min-w-0 items-center gap-2 rounded-full border border-border bg-raised px-3.5 text-sm transition-[border-color,box-shadow] hover:border-border-strong focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20",
              searchOpen ? "flex flex-1" : page ? "hidden sm:flex" : "hidden",
              page && "sm:ml-auto sm:w-56 sm:flex-none",
            )}
          >
            <Search className="size-4 shrink-0 text-subtle" aria-hidden />
            <input
              ref={inputRef}
              id={searchId}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && searchOpen && (e.preventDefault(), closeSearch())}
              onBlur={() => search === "" && setSearching(false)}
              placeholder={s.search}
              aria-label={s.search}
              className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-subtle focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {searchOpen && (
              <button
                type="button"
                // Keep focus in the field until the click lands, so the empty field doesn't close on blur first.
                onMouseDown={(e) => e.preventDefault()}
                onClick={closeSearch}
                aria-label={s.clearSearch}
                className="-mr-1.5 grid size-7 place-items-center rounded-full text-subtle hover:bg-border/60 hover:text-text"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </label>
          {sheet && (
            <IconButton label={sheet.closeLabel} size="md" onClick={sheet.onClose} className="-my-2 -mr-2 self-center">
              <X className="size-5" aria-hidden />
            </IconButton>
          )}
        </div>
        {/* One control, not a row of buttons: a track with the chosen filter raised, across the full width on phones (P93) and
            as wide as its labels on wide screens (P116). Scrolls sideways if it can't fit. */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
          <Segmented
            variant="segment"
            track="solid"
            emphasis="strong"
            fill="phone"
            label={s.filterLabel}
            value={filter}
            onChange={(id) => setFilter(id as Filter)}
            // পরীক্ষা ও নোট ("material") is hidden for now (P92); its filter logic stays for when it returns.
            items={(["all", "live", "archive"] as const).map((id) =>
              light && id === "live"
                ? { id, label: s.filter.online, icon: <MonitorPlay className="size-4" aria-hidden /> }
                : { id, label: s.filter[id], icon: filterIcons[id] },
            )}
          />
        </div>
      </div>

      <div ref={scrollRef} className={cn("min-h-0 flex-1 overscroll-contain", sheet ? "overflow-y-auto" : !page && "lg:overflow-y-auto")}>
        {visible.length === 0 && <p className="p-6 text-center text-sm text-muted">{s.noMatches}</p>}
        <ul className="divide-y divide-border">
          {visible.map(({ c, n }) => {
            // Searching or filtering shows every chapter with matches; otherwise one at a time.
            const isOpen = flat || open === c.id;
            const bodyId = `${uid}${c.id}-body`;
            return (
              <li key={c.id} className="group/ch">
                {/* The last closed chapter sits on the card's bottom edge: its title takes the card's curve,
                    or its white would square off the rounded corners. */}
                <h3
                  className={cn(
                    "sticky z-10 bg-surface",
                    // P176: with the phone's back-and-title bar (lab `class` v48, 56px plus the notch) in place of the 64px header,
                    // the chapter sticks right under it; at 64px it left an 8px gap the rows showed through.
                    sheet
                      ? "top-0"
                      : page
                        ? focusBar
                          ? `${UNDER_FOCUS_BAR} lg:top-16`
                          : "top-16"
                        : focusBar
                          ? `${UNDER_FOCUS_BAR} lg:top-0`
                          : "top-16 lg:top-0",
                    !sheet && !isOpen && "group-last/ch:rounded-b-lg",
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={bodyId}
                    disabled={flat}
                    onClick={(e) => toggleChapter(e.currentTarget, isOpen ? null : c.id)}
                    className={cn(
                      // Only the background fades: the border appears with the open state, and fading its
                      // colour would start from the default (black) and flash a dark line.
                      "flex w-full items-center gap-3 px-4 py-3 text-left transition-[background-color] disabled:cursor-default",
                      isOpen ? "border-b border-border bg-raised" : "hover:bg-raised",
                      !sheet && !isOpen && "group-last/ch:rounded-b-lg",
                    )}
                  >
                    <span className="grid min-w-0 flex-1">
                      <span className="text-xs font-medium text-subtle">{c.label}</span>
                      <span className={cn("text-sm font-semibold", isOpen ? "line-clamp-2" : "truncate")}>{c.title}</span>
                    </span>
                    {/* No per-chapter progress (P95): the paper's progress shows once, above. */}
                    {flat && (
                      <Badge tone="outline" size="sm" className="shrink-0">
                        {fill(s.matches, { n: fmt.number(n) })}
                      </Badge>
                    )}
                    {/* Lab `concept` v19 (P172): the count sits by the chevron, both in the middle of the row's two lines, so
                        "অধ্যায় ১" reads alone again (v18 had "অধ্যায় ১ · ৬টি ক্লাস" on one line). */}
                    {!flat && classCount && classesIn(c) > 0 && (
                      <span className="shrink-0 text-xs text-subtle tabular-nums">{fill(s.chapterClasses, { n: fmt.number(classesIn(c)) })}</span>
                    )}
                    {!flat && <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform", isOpen && "rotate-180")} aria-hidden />}
                  </button>
                </h3>
                {isOpen && (
                  <div id={bodyId} className="px-2 py-2">
                    {chapterBody(c)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
