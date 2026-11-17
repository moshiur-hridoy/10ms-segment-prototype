import { WelcomeCard } from "@/design-system/organisms/dashboard/welcome-card";
import { getBrief, getUser } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function Welcome({ ctx, lang, t }: SectionProps) {
  const c = await ctx;
  const [user, brief] = await Promise.all([getUser(c), getBrief(c)]);
  return <WelcomeCard user={user} brief={brief} now={c.now} fmt={createFormatter(lang, c.now)} t={t} />;
}
