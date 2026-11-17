/**
 * Every number and link on the page, with where it came from.
 * Rule (CLAUDE.md): real content only. Anything not yet confirmed by a team is listed in
 * `PENDING` and shown on the page with the <Sample> marker.
 */

const SITE = "https://10minuteschool.com";

/** Product pages built in this app; every other product still opens on the live site. */
const BUILT = new Set<string>();

/** The journey inside this app: home → product → cart → login → checkout → paid → the course. Bangla only. */
export const paths = {
  // Prototype: no landing pages; home is the segment page, and buying goes to its plans.
  home: "/bn/hsc/hsc-28",
  cart: "/bn/hsc/hsc-28#plans",
  checkout: "/bn/hsc/hsc-28#plans",
  paid: "/bn/hsc/hsc-28#plans",
  login: "/bn/login",
};

/**
 * The live payment page (the designer's screenshot, 1 Nov 2026): bKash, or "অন্যান্য পেমেন্ট মাধ্যম"
 * (its icons show VISA, Mastercard and two mobile wallets), an agent on 16910, and a link to pay
 * from another phone. Order numbers there look like TMS58701905.
 */
export const payment = {
  methods: [
    { id: "bkash", name: "বিকাশ", going: "বিকাশে নিয়ে যাচ্ছি…" },
    { id: "other", name: "অন্যান্য পেমেন্ট মাধ্যম", going: "পেমেন্ট পেজে নিয়ে যাচ্ছি…" },
  ],
  orderPrefix: "TMS",
  /** FAQ: "এই নম্বরে যোগাযোগ করুন: ১৬৯১০ (সকাল ৮টা – রাত ১১টা)". */
  hours: "সকাল ৮টা – রাত ১১টা",
};

export const links = {
  home: paths.home,
  en: `${SITE}/en/`,
  login: paths.login,
  dashboard: "/bn",
  phone: "tel:16910",
  phoneAlt: "tel:+8809610916910",
  freeClassHsc: `${SITE}/event/hsc-online-batch/`,
  englishOnline: `${SITE}/english/online/`,
  englishOffline: `${SITE}/english/offline/`,
  englishCentreFreeClass: `${SITE}/event/book-your-free-class-10ms-english-centre/`,
  skills: `${SITE}/skills/`,
  jobsPrep: `${SITE}/jobs-prep/`,
  store: `${SITE}/store/all/`,
  studyAbroad: "https://study-abroad.10minuteschool.com/",
  playStore: "https://play.google.com/store/apps/details?id=com.a10minuteschool.tenminuteschool",
  appStore: "https://apps.apple.com/us/app/10-minute-school/id1577061772",
  privacy: "https://app.10minuteschool.com/privacy-policy",
  refund: "https://app.10minuteschool.com/refund-policy",
  terms: "https://app.10minuteschool.com/terms-and-conditions",
  teacher: "https://docs.google.com/forms/d/e/1FAIpQLScWh9jjyWnUKdDKET1-LHvdTxuU6-ssd0GLTI-0JlQ2MH6RzA/viewform",
  certificate: `${SITE}/certificate`,
  facebook: "https://www.facebook.com/10minuteschool/",
  youtube: "https://www.youtube.com/channel/UCL89KKkLs0tZKld-iIS3NGw",
  product: (slug: string) => (BUILT.has(slug) ? `/bn/product/${slug}` : `${SITE}/product/${slug}/`),
};

/** Numbers as the live Bangla home page shows them (captured 30–31 Oct 2026). */
export const proof = {
  /** Batch section: "Be one of the 30,000+ academic students currently studying…" */
  academicStudents: "৩০,০০০+",
  /** App section: "গুগল প্লে স্টোরে ৪.৫+ … রেটিং দিয়েছে প্রায় ৩,০০,০০০ শিক্ষার্থী" */
  rating: "৪.৫",
  ratingCount: "প্রায় ৩ লাখ",
  /** App downloads, given by the designer on 2 Nov 2026 (the live pages' counters, ৪,৬২,০৬৮+ in
   *  Bangla and ৪,৯১,৮৪৩+ in English, were out of date). */
  downloads: "৭.৫ লাখ+",
};

/** Results as the live Bangla home page shows them (banner images, captured 31 Oct 2026). */
export const results = {
  /** Banner: "সারাদেশ থেকে আমাদের ৬০০+ শিক্ষার্থী বার্ষিক পরীক্ষায় ১ম হয়েছে!" */
  firstInAnnualExam: "৬০০+",
  /** Event photo banner: "কৃতী শিক্ষার্থী ২০২৪ | ৯ম ও ১০ম শ্রেণি" */
  eventCaption: "কৃতী শিক্ষার্থী সংবর্ধনা ২০২৪ · ৯ম ও ১০ম শ্রেণি",
};

/** A real testimonial from the live Bangla home page (shortened at the ellipses). */
export const testimonial = {
  quote:
    "আসলে আমি 10 ms এর ফ্রি ক্লাসগুলো করে আসছি। আর এই ক্লাসগুলোই আমাকে inspire করেছে ভালো একটা স্থান অর্জন করার।",
  name: "পূজা রানী দাস",
  school: "The Roses Collectorate School, Habiganj",
};

/** The batch benefits as the live page lists them ("Students are getting from Online Batches"). */
export const benefits = [
  "প্রতি সপ্তাহে লাইভ ক্লাস",
  "ক্লাস মিস? রেকর্ডেড ক্লাস",
  "হোমওয়ার্ক আর সাপ্তাহিক পরীক্ষা",
  "আনলিমিটেড MCQ প্র্যাকটিস",
  "প্রিন্টেড মাস্টারবুক",
  "২৪ ঘণ্টা ডাউট সলভ",
];

export const englishCentres = [
  { name: "উত্তরা", map: "https://www.google.com/maps/place/10+Minute+School+English+Centre+Uttara/@23.8645579,90.3963086,17z" },
  { name: "পান্থপথ", map: "https://www.google.com/maps?q=10+Minute+School+English+Centre,+Green+Road,+Panthapath,+Dhaka" },
  { name: "মিরপুর", map: "https://www.google.com/maps/place/10+Minute+School+English+Centre+Mirpur/@23.8044657,90.3693722,15z" },
  { name: "মগবাজার", map: "https://www.google.com/maps/place/10+Minute+School+English+Centre+Moghbazar/@23.7490976,90.4048202,17z" },
  { name: "চট্টগ্রাম", map: "https://www.google.com/maps/place/10+Minute+School+English+Centre+Chattogram/@22.3577849,91.8388827,19.34z" },
];

/** Shown on the page with the <Sample> marker until a team confirms them. */
export const PENDING = [
  "Prices for every batch (no price on the live home page)",
  "Live class times: the countdown uses a sample time (8 pm)",
  "A result story (medical or varsity admission) with permission; the stage reels show medical and varsity winners but no written story yet",
  "Free-class links for SSC, Class 5–8 and admission (only HSC has one)",
  "Sub-brand names under each step on desktop: SuperLive (live classes), SuperPrep (practice), TenTen (doubt solving); the live page uses SuperSolve and TenTen for the same feature (audit LH-09)",
  "After payment: how the Masterbook and the T-shirt are delivered, and when they arrive",
  "Whether Class 5 has an online batch (the hero says ৫ম–৮ম; batches exist for 6, 7 and 8)",
];
