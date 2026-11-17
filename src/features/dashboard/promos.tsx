import { PromoCard } from "@/design-system/organisms/dashboard/promo-card";
import { getPromos } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function PromosSection({ ctx, lang, t }: SectionProps) {
  const c = await ctx;
  const slides = await getPromos(c);
  if (slides.length === 0) return null;
  return <PromoCard slides={slides} fmt={createFormatter(lang, c.now)} t={t} />;
}
