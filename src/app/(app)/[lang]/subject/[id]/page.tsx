import { ArrowLeft, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { ViewTransition } from "react";
import { Suspense } from "react";
import { VisitorHeader } from "@/features/header/visitor-header";
import { SiteHeader } from "@/design-system/organisms/header/site-header";
import { HeaderActionsSkeleton } from "@/design-system/organisms/header/header-actions";
import { LockedItem } from "@/components/subject/locked-item";
import { LoginPopup } from "@/components/catalog/login-popup";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { itemMeta, toPanelChapters, withAccess } from "@/components/subject/panel-model";
import { ComingStrip } from "@/components/subject/coming-strip";
import { FloatingResume } from "@/components/subject/floating-resume";
import { FocusBar } from "@/components/subject/focus-bar";
import { PaperLinks } from "@/components/subject/paper-links";
import { TenTenPaperCard } from "@/components/subject/tenten-paper-card";
import { SuperPrepLink } from "@/design-system/molecules/superprep-link";
import { ResumeStrip } from "@/design-system/molecules/resume-strip";
import { SubjectSkeleton } from "@/components/subject/subject-skeleton";
import { SubjectPlaylist } from "@/components/subject/subject-playlist";
import { SyllabusPanel } from "@/components/subject/syllabus-panel";
import { itemHref, type PanelRow } from "@/components/subject/types";
import { Viewer } from "@/components/subject/viewer";
import { DEMO_AUDIENCE } from "@/components/subject/demo-audience";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { ProgressBar } from "@/design-system/atoms/progress";
import { EmptyState } from "@/design-system/molecules/empty-state";
import { IconButton } from "@/design-system/atoms/icon-button";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import {
  createDataContext,
  DEFAULT_SET_SIZE,
  getCatalog,
  getFreeShelf,
  getStreak,
  getPaperComing,
  getPaperCourse,
  getPaperFolders,
  getPaperPrepId,
  batchContext,
  getSyllabus,
  locate,
  nextClass,
  resumeItem,
  stripPrefix,
  upNextSteps,
  type DataContext,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { LabProvider } from "@/lib/lab";
import { labVersion } from "@/lib/lab-version";
import { newUploads } from "@/lib/new-uploads";
import { createFormatter, fill } from "@/lib/format";
import { subjectMorph, syllabusMorph } from "@/lib/motion";
import { examHref } from "@/lib/superprep-links";
import { visitorOf, type Visitor } from "@/lib/visitor";

/*
 * A paper's page ("জীববিজ্ঞান ১ম পত্র"), opened from a subject card on the dashboard.
 * Live batches teach in no fixed order, so the page opens on the syllabus list alone and
 * nothing plays until the student picks. ?item= opens that item beside the list.
 */
export default async function SubjectPage({ params, searchParams }: PageProps<"/[lang]/subject/[id]">) {
  // The language is known up front (root param), so the header renders before the paper loads.
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);
  // A guest can open a paper too (CT28): the free classes play, everything else is locked.
  const visitor = visitorOf(searchParams);

  return (
    <>
      <Suspense fallback={<SiteHeader lang={lang} t={t} current="courses" actions={<HeaderActionsSkeleton />} />}>
        <VisitorHeader visitor={visitor} ctx={ctx} lang={lang} t={t} current="courses" />
      </Suspense>
      <PageMotion>
        <main className="mx-auto max-w-page px-4 py-6 sm:px-6">
          <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
            <Reveal fallback={<SubjectSkeleton label={t.common.loading} />}>
              {params.then(({ id }) => (
                <SubjectBody id={id} ctx={ctx} visitor={visitor} searchParams={searchParams} lang={lang} t={t} />
              ))}
            </Reveal>
          </SectionErrorBoundary>
        </main>
      </PageMotion>
    </>
  );
}

type SearchParams = Record<string, string | string[] | undefined>;

/** TenTen and SuperPrep cards in the paper page's side column: built, hidden for now by the designer's choice. */
const PAPER_PRACTICE = false;

/** The page's `?lab=` goes to the server's render too, so a lab's layout doesn't jump on load (P115). */
async function SubjectBody(props: {
  id: string;
  ctx: Promise<DataContext>;
  visitor: Promise<Visitor>;
  searchParams: Promise<SearchParams>;
  lang: Locale;
  t: Dictionary;
}) {
  const [sp, who] = await Promise.all([props.searchParams, props.visitor]);
  const { lang, t } = props;
  // CT114 (lab `segment-home` v22): a guest who came in from the segment page's books logs in here in the pop-up (CT99), not on
  // the login page; once signed in, the page draws itself again for the new student (slides and sheets open, CT104).
  return (
    <LabProvider lab={sp.lab}>
      <LoginPopup
        lang={lang}
        copy={t.login}
        title={t.segment.homeLoginTitle}
        lead={t.segment.homeLoginLead}
        closeLabel={t.segment.homeLoginClose}
        off={!who.guest || labVersion("segment-home", sp.lab) === null}
      >
        <SubjectContent {...props} />
      </LoginPopup>
    </LabProvider>
  );
}

async function SubjectContent({
  id,
  ctx,
  visitor,
  searchParams,
  lang,
  t,
}: {
  id: string;
  ctx: Promise<DataContext>;
  visitor: Promise<Visitor>;
  searchParams: Promise<SearchParams>;
  lang: Locale;
  t: Dictionary;
}) {
  const [c, sp, who] = await Promise.all([ctx, searchParams, visitor]);
  const { guest } = who;
  // OB15: the free demo student (signed in, no courses) reads the paper from the batch's own content, with no progress
  // and no course, like a guest; but logging in opened every class ("লগইন করলে বাকি সব খুলে যাবে"), so nothing is locked.
  const outside = guest || who.free;
  const bc = outside ? batchContext(c) : c;
  // Lab `class` v24 (P117): lighter rows and class details; v23 stays as it was at `?lab=class@23`.
  const labV = labVersion("class", sp.lab) ?? 0;
  // Lab `concept` (O12): its own changes on top of class v53.
  const conceptV = labVersion("concept", sp.lab) ?? 0;
  const light = labV >= 24;
  // The segment page the visitor came from (`seg=hsc-28.science`, CT28).
  const [segBatch, segStream] = typeof sp.seg === "string" ? sp.seg.split(".") : [];
  const [data, enrolledCourse, shelf, segView] = await Promise.all([
    getSyllabus(bc, id, outside),
    getPaperCourse(c, id),
    outside ? getFreeShelf(bc) : [],
    outside ? getCatalog(c, segBatch || "hsc-28", segStream || null) : null,
  ]);
  // Outside the batch (the designer's rules): the paper's first class is free to watch, and so are the new uploads its
  // segment page lists, so a student who taps one there and logs in gets the class; every other class opens with the
  // batch (buy); every material (slide, sheet, exam) opens, downloads included, once logged in. In the batch: all open.
  const freeVideo = outside
    ? data?.chapters.flatMap((ch) => [...ch.batch.classes, ...ch.archive.classes].map((k) => k.video.id))[0]
    : undefined;
  const segSubjects = segView ? [...segView.stream.group, ...segView.stream.compulsory].map((s) => s.id) : [];
  const freeVideos = new Set([...(freeVideo ? [freeVideo] : []), ...newUploads(shelf, segSubjects).map((i) => i.id)]);
  const accessOf = (item: { id: string; kind: string }): PanelRow["access"] =>
    !outside ? undefined : item.kind === "video" ? (freeVideos.has(item.id) ? "free" : "buy") : guest ? "login" : undefined;
  const course = outside ? null : enrolledCourse;
  const fmt = createFormatter(lang, c.now);
  const s = t.syllabus;

  // Nothing loads until the student picks: without ?item= the page is only the syllabus list.
  // ?resume=1 (the course home's "continue") opens the class they're part-way through.
  const resume = data ? resumeItem(data.chapters) : null;
  const requested = typeof sp.item === "string" ? sp.item : sp.resume === "1" ? resume?.id : undefined;
  const found = data && requested ? locate(data.chapters, requested) : null;

  // Item links keep the other query params (dev knobs like ?fixture=), but not this page's own.
  const keep = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key !== "item" && key !== "resume" && key !== "via" && typeof value === "string") keep.set(key, value);
  }
  // Set by the phone's "up next" card on what it opens: a class starts playing, a slide or exam opens its card.
  const viaCard = sp.via === "card";
  const path = `/${lang}/subject/${id}`;
  const listHref = keep.size ? `${path}?${keep}` : path;
  // Has the student started this paper (a class watched or part-watched)? Only then is there somewhere to continue from.
  // A guest's way back is the segment page they came from (`seg=hsc-28.science`, CT28), keeping the lab and `?as=`.
  const segParams = new URLSearchParams();
  if (segStream) segParams.set("stream", segStream);
  for (const k of ["lab", "as"]) if (typeof sp[k] === "string") segParams.set(k, sp[k]);
  const home = outside ? `/${lang}/hsc/${segBatch || "hsc-28"}?${segParams}` : course ? `/${lang}/course/${course.id}` : `/${lang}#subjects-title`;
  const homeLabel = outside ? t.segment.backToSegment : course ? s.backToCourse : s.back;
  const begun = data?.chapters.some((ch) => [ch.batch, ch.archive].some((g) => g.classes.some((k) => k.video.status !== "new"))) ?? false;

  // Back goes up one level: from an open item to the list; from the list to the course home, else the dashboard's subjects.
  const back = found ? (
    <IconButton href={listHref} label={s.backToList} size="md">
      <ArrowLeft className="size-5" aria-hidden />
    </IconButton>
  ) : (
    <IconButton href={home} label={homeLabel} size="md">
      <ArrowLeft className="size-5" aria-hidden />
    </IconButton>
  );

  // `resume` is null only when the paper has no items at all.
  if (!data || !resume) {
    return (
      <div className="grid grid-cols-1 gap-5">
        <ViewTransition name={subjectMorph(id)} share="subject" default="none">
          <div className="flex items-center gap-2">
            {back}
            <p className="truncate type-title">{data?.paper.title}</p>
          </div>
        </ViewTransition>
        <EmptyState icon={BookOpen} title={s.emptyPaper} />
      </div>
    );
  }

  // Lab `class` v42 (P135): the chapters' lecture sheets, for the paper's other resources (they leave the chapters).
  const paperNotes =
    labV >= 42 && !outside
      ? data.chapters
          .flatMap((c) => [...c.batch.notes, ...c.archive.notes])
          .map((i) => ({ id: i.id, label: stripPrefix(i.title), href: itemHref(path, keep.toString(), i.id) }))
      : [];
  // Lab `concept` v22 (P175): a chapter's own exams ("Chapter Final: …"), which no class claims, move from the chapter's
  // "অন্যান্য" into "এই বিষয়ের অন্যান্য রিসোর্স" under পরীক্ষা, so everything outside the classes is in one place.
  const chapterExams =
    conceptV >= 22 && !outside
      ? data.chapters
          .flatMap((c) => [...c.batch.others, ...c.archive.others])
          .filter((i) => i.kind === "exam")
          .map((i) => ({ id: i.id, label: i.title, href: itemHref(path, keep.toString(), i.id) }))
      : [];
  const pct = data.total ? (data.done / data.total) * 100 : 0;
  const panel = {
    chapters: outside ? withAccess(toPanelChapters(data.chapters, fmt, t, labV), accessOf) : toPanelChapters(data.chapters, fmt, t, labV),
    path,
    keep: keep.toString(),
    lang,
    paperDone: fill(s.chapterDone, { done: fmt.number(data.done), total: fmt.number(data.total) }),
    labels: s,
  };

  const done = fill(s.done, { pct: fmt.percent(pct) });

  // One way up (the breadcrumb; with an item open, the paper's crumb leads back to its list), then
  // only the paper's name, with its progress at the opposite side.
  const header = (
    // `data-page-head`: phones in lab `class` swap these rows for the focus bar (P58). `contents` keeps the layout as it was.
    <div data-page-head className="contents">
      {course && (
        <Breadcrumb
          label={t.courseHome.crumbs}
          items={[
            { label: t.nav.dashboard, href: `/${lang}` },
            // "HSC 27 অনলাইন ব্যাচ (ফিজিক্স, কেমিস্ট্রি, …)" → "HSC 27 অনলাইন ব্যাচ": the course page shows the full name.
            { label: course.title.replace(/\s*\([^)]*\)\s*$/, ""), href: `/${lang}/course/${course.id}` },
            { label: data.paper.title, href: found ? listHref : undefined },
          ]}
        />
      )}
      <ViewTransition name={subjectMorph(id)} share="subject" default="none">
        {/* Lab `class` v10 (P60): with an item open (the grid's data-solo marker), the breadcrumb already names the paper, so this row steps aside. */}
        <div className={cn("mb-2 flex items-center gap-4", found && "[:root:has([data-solo])_&]:hidden")}>
          <h1 className="min-w-0 flex-1 truncate type-title">{data.paper.title}</h1>
          {/* Lab `class` v27 (P120): no paper progress beside the title. */}
          {!light && (
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <ProgressBar value={pct} label={done} thin className="w-28" />
              <span className="text-sm font-semibold whitespace-nowrap text-brand-text tabular-nums" aria-hidden>
                {done}
              </span>
            </div>
          )}
        </div>
      </ViewTransition>
    </div>
  );

  // The list on its own, every chapter closed so the student picks one, with this
  // paper's next class or deadline above it (only when something is coming; not beside an open item).
  // A column on the right, level with the first card on the left: practice for this paper (TenTen,
  // then SuperPrep's usual card; off for now, PAPER_PRACTICE), then the subject's exam and resource
  // folders. On phones the practice cards follow the routine strip and the folders fold into one row.
  // Opening an item narrows the list into the rail on the left and the player takes the right, where
  // this column was (shared name, globals.css). Without anything for the column, the list keeps its
  // reading width.
  if (!found) {
    // A guest has no routine and no course folders yet.
    const [coming, folders, prepId] = await Promise.all([
      outside ? [] : getPaperComing(c, data.paper.title),
      outside ? { exams: [], resources: [] } : getPaperFolders(c, id),
      PAPER_PRACTICE ? getPaperPrepId(c, data.paper.title) : null,
    ]);
    const side = PAPER_PRACTICE || folders.exams.length + folders.resources.length + paperNotes.length > 0;
    const practice = (titleId: string) =>
      PAPER_PRACTICE && (
        <>
          <TenTenPaperCard titleId={titleId} subject={data.paper.title} chapters={data.paper.chapters.map((ch) => ch.title)} t={t} />
          {prepId && (
            <SuperPrepLink
              href={examHref(lang, sp, prepId, { count: DEFAULT_SET_SIZE })}
              hint={fill(s.prepStart, { n: fmt.number(DEFAULT_SET_SIZE) })}
            />
          )}
        </>
      );
    return (
      <div className={cn("mx-auto grid w-full grid-cols-1 gap-3", side ? "max-w-5xl" : "max-w-3xl")}>
        {/* Lab `class` v48 (P142): an inside page, so phones get the back-and-title bar in place of the site header, the breadcrumb,
            the title row and the bottom nav. Wide screens keep the header and breadcrumb. */}
        {labV >= 48 && <FocusBar href={home} title={data.paper.title} backLabel={homeLabel} noBottomNav />}
        {/* With the column, the header's progress ends where the left column ends (column 240px + gap). */}
        <div className={cn("grid grid-cols-1 gap-3", side && "lg:pr-[calc(240px+1.5rem)]")}>{header}</div>
        <div className={cn("grid grid-cols-1 items-start gap-6", side && "lg:grid-cols-[minmax(0,1fr)_240px]")}>
          <div className="grid min-w-0 grid-cols-1 gap-3">
            {/* P104: where the student stopped, the dashboard's own strip, once they have started this paper. */}
            {begun && resume && labV < 50 && (
              <ResumeStrip
                href={itemHref(path, keep.toString(), resume.id)}
                type={resume.kind === "video" ? "video" : resume.kind === "exam" ? "quiz" : "pdf"}
                label={t.subjects.resume}
                title={stripPrefix(resume.title)}
                action={t.common.continue}
              />
            )}
            {/* Lab `class` v50 (P144): on phones the strip floats at the bottom, hiding while the student scrolls down. */}
            {begun && resume && labV >= 50 && (
              <FloatingResume>
                {/* P145: a light green fill and edge on phones, where it floats over the list; wide screens keep the plain strip. */}
                <ResumeStrip
                  className="max-md:border-brand/30 max-md:bg-brand-soft"
                  href={itemHref(path, keep.toString(), resume.id)}
                  type={resume.kind === "video" ? "video" : resume.kind === "exam" ? "quiz" : "pdf"}
                  label={t.subjects.resume}
                  title={stripPrefix(resume.title)}
                  action={t.common.continue}
                />
              </FloatingResume>
            )}
            <ComingStrip items={coming} lang={lang} fmt={fmt} t={t} />
            {PAPER_PRACTICE && <div className="grid gap-3 lg:hidden">{practice("tenten-title-phone")}</div>}
            <PaperLinks
              folders={folders}
              variant="fold"
              filter={labV >= 41}
              notes={paperNotes}
              chapterExams={chapterExams}
              kinds={conceptV >= 17}
              fmt={fmt}
              t={t}
              className="lg:hidden"
            />
            <ViewTransition name={syllabusMorph(id)} share="syllabus" default="none">
              <SyllabusPanel {...panel} currentId={null} layout="page" />
            </ViewTransition>
          </div>
          {side && (
            <div className="hidden gap-6 lg:sticky lg:top-20 lg:grid">
              {PAPER_PRACTICE && <div className="grid gap-3">{practice("tenten-title")}</div>}
              <PaperLinks
                folders={folders}
                variant="rail"
                filter={labV >= 41}
                fold={labV >= 46}
                notes={paperNotes}
                chapterExams={chapterExams}
                fmt={fmt}
                t={t}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // On a locked item the lock card takes the player's place; the list stays beside it.
  const access = accessOf(found.item);
  const lockReason = access === "buy" || access === "login" ? access : null;
  const next = nextClass(data.chapters, found.item);
  // "৩/৮": the open class among the classes of its group (this year's batch or the archive).
  const group = found.item.source === "archive" ? found.chapter.archive : found.chapter.batch;
  const position = found.node ? `${fmt.number(found.node.number)}/${fmt.number(group.classes.length)}` : null;
  // The phone's "up next" card: this class's slide and exam, then the next class.
  const fromCard = new URLSearchParams(keep);
  fromCard.set("via", "card");
  const upNext = upNextSteps(data.chapters, found.item).map((i) => ({
    id: i.id,
    kind: i.kind,
    kindLabel: s.kind[i.kind],
    title: stripPrefix(i.title),
    meta: itemMeta(i, fmt, t, labV),
    href: itemHref(path, fromCard.toString(), i.id),
    done: i.status === "done",
    score: i.score,
  }));
  // Lab `class` (P52): how much of the class was seen before this visit, and today's watering, for the end-of-class card.
  const streak = found.item.kind === "video" && !guest ? await getStreak(c) : null;
  const seenBefore =
    found.item.status === "done" ? 1 : found.item.watchedSec && found.item.durationSec ? found.item.watchedSec / found.item.durationSec : 0;
  const finish =
    found.item.kind === "video"
      ? {
          seenBefore,
          streak: streak && {
            current: streak.current,
            todayDone: streak.week.some((d) => d.status === "today-done"),
            todayMinutes: streak.today?.minutes ?? 0,
            goal: streak.today?.goal ?? 10,
          },
        }
      : null;
  // Lab `class` v19 (P91): live state and watching count; a demo sample until the API sends them (design-audit 9.2).
  const audience = DEMO_AUDIENCE[found.item.id] ?? null;
  // Lab `class` v10 (P60): the player speaks English.
  const playerEn = lang === "en" ? t.syllabus.player : (await getDictionary("en")).syllabus.player;
  // An exam's own actions, for the card on phones (a slide opens in its reader, and the card waits for its last page).
  const item = found.item;
  const doc =
    item.kind === "exam"
      ? {
          kind: item.kind,
          kindLabel: s.kind[item.kind],
          title: stripPrefix(item.title),
          meta: itemMeta(item, fmt, t, labV),
          actions:
            item.status === "done"
              ? [
                  { label: s.exam.result, href: item.url, primary: true },
                  { label: s.exam.retake, href: item.url, primary: false },
                ]
              : [{ label: s.exam.start, href: item.url, primary: true }],
          openOnArrival: viaCard,
        }
      : null;

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* P88: the phone's top bar says what is open, not the paper (there is no "live now" field yet, so a batch class reads as a recording; design-audit 9.2). */}
      <FocusBar
        href={listHref}
        title={
          found.item.kind !== "video"
            ? s.kind[found.item.kind]
            : audience?.live
              ? s.focus.live
              : found.item.source === "archive"
                ? s.focus.archive
                : s.focus.recorded
        }
        backLabel={s.backToList}
      />
      {header}
      {/* Wide screens: the list on the left, the player on the right (where the folders were). Phones
          keep the source order: the player first, the list under it. */}
      {/* Lab `class` v9 (P59): the list leaves this page (its marker carries data-solo), so the open item takes the full width; with the
          title row gone (P60), 4px more under the breadcrumb makes 16px (P65). */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] lg:has-[>[data-solo]]:mt-1 lg:has-[>[data-solo]]:grid-cols-1">
        {/* Rises in as the list moves aside; switching between items keeps it still. */}
        <ViewTransition enter="player-in" exit="player-out" default="none">
          {lockReason ? (
            <LockedItem
              item={found.item}
              title={stripPrefix(found.item.title)}
              reason={lockReason}
              freeHref={
                freeVideo
                  ? { href: itemHref(path, panel.keep, freeVideo), label: t.segment.seeFree }
                  : { href: home, label: t.segment.backToSegment }
              }
              plansHref={`${home}#plans`}
              lang={lang}
              t={t}
            />
          ) : (
            <Viewer
              item={found.item}
              chapter={found.chapter}
              node={found.node}
              href={(itemId) => itemHref(path, panel.keep, itemId)}
              autoplay={viaCard}
              playerEn={playerEn}
              audience={audience}
              light={light}
              labV={labV}
              conceptV={conceptV}
              guest={outside}
              download={!guest}
              fmt={fmt}
              t={t}
            />
          )}
        </ViewTransition>
        <SubjectPlaylist
          {...panel}
          morph={syllabusMorph(id)}
          position={position}
          next={next && { href: itemHref(path, panel.keep, next.node.video.id), title: stripPrefix(next.node.video.title) }}
          currentId={found.item.id}
          upNext={upNext}
          doc={doc}
          finish={finish}
          pagesOnly={found.item.kind === "slide" || found.item.kind === "sheet"}
        />
      </div>
    </div>
  );
}
