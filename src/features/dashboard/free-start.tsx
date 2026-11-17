import { ArrowRight, ArrowUpRight, Play, Radio } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { SectionCard } from "@/design-system/molecules/section-card";
import { batchContext, getCatalog, getFreeClasses, getLiveSoon, type FreeClass } from "@/lib/api";
import { cn } from "@/lib/cn";
import { createFormatter, fill } from "@/lib/format";
import { FREE_START_COOKIE, parseFreeStart } from "@/lib/free-start";
import { dayDiff, dhakaDay } from "@/lib/time";
import type { DashboardSectionProps } from "./types";

/** Classes shown in the card; the rest are a link away. */
const SHOWN = 4;

/**
 * OB15: "তোমার ফ্রি শুরু", the free classes a student kept from their segment page ("ফ্রি ক্লাসগুলো ড্যাশবোর্ডে রাখো").
 * Nothing until they have: the choice is a cookie (lib/free-start.ts). The batch's next live class, its classes with
 * the student's boss levels first (each opens the class page, which comes back to the segment page), and on HSC 28
 * the free batch. The classes and routine are the batch's own, whoever looks (`batchContext`).
 */
export async function FreeStartSection({ ctx, lang, t }: DashboardSectionProps) {
  const [c, jar] = await Promise.all([ctx, cookies()]);
  const kept = parseFreeStart(jar.get(FREE_START_COOKIE)?.value);
  if (!kept) return null;
  const bc = batchContext(c);
  const [view, classes, live] = await Promise.all([getCatalog(c, kept.batch, kept.stream), getFreeClasses(bc), getLiveSoon(bc, kept.batch)]);
  if (!view) return null;

  const l = t.segment;
  const fmt = createFormatter(lang, c.now);
  const names = new Map([...view.stream.group, ...view.stream.compulsory].map((s) => [s.id, s.name]));
  const hard = kept.hard.filter((id) => names.has(id));
  const order = (k: FreeClass) => (hard.includes(k.subject) ? hard.indexOf(k.subject) : hard.length);
  // The stream's classes, boss levels first, then the syllabus order; one of each subject before a second.
  const mine = classes.filter((k) => names.has(k.subject)).sort((a, b) => order(a) - order(b));
  const firsts = [...new Map(mine.map((k) => [k.subject, k])).values()];
  const shown = [...firsts, ...mine.filter((k) => !firsts.includes(k))].slice(0, SHOWN);
  const seg = `seg=${view.batch.id}.${view.stream.id}`;
  const page = `/${lang}/hsc/${view.batch.id}?stream=${view.stream.id}`;
  const freeBatch = view.stream.recorded && view.stream.recorded.price.final === 0 ? view.stream.recorded : null;

  const next = live.find((k) => Date.parse(k.endsAt) > c.now);
  const when = next
    ? (() => {
        const start = Date.parse(next.startsAt);
        const days = dayDiff(dhakaDay(c.now), dhakaDay(start));
        const day = days === 0 ? l.liveToday : days === 1 ? l.liveTomorrow : fmt.date(start);
        return start <= c.now ? l.liveNow : `${day} ${fmt.time(start)}`;
      })()
    : null;

  return (
    <SectionCard
      titleId="free-start-title"
      title={
        <>
          {l.startTitle}
          <span className="text-base font-normal text-muted">
            {view.batch.name} · {view.stream.name}
          </span>
        </>
      }
      action={
        <Link href={page} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
          {l.startPage}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      }
    >
      {next && when && (
        <div className="flex items-center gap-3 rounded-md border border-border bg-live-soft px-4 py-3">
          <Radio className="size-5 shrink-0 text-live" aria-hidden />
          <div className="grid min-w-0 gap-0.5">
            <p className="text-xs font-semibold text-live">
              {l.startLive} · {when} · {names.get(next.subject)}
            </p>
            <p className="truncate font-semibold">{next.title}</p>
          </div>
        </div>
      )}

      {shown.length > 0 && (
        <div className="grid gap-3">
          <p className="text-sm font-semibold text-muted">{hard.length ? l.startClassesBoss : l.startClasses}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {shown.map((k) => (
              <li key={k.id}>
                <Link
                  href={`/${lang}/subject/${k.paperId}?${seg}&item=${k.id}#player`}
                  className="flex items-center gap-3 rounded-md border border-border p-2 transition-colors hover:border-brand"
                >
                  <span
                    className="grid aspect-video w-24 shrink-0 place-items-center rounded-sm bg-raised bg-cover bg-center"
                    style={k.youtubeId ? { backgroundImage: `url(https://i.ytimg.com/vi/${k.youtubeId}/mqdefault.jpg)` } : undefined}
                  >
                    <Play className={cn("size-4 fill-current", k.youtubeId ? "text-surface drop-shadow" : "text-subtle")} aria-hidden />
                  </span>
                  <span className="grid min-w-0 gap-0.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-subtle">
                      {names.get(k.subject)}
                      {hard.includes(k.subject) && <span className="text-danger">· {t.onboarding.boss}</span>}
                    </span>
                    <span className="line-clamp-2 text-sm leading-snug font-semibold">{k.title}</span>
                    {k.durationSec && <span className="text-xs text-muted">{fmt.duration(k.durationSec)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {mine.length > shown.length && (
            <Link href={page} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
              {fill(l.startAll, { n: fmt.number(mine.length) })}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      )}

      {freeBatch && (
        <a
          href={freeBatch.url}
          className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3 text-sm transition-colors hover:border-brand"
        >
          <span className="grid gap-0.5">
            <span className="text-xs font-semibold text-subtle">{l.startFreeBatch}</span>
            <span className="font-semibold">{freeBatch.title}</span>
          </span>
          <ArrowUpRight className="size-4 shrink-0 text-brand-text" aria-hidden />
        </a>
      )}
    </SectionCard>
  );
}
