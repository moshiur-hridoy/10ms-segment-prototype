import type { ReactNode } from "react";
import { ChevronRight, Flag, MessageCircleQuestion, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/design-system/atoms/button";
import { ProgressBar } from "@/design-system/atoms/progress";
import { IconButton } from "@/design-system/atoms/icon-button";
import { Card } from "@/design-system/atoms/card";
import { LabSwitch } from "@/components/layout/lab-switch";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/i18n/get-dictionary";
import { stripPrefix, type ChapterView, type ClassNode, type SyllabusItem } from "@/lib/api";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { ItemIcon, SourceTag, StatusMark } from "./item-icon";
import { chapterLabel, itemMeta, watchedPct } from "./panel-model";
import { ClassBadges } from "./class-badges";
import { ExamStart } from "./exam-start";
import { ClassDoneSlot, DemoSeek } from "./up-next";
import { PdfReader } from "./pdf-reader";
import { YouTubePlayer } from "./youtube-player";
import { DEMO_PARTS } from "./demo-parts";
import { DownloadButton, DownloadToast } from "./download";
import { STAGE_BLEED } from "./stage";
import { ClassJourney } from "./class-journey";
import { demoAttendance } from "./demo-attendance";
import { WatchingLine } from "./watching-line";
import { ClassPoll } from "./class-poll";
import { TenTenHead } from "./tenten-head";
import { TenTenAsk, TenTenSwap } from "./tenten-chat";
import { NoteComposer } from "./note-composer";
import type { Audience } from "./demo-audience";

type Props = {
  item: SyllabusItem;
  chapter: ChapterView;
  /** The class this item is (or belongs to), if any. */
  node: ClassNode | null;
  href: (id: string) => string;
  /** Start the video on arrival (opened by the phone's "up next" card). */
  autoplay?: boolean;
  /** Lab `class` v10 (P60): the player's words in English. */
  playerEn: Dictionary["syllabus"]["player"];
  /** Lab `class` v19 (P91): live or not and how many are watching (a demo sample for now). */
  audience?: Audience | null;
  /** Lab `class` v24 (P117): no video length (the API has none), the date as day and month. */
  light?: boolean;
  /** Lab `class`'s version (0 without it), for the tasks' meta (P122). */
  labV?: number;
  /** Lab `concept`'s version (0 without it), O12. */
  conceptV?: number;
  /** A guest (CT28): no attendance, since there is no student to have attended. */
  guest?: boolean;
  /** Downloads need a login (the designer's rule): off for a visitor who isn't logged in. */
  download?: boolean;
  fmt: Formatter;
  t: Dictionary;
};

/** Until the API gives each slide its own file, demo slides open this placeholder deck. */
const DEMO_PDF = "/demo/lecture-slide.pdf";
const pdfUrl = (item: SyllabusItem) => (item.url && item.url !== "#" ? item.url : DEMO_PDF);

/** Lab `class` v9 (P59): the open item on the left, its tasks in a column on the right from `lg`; one column below. */
const SPLIT = "grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6";
const ASIDE = "grid min-w-0 grid-cols-1 content-start gap-5 lg:sticky lg:top-20";

/** The open item: player, PDF or exam, then what belongs with it. What comes next is the list's job (and, on phones, the playlist and the "up next" card), P53. */
export function Viewer({
  item,
  chapter,
  node,
  href,
  autoplay = false,
  playerEn,
  audience = null,
  light = false,
  labV = 0,
  conceptV = 0,
  guest = false,
  download = true,
  fmt,
  t,
}: Props) {
  const s = t.syllabus;
  const title = stripPrefix(item.title);
  const where = [chapterLabel(chapter, fmt, t), item.publishedAt && fmt.date(item.publishedAt)].filter(Boolean);
  const together = node ? [node.video, ...node.materials].filter((i) => i.id !== item.id) : [];
  const parts = videoParts(item);
  const pending = together.filter((m) => m.status !== "done").length;
  // Lab `concept` v10 (P163): TenTen's box and chat in the page.
  const chat = conceptV >= 10 && item.kind === "video";

  const head = (
    <div className="flex items-start gap-3">
      <DownloadToast labels={s.downloads} locale={fmt.locale} />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-subtle">
          {/* Live class or the previous batch's recording: the first thing to know about what's open. */}
          <SourceTag archive={item.source === "archive"} label={item.source === "archive" ? s.archiveBadge : s.liveBadge} />
          <span>{where.join(" · ")}</span>
        </p>
        <h1 className="type-title sm:text-2xl">{title}</h1>
      </div>
      <div className="flex shrink-0 gap-1">
        {download && item.kind !== "exam" && (
          <DownloadButton
            id={item.id}
            title={title}
            url={item.kind === "video" ? null : pdfUrl(item)}
            fileName={`${title}.pdf`}
            label={s.download}
            labels={s.downloads}
            locale={fmt.locale}
          />
        )}
        <IconButton href="#" label={s.report} tooltip variant="subtle" size="lg">
          <Flag className="size-5" aria-hidden />
        </IconButton>
      </div>
    </div>
  );

  /* P82: 44px targets side by side, no extra gap (icons 24px apart); -mr-3 lines the last icon up with the content edge. */
  const actions = (edge: string) => (
    <div className={cn("-mr-3 flex shrink-0", edge)}>
      {/* Lab `class` v15 (P67): write a note at this moment (a real video only: the stand-in has no clock). */}
      {/* Lab `class` v50 (P144): no notes, so no note button. */}
      {labV < 50 && item.kind === "video" && item.youtubeId && <NoteComposer item={item.id} locale={fmt.locale} labels={s.notes} />}
      {download && item.kind !== "exam" && (
        <DownloadButton
          id={item.id}
          title={title}
          url={item.kind === "video" ? null : pdfUrl(item)}
          fileName={`${title}.pdf`}
          label={s.download}
          labels={s.downloads}
          locale={fmt.locale}
        />
      )}
      <IconButton href="#" label={s.report} tooltip variant="subtle" size="lg">
        <Flag className="size-5" aria-hidden />
      </IconButton>
    </div>
  );

  // Lab `class` v13 (P64): like YouTube, a smaller title first, then one row: what it is and when, with the actions at its end.
  const hasParts = !!parts && parts.length > 1;
  const headLab = (
    // One column as wide as the page (grid-cols-1 is minmax(0, 1fr)), so a long part name shortens instead of widening the page.
    <div className="grid grid-cols-1 gap-1.5">
      <DownloadToast labels={s.downloads} locale={fmt.locale} />
      {/* Lab `concept` v7 (P158): the date moves up into the watching line, with the download and flag buttons at its end; the row under the title goes. */}
      {/* Lab `concept` v9 (P161): date and watching count above the title; the part playing and the buttons in a row under it,
          so a long part name has most of a line. A class without parts keeps the buttons on the top line. */}
      {conceptV >= 9 && item.kind === "video" ? (
        <>
          <div className="flex items-center">
            {/* P162: 12px between the date and the watching count. */}
            <div className="flex min-w-0 flex-1 items-center gap-3 text-xs font-semibold text-subtle">
              {item.source === "archive" && <SourceTag archive label={s.archiveBadge} />}
              {item.publishedAt && <span className="shrink-0 tabular-nums">{createFormatter("en", fmt.now).dateCompact(item.publishedAt)}</span>}
              <WatchingLine audience={audience} label={playerEn.watching} locale="en" />
            </div>
            {!hasParts && actions("-my-3 -ml-1")}
          </div>
          <h1 className="type-subtitle sm:type-title">{title}</h1>
          {hasParts && (
            <div className="flex items-center">
              {/* -ml-2: the chip's own padding, so its icon lines up with the title. */}
              <div className="-ml-2 flex min-w-0 flex-1 text-xs font-semibold">
                <WatchingLine audience={null} label={playerEn.watching} locale="en" parts={parts} partsLabel={playerEn.parts} />
              </div>
              {actions("-my-3 -ml-1")}
            </div>
          )}
        </>
      ) : conceptV >= 7 && item.kind === "video" ? (
        <>
          {/* No gap before the buttons: their own 12px padding keeps the icons clear of the text (needed at 360px). */}
          <div className="flex items-center">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold text-subtle">
              {item.source === "archive" && <SourceTag archive label={s.archiveBadge} />}
              {item.publishedAt && <span className="shrink-0 tabular-nums">{createFormatter("en", fmt.now).dateCompact(item.publishedAt)}</span>}
              <WatchingLine audience={audience} label={playerEn.watching} locale="en" parts={parts} partsLabel={playerEn.parts} />
            </div>
            {/* The 44px buttons hang over the 20px line (-my-3), so the line stays as tall as its text. */}
            {actions("-my-3 -ml-1")}
          </div>
          <h1 className="type-subtitle sm:type-title">{title}</h1>
        </>
      ) : (
        <>
          {/* Lab `class` v51 (P147): the watching count, above the title instead of on the video. English, like the date row under it. */}
          {/* Lab `class` v52 (P148): the part playing beside it, with its list. */}
          {labV >= 52 && item.kind === "video" ? (
            <WatchingLine audience={audience} label={playerEn.watching} locale="en" parts={parts} partsLabel={playerEn.parts} />
          ) : (
            labV >= 51 && audience && item.kind === "video" && <WatchingLine audience={audience} label={playerEn.watching} locale="en" />
          )}
          <h1 className="type-subtitle sm:type-title">{title}</h1>
          {/* Lab `concept` v5 (P155): the date row's 44px buttons push its text down; 4px up makes title → date 12px, like watching → title. */}
          <div className={cn("flex items-center gap-3", conceptV >= 5 && "-mt-1")}>
            <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-subtle">
              {/* P80: a live class needs no label here (it is the usual case); a recording from the previous batch keeps its tag. */}
              {item.source === "archive" && <SourceTag archive label={s.archiveBadge} />}
              {/* P81: when it went up, date and time, without the chapter. */}
              {item.publishedAt && (
                <span>{light ? createFormatter("en", fmt.now).dateCompact(item.publishedAt) : fmt.dateTime(item.publishedAt)}</span>
              )}
              {/* Lab `class` v31 (P124): the syllabus row's pills (P121) by the date too. */}
              {labV >= 31 && item.kind === "video" && (
                <ClassBadges
                  id={item.id}
                  status={item.status}
                  progress={item.status === "started" ? watchedPct(item) : undefined}
                  downloadedPill={labV < 43}
                  labels={s.badges}
                />
              )}
            </p>
            {actions("-my-1.5")}
          </div>
        </>
      )}
    </div>
  );

  // Lab `class` (P55): after a video, its slide and exam read as the student's tasks; the teacher inbox gets its own heading.
  const tasks = together.length > 0 && (
    <section aria-labelledby="together-title" className="grid gap-2.5">
      <h2 id="together-title" className="flex items-baseline gap-2 text-sm font-semibold text-subtle">
        {item.kind === "video" ? s.tasks.title : s.withThisClass}
        {item.kind === "video" && <span className="font-normal">· {pending ? fill(s.tasks.left, { n: fmt.number(pending) }) : s.tasks.allDone}</span>}
      </h2>
      {/* Two side by side on tablets; one under the other in the right column on wide screens. */}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {together.map((m) => (
          <li key={m.id} className="min-w-0">
            <Card as={Link} radius="md" interactive href={href(m.id)} replace className="flex min-h-16 items-center gap-3 px-3 py-2.5">
              <ItemIcon kind={m.kind} archive={m.source === "archive"} />
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-semibold">{m.kind === "video" ? stripPrefix(m.title) : s.kind[m.kind]}</span>
                <span className="truncate text-xs text-subtle">{itemMeta(m, fmt, t, labV)}</span>
              </span>
              <StatusMark status={m.status} progress={watchedPct(m)} label={s.status[m.status]} />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
  const ask = (
    <section aria-labelledby="ask-title" className="grid gap-2.5">
      <h2 id="ask-title" className="text-sm font-semibold text-subtle">
        {s.tasks.ask}
      </h2>
      <Card as="a" href="#" className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
        <MessageCircleQuestion className="size-5 shrink-0 text-info" aria-hidden />
        <span className="grid min-w-0 flex-1">
          <span className="font-semibold">{s.teacherInbox}</span>
          <span className="truncate text-sm text-subtle">{s.teacherInboxHint}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-subtle" aria-hidden />
      </Card>
    </section>
  );

  // Lab `class` v14 (P66): for a video, its parts and the class's slide and exam in one card (ClassJourney).
  const journey =
    item.kind === "video" &&
    ((key: string, className: string) => (
      <ClassJourney
        id={key}
        parts={parts ?? []}
        tasks={together.map((m) => ({
          id: m.id,
          kind: m.kind,
          archive: m.source === "archive",
          label: m.kind === "video" ? stripPrefix(m.title) : s.kind[m.kind],
          meta: itemMeta(m, fmt, t, labV),
          href: href(m.id),
          done: m.status === "done",
        }))}
        locale={fmt.locale}
        item={item.id}
        noteKey={item.youtubeId && labV < 50 ? item.id : null}
        labels={{ journey: s.journey, notes: s.notes, parts: s.parts, tasks: s.tasks, nowPlaying: s.nowPlaying, kind: s.kind }}
        videoPct={item.status === "done" ? 100 : watchedPct(item)}
        attendance={guest ? null : demoAttendance(item.id, item.source)}
        className={className}
      />
    ));

  // A slide or sheet is all pages: its title, then the PDF; what comes next is the card's job on phones and the list's beside it.
  if (item.kind === "slide" || item.kind === "sheet") {
    const doc = (top: ReactNode) => (
      <div className="grid min-w-0 grid-cols-1 content-start gap-4">
        {top}
        <section id="player" aria-label={title}>
          <DocStage item={item} fmt={fmt} t={t} />
        </section>
      </div>
    );
    // Lab `class` v9 (P59): wide screens keep the class's other items in the right column; phones stay all pages (the card offers what's next).
    return (
      <LabSwitch
        id="class"
        off={doc(head)}
        on={
          <div className={SPLIT}>
            {doc(headLab)}
            {together.length > 0 && <aside className={cn(ASIDE, "max-lg:hidden")}>{tasks}</aside>}
          </div>
        }
      />
    );
  }

  // Lab `class` v39 (P132): an exam is one card with its start, alone on the page.
  if (item.kind === "exam" && labV >= 39) return <ExamStart item={item} labV={labV} fmt={fmt} t={t} />;

  const stage = (
    <section id="player" aria-label={title}>
      {item.kind === "video" ? (
        <VideoStage item={item} autoplay={autoplay} playerEn={playerEn} audience={audience} light={light} fmt={fmt} t={t} />
      ) : (
        <DocStage item={item} fmt={fmt} t={t} />
      )}
    </section>
  );

  return (
    <LabSwitch
      id="class"
      off={
        <div className="grid min-w-0 grid-cols-1 content-start gap-5">
          {stage}
          {head}
          {together.length > 0 && (
            <section aria-labelledby="together-title" className="grid gap-2">
              <h2 id="together-title" className="text-sm font-semibold text-subtle">
                {s.withThisClass}
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {together.map((m) => (
                  <li key={m.id} className="min-w-0">
                    <Card as={Link} radius="md" interactive href={href(m.id)} replace className="flex min-h-16 items-center gap-3 px-3 py-2.5">
                      <ItemIcon kind={m.kind} archive={m.source === "archive"} />
                      <span className="grid min-w-0 flex-1">
                        <span className="truncate text-sm font-semibold">{m.kind === "video" ? stripPrefix(m.title) : s.kind[m.kind]}</span>
                        <span className="truncate text-xs text-subtle">{itemMeta(m, fmt, t)}</span>
                      </span>
                      <StatusMark status={m.status} progress={watchedPct(m)} label={s.status[m.status]} />
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Card as="a" href="#" className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-raised">
            <MessageCircleQuestion className="size-5 shrink-0 text-info" aria-hidden />
            <span className="grid min-w-0 flex-1">
              <span className="font-semibold">{s.teacherInbox}</span>
              <span className="truncate text-sm text-subtle">{s.teacherInboxHint}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-subtle" aria-hidden />
          </Card>
        </div>
      }
      // Lab `class` v9 (P59): like YouTube on a computer, the video, its title and parts on the left and
      // what the student does after it in a column on the right. Phones keep one column in the same order.
      on={
        <div className={SPLIT}>
          <div className="grid min-w-0 grid-cols-1 content-start gap-5">
            {/* Lab `class` v21 (P105): on a phone held upright the video stays under the top bar while the rest scrolls. */}
            <div className="max-lg:portrait:sticky max-lg:portrait:top-[calc(3.5rem+env(safe-area-inset-top))] max-lg:portrait:z-30">{stage}</div>
            {chat ? (
              // Lab `concept` v10 (P163): TenTen's box above the class's steps; a question opens the chat here, under the video.
              <TenTenSwap parts={parts} locale={fmt.locale} labels={s.tenten}>
                {headLab}
                <TenTenAsk parts={parts} labels={s.tenten} className="-my-2 lg:hidden" />
                {journey && journey(`m`, "lg:hidden")}
              </TenTenSwap>
            ) : (
              <>
                {headLab}
                {/* Lab `class` v14 (P66): a video's parts and tasks as one path, under the title on phones and tablets. */}
                {journey && journey(`m`, "lg:hidden")}
              </>
            )}
            {/* Lab `class` v22 (P109): TenTen as a chat head, in a live class only. Lab `concept` v10 (P163): in every class, while the box is out of view. */}
            {item.kind === "video" && <TenTenHead itemId={item.id} name={s.journey.tentenName} ask={s.journey.tentenAsk} handoff={chat} />}
          </div>
          <aside className={ASIDE}>
            {item.kind === "video" && <ClassDoneSlot />}
            {chat && journey ? (
              <TenTenSwap wide parts={parts} locale={fmt.locale} labels={s.tenten}>
                <TenTenAsk parts={parts} labels={s.tenten} className="-mb-2 max-lg:hidden" />
                {journey(`w`, "max-lg:hidden")}
              </TenTenSwap>
            ) : journey ? (
              journey(`w`, "max-lg:hidden")
            ) : (
              <>
                {tasks}
                {ask}
              </>
            )}
          </aside>
        </div>
      }
    />
  );
}

/** A video's parts (P49): from the API, else the demo videos' sample parts. */
const videoParts = (item: SyllabusItem) =>
  item.kind !== "video" ? undefined : (item.chapters ?? (item.youtubeId ? DEMO_PARTS[item.youtubeId] : undefined));

/**
 * The video stage. Items with a demo `youtubeId` play for real (styled as our own player);
 * the rest show this stand-in until the CDN player exists.
 */
function VideoStage({
  item,
  autoplay,
  playerEn,
  audience,
  light,
  fmt,
  t,
}: {
  item: SyllabusItem;
  autoplay: boolean;
  playerEn: Dictionary["syllabus"]["player"];
  audience: Audience | null;
  light: boolean;
  fmt: Formatter;
  t: Dictionary;
}) {
  const s = t.syllabus;
  const pct = item.status === "done" ? 100 : watchedPct(item);
  const resume = item.status === "started" && item.watchedSec;
  if (item.youtubeId) {
    return (
      <>
        <YouTubePlayer
          videoId={item.youtubeId}
          title={stripPrefix(item.title)}
          resumeSec={resume ? item.watchedSec! : null}
          watchedPct={pct}
          durationSec={item.durationSec ?? null}
          locale={fmt.locale}
          labels={s.player}
          labelsEn={playerEn}
          noteKey={item.id}
          audience={audience}
          parts={videoParts(item)}
          autoStart={autoplay}
        />
        {/* Demo only (the card shows on phones): reach the last 35 seconds without waiting. */}
        <DemoSeek labels={s.upNext} className="mt-2" />
        {/* Lab `class` v20 (P103): the teacher's poll, at its moment in the video. */}
        <ClassPoll itemId={item.id} locale={fmt.locale} labels={s.poll} />
      </>
    );
  }
  // The stand-in stage reaches the edges on phones in lab `class` (P57), like the real player, and speaks English there (P60).
  const en = createFormatter("en", fmt.now);
  const stage = (lab: boolean, l = lab ? playerEn : s.player, f = lab ? en : fmt, bleed = lab) => (
    <div
      className={cn("relative grid aspect-video w-full place-items-center overflow-hidden rounded-lg bg-player text-on-fill", bleed && STAGE_BLEED)}
    >
      <a href={item.url} aria-label={resume ? undefined : l.play} className="group/play grid justify-items-center gap-3 rounded-lg p-4 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-on-fill/15 ring-1 ring-on-fill/25 backdrop-blur transition-transform group-hover/play:scale-105 sm:size-20">
          <Play className="size-7 translate-x-0.5 fill-current sm:size-8" aria-hidden />
        </span>
        {/* Lab (P90): no "Play video" under a plain play button; the resume line stays. */}
        {(resume || !lab) && (
          <span className="text-sm font-semibold">{resume ? fill(l.resumeAt, { time: f.duration(item.watchedSec!) }) : l.play}</span>
        )}
      </a>
      <div className="absolute inset-x-0 bottom-0 grid gap-2 bg-gradient-to-t from-player/70 to-transparent px-4 pt-8 pb-3">
        <div className="flex items-center justify-between gap-3 text-xs text-on-fill/80 tabular-nums">
          <span>{pct > 0 && fill(l.watched, { pct: f.percent(pct) })}</span>
          {item.durationSec && !(lab && light) && <span>{f.duration(item.durationSec)}</span>}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-on-fill/20" aria-hidden>
          <div className={cn("h-full rounded-full", lab ? "bg-live" : "bg-brand")} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
  return <LabSwitch id="class" on={stage(true)} off={stage(false)} />;
}

/** Lecture sheet, slide or exam: what it is, how big, and the one action. */
/** A slide or sheet opens right here in the reader; an exam shows its start (or result) card. */
function DocStage({ item, fmt, t }: { item: SyllabusItem; fmt: Formatter; t: Dictionary }) {
  const s = t.syllabus;
  if (item.kind !== "exam") return <PdfReader url={pdfUrl(item)} title={stripPrefix(item.title)} labels={s.reader} lang={fmt.locale} />;
  const scorePct = item.score && item.score.total ? (item.score.got / item.score.total) * 100 : null;
  return (
    <div className="grid w-full place-items-center rounded-card border border-border bg-raised px-6 py-12 sm:aspect-[16/7] sm:py-0">
      <div className="grid max-w-sm justify-items-center gap-4 text-center">
        <ItemIcon kind={item.kind} size="lg" />
        <div className="grid gap-1">
          <p className="font-semibold">{s.kind[item.kind]}</p>
          <p className="text-sm text-muted">{itemMeta(item, fmt, t)}</p>
        </div>
        {scorePct !== null && <ProgressBar value={scorePct} label={itemMeta(item, fmt, t)} className="w-48" />}
        <div className="flex flex-wrap justify-center gap-2">
          <Button href={item.url}>{item.status === "done" ? s.exam.result : s.exam.start}</Button>
          {item.status === "done" && (
            <Button href={item.url} variant="secondary">
              {s.exam.retake}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
