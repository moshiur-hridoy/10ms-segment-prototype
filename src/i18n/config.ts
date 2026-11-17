export const locales = ["bn", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "bn";
export const localeCookie = "NEXT_LOCALE";

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** BCP 47 tags used for Intl formatting (dates, numbers, relative time). */
export const intlLocale: Record<Locale, string> = {
  bn: "bn-BD",
  en: "en-US",
};
