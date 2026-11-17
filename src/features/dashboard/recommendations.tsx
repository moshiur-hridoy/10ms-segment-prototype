import { RecommendationsCard } from "@/design-system/organisms/dashboard/recommendations-card";
import { getRecommendations } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import type { SectionProps } from "./types";

export async function Recommendations({ ctx, lang, t }: SectionProps) {
  const c = await ctx;
  const shelves = await getRecommendations(c);
  if (shelves.length === 0) return null;
  return <RecommendationsCard shelves={shelves} fmt={createFormatter(lang, c.now)} t={t} />;
}
