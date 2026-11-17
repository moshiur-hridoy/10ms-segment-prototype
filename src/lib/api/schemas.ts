import { z } from "zod";

/*
 * Shape of every data file. These mirror what we expect from the real API.
 * When real responses are captured, map them to these shapes in `sources.ts`
 * so components never change.
 *
 * Conventions
 *  - Timestamps end in `At` and are ISO 8601 with offset ("2026-10-25T15:00:00+06:00").
 *  - Calendar days end in `Date` and are "YYYY-MM-DD".
 *  - Percentages are numbers 0–100. Labels are never stored; they are formatted per locale.
 *  - Free text (titles, names) is stored as-is in whatever language the API returns.
 */

const id = z.string().min(1);
const text = z.string().min(1);
const url = z.string().min(1);
const at = z.iso.datetime({ offset: true });
const day = z.iso.date();
const percent = z.number().min(0).max(100);
const count = z.number().int().min(0);

export const category = z.enum(["academic", "english", "skills"]);
export const batchType = z.enum(["online", "offline", "recorded"]);
export const contentType = z.enum(["video", "quiz", "note", "pdf", "live"]);

/* ---------- user.json ---------- */

export const userSchema = z.object({
  id,
  name: text,
  avatarUrl: url.nullable(),
  school: text.nullable(),
  hotline: text,
  unreadMessages: count,
  activeBatchId: id,
  /** `courseId`: the enrolled course this batch is studied in; the learning report opens on it. */
  batches: z.array(z.object({ id, label: text, courseId: id.optional() })).min(1),
});

/* ---------- classes.json ---------- */

const classBase = {
  id,
  title: text,
  course: text,
  /** The enrolled course (`courses.json`) it belongs to; scopes the routine on the course home. */
  courseId: id.optional(),
  url: url.optional(),
};

/* Completion flags drive the task view (`getTasks`). All optional so older payloads still parse. */
const attendance = {
  /** The student joined this class. */
  attended: z.boolean().optional(),
  /** The student watched the recording (only meaningful for missed classes). */
  watched: z.boolean().optional(),
};

export const classItemSchema = z.discriminatedUnion("kind", [
  z.object({ ...classBase, ...attendance, kind: z.literal("free"), startsAt: at, endsAt: at }),
  z.object({ ...classBase, ...attendance, kind: z.literal("class"), startsAt: at, endsAt: at, joinUrl: url.optional() }),
  z.object({
    ...classBase,
    kind: z.literal("homework"),
    attendance: z.enum(["present", "absent", "late"]),
    homework: z.enum(["pending", "submitted", "graded"]),
    dueAt: at,
  }),
  z.object({ ...classBase, kind: z.literal("exam"), startsAt: at, endsAt: at, submitted: z.boolean().optional() }),
]);

export const classesSchema = z.object({
  upcoming: z.array(classItemSchema),
  missed: z.array(classItemSchema),
});

/* ---------- routine.json (the full routine page) ---------- */

/**
 * Every scheduled item over several weeks, past and future, in the same shape as classes.json
 * plus a short `subject` ("ফিজিক্স", "IELTS") for the subject filter. Past items keep their
 * completion flags (attended / watched / submitted / homework state), so the planner can tick
 * them off or offer a way to catch up.
 */
export const routineItemSchema = z.intersection(classItemSchema, z.object({ subject: text }));
export const routineSchema = z.object({ items: z.array(routineItemSchema) });

/* ---------- subjects.json ---------- */

export const subjectIcon = z.enum(["calculator", "flask", "atom", "leaf", "book", "languages", "mic", "globe"]);

export const subjectGroupSchema = z.object({
  id,
  title: text,
  /** The enrolled course (`courses.json`) this group belongs to; its course home lists it. */
  courseId: id.optional(),
  /** Short name shown first (e.g. "বায়োলজি"); falls back to `title`. */
  subject: text.optional(),
  /** Secondary line under the name (e.g. "HSC 2027 · অনলাইন ব্যাচ"). */
  batch: text.optional(),
  /** Falls back to the first subject's icon. */
  icon: subjectIcon.optional(),
  category,
  courseHomeUrl: url,
  communityUrl: url.optional(),
  subjects: z.array(z.object({ id, name: text, icon: subjectIcon, progress: percent, url })),
  /** `exam` folders (weekly, monthly, model tests) sit right under the subjects;
   *  `resource` folders (orientation, archive, PDFs) are tucked behind a disclosure. */
  folders: z.array(z.object({ id, label: text, url, kind: z.enum(["exam", "resource"]).default("resource") })),
  /** `paperId` (a subject id) opens that paper's syllabus page instead of `url`. */
  continue: z.object({ type: contentType, title: text, url, paperId: id.optional() }).nullable(),
});

export const subjectsSchema = z.object({ groups: z.array(subjectGroupSchema) });

/* ---------- recent.json ---------- */

export const recentSchema = z.object({
  items: z.array(
    z.object({
      id,
      type: contentType,
      title: text,
      uploadedAt: at,
      batchType,
      subject: text,
      url,
      /** Whether the student has opened it. Missing → treated as seen (no "new" marker). */
      seen: z.boolean().optional(),
    }),
  ),
});

/* ---------- courses.json ---------- */

export const coursesSchema = z.object({
  enrolled: z.array(
    z.object({
      id,
      /** The catalogue product this enrolment was bought as (`catalog.json`); marks it "ভর্তি আছো" there. */
      productId: id.optional(),
      title: text,
      category,
      progress: percent,
      nextItems: z.array(contentType).max(5),
      courseHomeUrl: url,
      /* Library fields. All optional: the card drops whatever is missing. */
      thumbnailUrl: url.optional(),
      batchType: batchType.optional(),
      badges: z.object({ earned: count, total: count }).optional(),
      /** How many subject groups (in the subjects section) belong to this course. */
      subjectCount: count.optional(),
      /** Last time the student did anything in it; orders the "in progress" list. */
      lastActivityAt: at.optional(),
    }),
  ),
});

/* ---------- recommendations.json ---------- */

/**
 * Catalog products for discovery, grouped into shelves as on the live site
 * ("তোমার শ্রেণির অনলাইন ব্যাচ", "তোমার জন্য ইংলিশ কোর্স", …). Mapped from the catalog
 * API's `taxonomies[].products[]`.
 */
export const recommendationsSchema = z.object({
  shelves: z.array(
    z.object({
      id,
      /** Full heading, e.g. "তোমার শ্রেণির অনলাইন ব্যাচ". */
      title: text,
      /** Short pill label, e.g. "অনলাইন ব্যাচ". */
      label: text,
      seeAllUrl: url.optional(),
      items: z.array(
        z.object({
          id,
          title: text,
          url,
          thumbnailUrl: url.optional(),
          /** API `modality`: online_batch | live_course | crash_course | recorded (others shown without a label). */
          modality: z.string().optional(),
          /** API `instructor_text`, e.g. "Zawad Hasan Adib +3". */
          instructor: text.optional(),
          /** In taka. `null` means free. */
          price: z.object({ original: count, final: count }).nullable(),
          /** API `is_enrolled`; owned products are never recommended. */
          isEnrolled: z.boolean().optional(),
        }),
      ),
    }),
  ),
});

/* ---------- notices.json ---------- */

export const noticesSchema = z.object({
  items: z.array(
    z.object({
      id,
      title: text,
      body: text,
      course: text,
      batchType,
      publishedAt: at,
      read: z.boolean(),
      url: url.optional(),
    }),
  ),
});

/* ---------- promos.json ---------- */

export const promoSchema = z.discriminatedUnion("variant", [
  z.object({ id, variant: z.literal("image"), image: url, alt: text, url }),
  z.object({
    id,
    variant: z.literal("text"),
    title: text,
    body: text,
    cta: z.object({ label: text, url }),
    tone: z.enum(["blue", "green", "warm"]),
  }),
]);

export const promosSchema = z.object({ slides: z.array(promoSchema) });

/* ---------- streak.json ---------- */

export const treeSpecies = z.enum(["apple", "mango", "lychee", "orange"]);

export const streakSchema = z.object({
  current: count,
  best: count,
  /** Seven consecutive days, first day of the week first. `rained`: missed, but a saved rainy day watered the tree. */
  week: z.array(z.object({ date: day, completed: z.boolean(), rained: z.boolean().optional() })).length(7),
  /**
   * The tree's growth in days (it sets the stage). The backend applies the rule: +1 for each day
   * watered, back to the start of the previous stage for each missed day, 0 (dead, replant) after
   * three missed days in a row. Optional: without it the streak length stands in.
   */
  growth: count.optional(),
  /** Saved rainy days (a streak freeze): a missed day uses one instead of setting the tree back. Optional until the backend has the rule. */
  rain: z.object({ left: count, max: count }).optional(),
  /** The fruit tree growing now (each grown tree unlocks the next). Optional: the garden works it out. */
  species: treeSpecies.optional(),
  /**
   * Today's watering so far: minutes of classes and videos, quizzes or exams taken, and the day's goal
   * in minutes. A day is watered at the goal or one quiz (the streak popup shows the progress).
   */
  today: z.object({ minutes: count, quizzes: count, goal: count }).optional(),
});

/* ---------- garden.json (the streak's orchard) ---------- */

/**
 * Everything the student has grown: each tree taken to fruit (its species, when it was planted and
 * bore fruit, its longest run), the last weeks of watering, the badges earned and running totals.
 * Day fields end in "Date" so fixtures rebase them by whole days.
 */
export const gardenSchema = z.object({
  trees: z.array(z.object({ id, species: treeSpecies, plantedDate: day, fruitedDate: day, longest: count })),
  history: z.array(z.object({ date: day, status: z.enum(["watered", "missed", "rained"]) })),
  badges: z.array(z.object({ id, earnedDate: day })),
  totals: z.object({ watered: count, harvested: count, lost: count }),
});

/* ---------- superprep.json ---------- */

/**
 * SuperPrep: question practice per paper. Only the chapters the course has taught are
 * listed, so numbering can skip (a paper may start at chapter 2). Totals, syllabus %
 * and accuracy are derived in `superprep.ts`, never stored.
 */
export const superprepChapterSchema = z.object({
  id,
  /** Chapter number in the textbook; shown as-is, never padded. */
  number: count,
  title: text,
  questions: count,
  correct: count,
  wrong: count,
  lastPracticedAt: at.nullable(),
});

export const superprepSchema = z.object({
  isNew: z.boolean(),
  learners: count,
  /** The student's syllabus goal (0 = no target set yet). */
  targetPct: percent,
  /** Paper the student practised last; `null` before the first answer. */
  lastSubjectId: id.nullable(),
  subjects: z.array(
    z.object({
      id,
      name: text,
      /** Subject family: picks the book's cover colour and groups papers on the shelf. */
      family: z.enum(["physics", "chemistry", "biology", "math", "ict", "bangla", "english", "other"]).default("other"),
      /** Real cover art (e.g. the Masterbook cover) when there is one; else a drawn cover. */
      coverUrl: url.nullable().default(null),
      chapters: z.array(superprepChapterSchema),
      /** Answered questions with explanations (not built yet). */
      reviewUrl: url,
    }),
  ),
});

/* ---------- questions.json ---------- */

/** How the student answered a question last time; drives the "question type" filter. */
export const questionHistory = z.enum(["new", "correct", "wrong"]);

/**
 * SuperPrep MCQs. Text, options and explanations may hold inline LaTeX between `$…$`
 * (as the live site does), typeset on the server.
 */
export const questionSchema = z
  .object({
    id,
    chapterId: id,
    text,
    options: z.array(text).min(2).max(6),
    /** Index of the correct option. */
    answer: count,
    explanation: text.nullable(),
    previous: questionHistory,
  })
  .refine((q) => q.answer < q.options.length, { message: "answer is out of range" });

export const questionsSchema = z.object({ questions: z.array(questionSchema) });

/* ---------- syllabus.json ---------- */

/**
 * A paper's syllabus ("জীববিজ্ঞান ১ম পত্র"), as a flat list of items per chapter in
 * the order the API returns them. Grouping (class → its slide and exam, chapter notes,
 * archive) happens in `syllabus.ts`, so this stays close to the raw response.
 */
export const syllabusItemKind = z.enum(["video", "sheet", "slide", "exam"]);
export const progressStatus = z.enum(["done", "started", "new"]);

export const syllabusItemSchema = z.object({
  id,
  kind: syllabusItemKind,
  title: text,
  /** `archive` = last year's batch recordings, offered as extra material. */
  source: z.enum(["batch", "archive"]).default("batch"),
  url,
  /** Best case: the API says which class a slide or exam belongs to. Otherwise we match by title. */
  classId: id.optional(),
  publishedAt: at.optional(),
  durationSec: count.optional(),
  watchedSec: count.optional(),
  /** Demo only: a YouTube id to stream the video from until the CDN player exists. */
  youtubeId: z.string().regex(/^[\w-]{11}$/).optional(),
  /** A video's parts (timestamps): where each starts and what it covers, in order (P49; assumed field, design-audit 9.2). */
  chapters: z.array(z.object({ startSec: count, title: text })).optional(),
  pages: count.optional(),
  questions: count.optional(),
  score: z.object({ got: count, total: count }).optional(),
  status: progressStatus.default("new"),
});

export const syllabusSchema = z.object({
  papers: z.array(
    z.object({
      /** Same id as the subject card on the dashboard (`subjects.json`). */
      id,
      title: text,
      course: text,
      archiveCourse: text.optional(),
      chapters: z.array(z.object({ id, number: count, title: text, items: z.array(syllabusItemSchema) })),
    }),
  ),
});

/* ---------- report.json ---------- */

/**
 * Raw learning events for the learning report. The report's numbers (rates, totals,
 * per-day and per-subject breakdowns, comparisons) are all computed from these in
 * `report.ts`, for whatever course and period the student picks.
 */
export const studyType = z.enum(["live", "video", "exam", "quiz"]);

export const reportSchema = z.object({
  /** Live classes that have been held, and how the student attended. */
  classes: z.array(
    z.object({ id, courseId: id, subject: text, title: text, startsAt: at, status: z.enum(["ontime", "late", "absent"]) }),
  ),
  /** Minutes spent per day, by activity type. */
  study: z.array(z.object({ date: day, courseId: id, subject: text, type: studyType, minutes: count })),
  homework: z.array(z.object({ id, courseId: id, subject: text, title: text, dueAt: at, submitted: z.boolean(), url })),
  /** Quiz and exam attempts. */
  attempts: z.array(
    z.object({ id, courseId: id, subject: text, kind: z.enum(["quiz", "exam"]), title: text, takenAt: at, correct: count, total: count }),
  ),
});

/* ---------- catalog.json ---------- */

/**
 * Catalogue pages (HSC 27, HSC 28), from the page-builder API (`/hsc/hsc-27`): each page's streams,
 * the products sold on it and the shared trust blocks. Products appear once per page; a stream lists
 * the ones it shows. `subjects` per product and `kind` are not in the API (assumed, see the decision
 * log §9.2); today they are read off the product titles. Prices are what the student pays: the
 * API's crossed-out `original` is kept but not shown.
 *
 * `layout`: picker = the student ticks subjects and the cheapest mix is priced (HSC 27);
 * bundle = the stream bundle leads, with the compulsory bundle as an add-on (HSC 28, where single
 * subjects aren't sold). `billing`: prices are per cycle (HSC 28: four 4-month cycles).
 */
const catalogTeacher = z.object({ name: text, imageUrl: url.nullable(), note: text.nullable() });

const catalogPage = z.object({
  batch: z.object({ id, name: text, examYear: count }),
  /** Sibling batches (HSC 26 · 27 · 28), each its own page. */
  batches: z.array(z.object({ id, label: text, url })).min(1),
  layout: z.enum(["picker", "bundle"]),
  /** "SSC 2026 পরীক্ষার্থীদের জন্য". */
  audience: text.nullable(),
  /** Short facts for the hero: start date, length, version. */
  highlights: z.array(text),
  billing: z.object({ cycleMonths: count, cycles: count }).nullable(),
  /** "ফ্রি ক্লাস বুক করুন" (one event link for the whole batch). */
  freeClassUrl: url.nullable(),
  /** The college year the batch runs alongside: "সেপ্টেম্বর-অক্টোবর · কলেজের ক্লাস শুরু". */
  timeline: z.array(z.object({ when: text, what: text })),
  /** "৯৫০+ শিক্ষার্থী বার্ষিক পরীক্ষায় ১ম". */
  toppers: count.nullable(),
  subjects: z.array(z.object({ id, name: text, papers: count, teachers: z.array(catalogTeacher) })),
  streams: z
    .array(
      z.object({
        id,
        name: text,
        groupSubjects: z.array(id).min(1),
        compulsorySubjects: z.array(id),
        productIds: z.array(id),
      }),
    )
    .min(1),
  products: z.array(
    z.object({
      id,
      title: text,
      url,
      thumbnailUrl: url.nullable(),
      /** live: a live batch for the listed subjects · recorded (price 0 = a free batch) · finalPrep: the exam-season revision bundle. */
      kind: z.enum(["live", "recorded", "finalPrep"]),
      subjects: z.array(id).min(1),
      price: z.object({ original: count, final: count }),
      enrolledCount: count.nullable(),
      liveClassesPerWeek: count.nullable(),
      facts: z.array(text),
      /** What each cycle teaches, per subject (from the product page's chapter table). */
      cycles: z.array(z.object({ name: text, subjects: z.array(z.object({ subject: id, chapters: z.array(text) })) })).optional(),
    }),
  ),
  features: z.array(z.object({ title: text, description: text, iconUrl: url })),
  testimonials: z.array(z.object({ name: text, role: text, text, imageUrl: url.nullable() })),
  /** CT72: the live batch page's video reviews (YouTube, vertical): who, their school or result, the video's title. */
  videoTestimonials: z.array(z.object({ name: text, role: text, videoId: text, title: text, imageUrl: url })).default([]),
  faq: z.array(z.object({ question: text, answer: text })),
});

export const catalogSchema = z.object({ pages: z.array(catalogPage).min(1) });

/* ---------- library.json ---------- */

/**
 * "কোর্স ও বইসমূহ": everything the student owns, as books on shelves. A batch shelf (HSC 27) holds
 * every paper the batch teaches, owned or not, grouped by subject; a not-owned paper links to its
 * subject's product page. Skills, English and e-book shelves hold whole courses and books. The
 * shape is proposed (no library API yet, see the decision log §9.2).
 */
const bookFamily = z.enum(["physics", "chemistry", "biology", "math", "ict", "bangla", "english", "other"]);

export const libraryBookSchema = z.object({
  id,
  /** The cover's big text: "১ম পত্র", a course or a book title. */
  title: text,
  /** The small line above it: the subject or the kind of book. */
  kicker: text.optional(),
  /** Cloth colour. */
  family: bookFamily.default("other"),
  /** Real cover art. `full` fills the cover (a book's own cover); `plate` sits inset on the cloth (a 16:9 course thumbnail). */
  coverUrl: url.optional(),
  coverFit: z.enum(["full", "plate"]).default("full"),
  /** owned: in the library · free: can be taken free · locked: for sale. */
  state: z.enum(["owned", "free", "locked"]),
  /** An owned paper opens its subject page (`subjects.json` id; reading progress comes from there). */
  paperId: id.optional(),
  /** An owned course opens its course home. */
  courseId: id.optional(),
  /** The product page (PDP); where an owned book opens when it has no paper or course. */
  url,
  /** What the student pays, in taka. */
  price: count.optional(),
});

export const librarySchema = z.object({
  shelves: z.array(
    z.object({
      id,
      kind: z.enum(["batch", "skills", "english", "ebook"]),
      title: text,
      subtitle: text.optional(),
      /** The batch's course home (routine, exams, resources). */
      courseId: id.optional(),
      /** A batch whose exam is over: its not-owned papers stay hidden until asked for. */
      past: z.boolean().default(false),
      groups: z.array(z.object({ id, name: text.optional(), books: z.array(libraryBookSchema).min(1) })),
      /** Products suggested at the shelf's end. */
      suggestions: z.array(libraryBookSchema).default([]),
      /** In-app catalogue page (`/hsc/<id>`) for "+ আরো"; else `moreUrl`. */
      catalogId: id.optional(),
      moreUrl: url.optional(),
    }),
  ),
});

/* ---------- meta.json ---------- */

export const metaSchema = z.object({
  /** Moment the snapshot was taken. Local fixtures are shifted so this equals "now". */
  snapshotAt: at,
  label: text,
});

export const schemas = {
  meta: metaSchema,
  user: userSchema,
  classes: classesSchema,
  subjects: subjectsSchema,
  recent: recentSchema,
  courses: coursesSchema,
  recommendations: recommendationsSchema,
  notices: noticesSchema,
  promos: promosSchema,
  streak: streakSchema,
  superprep: superprepSchema,
  questions: questionsSchema,
  syllabus: syllabusSchema,
  report: reportSchema,
  routine: routineSchema,
  garden: gardenSchema,
  catalog: catalogSchema,
  library: librarySchema,
} as const;

export type DataFile = keyof typeof schemas;
export type DataOf<K extends DataFile> = z.infer<(typeof schemas)[K]>;

export type User = DataOf<"user">;
export type ClassItem = z.infer<typeof classItemSchema>;
export type RoutineItem = z.infer<typeof routineItemSchema>;
export type SubjectGroup = z.infer<typeof subjectGroupSchema>;
export type RecentItem = DataOf<"recent">["items"][number];
export type Course = DataOf<"courses">["enrolled"][number];
export type Notice = DataOf<"notices">["items"][number];
export type Shelf = DataOf<"recommendations">["shelves"][number];
export type Product = Shelf["items"][number];
export type Promo = z.infer<typeof promoSchema>;
export type Streak = DataOf<"streak">;
export type SuperPrepData = DataOf<"superprep">;
export type SuperPrepChapter = z.infer<typeof superprepChapterSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionHistory = z.infer<typeof questionHistory>;
export type Category = z.infer<typeof category>;
export type ContentType = z.infer<typeof contentType>;
export type SyllabusPaper = DataOf<"syllabus">["papers"][number];
export type SyllabusItem = z.infer<typeof syllabusItemSchema>;
export type SyllabusItemKind = z.infer<typeof syllabusItemKind>;
export type ProgressStatus = z.infer<typeof progressStatus>;
export type ReportData = DataOf<"report">;
export type StudyType = z.infer<typeof studyType>;
export type CatalogData = DataOf<"catalog">["pages"][number];
export type CatalogProduct = CatalogData["products"][number];
export type CatalogSubject = CatalogData["subjects"][number];
export type LibraryBook = z.infer<typeof libraryBookSchema>;
