/*
 * The demo sign-in. There is no auth backend yet: a successful code sets one cookie for 30 days,
 * the proxy sends any page without it to the login page (with `next` = where the student was
 * going), and the profile menu's logout clears it. Plain values only, so the proxy can import it.
 */

import { clearFreeStart } from "./free-start";

export const SESSION_COOKIE = "demo_session";
const MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Which demo student is signed in (LG19): `full` is the demo student with courses (the `snapshot` data),
 * `free` a free student with none (the `new` data). The cookie's value says which; the data context reads it.
 */
export type DemoStudent = "full" | "free";
export const FREE_SESSION = "free";

/** Browser only: mark the student as signed in. */
export function startDemoSession(student: DemoStudent = "full") {
  document.cookie = `${SESSION_COOKIE}=${student === "free" ? FREE_SESSION : "1"}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

/** Browser only: sign out; the free start kept on the dashboard (OB15) goes with the session. */
export function endDemoSession() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
  clearFreeStart();
}

/** The `next` target if it is a path on this site (not "//host" or "https://…"), else null. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}

/** True for the login page itself, which must stay open without a session. */
export const isLoginPath = (pathname: string) => /^\/[a-z]{2}\/login\/?$/.test(pathname);

/**
 * The pages a visitor sees before signing in: the landing (home, product pages, the cart), the
 * segment pages (`/hsc/<batch>`, CT21), the guest's landing in the app, and a paper's class page
 * (`/subject/<id>`, CT28), where a guest gets the free classes and a lock on the rest. Checkout needs a session.
 */
export const isPublicPath = (pathname: string) => /^\/[a-z]{2}\/(?:hsc\/[^/]+|subject\/[^/]+)\/?$/.test(pathname);

/** CT104: a batch's live routine (`/routine?batch=`, CT74) is the segment page's too, so a visitor sees it without signing in. */
export const isPublicRoutine = (pathname: string, params: URLSearchParams) => /^\/[a-z]{2}\/routine\/?$/.test(pathname) && params.has("batch");

/** Browser only: whether the demo session cookie is set. */
export const hasDemoSession = () => document.cookie.split("; ").some((c) => c.startsWith(`${SESSION_COOKIE}=`) && c !== `${SESSION_COOKIE}=`);
