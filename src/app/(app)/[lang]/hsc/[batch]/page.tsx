import { cookies } from "next/headers";
import { notFound, redirect, RedirectType } from "next/navigation";
import { lang as rootLang } from "next/root-params";
import { Suspense, type ReactNode } from "react";
import {
  CatalogHero,
  CatalogSkeleton,
  EnrolledNote,
  Faq,
  Journey,
  OtherWays,
  SegmentSkeleton,
  SegmentTitle,
  StreamTabs,
} from "@/components/catalog/catalog-sections";
import { ProofBoard } from "@/components/catalog/proof-board";
import { SegmentBody } from "@/components/catalog/segment";
import { LoginPopup } from "@/components/catalog/login-popup";
import { StreamCrumb, StreamPick } from "@/components/catalog/stream-pick";
import { EnglishJump } from "@/components/catalog/english-jump";
import { STREAM_COOKIE } from "@/components/catalog/stream-icons";
import { SegmentHome } from "@/components/catalog/segment-home";
import { SuperPrepCard } from "@/design-system/organisms/dashboard/superprep-card";
import { VisitorHeader } from "@/features/header/visitor-header";
import { HeaderActionsSkeleton } from "@/design-system/organisms/header/header-actions";
import { SiteHeader } from "@/design-system/organisms/header/site-header";
import { SiteFooter } from "@/design-system/organisms/footer/site-footer";
import { Breadcrumb } from "@/design-system/molecules/breadcrumb";
import { PageMotion, Reveal } from "@/design-system/motion/motion";
import { SectionErrorBoundary } from "@/design-system/molecules/section-error";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import {
  batchContext,
  createDataContext,
  getBatchClasses,
  getBatchExams,
  getCatalog,
  getFreeClasses,
  getFreeShelf,
  getLiveSoon,
  getRecent,
  getSuperPrep,
  type DataContext,
} from "@/lib/api";
import type { CatalogView } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { FREE_START_COOKIE, parseFreeStart } from "@/lib/free-start";
import { labVersion } from "@/lib/lab-version";
import { visitorOf, type Visitor } from "@/lib/visitor";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** The page's width and side padding, on each part of the body rather than on <main> (CT32). */
const PAGE = "mx-auto grid w-full max-w-page grid-cols-1 gap-6 px-4 sm:px-6";

/** A guest owns nothing, whatever the demo data's student has. */
const forGuest = (view: CatalogView): CatalogView => ({ ...view, enrolled: [], ownedProducts: [], stream: { ...view.stream, owned: [] } });

/*
 * A batch's segment page (CT21 on; on the page since CT73, was lab `segment`): open without logging in.
 * The student picks a stream (?stream=science|business-studies|humanities, default: the one they're
 * enrolled in); a guest gets the free classes and the next live class first, a signed-in student the
 * plans first; then the plans, single subjects, recorded and final-prep batches, what the batch teaches,
 * the reviews board and the FAQ. The study-plan chooser it replaced (CT2–CT20) is on the drafts board.
 */
export default async function CatalogPage({ params, searchParams }: PageProps<"/[lang]/hsc/[batch]">) {
  const lang = await rootLang();
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const ctx = createDataContext(searchParams);
  const visitor = visitorOf(searchParams);
  const oldShape = (
    <div className={PAGE}>
      <CatalogSkeleton label={t.common.loading} />
    </div>
  );

  return (
    <>
      <Suspense fallback={<SiteHeader lang={lang} t={t} current="none" actions={<HeaderActionsSkeleton />} />}>
        <VisitorHeader visitor={visitor} ctx={ctx} lang={lang} t={t} />
      </Suspense>
      <PageMotion>
        {/* Bottom padding on phones clears the fixed total bar, which takes the bottom nav's place. */}
        {/* The page's width lives on each section's own container, so a band can run edge to edge (CT32). */}
        <main data-no-bottom-nav className="grid grid-cols-1 pt-4 pb-28 lg:pb-12">
          <SectionErrorBoundary message={t.errors.section} retryLabel={t.common.retry}>
            <Reveal
              fallback={
                // CT178 (lab `segment-home` v71): the shape the page will have. Reading `?lab=` waits on the request, so it
                // sits in a boundary of its own, the old shape standing in for the prerendered shell.
                <Suspense fallback={oldShape}>
                  <LoadingShape searchParams={searchParams} label={t.common.loading} old={oldShape} />
                </Suspense>
              }
            >
              {params.then(({ batch }) => (
                <CatalogBody batch={batch} ctx={ctx} visitor={visitor} searchParams={searchParams} lang={lang} t={t} />
              ))}
            </Reveal>
          </SectionErrorBoundary>
        </main>
      </PageMotion>
      {/* CT32: the site's footer closes the page. CT110: dark with the page's end in lab `segment-home` v18. */}
      <Suspense fallback={<SiteFooter lang={lang} t={t} />}>
        <PageFooter searchParams={searchParams} lang={lang} t={t} />
      </Suspense>
    </>
  );
}

/**
 * CT110 (lab `segment-home` v18): "কেন ১০ মিনিট স্কুল?", the questions and the footer share one dark area, so the page
 * says where what you need ends and the extras begin. `data-mode="dark"` gives that part the dark mode's tokens.
 */
const darkEnd = (sp: SearchParams) => (labVersion("segment-home", sp.lab) ?? 0) >= 18;

/** CT178: lab `segment-home` from v71 loads in its own shape; anything else in the catalogue's. */
async function LoadingShape({ searchParams, label, old }: { searchParams: Promise<SearchParams>; label: string; old: ReactNode }) {
  const v = labVersion("segment-home", (await searchParams).lab) ?? 0;
  return v >= 71 ? (
    <SegmentSkeleton
      label={label}
      books={v >= 76}
      shelf={v >= 77}
      routineTop={v >= 78}
      calm={v >= 79}
      course={v >= 80}
      leftRow={v >= 81}
      welcome={v >= 83}
      inset={v >= 84}
      moreBelow={v >= 91}
      uploadRows={v >= 92}
    />
  ) : (
    old
  );
}

async function PageFooter({ searchParams, lang, t }: { searchParams: Promise<SearchParams>; lang: Locale; t: Dictionary }) {
  const footer = <SiteFooter lang={lang} t={t} />;
  return darkEnd(await searchParams) ? <div data-mode="dark">{footer}</div> : footer;
}

async function CatalogBody({
  batch,
  ctx,
  visitor,
  searchParams,
  lang,
  t,
}: {
  batch: string;
  ctx: Promise<DataContext>;
  visitor: Promise<Visitor>;
  searchParams: Promise<SearchParams>;
  lang: Locale;
  t: Dictionary;
}) {
  const [c, sp, who, jar] = await Promise.all([ctx, searchParams, visitor, cookies()]);
  const found = await getCatalog(c, batch, first(sp.stream) ?? null);
  if (!found) notFound();
  const view = who.guest ? forGuest(found) : found;
  const fmt = createFormatter(lang, c.now);
  const props = { view, lang, fmt, t };

  // OB15 (lab `onboarding` v4): a signed-in student landing here from onboarding gets "তোমার জন্য সাজানো" on top, with
  // one thing to do: keep the free classes on the dashboard. Already kept for this batch and stream: the cookie says so.
  const forYou = !who.guest && (labVersion("onboarding", sp.lab) ?? 0) >= 4;
  const kept = parseFreeStart(jar.get(FREE_START_COOKIE)?.value);
  // CT54: a guest also sees the batch's next live class, to log in for.
  // CT59 (review switch `?livein=30`): the guest's next live class starts that many seconds after the page opens.
  const liveIn = Number(first(sp.livein));
  // OB15: the batch's classes and routine are the batch's, whoever looks (the free student's own data has none).
  const bc = batchContext(c);
  // CT90 (lab `segment-home`): a guest gets the page in the dashboard's shape, on top of lab `free-routine` v16.
  // CT99 (v9): also once signed in from the page's login pop-up (a new student, with no courses), its locks open.
  const home = (who.guest || who.free) && labVersion("segment-home", sp.lab) !== null;
  const dark = darkEnd(sp);
  const fr = home ? 16 : (labVersion("free-routine", sp.lab) ?? 0);
  // CT74 (lab `free-routine`): a guest also sees the paid batch's live routine in the stream's subjects, beside the filter.
  const withRoutine = home || (who.guest && labVersion("free-routine", sp.lab) !== null);
  const subjects = [...view.stream.group, ...view.stream.compulsory].map((s) => s.id);
  const [classes, live, routine, exams, recent, free, prep] = await Promise.all([
    getFreeClasses(bc),
    who.guest || forYou || home ? getLiveSoon(bc, view.batch.id) : [],
    withRoutine ? getBatchClasses(bc, view.batch.id, subjects) : null,
    home ? getBatchExams(bc, view.batch.id, subjects) : [],
    // CT90: the batch has no feed of its own yet (section 9), so the dashboard's stands in, marked as a sample.
    home ? getRecent(bc) : [],
    // CT120 (v27): the free things filed by kind, in place of the feed.
    home && (labVersion("segment-home", sp.lab) ?? 0) >= 27 ? getFreeShelf(bc) : null,
    // CT124 (v31): the dashboard's SuperPrep card in the aside, with the visitor's own. A guest's request reads the demo
    // student's data, so a guest gets a new student's SuperPrep instead: nothing answered, the card's not-started state.
    // CT156 (v54): SuperPrep is off the page for now.
    home && (labVersion("segment-home", sp.lab) ?? 0) >= 31 && (labVersion("segment-home", sp.lab) ?? 0) < 54
      ? getSuperPrep(who.guest ? { ...c, fixture: "new" } : c)
      : null,
  ]);
  const keep = (["lab", "as"] as const).map((k) => (first(sp[k]) ? `&${k}=${encodeURIComponent(first(sp[k])!)}` : "")).join("");
  // A class link keeps the lab and `?as=`, and `seg` brings the class page's back button here (CT28).
  const segment = `seg=${view.batch.id}.${view.stream.id}${keep}`;
  const v = home ? (labVersion("segment-home", sp.lab) ?? 0) : 0;
  // CT153 (v51): "SSC 2026 পরীক্ষার্থীদের জন্য" read as the wrong page on HSC 28; the same fact, said to the student.
  const sat = v >= 51 ? view.audience?.match(/SSC\s*(\d{4})/)?.[1] : undefined;
  // CT134 (v39): a guest has no dashboard yet; they land here from the menu or a link, so the way up is the site's home.
  const up = who.guest && home && v >= 39 ? { label: t.catalog.crumbHome, href: `/${lang}/hsc/hsc-28` } : { label: t.nav.dashboard, href: `/${lang}` };
  const audience = sat ? fill(t.segment.homeAudience, { year: sat }) : undefined;
  // CT216, CT218 (segment-page working v5): opened without a stream (the menu's "এইচএসসি ২৮"), the page goes to the one
  // the visitor chose before; with none, it draws the default stream's page and asks over it in a pop-up.
  const pick = home && v >= 96;
  const remembered = jar.get(STREAM_COOKIE)?.value;
  if (pick && !first(sp.stream) && remembered && view.streams.some((s) => s.id === remembered))
    redirect(`/${lang}/hsc/${view.batch.id}?stream=${remembered}${keep}`, RedirectType.replace);
  const streamPick = pick && (
    <StreamPick
      batch={view.batch.id}
      batchName={view.batch.name}
      streams={view.streams}
      current={view.stream.id}
      ask={!first(sp.stream)}
      lang={lang}
      keep={keep}
      l={t.segment}
      closeLabel={t.segment.homeLoginClose}
    />
  );
  // CT179 (v72): the batch's year in full for the path: "hsc-28" is the class of 2028 ("ব্যাচ ২০২৮"), in the page's digits, ungrouped.
  const yy = view.batch.id.match(/(\d{2})$/)?.[1];
  const batchYear = yy
    ? fill(t.segment.homeCrumbBatch, { year: lang === "bn" ? `20${yy}`.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]) : `20${yy}` })
    : undefined;
  // CT154 (v52): a plain header in place of the green hero; its path replaces the breadcrumb above it.
  const plain = v >= 52;
  const hero = plain ? (
    // CT155 (v53): boxed like the dashboard's welcome card, without the SSC line.
    <SegmentTitle
      view={view}
      t={t}
      up={up.href}
      audience={v >= 53 ? undefined : audience}
      boxed={v >= 53}
      yearLabel={v >= 72 ? batchYear : undefined}
      streamNode={pick ? <StreamCrumb name={view.stream.name} label={t.segment.homeStreamChange} /> : undefined}
      // CT239: from v6 the "অ্যাকাডেমিক | ইংলিশ" tab over the free part takes this pill's place.
      pathEnd={pick && v < 97 ? <EnglishJump label={t.segment.homeEnglishJump} short={t.segment.homeEnglishJumpShort} /> : undefined}
      welcome={
        v >= 83
          ? {
              greeting: `${t.greeting[fmt.greeting()]}!`,
              login: who.guest ? { label: t.segment.login, href: `/${lang}/login` } : undefined,
              avatar: v >= 88,
              oneLine: v >= 98,
            }
          : undefined
      }
    />
  ) : (
    <CatalogHero {...props} compact keep={keep} controls={withRoutine && fr >= 11} toppers={!home} dates={!home} audience={audience} />
  );
  // CT130 (lab `segment-home` v36): the hero moves into the dashboard grid's main column, so the aside (the login card)
  // starts beside it at the top; below `xl` the grid is one column and the hero still comes first.
  const heroInGrid = home && !!routine && (labVersion("segment-home", sp.lab) ?? 0) >= 36;
  return (
    <div className="grid grid-cols-1">
      {streamPick}
      <div className={PAGE}>
        {!plain && <Breadcrumb label={t.catalog.crumbs} items={[up, { label: view.batch.name }]} />}
        {!heroInGrid && hero}
      </div>
      {home && routine ? (
        <LoginPopup
          lang={lang}
          copy={t.login}
          title={t.segment.homeLoginTitle}
          lead={t.segment.homeLoginLead}
          closeLabel={t.segment.homeLoginClose}
          titleFor={t.segment.homeLoginFor}
          leadFor={t.segment.homeLoginForLead}
          off={!who.guest}
        >
          <SegmentHome
            view={view}
            lang={lang}
            now={c.now}
            classes={classes}
            routine={{ classes: routine, fullHref: `/${lang}/routine?batch=${view.batch.id}&stream=${view.stream.id}${keep}` }}
            exams={exams}
            recent={recent}
            free={free}
            version={labVersion("segment-home", sp.lab) ?? 0}
            hero={heroInGrid ? hero : null}
            superprep={
              prep && (
                <SuperPrepCard
                  sp={prep}
                  fmt={fmt}
                  lang={lang}
                  t={t}
                  instance="segment"
                  startHref={who.guest ? `/${lang}/login?next=${encodeURIComponent(`/${lang}/superprep`)}` : undefined}
                  // CT125: the designer's message, a 15,000+ question bank, free; the count line leaves out the demo data's question count.
                  tagline={v >= 51 ? t.segment.homePrepTaglineUnlimited : t.segment.homePrepTagline}
                  contents={fill(t.segment.homePrepContents, {
                    subjects: fmt.number(prep.subjects.length),
                    chapters: fmt.number(prep.totals.chaptersTotal),
                  })}
                  // CT152 (v51): a guest sees what's inside, not a 0% ring; the question count is gone from the message (CT125's 15,000+).
                  features={v >= 51 && who.guest ? t.segment.homePrepFeatures : undefined}
                />
              )
            }
            types={t.contentType}
            journey={{
              title: view.billing
                ? fill(t.catalog.journeyTitle, { months: fmt.number(view.billing.cycleMonths * view.billing.cycles) })
                : t.catalog.journeyTitleShort,
              node: <Journey {...props} />,
            }}
            segment={segment}
            signedIn={!who.guest}
            l={t.segment}
            c={t.catalog}
          />
        </LoginPopup>
      ) : (
        <>
          {/* Full width: each section keeps the page's width itself, so a band can run edge to edge (CT44). */}
          <SegmentBody
            view={view}
            lang={lang}
            now={c.now}
            guest={who.guest}
            preset={who.preset}
            streamAsked={Boolean(first(sp.stream))}
            classes={classes}
            live={live}
            liveIn={Number.isFinite(liveIn) && liveIn > 0 ? Math.min(liveIn, 86_400) : null}
            streamTabs={<StreamTabs {...props} keep={keep} icons />}
            enrolled={<EnrolledNote {...props} />}
            otherWays={<OtherWays {...props} covers big />}
            l={t.segment}
            c={t.catalog}
            segment={segment}
            forYou={forYou ? { added: kept?.batch === view.batch.id && kept.stream === view.stream.id } : null}
            planCovers={fr < 3}
            compare={fr >= 5}
            singlesRail={fr >= 7}
            heroStreams={fr >= 11}
            lockSheet={fr >= 14}
            cleanFree={fr >= 15}
            routine={routine && { classes: routine, fullHref: `/${lang}/routine?batch=${view.batch.id}&stream=${view.stream.id}${keep}` }}
          />
          {/* The section gap (CT43): 56px, 64px from `sm`. */}
          <div className={cn(PAGE, "pt-14 sm:pt-16")}>
            <Journey {...props} />
          </div>
        </>
      )}
      {/* CT110 (lab `segment-home` v18): from here on, one dark area down through the footer; it takes <main>'s bottom
          padding inside it, so no light strip is left before the footer. */}
      <div data-mode={dark ? "dark" : undefined} className={cn(dark && "mt-16 -mb-28 bg-bg pb-28 text-text sm:mt-20 lg:-mb-12 lg:pb-16")}>
        {/* CT72: the landing's results board with this batch page's own reviews, in place of the green band. */}
        <ProofBoard
          view={view}
          dark={dark}
          bento={(labVersion("segment-home", sp.lab) ?? 0) >= 19}
          bentoNumbers={(labVersion("segment-home", sp.lab) ?? 0) >= 21}
          column={v >= 54}
          labels={{
            title: t.segment.whyTitle,
            videos: t.segment.proofVideos,
            video: t.segment.proofVideo,
            quotes: t.catalog.testimonialsTitle,
            features: t.catalog.featuresTitle,
          }}
        />
        {/* CT156 (v54): the questions take the page's one column, so its edges stay put to the end. */}
        <div className={v >= 54 ? PAGE.replace("max-w-page", "max-w-column") : cn(PAGE, "max-w-reading")}>
          <Faq {...props} big />
        </div>
      </div>
    </div>
  );
}
