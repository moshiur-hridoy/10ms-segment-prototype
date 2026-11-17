"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PublicNav } from "@/design-system/organisms/header/public-nav";
import type { PublicNavGroup } from "@/design-system/organisms/header/public-nav/public-nav";
import { PUBLIC_TAB } from "@/design-system/organisms/header/site-header";
import { PUBLIC_NAV } from "@/data/landing/nav";

const noSubscribe = () => () => {};
const search = () => location.search;

/** CT216: the app's own pages in the menu keep `?lab=` and `?as=`, so a lab link stays in the lab from page to page. */
function keepParams(groups: PublicNavGroup[], q: string): PublicNavGroup[] {
  const sp = new URLSearchParams(q);
  const keep = (["lab", "as"] as const).flatMap((k) => (sp.get(k) ? [[k, sp.get(k)!] as const] : []));
  if (!keep.length) return groups;
  const withKeep = (href: string | undefined) => {
    if (!href?.startsWith("/")) return href;
    const [path, query = ""] = href.split("?");
    const params = new URLSearchParams(query);
    for (const [k, v] of keep) if (!params.has(k)) params.set(k, v);
    return `${path}?${params}`;
  };
  return groups.map((g) => ({
    ...g,
    href: withKeep(g.href),
    items: g.items?.map((i) => (i === "divider" ? i : { ...i, href: withKeep(i.href), sub: i.sub?.map((s) => ({ ...s, href: withKeep(s.href)! })) })),
  }));
}

/** CT64: the live site's menus for a visitor who isn't signed in, as on the landing. Client-side: the menus carry icon components. */
export function GuestNav({ label }: { label: string }) {
  const q = useSyncExternalStore(noSubscribe, search, () => "");
  const groups = useMemo(() => keepParams(PUBLIC_NAV, q), [q]);
  return <PublicNav groups={groups} label={label} tabClassName={PUBLIC_TAB} />;
}
