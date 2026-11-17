/*
 * Lab `segment-home` (CT90): what the team's brief "Changes required in Segment Page" (13 Nov 2026) lists for the
 * segment page and the app's data doesn't have yet. Real content from the team; what is still missing is in `SEGMENT_PENDING`
 * and shows the <Sample> marker on the page.
 */

/** The English centre branches as the brief lists them; মোহাম্মদপুর is not on the live site's centre list (1 Nov). */
export const englishBranches = ["উত্তরা", "মিরপুর", "পান্থপথ", "মগবাজার", "মোহাম্মদপুর", "চট্টগ্রাম"];

/**
 * CT102: HSC 28 masterbooks as the live store sells them (`10minuteschool.com/store/categories/hsc_and_beyond/`, read 14 Nov 2026):
 * each paper's printed book with its cover, price and product page, by the catalogue's subject id. ICT is one book. Prices in taka.
 */
export const masterbooks: { batch: string; slug: string; subject: string; name: string; price: number; img: string }[] = [
  { batch: "hsc-28", slug: "hsc-28-bangla-1st-paper-masterbook", subject: "bangla", name: "বাংলা ১ম পত্র", price: 750, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-%C3%A0%C2%A6%C2%AC%C3%A0%C2%A6%C2%BE%C3%A0%C2%A6%C2%82%C3%A0%C2%A6%C2%B2%C3%A0%C2%A6%C2%BE-%C3%A0%C2%A6%C2%AA%C3%A0%C2%A7%C2%8D%C3%A0%C2%A6%C2%B0%C3%A0%C2%A6%C2%A5%C3%A0%C2%A6%C2%AE-%C3%A0%C2%A6%C2%AA%C3%A0%C2%A6%C2%A4%C3%A0%C2%A7%C2%8D%C3%A0%C2%A6%C2%B0-%C3%A0%C2%A6%C2%AE%C3%A0%C2%A6%C2%BE%C3%A0%C2%A6%C2%B8%C3%A0%C2%A7%C2%8D%C3%A0%C2%A6%C2%9F%C3%A0%C2%A6%C2%BE%C3%A0%C2%A6%C2%B0-%C3%A0%C2%A6%C2%AC%C3%A0%C2%A7%C2%81%C3%A0%C2%A6%C2%95-cover_1788416761479.jpg" },
  { batch: "hsc-28", slug: "hsc-28-bangla-2nd-paper-masterbook", subject: "bangla", name: "বাংলা ২য় পত্র", price: 550, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-bangla-2nd-paper_1788417486718.jpg" },
  { batch: "hsc-28", slug: "hsc-28-english-1st-paper-masterbook", subject: "english", name: "ইংরেজি ১ম পত্র", price: 690, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-english-1st-paper_1788418386250.jpg" },
  { batch: "hsc-28", slug: "hsc-28-english-2nd-paper-masterbook", subject: "english", name: "ইংরেজি ২য় পত্র", price: 420, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-english-2nd-paper_1788418282905.jpg" },
  { batch: "hsc-28", slug: "hsc-28-information-and-communication-technology-masterbook", subject: "ict", name: "তথ্য ও যোগাযোগ প্রযুক্তি", price: 580, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-ict_1788417728155.jpg" },
  { batch: "hsc-28", slug: "hsc-28-physics-1st-paper-masterbook", subject: "physics", name: "পদার্থবিজ্ঞান ১ম পত্র", price: 790, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-physics-1st-paper_1788417736365.jpg" },
  { batch: "hsc-28", slug: "hsc-28-physics-2nd-paper-masterbook", subject: "physics", name: "পদার্থবিজ্ঞান ২য় পত্র", price: 850, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-physics-2nd-paper_1788421922587.jpg" },
  { batch: "hsc-28", slug: "hsc-28-chemistry-1st-paper-masterbook", subject: "chemistry", name: "রসায়ন ১ম পত্র", price: 650, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-chemistry-1st-paper_1788422109580.jpg" },
  { batch: "hsc-28", slug: "hsc-28-chemistry-2nd-paper-masterbook", subject: "chemistry", name: "রসায়ন ২য় পত্র", price: 690, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-chemistry-2nd-paper_1788422374323.jpg" },
  { batch: "hsc-28", slug: "hsc-28-higher-math-1st-paper-masterbook", subject: "math", name: "উচ্চতর গণিত ১ম পত্র", price: 890, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-higher-math-1st-paper_1788417744437.jpg" },
  { batch: "hsc-28", slug: "hsc-28-higher-math-2nd-paper-masterbook", subject: "math", name: "উচ্চতর গণিত ২য় পত্র", price: 690, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-higher-math-2nd-paper_1788423688197.jpg" },
  { batch: "hsc-28", slug: "hsc-28-biology-1st-paper-masterbook", subject: "biology", name: "জীববিজ্ঞান ১ম পত্র", price: 840, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-biology-1st-paper_1788417752419.jpg" },
  { batch: "hsc-28", slug: "hsc-28-biology-2nd-paper-masterbook", subject: "biology", name: "জীববিজ্ঞান ২য় পত্র", price: 870, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-biology-2nd-paper_1788427230661.jpg" },
  { batch: "hsc-28", slug: "hsc-28-accounting-1st-paper-masterbook", subject: "accounting", name: "হিসাববিজ্ঞান ১ম পত্র", price: 520, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-accounting-1st-paper_1788417683934.jpg" },
  { batch: "hsc-28", slug: "hsc-28-accounting-2nd-paper-masterbook", subject: "accounting", name: "হিসাববিজ্ঞান ২য় পত্র", price: 550, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-accounting-2nd-paper_1788427698486.jpg" },
  { batch: "hsc-28", slug: "hsc-28-economics-1st-paper-masterbook", subject: "economics", name: "অর্থনীতি ১ম পত্র", price: 495, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-economics-1st-paper_1788417779991.jpg" },
  { batch: "hsc-28", slug: "hsc-28-economics-2nd-paper-masterbook", subject: "economics", name: "অর্থনীতি ২য় পত্র", price: 495, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-economics-2nd-paper_1788427675221.jpg" },
  { batch: "hsc-28", slug: "hsc-28-business-and-management-1st-paper-masterbook", subject: "management", name: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা ১ম পত্র", price: 440, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-business-org-mgmt-1st-paper_1788427731567.jpg" },
  { batch: "hsc-28", slug: "hsc-28-business-and-management-2nd-paper-masterbook", subject: "management", name: "ব্যবসায় সংগঠন ও ব্যবস্থাপনা ২য় পত্র", price: 440, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-business-org-mgmt-2nd-paper_1788427771850.jpg" },
  { batch: "hsc-28", slug: "hsc-28-finance-banking-and-insurance-1st-paper-masterbook", subject: "finance", name: "ফিন্যান্স, ব্যাংকিং ও বিমা ১ম পত্র", price: 460, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-finance-banking-insurance-1st-paper_1788427872064.jpg" },
  { batch: "hsc-28", slug: "hsc-28-finance-banking-and-insurance-2nd-paper-masterbook", subject: "finance", name: "ফিন্যান্স, ব্যাংকিং ও বিমা ২য় পত্র", price: 490, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-finance-banking-insurance-2nd-paper_1788427905924.jpg" },
  { batch: "hsc-28", slug: "hsc-28-management-and-marketing-1st-paper-masterbook", subject: "marketing", name: "উৎপাদন ব্যবস্থাপনা ও বিপণন ১ম পত্র", price: 440, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-production-mgmt-marketing-1st-paper_1788427795254.jpg" },
  { batch: "hsc-28", slug: "hsc-28-management-and-marketing-2nd-paper-masterbook", subject: "marketing", name: "উৎপাদন ব্যবস্থাপনা ও বিপণন ২য় পত্র", price: 440, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-production-mgmt-marketing-2nd-paper_1788427826383.jpg" },
  { batch: "hsc-28", slug: "hsc-28-civics-and-good-governance-1st-paper-masterbook", subject: "civics", name: "পৌরনীতি ও সুশাসন ১ম পত্র", price: 460, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-civics-1st-paper_1788417762842.jpg" },
  { batch: "hsc-28", slug: "hsc-28-civics-and-good-governance-2nd-paper-masterbook", subject: "civics", name: "পৌরনীতি ও সুশাসন ২য় পত্র", price: 460, img: "https://cdn.10minuteschool.com/images/catalog/media/hsc-28-masterbook-updated-thumbnails-civics-2nd-paper_1788427627918.jpg" },
];

/** CT102: the store's masterbook bundles, with the subjects each covers (PCMB the science group, BEI the compulsory three, FAMM business studies).
 * CT206: `spelled` is what the letters stand for, the subjects in the letters' order, shown small under the name. */
export const masterbookBundles: { batch: string; slug: string; name: string; spelled: string; subjects: string[]; price: number; img: string }[] = [
  { batch: "hsc-28", slug: "hsc-28-master-book-bundle-famm", name: "FAMM: মাস্টারবুক বান্ডেল", spelled: "ফিন্যান্স, হিসাববিজ্ঞান, ব্যবস্থাপনা, মার্কেটিং", subjects: ["finance", "accounting", "management", "marketing"], price: 3780, img: "https://cdn.10minuteschool.com/images/catalog/media/HSC_28_FAMM_1789467664141.png" },
  { batch: "hsc-28", slug: "hsc-28-bei-masterbook-bundle", name: "BEI: মাস্টারবুক বান্ডেল", spelled: "বাংলা, ইংরেজি, ICT", subjects: ["bangla", "english", "ict"], price: 2990, img: "https://cdn.10minuteschool.com/images/catalog/media/ChatGPT_Image_Sep_8%2C_2026%2C_02_30_41_PM_1788856267449.png" },
  { batch: "hsc-28", slug: "hsc-28-pcmb-masterbook-bundle", name: "PCMB: মাস্টারবুক বান্ডেল", spelled: "পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান", subjects: ["physics", "chemistry", "math", "biology"], price: 6270, img: "https://cdn.10minuteschool.com/images/catalog/media/ChatGPT_Image_Sep_8%2C_2026%2C_01_59_13_PM_1788854374971.png" },
];

/**
 * CT241: three lines from each English course's own "এই কোর্সে যা থাকছে" on the live product page (read 16 Nov), in the
 * page's language: Spoken English (Bangla page), Grammar & Writing (its page is in English), IELTS Programme (Bangla
 * page). Study Abroad's site has no such list; its three are from the site's own figures. CT246: shortened to fit one
 * line as a description (the page's full wording: "সাপ্তাহিক ৩টি সেশন (২টি ক্লাস ও ১টি ল্যাঙ্গুয়েজ ক্লাব)", "প্রতি মাসে
 * ১টি করে প্রেজেন্টেশন ডে", "প্রতি মাসে ১টি করে 1:1 স্পিকিং প্র্যাকটিস"; "Certificate Upon Course Completion"; "১২টি
 * IELTS-style Speaking Mock"; "7 destinations available now", "30+ universities suggested").
 */
export const englishCourseFacts: Record<string, string[]> = {
  spoken: ["সাপ্তাহিক ৩টি সেশন", "প্রতি মাসে প্রেজেন্টেশন ডে", "প্রতি মাসে 1:1 স্পিকিং প্র্যাকটিস"],
  grammar: ["3-Month Course with 30 Classes", "3 Classes Per Week", "Certificate"],
  ielts: ["৩১টি লাইভ ক্লাস", "১২টি Partial Mock Tests", "১২টি Speaking Mock"],
  abroad: ["7 destinations", "30+ universities", "৳0 processing fee"],
};

/** CT137 (v42): the offline courses the designer named for HSC students at the branches, by `offlineCourses` id. */
export const branchNowCourses = ["grammar", "ielts"];

/** CT157: the live store's HSC books, where every masterbook is listed (the category the masterbooks above were read from). */
export const masterbookStore = "https://10minuteschool.com/store/categories/hsc_and_beyond/";

/**
 * CT161: the offers at the top of "তোমার জন্য ফ্রি", in this order. Each shows only from `from` until `to` (ISO times,
 * Bangladesh), so the team can bring one forward for a season (a suggestion before the exams, the demo in admission time).
 * `live` is the next free live classes, from the routine; `uploads` (CT162) the newest free video and PDF. Suggestions and a
 * free trial join when the teams have them (section 9).
 */
/**
 * CT176: the demo class and the free trial take turns, a day each, counted from `from` (a Bangladesh date): that day the
 * demo, the next the trial, and so on; the two never show together. `?offer=demo|trial` picks one, for review.
 */
export const offerTurns = { from: "2026-11-15", kinds: ["demo", "trial"] as const };

export const freeOffers: { kind: "uploads" | "live" | "demo" | "trial"; from?: string; to?: string }[] = [
  { kind: "uploads" },
  { kind: "live" },
  { kind: "demo" },
  // CT163: asked for by the designer; whether HSC 28 has a free trial, and what it gives, is open (section 9, item 89).
  { kind: "trial" },
];

/** Asked of the teams (design-audit section 9). */
export const SEGMENT_PENDING = [
  "How many English batches are running, and in which branches (the brief asks for the number)",
  "The মোহাম্মদপুর branch's address (not on the live centre list)",
  "A batch-level feed of the latest uploads (the dashboard's feed is one student's)",
];

/**
 * CT93: HSC 28's weekly live routine, as each subject's live product page shows it under "ক্লাস রুটিন" (read 14 Nov 2026,
 * `10minuteschool.com/product/hsc-28-<subject>-online-batch/`). Weekday 0 is Sunday; times are Bangladesh time. The pages
 * give no class length or topics: a class runs 90 minutes (as most of HSC 27's do) and is titled by its subject.
 */
export const weeklyRoutine: Record<string, { subject: string; name: string; course: string; days: number[]; time: string }[]> = {
  "hsc-28": [
    { subject: "ফিজিক্স", name: "পদার্থবিজ্ঞান", course: "HSC 28 অনলাইন ব্যাচ - ফিজিক্স", days: [6, 1, 3], time: "18:30" },
    { subject: "রসায়ন", name: "রসায়ন", course: "HSC 28 অনলাইন ব্যাচ - কেমিস্ট্রি", days: [6, 1, 3], time: "20:30" },
    { subject: "ম্যাথ", name: "উচ্চতর গণিত", course: "HSC 28 অনলাইন ব্যাচ - ম্যাথ", days: [0, 2, 4], time: "18:30" },
    { subject: "বায়োলজি", name: "জীববিজ্ঞান", course: "HSC 28 অনলাইন ব্যাচ - বায়োলজি", days: [0, 2, 4], time: "20:30" },
    { subject: "বাংলা", name: "বাংলা", course: "HSC 28 অনলাইন ব্যাচ - বাংলা", days: [2, 4], time: "16:30" },
    { subject: "ইংরেজি", name: "ইংরেজি", course: "HSC 28 অনলাইন ব্যাচ - ইংরেজি", days: [0, 3], time: "16:30" },
    { subject: "ICT", name: "ICT", course: "HSC 28 অনলাইন ব্যাচ - ICT", days: [6, 1], time: "16:30" },
  ],
};
/** CT93: the live pages give no length; most HSC 27 live classes run this long. */
export const WEEKLY_CLASS_MINUTES = 90;

/**
 * CT193 (lab `segment-home` v85): the fourth plan card, "শেষ মুহূর্তের প্রস্তুতি". HSC 28 has no last-minute course yet
 * (the team will give its facts, section 9); until then the card shows HSC 27's, per stream, marked as a sample:
 * its live classes and model tests (from the catalogue snapshot), its product page and (CT194) its thumbnail.
 * CT205: the class count is the designer's (a last-minute course runs 10–15 classes); the HSC 27 pages list 180, 133 and
 * 100 for the whole bundles (section 9, item 95). "ফাইনাল" left out of the model tests so each fact keeps one line.
 */
export const lastMinuteSample: Record<string, { url: string; thumb: string; facts: [string, string] }> = {
  science: {
    url: "https://10minuteschool.com/product/hsc-27-sesh-muhurter-prostuti-science/",
    thumb: "https://cdn.10minuteschool.com/images/catalog/media/hsc-27-shesh-muhurtor-prostuti-course-biggyan-bibhag-bundle-sqr_1788940060736.jpg",
    facts: ["১০–১৫টি লাইভ ক্লাস", "১৩টি মডেল টেস্ট + সল্ভ শিট"],
  },
  "business-studies": {
    url: "https://10minuteschool.com/product/hsc-27-sesh-muhurter-prostuti-business-studies/",
    thumb: "https://cdn.10minuteschool.com/images/catalog/media/hsc-27-shesh-muhurtor-prostuti-course-business-shikkha-bundle-sqr-thumbnail_1788940192044.jpg",
    facts: ["১০–১৫টি লাইভ ক্লাস", "১৫টি মডেল টেস্ট + সল্ভ শিট"],
  },
  humanities: {
    url: "https://10minuteschool.com/product/hsc-27-sesh-muhurter-prostuti-humanities/",
    thumb: "https://cdn.10minuteschool.com/images/catalog/media/hsc-27-shesh-muhurtor-prostuti-course-manobik-bibhag-bundle-sqr-thumbnail_1788940285851.jpg",
    facts: ["১০–১৫টি লাইভ ক্লাস", "১৩টি মডেল টেস্ট + সল্ভ শিট"],
  },
};

/**
 * CT197 (lab `segment-home` v89): the HSC 28 bundles' square covers, by product id. The catalogue carries only their
 * wide thumbnails; these 1080×1080 versions sit beside them on the CDN (the compulsory bundle's is the one its
 * product page uses). The plan cards show every course in the same square, so none looks cut.
 */
const SQR = "https://cdn.10minuteschool.com/images/Thumbnails/hsc-28-ob-individual-course/bundle_new/hsc-28-online-batch-";
export const squareCovers: Record<string, string> = {
  "11234": `${SQR}physics-chemistry-biology-higher-math-sqr-thumbnail.jpg`,
  "11233": `${SQR}bangla-english-ict-online-batch-sqr-thumbnail.jpg`,
  "11235": `${SQR}finance-accounting-management-marketing-sqr-thumbnail.jpg`,
  "11236": `${SQR}geography-economics-civics-sqr-thumbnail.jpg`,
};
