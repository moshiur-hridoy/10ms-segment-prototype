import { NoticesCard } from "@/design-system/organisms/dashboard/notices-card";
import { getNotices } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function Notices({ ctx, lang, t }: SectionProps) {
  const c = await ctx;
  const { items } = await getNotices(c);
  return <NoticesCard items={items} fmt={createFormatter(lang, c.now)} lang={lang} t={t} />;
}
