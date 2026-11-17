import "server-only";
import { dhakaDay, shiftDay } from "@/lib/time";
import type { DataFile } from "../schemas";
import {
  toClasses,
  toCourses,
  toNotices,
  toStreak,
  toUser,
  type ActiveStatusResponse,
  type EnrolmentsResponse,
  type MeResponse,
  type NoticesResponse,
  type ProgressResponse,
  type RoutineResponse,
} from "./adapters";

/*
 * Server-side client for the live API. Credentials come from the environment and never reach the browser:
 *   TENMS_API_TOKEN     the student's access token (the `access_token` cookie value)
 *   TENMS_ACCESS_KEY    the app's `x-tenms-access-key` header
 *   TENMS_PLATFORM      `x-tenms-source-platform`   (optional)
 *   TENMS_LANG          `x-tenms-source-lang`       (optional)
 *   TENMS_GRADE / TENMS_BATCH / TENMS_GROUP   the student's class filters, e.g. hsc_and_beyond / hsc-2027 / science
 * Assumption to confirm with the backend: the token goes in `Authorization: Bearer <token>`.
 */

const BASE = process.env.TENMS_API_BASE ?? "https://api.10minuteschool.com";

export const liveConfigured = () => Boolean(process.env.TENMS_API_TOKEN);

async function get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);

  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${process.env.TENMS_API_TOKEN}`,
  };
  const extra = {
    "x-tenms-access-key": process.env.TENMS_ACCESS_KEY,
    "x-tenms-source-platform": process.env.TENMS_PLATFORM,
    "x-tenms-source-lang": process.env.TENMS_LANG,
  };
  for (const [k, v] of Object.entries(extra)) if (v) headers[k] = v;

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`${path} answered ${res.status}`);
  return (await res.json()) as T;
}

/** A Dhaka calendar day as the API expects it: its start and end as UTC instants. */
const dayStart = (day: string) => new Date(Date.parse(`${day}T00:00:00+06:00`)).toISOString();
const dayEnd = (day: string) => new Date(Date.parse(`${day}T23:59:59.999+06:00`)).toISOString();

const filters = () => ({
  vertical: "k12",
  grade: process.env.TENMS_GRADE,
  batch: process.env.TENMS_BATCH,
  group: process.env.TENMS_GROUP,
});

/** Files that have a live source. Everything else keeps reading the snapshot fixture. */
export const liveFiles: Partial<Record<DataFile, (now: number) => Promise<unknown>>> = {
  user: async () => toUser(await get<MeResponse>("auth/v1/user/me")),

  streak: async (now) => {
    const today = dhakaDay(now);
    const range = (days: number) => ({
      start_at: dayStart(shiftDay(today, -(days - 1))),
      end_at: dayEnd(today),
    });
    const path = "tenlytics-service/api/v1/learning/active-status";
    // A longer window gives a truer current/best streak; fall back to the week the site itself asks for.
    const res = await get<ActiveStatusResponse>(path, range(30)).catch(() => get<ActiveStatusResponse>(path, range(7)));
    return toStreak(res, now);
  },

  courses: async () => {
    const enrolments = await get<EnrolmentsResponse>("enrolment-service/api/v1/my-enrolments", { limit: "-1" });
    // School (k12) products report progress through tenlytics, skills courses through skillup.
    const idsOf = (platform: string) =>
      enrolments.data.filter((e) => e.product.platform === platform).map((e) => e.product.id);
    const [k12, skills] = await Promise.all([
      fetchProgress("tenlytics-service/api/v1/engagements/products/progress", idsOf("k12")),
      fetchProgress("skillup-service/api/v4/courses/progress", idsOf("skills")),
    ]);
    return toCourses(enrolments, k12, skills);
  },

  notices: async () =>
    toNotices(
      await get<NoticesResponse>("notice-service/api/v1/notices", {
        identification_id: process.env.TENMS_GRADE,
        identification_type: "grade",
        page: "1",
        type: "notice",
        limit: "10",
        show_enrolled: "true",
        batch: process.env.TENMS_BATCH,
        group: process.env.TENMS_GROUP,
      }),
    ),

  classes: async () =>
    toClasses(
      await get<RoutineResponse>("k12-course-service/api/v2/routine", {
        page: "home",
        limit: "5",
        modality: "online_batch",
        ...filters(),
      }),
    ),
};

/** The progress endpoints are POSTs on the site. A failure here only means 0% progress. */
async function fetchProgress(path: string, ids: string[]): Promise<ProgressResponse | null> {
  if (!ids.length) return null;
  try {
    const url = new URL(`${BASE}/${path}`);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${process.env.TENMS_API_TOKEN}`,
        ...(process.env.TENMS_ACCESS_KEY ? { "x-tenms-access-key": process.env.TENMS_ACCESS_KEY } : {}),
      },
      body: JSON.stringify({ products: ids.map((id) => ({ catalog_product_id: id })) }),
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as ProgressResponse) : null;
  } catch {
    return null;
  }
}
