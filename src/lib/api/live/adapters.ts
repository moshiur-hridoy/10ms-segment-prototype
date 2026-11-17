import { dhakaDay, shiftDay } from "@/lib/time";

/*
 * Pure mappers from the live 10 Minute School API responses to our data files
 * (the shapes in ../schemas.ts). The response types below list only the fields we read;
 * they come from the shapes recorded in docs/api-map.md. Nothing here does I/O.
 */

type Bn = { bn?: string; en?: string };
const nameOf = (n: Bn | string | null | undefined) => (typeof n === "string" ? n : (n?.bn || n?.en || ""));

/* ---------- user ---------- */

export type MeResponse = {
  data: {
    user_info: {
      id?: string;
      user_id?: string;
      name: string;
      profile_img_url?: string | null;
      class_name?: string | null;
      current_academic_group?: string | null;
      institution_name?: string | null;
    };
  };
};

export function toUser(me: MeResponse) {
  const u = me.data.user_info;
  const label = [u.class_name, u.current_academic_group].filter(Boolean).join(" - ") || "10 Minute School";
  return {
    id: u.user_id || u.id || "me",
    name: u.name,
    avatarUrl: u.profile_img_url || null,
    school: u.institution_name || null,
    hotline: "16910",
    unreadMessages: 0,
    activeBatchId: "active",
    batches: [{ id: "active", label }],
  };
}

/* ---------- streak ---------- */

export type ActiveStatusResponse = {
  data: { activities: { date: string; activity_score: number; streak: boolean }[] };
};

/** `now` decides "today". The API dates are the start of each Dhaka day, as UTC. */
export function toStreak(res: ActiveStatusResponse, now: number) {
  const today = dhakaDay(now);
  const done = new Map<string, boolean>();
  for (const a of res.data.activities) done.set(dhakaDay(Date.parse(a.date)), a.streak);

  // Seven consecutive days ending today.
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = shiftDay(today, i - 6);
    return { date, completed: done.get(date) === true };
  });

  const days = [...done.keys()].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (!done.get(d)) run = 0;
    else run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    prev = d;
    best = Math.max(best, run);
  }

  // Current streak: back from today, or from yesterday while today is still open.
  let cursor = done.get(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (done.get(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  return { current, best: Math.max(best, current), week };
}

/* ---------- courses ---------- */

export type EnrolmentsResponse = {
  data: {
    product: {
      id: string;
      name: string;
      slug: string;
      modality: string;
      platform?: string;
      vertical?: string[];
      thumbnail?: string | null;
    };
  }[];
};

export type ProgressResponse = {
  data: {
    catalog_product_id: string | number;
    progress: number;
    total_badges?: number;
    achieved_badges?: number;
  }[];
};

const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function toCourses(enrolments: EnrolmentsResponse, ...progress: (ProgressResponse | null)[]) {
  const byProduct = new Map<string, ProgressResponse["data"][number]>();
  for (const res of progress) for (const p of res?.data ?? []) byProduct.set(String(p.catalog_product_id), p);

  return {
    enrolled: enrolments.data.map(({ product: p }) => {
      const pr = byProduct.get(String(p.id));
      const vertical = p.vertical ?? [];
      return {
        id: String(p.id),
        productId: String(p.id),
        title: p.name,
        category: vertical.includes("k12") ? "academic" : vertical.includes("english") ? "english" : "skills",
        progress: clampPct(pr?.progress ?? 0),
        nextItems: [] as never[],
        courseHomeUrl: `https://10minuteschool.com/product/${p.slug}/`,
        batchType: p.modality === "online_batch" ? "online" : "recorded",
        ...(p.thumbnail ? { thumbnailUrl: p.thumbnail } : {}),
        ...(pr?.total_badges ? { badges: { earned: pr.achieved_badges ?? 0, total: pr.total_badges } } : {}),
      };
    }),
  };
}

/* ---------- notices ---------- */

export type NoticesResponse = {
  data: {
    id: string;
    title: string;
    description?: string;
    program_name?: string;
    program_modality?: string;
    start_at: string;
    status: string;
    resource_type?: string;
    resource_value?: string;
  }[];
};

export function toNotices(res: NoticesResponse) {
  return {
    items: res.data.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.description || n.title,
      course: n.program_name || "10 Minute School",
      batchType: n.program_modality === "online_batch" ? "online" : "recorded",
      publishedAt: n.start_at,
      read: n.status === "read",
      ...(n.resource_type === "url" && n.resource_value ? { url: n.resource_value } : {}),
    })),
  };
}

/* ---------- classes (the home routine) ---------- */

export type RoutineResponse = {
  data: {
    course: { catalog_product_id: number; name: Bn | string };
    content: { map_content_id: number; type: string; name: string; start_at: string; end_at: string };
    status: string;
  }[];
};

/** Statuses that are still ahead or running. "ready" and "discussion" are past sessions. */
const AHEAD = new Set(["scheduled", "live"]);

export function toClasses(res: RoutineResponse) {
  const upcoming = res.data
    .filter((r) => AHEAD.has(r.status))
    .map(({ course, content }) => ({
      id: String(content.map_content_id),
      kind: content.type === "exam" ? ("exam" as const) : ("class" as const),
      title: content.name,
      course: nameOf(course.name),
      courseId: String(course.catalog_product_id),
      startsAt: content.start_at,
      endsAt: content.end_at,
    }));
  // The dashboard routine does not say who attended, so nothing can be called missed.
  return { upcoming, missed: [] };
}
