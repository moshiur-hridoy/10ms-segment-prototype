import type { CatalogData, CatalogProduct, CatalogSubject, Course } from "./schemas";

/*
 * A catalogue page (HSC 27) as a study-plan chooser instead of a wall of product cards. The student
 * picks a stream, then the subjects they want; `planFor` works out the cheapest way to buy exactly
 * those (bundles where they pay off, single subjects otherwise) and what that saves against buying
 * each subject alone. Pure (no I/O), so the client picker and the tests share it.
 */

export type StreamView = {
  id: string;
  name: string;
  /** The stream's own subjects (physics, chemistry …), then the ones every stream takes. */
  group: CatalogSubject[];
  compulsory: CatalogSubject[];
  /** Live batches sold in this stream: single subjects and bundles. */
  live: CatalogProduct[];
  recorded: CatalogProduct | null;
  finalPrep: CatalogProduct | null;
  /** Subjects the student already studies through a live batch they own. */
  owned: string[];
  /** How many students are in the stream's main live bundle ("৩৩০৫ জন পড়ছে"). */
  learners: number | null;
  /** The bundle for the stream's own subjects (the one most students buy), and the rest to add to it. */
  main: CatalogProduct | null;
  addOns: CatalogProduct[];
};

export type CatalogView = {
  batch: CatalogData["batch"];
  /** `here`: the batch has its page in this app; otherwise it opens the main site. */
  batches: (CatalogData["batches"][number] & { here: boolean })[];
  layout: CatalogData["layout"];
  audience: string | null;
  highlights: string[];
  billing: CatalogData["billing"];
  freeClassUrl: string | null;
  timeline: CatalogData["timeline"];
  toppers: number | null;
  streams: { id: string; name: string }[];
  stream: StreamView;
  /** Live enrolments shown on this page, with the course home to open instead of buying. */
  enrolled: { product: CatalogProduct; courseId: string }[];
  /** Product ids the student owns (any kind), to mark recorded / final-prep cards too. */
  ownedProducts: string[];
  features: CatalogData["features"];
  testimonials: CatalogData["testimonials"];
  videoTestimonials: CatalogData["videoTestimonials"];
  faq: CatalogData["faq"];
};

export function buildCatalog(data: CatalogData, enrolled: Course[], streamId: string | null, pagesHere: string[] = [data.batch.id]): CatalogView {
  const byProduct = new Map(data.products.map((p) => [p.id, p]));
  const bySubject = new Map(data.subjects.map((s) => [s.id, s]));
  const owns = new Map(enrolled.flatMap((c) => (c.productId && byProduct.has(c.productId) ? [[c.productId, c.id] as const] : [])));

  const productsOf = (s: CatalogData["streams"][number]) => s.productIds.flatMap((id) => byProduct.get(id) ?? []);
  // No stream asked for: open on the one the student is enrolled in, else the first.
  const fallback = data.streams.find((s) => productsOf(s).some((p) => owns.has(p.id) && p.kind === "live")) ?? data.streams[0];
  const raw = data.streams.find((s) => s.id === streamId) ?? fallback;

  const products = productsOf(raw);
  const live = products.filter((p) => p.kind === "live");
  const subjectsOf = (ids: string[]) => ids.flatMap((id) => bySubject.get(id) ?? []);
  const owned = [...new Set(live.filter((p) => owns.has(p.id)).flatMap((p) => p.subjects))];
  const groupIds = new Set(raw.groupSubjects);
  const groupCover = (p: CatalogProduct) => p.subjects.filter((s) => groupIds.has(s)).length;
  const main = live.filter((p) => groupCover(p) > 0).sort((a, b) => groupCover(b) - groupCover(a) || b.subjects.length - a.subjects.length)[0];

  return {
    batch: data.batch,
    batches: data.batches.map((b) => ({ ...b, here: pagesHere.includes(b.id) })),
    layout: data.layout,
    audience: data.audience,
    highlights: data.highlights,
    billing: data.billing,
    freeClassUrl: data.freeClassUrl,
    timeline: data.timeline,
    toppers: data.toppers,
    streams: data.streams.map((s) => ({ id: s.id, name: s.name })),
    stream: {
      id: raw.id,
      name: raw.name,
      group: subjectsOf(raw.groupSubjects),
      compulsory: subjectsOf(raw.compulsorySubjects),
      live,
      recorded: products.find((p) => p.kind === "recorded") ?? null,
      finalPrep: products.find((p) => p.kind === "finalPrep") ?? null,
      owned,
      learners: main?.enrolledCount ?? null,
      main: main ?? null,
      addOns: live.filter((p) => p !== main),
    },
    enrolled: live.flatMap((p) => (owns.has(p.id) ? [{ product: p, courseId: owns.get(p.id)! }] : [])),
    ownedProducts: [...owns.keys()],
    features: data.features,
    testimonials: data.testimonials,
    videoTestimonials: data.videoTestimonials,
    faq: data.faq,
  };
}

/* ---------- the plan ---------- */

export type Plan = {
  /** What to buy: bundles first, then single subjects. */
  items: CatalogProduct[];
  total: number;
  /** Subjects a chosen bundle brings that the student didn't pick (it was still the cheapest way). */
  bonus: string[];
  /** Every picked subject bought alone; null when one of them is only sold in a bundle. */
  separateTotal: number | null;
  saving: number;
  /** Live classes a week across the plan; null when a product doesn't say. */
  weekly: number | null;
  /** Picked subjects no live product covers (shouldn't happen with real data). */
  missing: string[];
};

const isBundle = (p: CatalogProduct) => p.subjects.length > 1;

/** The cheapest single-subject batch for each subject. */
function singlesOf(live: CatalogProduct[]) {
  const map = new Map<string, CatalogProduct>();
  for (const p of live) {
    if (isBundle(p)) continue;
    const cur = map.get(p.subjects[0]);
    if (!cur || p.price.final < cur.price.final) map.set(p.subjects[0], p);
  }
  return map;
}

/**
 * Cheapest set of live products covering the picked subjects (minus the ones already owned).
 * A stream has at most a handful of bundles, so every combination is tried; whatever a chosen
 * bundle leaves uncovered is bought as single subjects. Ties go to fewer products, then fewer extras.
 */
export function planFor(picked: string[], live: CatalogProduct[], owned: string[] = []): Plan {
  const have = new Set(owned);
  const coverable = new Set(live.flatMap((p) => p.subjects));
  const wanted = [...new Set(picked)].filter((s) => !have.has(s));
  const missing = wanted.filter((s) => !coverable.has(s));
  const needed = wanted.filter((s) => coverable.has(s));
  const singles = singlesOf(live);
  const bundles = live.filter((p) => isBundle(p) && p.subjects.some((s) => needed.includes(s)));

  let best: { items: CatalogProduct[]; total: number; extra: number } | null = null;
  for (let mask = 0; mask < 1 << bundles.length; mask++) {
    const chosen = bundles.filter((_, i) => mask & (1 << i));
    const covered = new Set(chosen.flatMap((p) => p.subjects));
    const rest = needed.filter((s) => !covered.has(s));
    if (rest.some((s) => !singles.has(s))) continue;
    const items = [...chosen, ...rest.map((s) => singles.get(s)!)];
    const total = items.reduce((sum, p) => sum + p.price.final, 0);
    const extra = [...covered].filter((s) => !needed.includes(s) && !have.has(s)).length;
    if (!best || total < best.total || (total === best.total && (items.length < best.items.length || (items.length === best.items.length && extra < best.extra)))) {
      best = { items, total, extra };
    }
  }

  // Every needed subject is coverable (taking all bundles at worst), so a plan always exists.
  if (!best) return { items: [], total: 0, bonus: [], separateTotal: null, saving: 0, weekly: null, missing };

  const covered = new Set(best.items.flatMap((p) => p.subjects));
  const bonus = [...covered].filter((s) => !needed.includes(s) && !have.has(s));
  const separate = needed.every((s) => singles.has(s)) ? needed.reduce((sum, s) => sum + singles.get(s)!.price.final, 0) : null;
  const weekly = best.items.every((p) => p.liveClassesPerWeek !== null) ? best.items.reduce((sum, p) => sum + p.liveClassesPerWeek!, 0) : null;

  return {
    items: best.items,
    total: best.total,
    bonus,
    separateTotal: separate,
    saving: separate === null ? 0 : Math.max(0, separate - best.total),
    weekly: best.items.length ? weekly : null,
    missing,
  };
}

export type Nudge = { add: string[]; extra: number; bundle: CatalogProduct };

/**
 * One honest upsell: a bundle that, for a little more, adds subjects for less than they cost alone
 * ("আর ৳১,০০০ দিলে ম্যাথ ও বায়োলজিও পাবে"). The best value per added subject wins; none if nothing beats buying alone.
 */
export function nudgeFor(picked: string[], live: CatalogProduct[], owned: string[], plan: Plan): Nudge | null {
  if (!plan.items.length) return null;
  const skip = new Set([...picked, ...owned, ...plan.bonus]);
  const singles = singlesOf(live);
  let best: (Nudge & { per: number }) | null = null;
  for (const bundle of live.filter(isBundle)) {
    if (plan.items.includes(bundle)) continue;
    const add = bundle.subjects.filter((s) => !skip.has(s));
    if (!add.length) continue;
    const next = planFor([...picked, ...add], live, owned);
    const extra = next.total - plan.total;
    const alone = add.reduce((sum, s) => sum + (singles.get(s)?.price.final ?? Infinity), 0);
    if (extra <= 0 || extra >= alone) continue;
    const per = extra / add.length;
    if (!best || per < best.per) best = { add, extra, bundle, per };
  }
  return best && { add: best.add, extra: best.extra, bundle: best.bundle };
}

/** The quick picks above the subject list. Owned subjects are never re-picked. */
export function presetsFor(stream: Pick<StreamView, "group" | "compulsory" | "owned">) {
  const ids = (list: CatalogSubject[]) => list.map((s) => s.id).filter((id) => !stream.owned.includes(id));
  return { all: [...ids(stream.group), ...ids(stream.compulsory)], group: ids(stream.group), compulsory: ids(stream.compulsory) };
}
