"use client";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  FileQuestion,
  FileText,
  ImageIcon,
  Lock,
  MapPin,
  NotebookText,
  Play,
  Radio,
  School,
  Star,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { BookFace } from "@/design-system/atoms/book-face";
import { ContentIcon } from "@/design-system/atoms/content-icon";
import { BOOK_COLOR, type BookFamily } from "@/design-system/foundations/book";
import { subjectIcons } from "@/design-system/foundations/subject-icons";
import { Sample } from "@/components/landing/ui";
import { useVisitor } from "@/features/segment/visitor";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { CatalogView } from "@/lib/api/catalog";
import type { BatchClass, FreeClass, FreeShelfItem, RecentItem } from "@/lib/api";
import type { CatalogProduct } from "@/lib/api/schemas";
import { cn } from "@/lib/cn";
import { createFormatter, fill, type Formatter } from "@/lib/format";
import { LIVE_PASSES } from "@/lib/guest";
import { setCourses } from "@/lib/cart";
import { englishCentres, links, paths, proof } from "@/data/landing/site";
import { offlineCourses } from "@/data/landing/centres";
import {
  branchNowCourses,
  englishBranches,
  englishCourseFacts,
  lastMinuteSample,
  masterbookBundles,
  masterbooks,
  masterbookStore,
  squareCovers,
} from "@/data/segment-home";
import { BatchRoutine } from "./batch-routine";
import { BundlePile, MasterbookCover } from "./masterbook";
import { SubjectFolder } from "@/components/course/subject-folder";
import { ShelfScroller } from "@/components/library/shelf-scroller";
import { weekStart } from "@/lib/api/routine";
import { dhakaDay, shiftDay } from "@/lib/time";
import { Segmented } from "@/design-system/molecules/segmented";
import { ENGLISH_ID, glideTo } from "./english-jump";
import { FreeFolders } from "./free-folders";
import { FreeNow } from "./free-now";
import { FreeVsPaid } from "./free-vs-paid";
import { SinglesRail } from "./singles-rail";
import { Facts, LoginButton, Plans, singlesToBuy, UnlockList } from "./segment";
import { BARE_ON_PHONE, SECTION_TITLE_BIG } from "./section-title";

type L = Dictionary["segment"];
type CatalogLabels = Dictionary["catalog"];

/** The page's width and side padding (CT44). */
const W = "mx-auto grid w-full max-w-page grid-cols-1 px-4 sm:px-6";
const TITLE = cn("type-title", SECTION_TITLE_BIG);

/*
 * Lab `segment-home` (CT90): the segment page in the signed-in dashboard's shape, so a guest already knows their way
 * around after logging in (the team's brief, 13 Nov). Under the hero (lab `free-routine` v16's, unchanged):
 *   the dashboard's grid: main column = what's on now (routine + exams, each row naming its batch) → just added → the
 *   subject folders; aside = the English batches → what logging in opens.
 *   then full width: offers and bundles with a filter (academic, English & skills, books) and an online / offline
 *   tag; the single subjects, the free vs paid table and the 16 months fold into disclosures under the plans.
 * The server draws the reviews board and the FAQ after it, as before. Guests only; a signed-in student keeps the page.
 */
export function SegmentHome({
  view,
  lang,
  now,
  classes,
  routine,
  exams,
  recent,
  free,
  version,
  superprep = null,
  hero = null,
  types,
  journey,
  segment,
  signedIn,
  l,
  c,
}: {
  view: CatalogView;
  lang: Locale;
  now: number;
  /** The free batch's recorded classes (CT23): which papers have a page of their own, for the folders' books. */
  classes: FreeClass[];
  /** The paid batch's live classes in this stream, and the full routine's link (CT74). */
  routine: { classes: BatchClass[]; fullHref: string };
  exams: BatchClass[];
  /** Stand-in for the batch's latest uploads (the dashboard's feed), shown with the sample marker. */
  recent: RecentItem[];
  /** CT120 (v27): the free things filed by kind; null before v27, where the feed shows. */
  free: FreeShelfItem[] | null;
  /** The lab version showing (`?lab=segment-home@n`): later changes are drawn from their version on, so a kept one stays as it was. */
  version: number;
  /** CT124 (v31): the dashboard's SuperPrep card, server-drawn, under the login card in the aside. */
  superprep?: ReactNode;
  /** CT130 (v36): the page's hero, server-drawn, at the top of the main column, so the aside starts beside it. */
  hero?: ReactNode;
  types: Dictionary["contentType"];
  /** "১৬ মাসে কী পড়বে", server-drawn, with its title for the disclosure. */
  journey: { title: string; node: ReactNode } | null;
  /** `seg=<batch>.<stream>…`: the paper page's way back here (CT28). */
  segment: string;
  /** CT99: signed in from the login pop-up (a new student, no courses): the page with its locks open. */
  signedIn: boolean;
  l: L;
  c: CatalogLabels;
}) {
  // CT121 (v28): the routine's quiet rows, one login under the list. CT123 (v30): the day tabs drawn tighter.
  const quietRoutine = version >= 28;
  const joined = version >= 44;
  const shortCtas = version >= 45;
  // CT146–CT151 (v51): the audit's fixes. No whole subject is free any more (every subject has some free classes), so no
  // subject is "open"; the routine names subjects as the page does; the books scroll in one row on phones.
  const v51 = version >= 51;
  const oneCol = version >= 54;
  // CT161 (v56): every free offer in "তোমার জন্য ফ্রি": the next free live classes and the demo over the folders.
  const v56 = version >= 56;
  const evenGaps = version >= 96;
  // CT239 (segment-page v6): "অ্যাকাডেমিক | ইংলিশ" over the free part; "ইংলিশ" shows only the English sections. The
  // choice is kept in the address (`?tab=english`), replaced rather than pushed, so it survives a reload or a shared link.
  // CT248 (segment-page v7): the tabs gone again; the page is one page for every visitor.
  const tabs = version === 97;
  const [tab, setTab] = useState<"academic" | "english">("academic");
  useEffect(() => {
    if (tabs && new URLSearchParams(location.search).get("tab") === "english") setTab("english");
  }, [tabs]);
  const english = tabs && tab === "english";
  const pickTab = (id: string) => {
    const next = id === "english" ? "english" : "academic";
    setTab(next);
    const params = new URLSearchParams(location.search);
    if (next === "english") params.set("tab", "english");
    else params.delete("tab");
    history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
  };
  // CT162 (v57): the offers as the day's timeline, the newest uploads first; the full routine as the fifth folder.
  const v57 = version >= 57;
  // CT173 (v66): 24px from the site's header to the page's header (was 40), and 16px from it to the first card (was 24).
  const v66 = version >= 66;
  const openSubjects = v51 ? [] : OPEN_SUBJECTS;
  const openParam = openSubjects.length ? `&open=${openSubjects.join(",")}` : "";
  const fmt = useMemo(() => createFormatter(lang, now), [lang, now]);
  const visitor = useVisitor(null);
  const hard = visitor?.known?.hard ?? [];
  const router = useRouter();
  // CT65: every "ভর্তি হও" puts its courses in our cart and opens it.
  const buy = (products: CatalogProduct[]) => {
    const unit = view.billing ? c.perCycle : undefined;
    setCourses({
      items: products.map((p) => ({ id: p.id, title: p.title, img: p.thumbnailUrl ?? null, price: p.price.final, list: p.price.original, unit })),
      back: location.pathname + location.search,
      backLabel: view.batch.name,
    });
    router.push(paths.cart);
  };
  // CT99: signed in, a free class says so and a live one is joined from the full routine; otherwise both ask for the login.
  const login = signedIn ? (
    <span className="inline-flex h-8 items-center rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand-text">{l.homeFreeForYou}</span>
  ) : (
    <LoginButton lang={lang} label={l.login} />
  );
  const demoHref = view.freeClassUrl ?? links.freeClassHsc;

  // CT156 (v54): one column, 960px wide, for the whole page; no routine, no branch card, no SuperPrep; the free content
  // comes second, and the login card closes the free part.
  const w = oneCol ? W.replace("max-w-page", "max-w-column") : W;
  // CT188 (v80): the login card as a free course: a picture on the left (the team's, a sample until then), the title,
  // what unlocks and "ফ্রি এনরোল করো" on the right; on phones the picture on top.
  const loginCard =
    !signedIn &&
    (version >= 80 ? (
      <Card as="section" aria-labelledby="home-login-title" className="grid overflow-hidden p-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* CT192 (v84): the picture inset 4px from the card's edges, its corners rounded to match. */}
        <div
          className={cn(
            "relative grid aspect-video place-items-center bg-brand-soft sm:aspect-auto",
            version >= 84 && "m-1 overflow-hidden rounded-md",
          )}
        >
          {/* CT190 (v82): a realistic stand-in photo (generated, so still marked as a sample) until the team's own picture
              comes: a student at home in the evening, a class on the phone, notes open. The face stays in the phone's 16:9
              crop; on desktop the crop leans right so the phone stays whole. */}
          {version >= 82 ? (
            <Image
              src="/img/home/free-course-sample.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 384px, 100vw"
              className="object-cover object-[80%_35%]"
            />
          ) : (
            <ImageIcon className="size-12 text-brand-text opacity-40" strokeWidth={1.5} aria-hidden />
          )}
          <Sample className="absolute top-3 left-3">{l.homeSample}</Sample>
        </div>
        <div className="grid content-start gap-4 p-5 sm:p-6">
          <h2 id="home-login-title" className="type-title">
            {l.homeFreeCourseTitle}
          </h2>
          <UnlockList n={fmt.number(LIVE_PASSES)} l={l} more each tenten={version >= 97} />
          <div className="grid sm:justify-self-start">
            <LoginButton lang={lang} label={l.homeFreeEnroll} size="md" />
          </div>
        </div>
      </Card>
    ) : (
      <Card as="section" aria-labelledby="home-login-title" className="grid content-start gap-4 p-5 sm:p-6">
        <h2 id="home-login-title" className="type-title">
          {l.unlockTitle}
        </h2>
        <UnlockList n={fmt.number(LIVE_PASSES)} l={l} more={version >= 34} each={v51} wide={oneCol} tenten={version >= 97} />
        {/* In the wide column the button keeps its own width from `sm`, under the list. */}
        <div className={cn("grid", oneCol && "sm:justify-self-start")}>
          <LoginButton lang={lang} label={l.login} size="md" />
        </div>
      </Card>
    ));

  return (
    <div className={cn("grid grid-cols-1 gap-14 sm:gap-16", v66 ? "mt-2" : "mt-6")}>
      {/* The dashboard's grid: the main column and a 340px aside from `xl`; one column below, main first. */}
      <div className={w}>
        <div className={cn("grid grid-cols-1 gap-10 sm:gap-6", !oneCol && (!signedIn || superprep) && "xl:grid-cols-[minmax(0,1fr)_340px]")}>
          {/* CT117 (v25): on phones the sections have no card, so more space between them tells them apart. The login stays a card: it closes the
              dashboard part, a break before the offers. */}
          {/* CT223 (segment-page v5): every section 16px from the next, the gap the hero already had to the one under it. */}
          <div className={cn("grid min-w-0 content-start", evenGaps ? "gap-4" : "gap-10 sm:gap-6")}>
            {/* On phones the hero keeps its 24px to the routine, as when it sat above the grid. */}
            {hero && <div className={evenGaps ? undefined : v66 ? "-mb-6 sm:-mb-2" : "max-sm:-mb-4"}>{hero}</div>}
            {tabs && (
              // From `lg` the switch hugs its two tabs at the column's left; below, it spans the width.
              <div className="lg:justify-self-start">
                <Segmented
                  label={l.homeTabsLabel}
                  items={[
                    { id: "academic", label: l.homeTabAcademic },
                    { id: "english", label: l.homeTabEnglishShort },
                  ]}
                  value={tab}
                  onChange={pickTab}
                  fill="phone"
                />
              </div>
            )}
            {/* CT139 (v44): from `sm` the routine and the branch card are one block, 4px apart, the corners where they meet 4px. */}
            {!oneCol && (
              <div className={cn("grid min-w-0 content-start", joined ? "gap-10 sm:gap-1" : "gap-10 sm:gap-6")}>
                <BatchRoutine
                  key={`routine.${view.batch.id}.${view.stream.id}`}
                  classes={routine.classes}
                  exams={exams}
                  hard={hard}
                  now={now}
                  fmt={fmt}
                  l={l}
                  // CT132 (v38): the title names the batch, so a guest sees their year-mates already at it.
                  title={version >= 38 ? fill(l.homeRoutineTitleBatch, { batch: view.batch.name }) : l.homeRoutineTitle}
                  batchTags
                  bareOnPhone
                  className={joined ? "sm:rounded-b-xs" : undefined}
                  tabDays
                  tightDays={version >= 30}
                  glassTrack={version >= 49}
                  open={openSubjects}
                  freeEach={v51}
                  tidy={v51}
                  openTag={
                    quietRoutine ? (
                      <span className="rounded-sm bg-brand-soft px-1.5 py-px text-xs font-semibold text-brand-text">{l.homeOpenTag}</span>
                    ) : (
                      <span className="inline-flex h-8 items-center rounded-full bg-brand-soft px-3 text-xs font-semibold text-brand-text">
                        {l.homeOpenTag}
                      </span>
                    )
                  }
                  quiet={quietRoutine}
                  freeHref={signedIn ? routine.fullHref : `/${lang}/login`}
                  fullHref={`${routine.fullHref}${hard.length ? `&hard=${hard.join(",")}` : ""}${openParam}`}
                  login={quietRoutine ? null : login}
                  joinLogin={
                    quietRoutine ? null : signedIn ? (
                      <Button href={routine.fullHref} size="sm">
                        {l.homeJoin}
                      </Button>
                    ) : (
                      <LoginButton lang={lang} label={l.liveJoin} />
                    )
                  }
                  signedIn={signedIn}
                  footer={
                    quietRoutine ? (
                      <>
                        {/* CT121: one login for the day's free classes, then the demo, lighter. */}
                        {/* CT140 (v45): shorter labels, so the two fit side by side on a phone. */}
                        {!signedIn && <LoginButton lang={lang} label={shortCtas ? l.homeRoutineLoginShort : l.homeRoutineLogin} />}
                        <Button href={demoHref} size="sm" variant="secondary">
                          {shortCtas ? l.homeDemoShort : l.homeDemo}
                          <ArrowUpRight className="size-4" aria-hidden />
                        </Button>
                      </>
                    ) : (
                      <Button href={demoHref} size="sm">
                        {l.homeDemo}
                        <ArrowUpRight className="size-4" aria-hidden />
                      </Button>
                    )
                  }
                />
                {version >= 42 && <BranchNow fmt={fmt} l={l} rows={version >= 43} className={joined ? "sm:rounded-t-xs" : undefined} />}
              </div>
            )}
            {english ? null : free ? (
              <FreeFolders
                items={free}
                view={view}
                lang={lang}
                segment={segment}
                signedIn={signedIn}
                fmt={fmt}
                l={l}
                top={
                  v56 ? (
                    <FreeNow
                      classes={routine.classes}
                      now={now}
                      fmt={fmt}
                      l={l}
                      lang={lang}
                      signedIn={signedIn}
                      joinHref={routine.fullHref}
                      demoHref={demoHref}
                      fullHref={`${routine.fullHref}${hard.length ? `&hard=${hard.join(",")}` : ""}${openParam}`}
                      uploads={v57 ? free.filter((i) => [...view.stream.group, ...view.stream.compulsory].some((s) => s.id === i.subject)) : []}
                      segment={segment}
                      timeline={v57}
                      slim={version >= 58}
                      boxed={version >= 59}
                      samples={version < 59}
                      soft={version >= 60}
                      tiles={version >= 61}
                      stacked={version >= 67}
                      liveBand={version >= 68}
                      classBand={version >= 98}
                      spokenRow={version >= 98}
                      turns={version >= 69}
                      roomRight={version >= 70}
                      sharedLinks={version >= 73}
                      greyPulse={version >= 74}
                      softPulse={version >= 75}
                      calmHeads={version >= 79}
                      moreBelow={version >= 91}
                      uploadRows={version >= 92}
                      oneLine={version >= 97}
                      folderUpload={version >= 98}
                      moreLink={version >= 98}
                    />
                  ) : undefined
                }
                samples={version < 59}
                noRule={version >= 60}
                phoneTwo={version >= 64}
                notesWithSuggestions={version >= 65}
                routineTop={version >= 78}
                newSheet={version >= 78}
                leftRow={version >= 81}
                appIcons={version >= 97}
                moreFree={version >= 97}
                videoOnly={version >= 98}
                practice={
                  version >= 93
                    ? { exam: signedIn ? `/${lang}/superprep` : `/${lang}/login?next=${encodeURIComponent(`/${lang}/superprep`)}`, tenten: "#" }
                    : undefined
                }
                routineHref={v57 ? `${routine.fullHref}${hard.length ? `&hard=${hard.join(",")}` : ""}${openParam}` : undefined}
              />
            ) : (
              <Uploads items={recent} types={types} lang={lang} fmt={fmt} l={l} signedIn={signedIn} />
            )}
            {/* CT221 (segment-page v5): English in view early, between the free content and the subjects. CT248 (v7): not there any
                more; the two courses' free-class booking stays in the English and skills list below. */}
            {version >= 98 ? null : version >= 97 ? <OfflineClassroom l={l} /> : version >= 96 && <EnglishBanner l={l} />}
            {!english && (
              <Books
                view={view}
                classes={routine.classes}
                papers={classes}
                segment={segment}
                lang={lang}
                fullHref={`${routine.fullHref}${hard.length ? `&hard=${hard.join(",")}` : ""}${openParam}`}
                now={now}
                fmt={fmt}
                l={l}
                cornerFree={version >= 33}
                openIds={openSubjects}
                phoneRow={v51}
                racks={version >= 62}
                twoRows={version >= 63}
                noWeek={version >= 65}
                oneBook={version >= 76}
                shelf={version >= 77}
              />
            )}
            {oneCol && !english && loginCard}
          </div>
          {/* CT111 (v19): the English batches card moved into the classroom card under the masterbooks. */}
          {!oneCol && (!signedIn || superprep) && (
            <aside
              className={cn(
                "grid min-w-0 content-start gap-6",
                // CT130: beside the hero it stays in view while the long main column scrolls (under the 64px header), when
                // the window is tall enough to hold it whole.
                hero && "xl:top-20 xl:self-start xl:[@media(min-height:56rem)]:sticky",
              )}
            >
              {loginCard}
              {superprep}
            </aside>
          )}
        </div>
      </div>

      <div className={cn(w, "grid gap-14 sm:gap-16")}>
        <Offers
          view={view}
          journey={journey}
          fmt={fmt}
          l={l}
          c={c}
          buy={buy}
          bundleButton={version >= 40}
          englishFirst={version >= 41 && version < 97}
          cleanPlans={version >= 46}
          planFaces={version >= 47}
          planInk={version >= 48}
          planGold={version >= 50}
          simplePlans={v51}
          allClassroom={oneCol}
          storeLink={version >= 55}
          bareTitle={version >= 55}
          lastMinute={version >= 85}
          planThumbs={version >= 86}
          planThumbSide={version >= 87}
          planSquares={version >= 89}
          hscCourses={version >= 90}
          skillsTitle={version >= 96}
          freeClass={version >= 96}
          bigThumbs={version >= 97}
          englishOnly={english}
        />
      </div>
      {v51 && !english && <PlanBar l={l} />}
    </div>
  );
}

/**
 * CT150 (v51): on phones the plans start some five screens down, so once past the top a slim bar at the bottom offers a
 * jump to them; it slides away when the plans come into view.
 */
function PlanBar({ l }: { l: L }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => {
      const plans = document.getElementById("plans");
      const top = plans ? plans.getBoundingClientRect().top : Infinity;
      setShow(window.scrollY > 480 && top > window.innerHeight);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  return (
    <div
      aria-hidden={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-overlay px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 motion-reduce:transition-none sm:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{l.homePlanBar}</p>
        <Button href="#plans" size="sm" tabIndex={show ? undefined : -1} className="shrink-0">
          {l.homePlanBarCta}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/* ---------- just added ---------- */

/** The dashboard's recent card for a guest: every item locked behind a login. The data is one student's feed, so it is marked. */
/** A feed item's subject ("রসায়ন ১ম পত্র") to its book colour; anything else (ফ্রিল্যান্সিং) takes the neutral one. */
const UPLOAD_FAMILY: [RegExp, BookFamily][] = [
  [/পদার্থ|ফিজিক্স/, "physics"],
  [/রসায়ন|কেমিস্ট্রি/, "chemistry"],
  [/জীব|বায়োলজি/, "biology"],
  [/গণিত|ম্যাথ/, "math"],
  [/আইসিটি|ICT/i, "ict"],
  [/বাংলা/, "bangla"],
  [/ইংরেজি|English/i, "english"],
];
const uploadColor = (subject: string) => BOOK_COLOR[UPLOAD_FAMILY.find(([re]) => re.test(subject))?.[1] ?? "other"];
const UPLOAD_ICON = { video: Play, quiz: FileQuestion, note: NotebookText, pdf: FileText, live: Radio } as const;

/**
 * CT95 (v5): the newest upload as a large card in its subject's book colour (a "নতুন" tag, the type's icon large, a
 * play mark for a video), the next four as small cards beside it, two by two, each with a stripe of its subject's
 * colour as the folders' books have. One small lock per card, and one line under them: logging in opens them all.
 * Phones: the large card first, the small ones one per row. v4's list is on the drafts board (`segment-uploads-list`).
 */
function Uploads({
  items,
  types,
  lang,
  fmt,
  l,
  signedIn,
}: {
  items: RecentItem[];
  types: Dictionary["contentType"];
  lang: Locale;
  fmt: Formatter;
  l: L;
  signedIn: boolean;
}) {
  if (!items.length) return null;
  const [lead, ...rest] = items.slice(0, 5);
  const LeadIcon = UPLOAD_ICON[lead.type];
  // CT99: signed in, an item opens itself; a guest's opens the login.
  const open = (item: RecentItem) => (signedIn ? item.url : `/${lang}/login`);
  const meta = (item: RecentItem) => `${item.subject} · ${fmt.ago(item.uploadedAt)}`;
  return (
    <Card as="section" aria-labelledby="home-uploads-title" className={cn("grid content-start gap-4 p-5 sm:p-6", BARE_ON_PHONE)}>
      <header className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="home-uploads-title" className="type-title">
            {l.homeUploadsTitle}
          </h2>
          <Sample>{l.homeSample}</Sample>
        </div>
        <p className="text-sm text-muted">{l.homeUploadsLead}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Link
          href={open(lead)}
          className="group/up relative grid min-h-56 content-between gap-4 overflow-hidden rounded-lg p-4 text-on-fill press lift hover:shadow-raised sm:p-5"
          style={{ backgroundColor: uploadColor(lead.subject) }}
        >
          {/* The book's own light: a sheen from the top left, as on the covers. */}
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgb(255_255_255/0.22),transparent_55%)]" />
          <LeadIcon aria-hidden className="absolute -right-6 -bottom-6 size-40 opacity-15" />
          <span className="relative flex items-center gap-2">
            <span className="rounded-sm bg-surface px-1.5 py-px text-xs font-bold text-text">{l.homeUploadsNew}</span>
            <span className="text-sm font-semibold opacity-90">{types[lead.type]}</span>
            {!signedIn && <Lock className="ml-auto size-4 opacity-90" aria-label={l.homeFolderLocked} />}
          </span>
          {lead.type === "video" && (
            <span
              aria-hidden
              className="relative grid size-14 place-items-center justify-self-center rounded-full bg-surface/25 ring-1 ring-surface/40 backdrop-blur-sm transition-transform group-hover/up:scale-110 motion-reduce:transition-none"
            >
              <Play className="ml-0.5 size-6 fill-current" />
            </span>
          )}
          <span className="relative grid gap-1">
            <span className="line-clamp-3 type-title">{lead.title}</span>
            <span className="text-sm opacity-90">{meta(lead)}</span>
          </span>
        </Link>
        {/* CT115 (v23): on phones the small cards are a row that slides, two in view and the third peeking, not a long list. */}
        {rest.length > 0 && (
          <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0">
            {rest.map((item) => (
              <li key={item.id} className="w-[44%] min-w-0 shrink-0 snap-start sm:w-auto">
                <Card as={Link} href={open(item)} interactive className="grid h-full content-start gap-2 p-3">
                  <span className="flex items-center gap-2">
                    <ContentIcon type={item.type} size="sm" className="ring-0" />
                    <span className="text-xs font-semibold text-subtle">{types[item.type]}</span>
                    {!signedIn && <Lock className="ml-auto size-3.5 text-subtle" aria-label={l.homeFolderLocked} />}
                  </span>
                  <span className="line-clamp-3 text-sm leading-snug font-semibold sm:line-clamp-2">{item.title}</span>
                  <span className="mt-auto flex min-w-0 gap-1 text-xs text-subtle">
                    <span className="min-w-0 truncate">{item.subject}</span>
                    <span aria-hidden>·</span>
                    <span className="shrink-0">{fmt.ago(item.uploadedAt)}</span>
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
      {!signedIn && (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock className="size-4 shrink-0" aria-hidden />
          {l.homeUploadsUnlock}
        </p>
      )}
    </Card>
  );
}

/* ---------- subject books ---------- */

/** How a paper's title names it ("জীববিজ্ঞান ১ম পত্র"). */
const PAPER_MARK = ["১ম", "২য়", "৩য়"];
/** CT104: the subjects a guest opens whole without a login (students rarely pay for them). */
const OPEN_SUBJECTS = ["bangla", "ict"];
const FAMILIES: BookFamily[] = ["physics", "chemistry", "biology", "math", "ict", "bangla", "english"];
const MARK = {
  physics: "atom",
  chemistry: "flask",
  biology: "leaf",
  math: "calculator",
  ict: "globe",
  bangla: "book",
  english: "languages",
  other: "book",
} as const;

/**
 * CT94 (v4): one folder per subject of the stream, in the stream's order: the course home's subject folder
 * (`SubjectFolder`), its papers standing as books in the subject's colour. Any book opens the full routine filtered to
 * that subject (`/routine?batch=…&subject=…`), so the guest sees every live class of it, the free ones marked. Under the
 * folder, how many live classes the subject has this week. v2's single books are on the drafts board (`segment-books`).
 */
function Books({
  view,
  classes,
  papers,
  segment,
  lang,
  fullHref,
  now,
  fmt,
  l,
  cornerFree = false,
  openIds = OPEN_SUBJECTS,
  phoneRow = false,
  racks = false,
  twoRows = false,
  noWeek = false,
  oneBook = false,
  shelf = false,
}: {
  view: CatalogView;
  classes: BatchClass[];
  papers: FreeClass[];
  segment: string;
  lang: Locale;
  fullHref: string;
  now: number;
  fmt: Formatter;
  l: L;
  /** CT126 (v33): an open subject's "ফ্রি" in the pocket's corner, not under its name. */
  cornerFree?: boolean;
  /** CT146 (v51): the subjects free whole (none from v51). */
  openIds?: string[];
  /** CT150 (v51): on phones the books in one row that scrolls sideways, not two to a row down the screen. */
  phoneRow?: boolean;
  /**
   * CT168 (v62): each subject a rack, as the library's shelves: its papers stand as books on a board that carries the
   * subject's name. Each book is the one thing to tap (its paper's page); the folder, with books peeking out of a pocket,
   * left phone users unsure whether to tap the folder or a book.
   */
  racks?: boolean;
  /** CT169 (v63): on phones the racks in two rows that scroll sideways together. */
  twoRows?: boolean;
  /** CT172 (v65): no "এ সপ্তাহে Nটা লাইভ ক্লাস" under the racks. */
  noWeek?: boolean;
  /**
   * CT183 (v76): one book a subject, as the singles' rail draws it (its colour, shrink-wrapped, the name and the papers on
   * the cover, the subject's mark): two rows. Each paper on the cover is its own link to the paper's page, so a tap is
   * never unsure; no prices on this page.
   */
  oneBook?: boolean;
  /**
   * CT184 (v77): the library's shelf, smaller: each paper its own full-colour book (the subject small, the paper large,
   * the subject's mark), a subject's books standing together over its name on the board; two shelves (four subjects,
   * then three), scrolling sideways together on phones. Each book opens its paper's page.
   */
  shelf?: boolean;
}) {
  const subjects = [...view.stream.group, ...view.stream.compulsory];
  const start = weekStart(dhakaDay(now));
  const end = shiftDay(start, 7);

  if (shelf) {
    // A subject's books and where each opens: the paper's page, else (no page yet) the subject's routine.
    const groups = subjects.map((s) => {
      const name = classes.find((k) => k.subject === s.id)?.subjectName;
      const routineHref = name ? `${fullHref}&subject=${encodeURIComponent(name)}` : fullHref;
      const pages = [...new Map(papers.filter((k) => k.subject === s.id).map((k) => [k.paperId, k.paper])).entries()];
      const family: BookFamily = FAMILIES.includes(s.id as BookFamily) ? (s.id as BookFamily) : "other";
      const n = Math.max(1, s.papers);
      const books = Array.from({ length: n }, (_, k) => {
        const page = pages.find(([, title]) => title.includes(PAPER_MARK[k]))?.[0];
        const label = n === 1 ? s.name : (l.homePapers[k] ?? s.name);
        return {
          id: `${s.id}-${k}`,
          label,
          href: page ? `/${lang}/subject/${page}?${segment}` : routineHref,
          openLabel: fill(l.homeFolderGo, { name: n === 1 ? s.name : `${s.name} ${label}` }),
        };
      });
      return { s, family, n, books };
    });
    const shelves = [groups.slice(0, 4), groups.slice(4)].filter((g) => g.length > 0);
    return (
      <Card as="section" aria-labelledby="home-books-title" className={cn("grid content-start gap-4 p-5 sm:p-6", BARE_ON_PHONE)}>
        <header className="grid gap-1">
          <h2 id="home-books-title" className="type-title">
            {l.homeFoldersTitle}
          </h2>
          <p className="text-sm text-muted">{fill(l.homeFoldersCount, { n: fmt.number(subjects.length) })}</p>
        </header>
        {/* The two shelves scroll as one on phones; from `sm` they fit. */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="grid w-max min-w-full gap-5">
            {shelves.map((row, r) => (
              <ul key={r} className="relative flex items-end gap-6 px-4 pt-3 sm:gap-8 sm:px-5">
                {/* The board, under every book; the subjects' names sit on its front. */}
                <li
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-sm"
                  style={{ background: "var(--shelf-board)", boxShadow: "var(--shadow-shelf)" }}
                />
                {row.map(({ s, family, n, books }) => (
                  <li key={s.id} className="relative grid justify-items-center">
                    <ul className="flex items-end gap-2">
                      {books.map((b) => (
                        <li key={b.id}>
                          <Link href={b.href} aria-label={b.openLabel} className="group/sb block w-18 rounded-md outline-offset-4 sm:w-20">
                            <BookFace
                              family={family}
                              mark={subjectIcons[MARK[family]]}
                              markClassName="right-1 bottom-1.5 size-8"
                              className="group-hover/sb:-translate-y-1 group-hover/sb:[transform:rotateY(-14deg)] group-focus-visible/sb:-translate-y-1 motion-reduce:group-hover/sb:transform-none"
                            >
                              <span className="relative flex min-w-0 flex-col gap-0.5 p-2 pl-[calc(10%+0.5rem)]">
                                {n > 1 && <span className="truncate text-[0.625rem] leading-tight font-semibold opacity-85">{s.name}</span>}
                                <span className={cn("leading-tight font-bold", n > 1 ? "text-sm" : "text-xs")}>{b.label}</span>
                              </span>
                            </BookFace>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <span className="flex h-8 max-w-full items-center px-1">
                      <span className="truncate text-xs font-semibold tracking-wide text-muted">{s.name}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" aria-labelledby="home-books-title" className={cn("grid content-start gap-4 p-5 sm:p-6", BARE_ON_PHONE)}>
      <header className="grid gap-1">
        <h2 id="home-books-title" className="type-title">
          {l.homeFoldersTitle}
        </h2>
        {/* CT115 (v23): the lead is just the count; the green tag and the books say the rest. */}
        <p className="text-sm text-muted">{fill(l.homeFoldersCount, { n: fmt.number(subjects.length) })}</p>
      </header>
      <div className="@container">
        <ul
          className={cn(
            oneBook
              ? "grid grid-cols-2 gap-x-6 gap-y-8 @md:grid-cols-3 @2xl:grid-cols-4"
              : racks
                ? "grid grid-cols-1 gap-x-4 gap-y-6 @md:grid-cols-2 @2xl:grid-cols-3"
                : "grid grid-cols-2 gap-x-5 gap-y-6 @xl:grid-cols-3 @3xl:grid-cols-4",
            phoneRow &&
              (oneBook
                ? "max-sm:-mx-4 max-sm:auto-cols-[8.5rem] max-sm:grid-flow-col max-sm:grid-cols-none max-sm:grid-rows-2 max-sm:gap-x-4 max-sm:gap-y-6 max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pt-2 max-sm:pb-2"
                : racks && twoRows
                  ? "max-sm:-mx-4 max-sm:auto-cols-[15rem] max-sm:grid-flow-col max-sm:grid-cols-none max-sm:grid-rows-2 max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-2"
                  : "max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-2"),
          )}
        >
          {subjects.map((s) => {
            const mine = classes.filter((k) => k.subject === s.id);
            const week = mine.filter((k) => {
              const d = dhakaDay(Date.parse(k.startsAt));
              return d >= start && d < end;
            }).length;
            // The routine's own subject name ("ফিজিক্স") is its filter's value; without classes, the whole routine.
            const name = mine[0]?.subjectName;
            const routineHref = name ? `${fullHref}&subject=${encodeURIComponent(name)}` : fullHref;
            // The subject's papers that have a page (the syllabus, CT28), in order: "… ১ম পত্র" before "… ২য় পত্র".
            const pages = [...new Map(papers.filter((k) => k.subject === s.id).map((k) => [k.paperId, k.paper])).entries()];
            const pageOf = (k: number) => pages.find(([, title]) => title.includes(PAPER_MARK[k]))?.[0];
            const open = openIds.includes(s.id);
            const family: BookFamily = FAMILIES.includes(s.id as BookFamily) ? (s.id as BookFamily) : "other";
            const n = Math.max(1, s.papers);
            const books = Array.from({ length: n }, (_, k) => {
              const label = n === 1 ? s.name : (l.homePapers[k] ?? s.name);
              const page = pageOf(k);
              const href = open ? routineHref : page ? `/${lang}/subject/${page}?${segment}` : routineHref;
              return {
                id: `${s.id}-${k}`,
                label,
                href,
                openLabel: fill(open ? l.homeFolderFreeRoutine : l.homeFolderGo, { name: n === 1 ? s.name : `${s.name} ${label}` }),
              };
            });
            const week_ = week > 0 ? fill(l.homeFolderWeek, { n: fmt.number(week) }) : l.homeFolderNoClass;
            if (oneBook)
              return (
                <li key={s.id} className={cn("min-w-0", phoneRow && "max-sm:snap-start")}>
                  <div className="w-full max-w-44">
                    <BookFace family={family} owned={false} mark={subjectIcons[MARK[family]]} markClassName="right-2 bottom-2 size-12">
                      <span className="relative flex min-w-0 flex-col gap-2 p-3 pl-[calc(10%+0.75rem)]">
                        <span className="text-base leading-tight font-bold whitespace-nowrap sm:text-xl">{s.name}</span>
                        {/* The papers, each its own link: a row tall enough for a thumb, the name and an arrow. */}
                        <span className="-ml-1 grid">
                          {books.map((b, k) => (
                            <Link
                              key={b.id}
                              href={b.href}
                              aria-label={b.openLabel}
                              className="group/pp relative z-10 flex min-h-9 items-center gap-1 rounded-sm px-1.5 text-sm font-semibold opacity-85 transition-[background-color,opacity] hover:bg-on-fill/40 hover:opacity-100"
                            >
                              <span className="truncate">{n === 1 ? l.paperOne : (l.homePapers[k] ?? b.label)}</span>
                              <ChevronRight className="size-4 shrink-0 opacity-60 transition-transform group-hover/pp:translate-x-0.5" aria-hidden />
                            </Link>
                          ))}
                        </span>
                      </span>
                      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--book-wrap)" }} />
                    </BookFace>
                  </div>
                </li>
              );
            if (racks)
              return (
                <li
                  key={s.id}
                  className={cn("grid min-w-0 gap-2", phoneRow && (twoRows ? "max-sm:snap-start" : "max-sm:w-64 max-sm:shrink-0 max-sm:snap-start"))}
                >
                  <div className="overflow-hidden rounded-card border border-border bg-gradient-to-b from-surface to-raised">
                    <ul className="flex items-end justify-center gap-4 px-4 pt-6">
                      {books.map((b) => (
                        <li key={b.id}>
                          <Link href={b.href} aria-label={b.openLabel} className="group/rb block w-24 rounded-md outline-offset-4 sm:w-26">
                            <BookFace
                              family={family}
                              mark={subjectIcons[MARK[family]]}
                              markClassName="right-1.5 bottom-3 size-11"
                              className="group-hover/rb:-translate-y-1.5 group-hover/rb:[transform:rotateY(-14deg)] group-focus-visible/rb:-translate-y-1.5 motion-reduce:group-hover/rb:transform-none"
                            >
                              <span className="relative flex min-w-0 flex-col gap-1 p-2.5 pl-4">
                                {n > 1 && <span className="truncate text-xs font-semibold opacity-80">{s.name}</span>}
                                <span className="text-lg leading-tight font-bold">{b.label}</span>
                              </span>
                            </BookFace>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {/* The board the books stand on, the subject's name on its front, as the library labels its sections. */}
                    <div
                      className="grid h-10 place-items-center px-3 text-sm font-semibold tracking-wide text-muted"
                      style={{ background: "var(--shelf-board)", boxShadow: "var(--shadow-shelf)" }}
                    >
                      {s.name}
                    </div>
                  </div>
                  {!noWeek && <span className="text-xs leading-snug text-muted">{week_}</span>}
                </li>
              );
            return (
              <li key={s.id} className={cn("grid min-w-0 gap-2", phoneRow && "max-sm:w-40 max-sm:shrink-0 max-sm:snap-start")}>
                <SubjectFolder
                  centered
                  tintOnPhone
                  cornerTag={open && cornerFree ? l.homeFolderOpenAll : undefined}
                  badge={
                    open && !cornerFree ? (
                      <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-brand-text">
                        {l.homeFolderOpenAll}
                      </span>
                    ) : null
                  }
                  name={s.name}
                  icon={subjectIcons[MARK[family]]}
                  family={family}
                  papers={Array.from({ length: n }, (_, k) => {
                    const label = n === 1 ? s.name : (l.homePapers[k] ?? s.name);
                    const page = pageOf(k);
                    // CT114 (v22): every book opens, no lock; inside, the paper's page asks a guest to log in for anything but a free class.
                    // An open subject's book (CT104) opens its routine with every class free.
                    const href = open ? routineHref : page ? `/${lang}/subject/${page}?${segment}` : routineHref;
                    return {
                      id: `${s.id}-${k}`,
                      label,
                      href,
                      openLabel: fill(open ? l.homeFolderFreeRoutine : l.homeFolderGo, {
                        name: n === 1 ? s.name : `${s.name} ${label}`,
                      }),
                    };
                  })}
                />
                <span className="text-xs leading-snug text-muted">
                  {week > 0 ? fill(l.homeFolderWeek, { n: fmt.number(week) }) : l.homeFolderNoClass}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/* ---------- English and skills: the classroom ---------- */

/**
 * CT112 (v20): the offline courses as a place, the way the books are a shelf. One card: on the left the centre (its
 * branches as map pins, the free-class booking), on the right every course as a small thumbnail with its age. The
 * branches say "offline", so no card carries the tag; the aside's English batches card is folded in here.
 */
function Classroom({
  fmt,
  l,
  skip = [],
  confirmed = false,
  hscOnly = false,
  freeClass = false,
  bigThumbs = false,
}: {
  fmt: Formatter;
  l: L;
  skip?: string[];
  /** CT159 (v55): only what the live site confirms: no sample batch count, no branch missing from the centre list. */
  confirmed?: boolean;
  /**
   * CT198 (v90): only the courses for an HSC student and after (the centre's "senior" ones: Spoken English, Grammar &
   * Writing, IELTS, Study Abroad), and no branch panel. Kids' English and Spoken English Junior stay on the home page's
   * English section; the branches and the free class booking on each course's page and the centre page.
   */
  hscOnly?: boolean;
  /** CT220: a "ফ্রি ক্লাস বুক করো" button on the courses that have a free class (`FREE_CLASS_COURSES`). */
  freeClass?: boolean;
  /**
   * CT229, CT230: one course under another, each picture big (192×108 from `sm`, 128×72 on phones), 16:9 so it shows
   * whole, the name larger; text on one line.
   */
  bigThumbs?: boolean;
}) {
  const branches = confirmed ? knownBranches() : englishBranches;
  const courses = offlineCourses.filter((p) => !skip.includes(p.id) && (!hscOnly || p.age === "senior"));
  return (
    <Card
      as="div"
      data-flash
      className={cn(
        // CT227: the glow on landing; on phones, with no card edge, each course's box lights up instead.
        "grid gap-5 p-4 transition-shadow duration-500 data-[flash=on]:ring-2 data-[flash=on]:ring-brand max-sm:data-[flash=on]:ring-0 sm:p-5",
        !hscOnly && "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6",
        BARE_ON_PHONE,
      )}
    >
      {/* CT117: with no card around it on phones, the centre is a white panel of its own. */}
      {!hscOnly && (
        <div className="grid content-start gap-4 rounded-md bg-raised p-4 max-sm:border max-sm:border-border max-sm:bg-surface sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-brand-text ring-1 ring-border ring-inset">
              <School className="size-5" aria-hidden />
            </span>
            <div className="grid gap-0.5">
              <h3 className="type-title">{fill(l.homeEnglishLead, { n: fmt.number(branches.length) })}</h3>
              {!confirmed && (
                <Sample className="justify-self-start">
                  {l.homeEnglishBatches}: {l.homeSample}
                </Sample>
              )}
            </div>
          </div>
          <BranchPins l={l} onlyKnown={confirmed} />
          <Button href={links.englishCentreFreeClass} size="md" variant="secondary" className="justify-self-start">
            {l.homeEnglishBook}
            <ArrowUpRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
      {/* CT208: on phones each course is a white box with a chevron, so it reads as tappable. */}
      {/* CT230 (v6): one course under another, each picture big enough to catch the eye. */}
      <ul className={cn("grid content-center gap-x-6 gap-y-2", bigThumbs ? "sm:gap-y-2" : "sm:grid-cols-2 sm:gap-y-1")}>
        {courses.map((p) => {
          const book = freeClass && FREE_CLASS_COURSES.includes(p.id);
          // CT241 (v6): what the course gives, three lines from its own product page.
          const facts = bigThumbs ? englishCourseFacts[p.id] : undefined;
          return (
            <li
              key={p.id}
              className={cn(
                book &&
                  "flex items-center gap-2 rounded-md transition-colors duration-500 max-sm:grid max-sm:gap-0 max-sm:border max-sm:border-border max-sm:bg-surface max-sm:pb-2 max-sm:in-data-[flash=on]:border-brand",
              )}
            >
              <a
                href={p.href}
                className={cn(
                  "group/oc flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 press hover:bg-raised",
                  facts && "max-sm:flex-wrap",
                  bigThumbs && "sm:gap-5",
                  !book && "max-sm:border max-sm:border-border max-sm:bg-surface max-sm:pr-3 max-sm:in-data-[flash=on]:border-brand",
                  book && "max-sm:pr-3",
                )}
              >
                <span
                  className={cn(
                    "relative block shrink-0 overflow-hidden rounded-sm bg-raised ring-1 ring-border ring-inset",
                    bigThumbs ? "aspect-video w-32 rounded-md sm:w-48" : "aspect-[4/3] w-16 sm:w-20",
                  )}
                >
                  <Image src={p.img} alt="" fill sizes="192px" className={p.contain ? "object-contain p-1" : "object-cover"} />
                </span>
                <div className={cn("grid min-w-0 gap-0.5", facts && "max-sm:flex-1 max-sm:basis-0")}>
                  <span
                    className={cn(
                      "font-semibold group-hover/oc:text-brand-text",
                      // On phones a long name ("English Grammar & Writing") takes two lines rather than losing its end.
                      bigThumbs ? "text-base leading-snug max-sm:line-clamp-2 sm:truncate sm:type-title" : "truncate text-sm",
                    )}
                  >
                    {p.title}
                  </span>
                  <span className={cn("truncate text-muted", bigThumbs ? "text-sm" : "text-xs")}>{p.ageLabel}</span>
                  {facts && <CourseFacts facts={facts} className="mt-1 max-sm:hidden" />}
                </div>
                <ChevronRight className="ml-auto size-4 shrink-0 text-subtle sm:hidden" aria-hidden />
                {/* On phones the facts take the row's full width under the picture and the name. */}
                {facts && <CourseFacts facts={facts} className="basis-full px-1 pb-1 sm:hidden" />}
              </a>
              {/* CT220: the booking beside the course on desktop, full width under it in the course's box on phones. */}
              {book && (
                <Button
                  href={links.englishCentreFreeClass}
                  size="sm"
                  variant="secondary"
                  aria-label={`${l.homeEnglishBook}: ${p.title}`}
                  className="shrink-0 max-sm:mx-2 max-sm:w-auto"
                >
                  {l.homeEnglishBook}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/**
 * CT221 (segment-page v5): a slim English banner between the free content and the subjects, so English is seen early
 * without pushing the subjects down: three course thumbnails, the centre's own line ("ক্লাসরুমে ইংরেজি শেখার নতুন
 * আনন্দ", live home page), how many centres and which courses have a free class, the booking, and a link down to the full
 * "ইংলিশ ও স্কিলস কোর্স" list. CT222: a white card like the sections around it (it had a soft blue tint). CT224: one
 * picture at a time instead of three overlapping, the centres as named chips, "আরও দেখো" for the link. On phones the
 * booking runs full width.
 */
function EnglishBanner({ l }: { l: L }) {
  const thumbs = ["spoken", "ielts", "grammar"].map((id) => offlineCourses.find((p) => p.id === id)).filter((p) => !!p);
  // CT224: one course picture at a time, the next every 3 seconds; still for anyone who asks for reduced motion.
  // CT225: the frame 16:9, the pictures' own shape, so each shows whole.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setShown((i) => (i + 1) % thumbs.length), 3000);
    return () => clearInterval(t);
  }, [thumbs.length]);
  return (
    <Card as="section" aria-labelledby="home-english-banner-title" className="grid gap-4 p-4 sm:flex sm:items-center sm:gap-6 sm:p-5">
      {/* On phones the chips take the card's full width under the picture and the title; from `sm` they sit under the title. */}
      <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 sm:gap-y-2">
        <span aria-hidden className="relative block aspect-video w-32 shrink-0 overflow-hidden rounded-md bg-raised sm:row-span-2 sm:w-40">
          {thumbs.map((p, i) => (
            <Image
              key={p.id}
              src={p.img}
              alt=""
              fill
              sizes="160px"
              className={cn("object-cover transition-opacity duration-700", i === shown ? "opacity-100" : "opacity-0")}
            />
          ))}
          <span className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
            {thumbs.map((p, i) => (
              <span key={p.id} className={cn("h-1.5 rounded-full bg-on-fill transition-all", i === shown ? "w-3" : "w-1.5 opacity-60")} />
            ))}
          </span>
        </span>
        <div className="grid min-w-0 gap-1 sm:self-end">
          <h2 id="home-english-banner-title" className="type-title">
            {l.homeEnglishBannerTitle}
          </h2>
          <p className="text-sm text-muted">{l.homeEnglishBannerFree}</p>
        </div>
        {/* CT224: the centres by name, as the classroom card's map pins. */}
        <div className="col-span-2 self-start sm:col-span-1 sm:col-start-2">
          <BranchPins l={l} onlyKnown />
        </div>
      </div>
      <div className="grid shrink-0 items-center gap-1 sm:flex sm:gap-4">
        <Button href={links.englishCentreFreeClass} size="md" className="max-sm:w-full">
          {l.homeEnglishBook}
        </Button>
        <a
          href={`#${ENGLISH_ID}`}
          // CT226: a smooth scroll down to the list (a jump for anyone who asks for reduced motion).
          onClick={(e) => glideTo(ENGLISH_ID) && e.preventDefault()}
          className="inline-flex min-h-11 items-center justify-center gap-1 text-sm font-semibold text-brand-text hover:underline"
        >
          {l.homeOfferMore}
          <ArrowDown className="size-4" aria-hidden />
        </a>
      </div>
    </Card>
  );
}

/**
 * CT232 (segment-page v6): in place of the banner, "তোমার জন্য অফলাইন ক্লাসরুমে" (CT237: "সেন্টারে এসে শেখো"): the two courses with a free class,
 * one under another as in the full English list (a 16:9 picture and the name), each with the centres it runs
 * at and its own "ফ্রি ক্লাস বুক করো" (secondary, CT231). Both live product pages send a visitor to "নিকটস্থ যেকোনো
 * ইংলিশ সেন্টারে", so each lists the five live centres until the team gives a per-course list (section 9). "আরও দেখো ↓"
 * still glides to the full list. Phones: picture and name side by side, the centres and the booking full width under.
 * CT233: no age line and no "যেসব সেন্টারে চলছে" label, the pictures smaller (160×90, 112×63 on phones), no box round
 * each course. CT234: the centres as a comma-separated line under the name, not chips. CT235: on phones the two as cards
 * side by side (80% of the width each), scrolled sideways with a snap; from `sm` the rows as before.
 */
function OfflineClassroom({ l }: { l: L }) {
  const courses = FREE_CLASS_COURSES.map((id) => offlineCourses.find((p) => p.id === id)).filter((p) => !!p);
  return (
    // CT236: no outer card on phones, so the course cards get the page's width; from `sm` the white card as before.
    <Card as="section" aria-labelledby="home-classroom-title" className={cn("grid gap-4 p-4 sm:p-5", BARE_ON_PHONE)}>
      <header className="flex items-center justify-between gap-3">
        <h2 id="home-classroom-title" className="type-title">
          {l.homeClassroomTitle}
        </h2>
        <a
          href={`#${ENGLISH_ID}`}
          onClick={(e) => glideTo(ENGLISH_ID) && e.preventDefault()}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-brand-text hover:underline"
        >
          {l.homeOfferMore}
          <ArrowDown className="size-4" aria-hidden />
        </a>
      </header>
      {/* CT235: on phones the two side by side as cards, the second peeking at the edge, a little sideways scroll. */}
      <ul className="grid gap-3 max-sm:-mx-4 max-sm:flex max-sm:snap-x max-sm:snap-mandatory max-sm:scroll-px-4 max-sm:overflow-x-auto max-sm:overscroll-x-contain max-sm:px-4 max-sm:pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {courses.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-3 max-sm:w-[80%] max-sm:shrink-0 max-sm:snap-start max-sm:rounded-md max-sm:border max-sm:border-border max-sm:bg-surface max-sm:p-3 sm:flex-row sm:items-center sm:gap-5"
          >
            <a
              href={p.href}
              tabIndex={-1}
              aria-hidden
              className="relative block aspect-video w-full shrink-0 overflow-hidden rounded-md bg-raised sm:w-40"
            >
              <Image src={p.img} alt="" fill sizes="(max-width: 639px) 300px, 160px" className="object-cover" />
            </a>
            <div className="grid min-w-0 flex-1 content-start gap-1">
              <a href={p.href} className="text-base leading-snug font-semibold hover:text-brand-text hover:underline sm:type-title">
                {p.title}
              </a>
              {/* CT234: the centres as one plain line under the name, comma-separated, on phones too. */}
              <p className="flex items-start gap-1 text-sm text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                {knownBranches().join(", ")}
              </p>
            </div>
            <Button
              href={links.englishCentreFreeClass}
              size="md"
              variant="secondary"
              aria-label={`${l.homeEnglishBook}: ${p.title}`}
              className="shrink-0 max-sm:w-full sm:self-center"
            >
              {l.homeEnglishBook}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * CT220: the courses whose own live pages offer a free class: Spoken English ("ফ্রি ক্লাস বুক করতে…") and IELTS
 * Programme ("IELTS Programme এর ফ্রি ক্লাস বুক করতে…"). Grammar & Writing's page doesn't mention one; Study Abroad is
 * counselling. All book through the centre's free-class page.
 */
const FREE_CLASS_COURSES = ["spoken", "ielts"];

/** CT241, CT246: a course's facts from its product page as one quiet description line, joined with " · " (no checklist). */
function CourseFacts({ facts, className }: { facts: string[]; className?: string }) {
  return <p className={cn("text-sm text-muted", className)}>{facts.join(" · ")}</p>;
}

/** CT159: the brief's branches that the live centre list also has. */
const knownBranches = () => englishBranches.filter((b) => englishCentres.some((c) => c.name === b));

/** The centre's branches as map pins; one the live centre list doesn't have yet (Q74) is dashed and carries the sample marker. */
function BranchPins({ l, onlyKnown = false }: { l: L; onlyKnown?: boolean }) {
  const known = new Set(englishCentres.map((c) => c.name));
  return (
    <ul className="flex flex-wrap gap-1.5">
      {(onlyKnown ? knownBranches() : englishBranches).map((b) => (
        // A branch the live centre list doesn't have yet (Q74) is dashed and carries the sample marker.
        <li
          key={b}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border bg-surface px-2.5 py-1 text-xs",
            known.has(b) ? "border-border" : "border-dashed border-warning/60",
          )}
        >
          <MapPin className="size-3 text-brand-text" aria-hidden />
          {b}
          {!known.has(b) && <span className="sr-only">({l.homeSample})</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * CT137 (v42): under the routine, what the segment's students take at the branches, so the offline side is seen next to
 * the online one. The courses are the live centre page's (their pictures, ages and product pages); the branches have no
 * published timetable, so the card shows no days or times (section 9).
 */
function BranchNow({ fmt, l, rows = false, className }: { fmt: Formatter; l: L; rows?: boolean; className?: string }) {
  const courses = branchNowCourses.map((id) => offlineCourses.find((p) => p.id === id)).filter((p): p is (typeof offlineCourses)[number] => !!p);
  if (!courses.length) return null;
  return (
    <Card as="section" aria-labelledby="home-branch-title" className={cn("grid content-start gap-5 p-5 sm:p-6", className)}>
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="grid min-w-0 gap-1">
          <h2 id="home-branch-title" className="flex flex-wrap items-center gap-2 type-title">
            {l.homeBranchTitle}
            <Tag kind="offline" l={l} />
          </h2>
          <p className="text-sm text-muted">{fill(l.homeBranchLead, { n: fmt.number(englishBranches.length) })}</p>
        </div>
        {!rows && (
          <Button href={links.englishCentreFreeClass} size="sm" variant="secondary" className="max-sm:hidden">
            {l.homeEnglishBook}
            <ArrowUpRight className="size-4" aria-hidden />
          </Button>
        )}
      </header>
      {rows ? (
        // CT138 (v43): the routine's rows, a course to a row: a classroom tile where the time would be, the course and its
        // age, and its free-class booking beside it (under it on phones).
        <ul className="grid grid-cols-1 gap-1">
          {courses.map((p) => (
            <li key={p.id} className="-mx-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-md p-2 sm:flex sm:gap-4">
              <Card as="div" radius="md" aria-hidden className="grid size-14 shrink-0 grid-rows-[1fr_auto] overflow-hidden text-center">
                <div className="grid place-items-center">
                  <School className="size-5 text-brand-text" />
                </div>
                <div className="truncate bg-class-band-class px-1 py-0.5 text-xs leading-4 font-bold text-on-fill">{l.homeBranchBand}</div>
              </Card>
              <a href={p.href} className="group/bc grid min-w-0 flex-1 gap-0.5 rounded-sm">
                <span className="truncate font-semibold group-hover/bc:text-brand-text">{p.title}</span>
                <span className="truncate text-sm text-muted">{p.ageLabel}</span>
              </a>
              <Button href={links.englishCentreFreeClass} size="sm" variant="secondary" className="col-start-2 justify-self-start sm:shrink-0">
                {l.homeEnglishBook}
                <ArrowUpRight className="size-4" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((p) => (
            <li key={p.id}>
              <a
                href={p.href}
                className="group/bc grid overflow-hidden rounded-md bg-surface ring-1 ring-border ring-inset press hover:ring-brand/40"
              >
                <span className="relative block aspect-video overflow-hidden bg-raised">
                  <Image
                    src={p.img}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 360px, 100vw"
                    className="object-cover transition-transform duration-300 group-hover/bc:scale-[1.03] motion-reduce:transition-none"
                  />
                </span>
                <span className="flex items-center gap-3 p-3 sm:p-4">
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-semibold group-hover/bc:text-brand-text">{p.title}</span>
                    <span className="truncate text-sm text-muted">{p.ageLabel}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-subtle group-hover/bc:text-brand-text" aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-4 border-t border-border pt-4 sm:flex sm:items-center sm:justify-between">
        <BranchPins l={l} />
        {!rows && (
          <Button href={links.englishCentreFreeClass} size="sm" variant="secondary" className="justify-self-start sm:hidden">
            {l.homeEnglishBook}
            <ArrowUpRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </Card>
  );
}

/** The brief's online / offline mark. */
function Tag({ kind, l }: { kind: "online" | "offline"; l: L }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold",
        kind === "online" ? "bg-brand-soft text-brand-text" : "bg-raised text-muted ring-1 ring-border ring-inset",
      )}
    >
      {kind === "online" ? <Wifi className="size-3" aria-hidden /> : <School className="size-3" aria-hidden />}
      {kind === "online" ? l.homeOnline : l.homeOffline}
    </span>
  );
}

/* ---------- offers and bundles ---------- */

function Offers({
  view,
  journey,
  fmt,
  l,
  c,
  buy,
  bundleButton = false,
  englishFirst = false,
  englishOnly = false,
  cleanPlans = false,
  planFaces = false,
  planInk = false,
  planGold = false,
  simplePlans = false,
  allClassroom = false,
  storeLink = false,
  bareTitle = false,
  lastMinute = false,
  planThumbs = false,
  planThumbSide = false,
  planSquares = false,
  hscCourses = false,
  skillsTitle = false,
  freeClass = false,
  bigThumbs = false,
}: {
  view: CatalogView;
  journey: { title: string; node: ReactNode } | null;
  fmt: Formatter;
  l: L;
  c: CatalogLabels;
  buy: (products: CatalogProduct[]) => void;
  /** CT135 (v40): a bundle card shows a button, so it reads as something to open and buy. */
  bundleButton?: boolean;
  /** CT136 (v41): the English and skills classroom comes before the masterbooks. */
  englishFirst?: boolean;
  /** CT239: the "ইংলিশ" tab: only the English and skills list; no offers, no masterbooks. */
  englishOnly?: boolean;
  /** CT141 (v46): the plan cards cleaned up (see `Plans`' `clean`). */
  cleanPlans?: boolean;
  /** CT142 (v47): the teachers' small faces on the cleaned cards. */
  planFaces?: boolean;
  /** CT143 (v48): the full plan's band in dark ink. */
  planInk?: boolean;
  /** CT145 (v50): the full plan's band in gold instead (the dark one didn't sit right). */
  planGold?: boolean;
  /** CT147 (v51): plan cards without prices, each opening its product page; a line of proof under the title. */
  simplePlans?: boolean;
  /** CT156 (v54): the branch card is gone with the routine, so the classroom lists every offline course again. */
  allClassroom?: boolean;
  /** CT157 (v55): no row of single books; one quiet button to the store's HSC books. */
  storeLink?: boolean;
  /** CT158 (v55): the offers' title without its lead and proof line. */
  bareTitle?: boolean;
  /** CT193 (v85): four plan cards two by two, with "শেষ মুহূর্তের প্রস্তুতি", none singled out. */
  lastMinute?: boolean;
  /** CT194 (v86): each plan card opens with its course's thumbnail. */
  planThumbs?: boolean;
  /** CT195 (v87): the thumbnail small, at the card's left. */
  planThumbSide?: boolean;
  /** CT197 (v89): every plan picture square in one fixed frame; the last-minute line shorter, on one line. */
  planSquares?: boolean;
  /** CT198 (v90): the classroom card with only the HSC-and-after courses, no branch panel. */
  hscCourses?: boolean;
  /** CT219 (segment-page v5): the section titled "তোমার জন্য ইংলিশ ও স্কিলস কোর্স", not "…অফলাইন কোর্স". */
  skillsTitle?: boolean;
  /** CT220 (segment-page v5): the courses with a free class carry a button to book it. */
  freeClass?: boolean;
  /** CT229, CT230 (segment-page v6): the English courses one under another, their pictures big, in their own 16:9; the section after the masterbooks. */
  bigThumbs?: boolean;
}) {
  // CT102: the stream's own masterbooks, in the stream's subject order, and the store's bundles that cover only its subjects.
  const streamIds = [...view.stream.group, ...view.stream.compulsory].map((x) => x.id);
  const books = masterbooks
    .filter((b) => b.batch === view.batch.id && streamIds.includes(b.subject))
    .sort((a, b) => streamIds.indexOf(a.subject) - streamIds.indexOf(b.subject));
  const bundles = masterbookBundles
    .filter((b) => b.batch === view.batch.id && b.subjects.every((x) => streamIds.includes(x)))
    .map((b) => {
      const inside = books.filter((x) => b.subjects.includes(x.subject));
      // CT105: the pile shows the first paper of each subject in the bundle, in the bundle's order.
      const covers = b.subjects.map((x) => inside.find((k) => k.subject === x)?.img).filter((x): x is string => !!x);
      return { ...b, count: inside.length, covers, separate: inside.reduce((sum, x) => sum + x.price, 0) };
    })
    .sort((a, b) => streamIds.indexOf(a.subjects[0]) - streamIds.indexOf(b.subjects[0]));
  const english = (
    <div id={skillsTitle ? ENGLISH_ID : undefined} className="grid scroll-mt-20 gap-4">
      {/* CT198 (v90): the section names what it now holds, the offline courses for an HSC student. */}
      <GroupTitle big title={hscCourses ? (skillsTitle ? l.homeEnglishSkillsForYou : l.homeOfflineForYou) : l.homeTabEnglish} />
      {/* CT151 (v51): the courses the branch card under the routine already shows aren't listed again. */}
      <Classroom
        fmt={fmt}
        l={l}
        skip={simplePlans && !allClassroom ? branchNowCourses : []}
        confirmed={bareTitle}
        hscOnly={hscCourses}
        freeClass={freeClass}
        bigThumbs={bigThumbs}
      />
    </div>
  );

  return (
    <>
      {/* CT97 (v7): the offers alone, the plans' big cards under one title; the plans' own title stays for screen readers. */}
      <section aria-labelledby="home-offers-title" className={cn("grid gap-4", englishOnly && "hidden")}>
        <header className="grid gap-1">
          <h2 id="home-offers-title" className={cn(TITLE, "flex flex-wrap items-center gap-2")}>
            {l.homeOffersTitle}
            <Tag kind="online" l={l} />
          </h2>
          {/* CT158 (v55): no lead and no proof line; the title and the cards alone. */}
          {!bareTitle && <p className="text-sm text-muted sm:text-base">{l.homeOffersLead}</p>}
          {/* CT149 (v51): the site's own proof, beside the decision rather than at the page's foot. */}
          {simplePlans && !bareTitle && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <Star className="size-4 shrink-0 fill-current text-warning" aria-hidden />
              {fill(l.homeProofLine, { rating: proof.rating, students: proof.academicStudents })}
            </p>
          )}
        </header>
        <Plans
          view={view}
          fmt={fmt}
          guest
          covers={false}
          titled={false}
          bookColors
          clean={cleanPlans}
          faces={planFaces}
          ink={planInk}
          gold={planGold}
          simple={simplePlans}
          rows={bareTitle}
          thumbs={planThumbs}
          thumbSide={planThumbSide}
          squares={planSquares ? squareCovers : undefined}
          lastMinute={
            lastMinute && lastMinuteSample[view.stream.id]
              ? {
                  ...lastMinuteSample[view.stream.id],
                  title: c.finalPrep,
                  note: planSquares ? l.homeLastMinuteNoteShort : l.homeLastMinuteNote,
                  sample: <Sample>{l.homeSample}</Sample>,
                }
              : undefined
          }
          l={l}
          c={c}
          buy={buy}
        />
        {!cleanPlans && <Facts view={view} fmt={fmt} l={l} c={c} />}
        {/* CT106 (v15): the plans' own questions sit right under them, before the other courses and books. */}
        <div className="grid gap-2">
          {singlesToBuy(view.stream).length > 0 && (
            <Disclosure title={l.singlesTitle}>
              <SinglesRail view={view} fmt={fmt} l={l} c={c} buy={buy} />
            </Disclosure>
          )}
          <Disclosure title={l.compareTitle}>
            <FreeVsPaid view={view} fmt={fmt} l={l} unit={view.billing ? c.perCycle : undefined} />
          </Disclosure>
          {journey && <Disclosure title={journey.title}>{journey.node}</Disclosure>}
        </div>
      </section>

      {/* Everything else the page sells, by kind; CT106: no filter, the two groups are short enough to scroll. */}
      {/* CT108 (v17): no title of its own; the masterbooks and the English courses each carry a big one. */}
      <section aria-label={l.homeMoreTitle} className="grid min-w-0 gap-14 sm:gap-16">
        {englishFirst && english}
        {books.length > 0 && !englishOnly && (
          <div className="grid min-w-0 gap-4">
            <GroupTitle
              big
              title={`${view.batch.name} ${l.homeBooksTitle}`}
              tag={<span className="text-sm font-normal text-muted sm:text-base">{l.homeBooksPrinted}</span>}
            />
            {/* CT103 (v12): the bundles lead, large; the single books follow in one row that scrolls sideways.
                CT105 (v14): a bundle is its own books in a pile tied with a ribbon, the count on the bow's tag. */}
            {bundles.length > 0 && (
              <ul className="grid gap-4 md:grid-cols-2">
                {bundles.map((b) => (
                  <li key={b.slug}>
                    <Card
                      as="a"
                      href={links.product(b.slug)}
                      interactive
                      aria-label={`${b.name}, ${fill(l.homeBundleBooks, { n: fmt.number(b.count) })}, ৳${fmt.number(b.price)}`}
                      className="group/bundle flex h-full items-center gap-4 p-4 sm:gap-6 sm:p-5"
                    >
                      <BundlePile covers={b.covers} tag={fill(l.homeBundleBooks, { n: fmt.number(b.count) })} className="w-32 sm:w-40" />
                      <span className="grid min-w-0 gap-1.5">
                        <span className="type-title">{b.name}</span>
                        {/* CT206: what the letters stand for, small and plain. */}
                        <span className="-mt-1 text-sm text-subtle">{b.spelled}</span>
                        <span className="mt-1 type-headline text-brand-text">৳{fmt.number(b.price)}</span>
                        {b.separate > b.price && (
                          <span className="text-sm text-subtle">
                            {l.homeBundleSeparate.split("{price}")[0]}
                            <s>৳{fmt.number(b.separate)}</s>
                            {l.homeBundleSeparate.split("{price}")[1]}
                          </span>
                        )}
                        {/* The whole card is the link (to the store's page, where it's bought), so this is the button's look, not a second link. */}
                        {bundleButton && (
                          <span className="mt-2 inline-flex h-9 w-fit items-center gap-1.5 rounded-button border-b-(length:--button-edge) border-b-primary-edge bg-primary px-4 text-sm [font-weight:var(--button-weight)] whitespace-nowrap text-on-primary transition-colors group-hover/bundle:bg-primary-hover">
                            {l.homeBundleOpen}
                            <ArrowRight className="size-4" aria-hidden />
                          </span>
                        )}
                      </span>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
            {storeLink ? (
              <Button href={masterbookStore} variant="secondary" className="w-fit">
                {l.homeBooksStore}
                <ArrowUpRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <div className="grid min-w-0 gap-3">
                <h4 className="text-sm font-semibold text-muted">{fill(l.homeBooksSingles, { n: fmt.number(books.length) })}</h4>
                <ShelfScroller label={fill(l.homeBooksSingles, { n: fmt.number(books.length) })} prev={l.homeRailPrev} next={l.homeRailNext} bare>
                  <ul className="flex w-max gap-5 pt-3 pb-1">
                    {books.map((b) => (
                      <li key={b.slug} className="w-28 shrink-0 snap-start sm:w-32">
                        <a href={links.product(b.slug)} className="group/mb grid gap-1.5 rounded-md outline-offset-4 press">
                          {/* CT105 (v14): the cover as a printed book; hovering lifts it and opens the cover a little. */}
                          <MasterbookCover img={b.img} className="mr-[3%] mb-2" />
                          <span className="line-clamp-2 text-xs leading-snug font-semibold sm:text-sm">{b.name}</span>
                          <span className="text-xs font-semibold text-brand-text sm:text-sm">৳{fmt.number(b.price)}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </ShelfScroller>
              </div>
            )}
          </div>
        )}

        {/* CT107 (v16): the English and skills courses after the masterbooks; CT136 (v41): before them. */}
        {!englishFirst && english}
      </section>
    </>
  );
}

/** `big` (CT108): a section's own title (h2, the page's section size), for a group that stands as a section. */
function GroupTitle({ title, tag, big = false }: { title: string; tag?: ReactNode; big?: boolean }) {
  const H = big ? "h2" : "h3";
  return (
    <H className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", big ? TITLE : "type-title")}>
      {title}
      {tag}
    </H>
  );
}

/** A folded section: its title on a row; open, the section below without its own title (the row says it). */
function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="details" radius="md" className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-5 shrink-0 text-subtle transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-border p-4 sm:p-5 [&_h2]:sr-only">{children}</div>
    </Card>
  );
}
