import { cookies } from "next/headers";
import type { Preset } from "@/features/segment/visitor";
import { FREE_SESSION, SESSION_COOKIE } from "./session";

/*
 * Who is looking (CT21), for the pages a guest can open: the segment page and the class page (CT28).
 * A guest has no session cookie. `?as=` overrides it for reviews (CT26): `new` and `onboarded` are
 * guests, `member` a signed-in student. `free` (OB15) is the free demo student (LG19): signed in, with no courses, so
 * the batch pages treat them like a guest for what is open (the free classes) but keep their header.
 */

type SearchParams = Record<string, string | string[] | undefined>;
export type Visitor = { guest: boolean; preset: Preset; free: boolean };

export async function visitorOf(searchParams: Promise<SearchParams> | SearchParams): Promise<Visitor> {
  const [sp, jar] = await Promise.all([searchParams, cookies()]);
  const as = Array.isArray(sp.as) ? sp.as[0] : sp.as;
  if (as === "new" || as === "onboarded") return { guest: true, preset: as, free: false };
  if (as === "member") return { guest: false, preset: null, free: false };
  const session = jar.get(SESSION_COOKIE)?.value;
  return { guest: !session, preset: null, free: session === FREE_SESSION };
}
