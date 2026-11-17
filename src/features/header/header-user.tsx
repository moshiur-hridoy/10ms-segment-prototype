import { HeaderActions } from "@/design-system/organisms/header/header-actions";
import type { SectionProps } from "@/features/dashboard/types";
import { getNotices, getUser } from "@/lib/api";
import { createFormatter } from "@/lib/format";

export async function HeaderUser({ ctx, lang, t }: SectionProps) {
  const c = await ctx;
  const [user, { items }] = await Promise.all([getUser(c), getNotices(c)]);
  return <HeaderActions user={user} notices={items} fmt={createFormatter(lang, c.now)} lang={lang} t={t} />;
}
