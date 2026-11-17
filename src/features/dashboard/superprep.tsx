import { SuperPrepCard } from "@/design-system/organisms/dashboard/superprep-card";
import { getSuperPrep } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function SuperPrep({ ctx, lang, t, instance }: SectionProps & { instance?: string }) {
  const c = await ctx;
  const sp = await getSuperPrep(c);
  return <SuperPrepCard sp={sp} fmt={createFormatter(lang, c.now)} lang={lang} t={t} instance={instance} />;
}
