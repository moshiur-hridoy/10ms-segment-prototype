import { getRecent, getStreak, getUser } from "@/lib/api";
import { createFormatter } from "@/lib/format";
import { dhakaMinutes } from "@/lib/sky";
import { DAY_MS, dhakaDay, dhakaHour } from "@/lib/time";
import { popupSituation } from "@/lib/tree";
import { StreakPopup } from "@/design-system/organisms/dashboard/streak-popup";
import { StreakTreeCard } from "@/design-system/organisms/dashboard/streak-tree-card";
import type { SectionProps } from "./types";

/** The streak as an apple tree that each day's study waters (StreakTreeCard). The server side only loads and formats. */
/** `popup={false}` leaves out the once-a-day popup (style guide). */
export async function Streak({ ctx, lang, t, popup = true }: SectionProps & { popup?: boolean }) {
  const c = await ctx;
  // The name is a nice-to-have: if the user file fails, the streak still renders.
  const [streak, user, recent] = await Promise.all([getStreak(c), getUser(c).catch(() => null), getRecent(c).catch(() => [])]);
  const fmt = createFormatter(lang, c.now);
  const today = dhakaDay(c.now);
  const status = (day: string) => streak.week.find((d) => d.date === day)?.status;
  const growth = streak.growth ?? streak.current;
  const minutes = dhakaMinutes(c.now);
  const hoursLeft = Math.max(1, 24 - dhakaHour(c.now));

  return (
    <>
    {popup && (
    <StreakPopup
      lang={lang}
      today={today}
      situation={popupSituation({ growth, today: status(today), yesterday: status(dhakaDay(c.now - DAY_MS)) })}
      days={streak.current}
      growth={growth}
      species={streak.species ?? "apple"}
      minutes={minutes}
      hoursLeft={hoursLeft}
      progress={streak.today ?? { minutes: 0, quizzes: 0, goal: 10 }}
      rain={streak.rain ?? null}
      waterHref={recent[0]?.url ?? `/${lang}/routine`}
      gardenHref={`/${lang}/garden`}
      t={{ ...t.streak, trees: t.trees }}
    />
    )}
    <StreakTreeCard
      lang={lang}
      today={today}
      current={streak.current}
      best={streak.best}
      growth={growth}
      week={streak.week.map(({ date, status }) => ({ date, status }))}
      rain={streak.rain ?? null}
      hoursLeft={hoursLeft}
      minutes={minutes}
      name={user?.name.split(/\s+/)[0] ?? null}
      weekdays={streak.week.map((d) => fmt.weekday(d.date))}
      species={streak.species ?? "apple"}
      gardenHref={`/${lang}/garden`}
      t={{ ...t.streak, seeDetails: t.common.seeDetails, trees: t.trees }}
    />
    </>
  );
}
