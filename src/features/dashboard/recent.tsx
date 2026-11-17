import { RecentCard } from "@/design-system/organisms/dashboard/recent-card";
import { getRecent } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function Recent({ ctx, lang, t }: SectionProps) {
  const c = await ctx;
  const items = await getRecent(c);
  return <RecentCard items={items} fmt={createFormatter(lang, c.now)} t={t} />;
}
