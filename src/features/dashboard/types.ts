import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { DataContext } from "@/lib/api";

/** Every dashboard section receives the same props. `ctx` is a promise so the
 *  page shell can render before request-time data is available. */
export type SectionProps = {
  ctx: Promise<DataContext>;
  lang: Locale;
  t: Dictionary;
};

/** Sections placed by the dashboard config also get the query (subject filter, routine version). */
export type DashboardSectionProps = SectionProps & {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
