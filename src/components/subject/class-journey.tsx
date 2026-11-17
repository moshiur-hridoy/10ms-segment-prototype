"use client";

import { Atom, Bookmark, Check, ChevronDown, ChevronRight, ExternalLink, Inbox, ListChecks, NotebookPen, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useId, useState, useSyncExternalStore } from "react";
import { Card } from "@/design-system/atoms/card";
import { Segmented } from "@/design-system/molecules/segmented";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SyllabusItemKind } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { useLabAt } from "@/lib/lab";
import { ClassSteps } from "./class-steps";
import type { Attendance } from "./demo-attendance";
import { ItemIcon, NowPlaying } from "./item-icon";
import { removeNote, useNotes, type ClassNote } from "./notes";
import { usePlayback } from "./playback";
import { partAt, type VideoPart } from "./player-parts";

export type JourneyTask = {
  id: string;
  kind: SyllabusItemKind;
  archive: boolean;
  label: string;
  meta: string;
  href: string;
  done: boolean;
};

type JourneyTab = "tasks" | "timeline";
const tabs = new Map<string, JourneyTab>();
const tabListeners = new Set<() => void>();
const subscribeTab = (l: () => void) => {
  tabListeners.add(l);
  return () => void tabListeners.delete(l);
};
/** The class card's open tab for this item (the tasks first, P84), the same in both copies of the card. */
function useJourneyTab(item: string) {
  const tab = useSyncExternalStore(
    subscribeTab,
    () => tabs.get(item) ?? "tasks",
    () => "tasks" as JourneyTab,
  );
  const set = (t: JourneyTab) => {
    tabs.set(item, t);
    for (const l of tabListeners) l();
  };
  return [tab, set] as const;
}

/** With more parts than this, the watched ones fold into one row and only the next few show. */
const FOLD_OVER = 5;
/** Parts shown after the playing one while the rest are folded. */
const AHEAD = 2;

type Labels = {
  journey: Dictionary["syllabus"]["journey"];
  notes: Dictionary["syllabus"]["notes"];
  parts: Dictionary["syllabus"]["parts"];
  tasks: Dictionary["syllabus"]["tasks"];
  nowPlaying: string;
  kind?: Dictionary["syllabus"]["kind"];
};

/*
 * Lab `class` v14 (P66): the open class as one path in one card. The video's parts (time, topic) on a
 * line, the watched ones ticked and the playing one on soft green with its progress; then "ক্লাস শেষে"
 * and the class's slide and exam as a checklist. Long classes fold: the watched parts into one row, and
 * all but the next two after the playing part into "আরও ৬টি অংশ", so the tasks always show. The
 * teacher inbox is a one-line link under the card.
 */
export function ClassJourney({
  id,
  parts,
  tasks,
  item,
  noteKey,
  locale,
  labels: l,
  videoPct = 0,
  attendance = null,
  className,
}: {
  /** Tells the phone's copy (under the title) from the wide screen's (in the column). */
  id: string;
  parts: VideoPart[];
  tasks: JourneyTask[];
  /** The open item's id: the chosen tab is remembered per item, for both copies of the card. */
  item: string;
  /** Lab `class` v15 (P67): the video's item id; its marks and notes join the path at their times. */
  noteKey: string | null;
  locale: Locale;
  labels: Labels;
  /** 0–100, how much of the video the student has watched (lab `concept` v2). */
  videoPct?: number;
  /** How the student attended the live class (lab `concept` v7); null for a recording. */
  attendance?: Attendance | null;
  className?: string;
}) {
  const { phase, time, seekTo } = usePlayback();
  const fmt = createFormatter(locale, 0);
  const [openSeen, setOpenSeen] = useState(false);
  const [openRest, setOpenRest] = useState(false);
  const list = [...parts].sort((a, b) => a.startSec - b.startSec);
  // Before the first play, only a resume point marks a part as current.
  const current = phase !== "idle" || time > 0 ? partAt(list, time) : undefined;
  const at = current ? list.indexOf(current) : -1;
  const fold = list.length > FOLD_OVER;
  // Folded: the watched parts (two or more) as one row, the playing part and the next two, then the rest as one row.
  const seen = fold && at >= 2 && !openSeen ? at : 0;
  const shownTo = fold && !openRest ? Math.max(at, 0) + AHEAD + 1 : list.length;
  const rest = list.length - shownTo;
  const titleId = `journey-title-${id}`;
  const notes = useNotes(noteKey);
  /** The marks and notes from `from` up to (not including) `to`, as rows on the path. */
  const notesIn = (from: number, to: number) =>
    noteKey
      ? notes
          .filter((n) => n.sec >= from && n.sec < to)
          .map((n) => <NoteRow key={n.id} note={n} item={noteKey} labels={l.notes} fmt={fmt} onJump={seekTo} />)
      : null;

  const rail = "relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2";
  // P84: two tabs, the tasks open first (the designer's choice); without tasks, only the timeline.
  // Shared by the phone's copy of the card and the wide screen's, so resizing keeps the same tab.
  const [tab, setTab] = useJourneyTab(item);
  const showing = tasks.length ? tab : "timeline";
  const empty = list.length === 0 && notes.length === 0;
  // Lab `class` v24 (P117): no timeline and no tabs; the slide and the exam are cards of their own,
  // like the teacher inbox and MCQ under them. v23 keeps the tabbed card at `?lab=class@23`.
  const light = useLabAt("class", 24);
  // Lab `class` v30 (P123): the timeline's notes and bookmarks come back as a card of their own.
  const notesCard = useLabAt("class", 30) && noteKey !== null && notes.length > 0;

  // The teacher inbox as its own card under the timeline (P79): questions go there, since a recording has no teacher to ask.
  // P104: homework, MCQ (in TenTen's place, P107) and the simulation follow in the same cards. All four wait for their pages (no links yet).
  const links = (
    [
      { label: l.journey.askTeacher, icon: Inbox, tone: "bg-info-soft text-info" },
      { label: l.journey.homework, icon: NotebookPen, tone: "bg-warning-soft text-warning" },
      { label: l.journey.mcq, icon: ListChecks, tone: "bg-highlight-soft text-highlight" },
      { label: l.journey.simulation, icon: Atom, tone: "bg-success-soft text-success" },
    ] as const
  ).map(({ label, icon: Icon, tone }) => (
    <Card key={label} as="a" href="#" radius="md" interactive className="flex min-h-14 items-center gap-3 px-3 py-2.5">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone)}>
        <Icon className="size-[1.125rem]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
    </Card>
  ));

  // Lab `class` v32 (P125): the arrow says what a card does. The teacher inbox and the simulation open
  // outside this page (an external-link mark); homework and MCQ hold several items and open in place,
  // like the notes card (a down arrow). Their items have no data yet, so they open on a plain line (§9).
  const v32 = useLabAt("class", 32);
  // Lab `class` v34 (P127): the slide and exam cards keep their arrow when done, no tick (like the syllabus, P126).
  const noTick = useLabAt("class", 34);
  const linkCard = (label: string, Icon: typeof Inbox, tone: string) => (
    <Card
      key={label}
      as="a"
      href="#"
      target="_blank"
      rel="noopener noreferrer"
      radius="md"
      interactive
      className="flex min-h-14 items-center gap-3 px-3 py-2.5"
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone)}>
        <Icon className="size-[1.125rem]" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
      <ExternalLink className="size-4 shrink-0 text-subtle" aria-hidden />
      <span className="sr-only">{l.journey.opensOutside}</span>
    </Card>
  );
  const links32 = [
    linkCard(l.journey.askTeacher, Inbox, "bg-info-soft text-info"),
    <FoldCard key="homework" icon={NotebookPen} tone="bg-warning-soft text-warning" title={l.journey.homework}>
      <p className="px-3 py-3 text-sm text-subtle">{l.journey.homeworkEmpty}</p>
    </FoldCard>,
    <FoldCard key="mcq" icon={ListChecks} tone="bg-highlight-soft text-highlight" title={l.journey.mcq}>
      <p className="px-3 py-3 text-sm text-subtle">{l.journey.mcqEmpty}</p>
    </FoldCard>,
    linkCard(l.journey.simulation, Atom, "bg-success-soft text-success"),
  ];

  // Lab `class` v44 (P137): the exam moves into the homework card, as its first row with the exam banner students
  // know from the app; the homework card takes the exam's old place under the slide, and the cards sit 8px apart.
  const hw = useLabAt("class", 44);
  const exams = hw ? tasks.filter((t) => t.kind === "exam") : [];
  const own = hw ? tasks.filter((t) => t.kind !== "exam") : tasks;
  const hwSub = exams.length
    ? [fill(l.journey.examCount, { n: fmt.number(exams.length) }), exams.length === 1 && exams[0].meta].filter(Boolean).join(" · ")
    : undefined;
  const hwCard = (
    <FoldCard key="homework" icon={NotebookPen} tone="bg-warning-soft text-warning" title={l.journey.homework} sub={hwSub}>
      {exams.length ? (
        <ol className="grid gap-0.5 p-1">
          {exams.map((t) => (
            <li key={t.id}>
              <Link href={t.href} replace className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors press hover:bg-raised">
                <Image src="/assets/homework-banner.svg" alt="" width={91} height={52} className="h-10 w-auto shrink-0 rounded-sm" />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate text-sm font-semibold">{t.label}</span>
                  {t.meta && <span className="truncate text-xs text-subtle">{t.meta}</span>}
                </span>
                <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-3 py-3 text-sm text-subtle">{l.journey.homeworkEmpty}</p>
      )}
    </FoldCard>
  );

  // Lab `class` v49 (P143): homework opens nothing in place; a tap goes straight to its exam (the first one not yet
  // done, else the first). Without an exam it keeps the fold with its "no homework yet" line.
  const hwDirect = useLabAt("class", 49);
  const hwExam = exams.find((t) => !t.done) ?? exams[0];
  const homework =
    hwDirect && hwExam ? (
      <Card key="homework" as={Link} href={hwExam.href} replace radius="md" interactive className="flex min-h-14 items-center gap-3 px-3 py-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-soft text-warning">
          <NotebookPen className="size-[1.125rem]" aria-hidden />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-semibold">{l.journey.homework}</span>
          {hwSub && <span className="truncate text-xs text-subtle">{hwSub}</span>}
        </span>
        <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
      </Card>
    ) : (
      hwCard
    );

  // Lab `concept` v2 (P151): the class's work as steps on one path, with the extras as a quiet row under it.
  const steps = useLabAt("concept", 2);
  if (steps && l.kind)
    return (
      <ClassSteps
        tasks={tasks}
        videoPct={videoPct}
        attendance={attendance}
        locale={locale}
        labels={{ journey: l.journey, kind: l.kind }}
        className={className}
      />
    );

  if (light) {
    return (
      <section aria-label={l.journey.afterClass} className={cn("grid", hw ? "gap-2" : "gap-3", className)}>
        {own.map((t) => (
          <Card key={t.id} as={Link} href={t.href} replace radius="md" interactive className="flex min-h-14 items-center gap-3 px-3 py-2.5">
            <ItemIcon kind={t.kind} archive={t.archive} round />
            <span className="grid min-w-0 flex-1">
              <span className="truncate text-sm font-semibold">{t.label}</span>
              {t.meta && <span className="truncate text-xs text-subtle">{t.meta}</span>}
            </span>
            {/* Done: a tick in place of the arrow, as in v23's checklist. */}
            {t.done && !noTick ? <Dot state="done" /> : <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />}
          </Card>
        ))}
        {hw && homework}
        {notesCard && <NotesCard notes={notes} item={noteKey} labels={l.notes} fmt={fmt} onJump={seekTo} />}
        {hw ? links32.filter((c) => c.key !== "homework") : v32 ? links32 : links}
      </section>
    );
  }

  return (
    <section aria-label={l.journey.title} className={cn("grid gap-3", className)}>
      <Card radius="md" className="p-2">
        {tasks.length > 0 ? (
          <div className="pt-0.5 pb-2">
            <Segmented
              label={l.journey.title}
              track="solid"
              fill
              value={showing}
              onChange={(v) => setTab(v as JourneyTab)}
              items={[
                // No red count on the tab (P100): the ticks and circles in the list say what is left.
                { id: "tasks", label: l.journey.afterClass },
                { id: "timeline", label: l.journey.title },
              ]}
            />
          </div>
        ) : (
          <h2 id={titleId} className="px-2 pt-1.5 pb-3 text-sm font-semibold">
            {l.journey.title}
          </h2>
        )}

        {showing === "tasks" ? (
          // The class's slide and exam as a checklist.
          <ol role="tabpanel" aria-label={l.journey.afterClass} className="grid gap-1">
            {tasks.map((t) => (
              <li key={t.id}>
                {/* P85: the item first, its done mark at the end (no path here, so no marker in front). */}
                <Link href={t.href} replace className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors press hover:bg-raised">
                  <ItemIcon kind={t.kind} archive={t.archive} size="sm" />
                  <span className="grid min-w-0 flex-1">
                    <span className={cn("truncate text-sm font-semibold", t.done && "text-muted")}>{t.label}</span>
                    <span className="truncate text-xs text-subtle">{t.meta}</span>
                  </span>
                  <Dot state={t.done ? "done" : "todo"} />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <ol role={tasks.length ? "tabpanel" : undefined} aria-label={tasks.length ? l.journey.title : undefined} className="relative grid gap-1">
            {/* The path: one line behind the dots, from the first row to the last. */}
            {!empty && <span aria-hidden className="absolute top-5 bottom-5 left-5 w-px -translate-x-1/2 bg-border" />}
            {empty && <li className="px-2 py-3 text-sm text-subtle">{l.journey.empty}</li>}

            {seen > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setOpenSeen(true)}
                  className={cn(
                    rail,
                    "w-full items-center rounded-md px-2 py-2.5 text-left text-sm text-subtle transition-colors press hover:bg-raised",
                  )}
                >
                  <Dot state="done" />
                  <span className="flex items-center gap-1">
                    {fill(l.journey.seen, { n: fmt.number(seen) })}
                    <ChevronDown className="size-4" aria-hidden />
                  </span>
                </button>
              </li>
            )}

            {list.slice(seen, shownTo).map((p, j) => {
              const i = seen + j;
              const on = i === at;
              return [
                <li key={p.startSec}>
                  <button
                    type="button"
                    aria-current={on || undefined}
                    aria-label={fill(l.parts.jump, { time: fmt.duration(p.startSec), title: p.title })}
                    onClick={() => seekTo?.(p.startSec)}
                    className={cn(
                      rail,
                      "w-full items-center rounded-md px-2 py-2.5 text-left transition-colors press",
                      on ? "bg-brand-soft" : "hover:bg-raised",
                    )}
                  >
                    <Dot state={on ? "now" : i < at ? "done" : "todo"} />
                    <span className="flex items-baseline gap-2.5">
                      <span className="min-w-11 shrink-0 text-xs font-semibold text-brand-text tabular-nums">{fmt.duration(p.startSec)}</span>
                      <span className={cn("line-clamp-2 min-w-0 flex-1 text-sm", i < at ? "text-muted" : "font-semibold")}>{p.title}</span>
                      {/* The playing part (P75): the syllabus's "now playing" bars at the end, still while the video is paused. */}
                      {on && <NowPlaying label={l.nowPlaying} paused={phase !== "playing"} className="self-center" />}
                    </span>
                  </button>
                </li>,
                // Before the first part (if it starts late), its own notes; then each part's.
                i === 0 ? notesIn(0, p.startSec) : null,
                notesIn(p.startSec, list[i + 1]?.startSec ?? Infinity),
              ];
            })}

            {/* Without parts, the notes are the path. */}
            {list.length === 0 && notesIn(0, Infinity)}

            {rest > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setOpenRest(true)}
                  className={cn(
                    rail,
                    "w-full items-center rounded-md px-2 py-2.5 text-left text-sm text-subtle transition-colors press hover:bg-raised",
                  )}
                >
                  <Dot state="more" />
                  <span className="flex items-center gap-1">
                    {fill(l.journey.more, { n: fmt.number(rest) })}
                    <ChevronDown className="size-4" aria-hidden />
                  </span>
                </button>
              </li>
            )}

            {fold && (openSeen || openRest) && (
              <li>
                <button
                  type="button"
                  onClick={() => (setOpenSeen(false), setOpenRest(false))}
                  className={cn(rail, "w-full items-center rounded-md px-2 py-1.5 text-left text-xs font-semibold text-subtle hover:text-text")}
                >
                  <span />
                  {l.journey.fold}
                </button>
              </li>
            )}
          </ol>
        )}
      </Card>

      {links}
    </section>
  );
}

/** Lab `class` v32 (P125): a card in the class page's list that opens in place, like the notes card. */
function FoldCard({
  icon: Icon,
  tone,
  title,
  sub,
  children,
}: {
  icon: typeof Inbox;
  tone: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  return (
    <Card radius="md" className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-raised"
      >
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone)}>
          <Icon className="size-[1.125rem]" aria-hidden />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-semibold">{title}</span>
          {sub && <span className="truncate text-xs text-subtle">{sub}</span>}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div id={panel} className="border-t border-border">
          {children}
        </div>
      )}
    </Card>
  );
}

/**
 * Lab `class` v30 (P123): the student's notes and bookmarks on this class, when there are any, as a card
 * like the ones around it. Pressed, it opens in place: each one with its time; a tap jumps there, × deletes.
 */
function NotesCard({
  notes,
  item,
  labels: l,
  fmt,
  onJump,
}: {
  notes: ClassNote[];
  item: string;
  labels: Labels["notes"];
  fmt: ReturnType<typeof createFormatter>;
  onJump: ((sec: number) => void) | null;
}) {
  const [open, setOpen] = useState(false);
  const written = notes.filter((n) => n.text).length;
  const marks = notes.length - written;
  const count = [written > 0 && fill(l.countNotes, { n: fmt.number(written) }), marks > 0 && fill(l.countMarks, { n: fmt.number(marks) })]
    .filter(Boolean)
    .join(" · ");
  const panel = `notes-card-${item}`;
  return (
    <Card radius="md" className="overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-raised"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-warning-soft text-warning">
          <Bookmark className="size-[1.125rem]" aria-hidden />
        </span>
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm font-semibold">{l.card}</span>
          <span className="truncate text-xs text-subtle">{count}</span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ol id={panel} className="grid gap-0.5 border-t border-border p-1">
          {notes.map((n) => (
            <NoteRow key={n.id} note={n} item={item} labels={{ ...l, mark: l.bookmark }} fmt={fmt} onJump={onJump} />
          ))}
        </ol>
      )}
    </Card>
  );
}

/** A mark or note on the path: its time and words (a mark shows "চিহ্ন"); a tap jumps there, × deletes it. */
function NoteRow({
  note: n,
  item,
  labels: l,
  fmt,
  onJump,
}: {
  note: ClassNote;
  item: string;
  labels: Labels["notes"];
  fmt: ReturnType<typeof createFormatter>;
  onJump: ((sec: number) => void) | null;
}) {
  const time = fmt.duration(n.sec);
  return (
    <li className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2 rounded-md px-2 py-2 transition-colors hover:bg-raised">
      <Dot state="note" />
      <span className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onJump?.(n.sec)}
          aria-label={fill(l.jump, { time, text: n.text ?? l.mark })}
          className="flex min-w-0 flex-1 items-baseline gap-2.5 py-0.5 text-left"
        >
          <span className="min-w-11 shrink-0 text-xs font-semibold text-warning tabular-nums">{time}</span>
          {n.text ? (
            <span className="line-clamp-3 text-sm whitespace-pre-line">{n.text}</span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-muted">
              <Bookmark className="size-3.5 fill-current text-warning" aria-hidden />
              {l.mark}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label={l.remove}
          title={l.remove}
          onClick={() => removeNote(item, n.id)}
          className="grid size-7 shrink-0 place-items-center rounded-full text-subtle transition-colors hover:bg-surface hover:text-text"
        >
          <X className="size-4" aria-hidden />
        </button>
      </span>
    </li>
  );
}

/** A stop on the path: ticked, playing, still to come, a fold of several, or a student's note. */
function Dot({ state }: { state: "done" | "now" | "todo" | "more" | "note" }) {
  return (
    <span aria-hidden className="relative grid h-5 place-items-center">
      {state === "done" ? (
        <span className="grid size-4 place-items-center rounded-full bg-brand text-on-primary">
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      ) : state === "now" ? (
        <span className="grid size-4 place-items-center rounded-full bg-surface ring-2 ring-brand">
          <span className="size-2 rounded-full bg-brand" />
        </span>
      ) : state === "note" ? (
        <span className="size-2.5 rounded-full bg-warning ring-[3px] ring-surface" />
      ) : state === "more" ? (
        <span className="h-4 w-1 rounded-full border-x-2 border-dotted border-border-strong bg-surface" />
      ) : (
        <span className="size-3.5 rounded-full border-2 border-border-strong bg-surface" />
      )}
    </span>
  );
}
