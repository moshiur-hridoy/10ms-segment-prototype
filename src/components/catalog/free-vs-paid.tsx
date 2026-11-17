import {
  Archive,
  Atom,
  Bot,
  Check,
  Clapperboard,
  ClipboardCheck,
  FileText,
  Minus,
  NotebookPen,
  PenLine,
  PlayCircle,
  Presentation,
  Radio,
  Sparkles,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/design-system/atoms/card";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { CatalogView } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";
import { fill, type Formatter } from "@/lib/format";
import { LIVE_PASSES } from "@/lib/guest";
import { SECTION_TITLE_BIG } from "./section-title";

type L = Dictionary["segment"];

/*
 * CT78–CT79 (lab `free-routine` v5–v6): free against paid, just before "পুরো ব্যাচে ভর্তি হতে চাও?". A real table (v6), so it
 * doesn't read like the plan cards below it: one bordered card, a header row, hairline rows, the paid column tinted green,
 * no band and no raised card. Rows: price, live classes, recorded classes; (CT89: no buttons under it; the plans follow right below.) Under the
 * table, the batch's other features as one line. Only what the data backs: the free side is the page's own promises
 * (LIVE_PASSES live classes, the free batch's classes after login), the paid side its plan facts and feature titles; rows
 * the free batch can't be checked on (TenTen AI, exams, Masterbook) are left out until confirmed. On phones the label column
 * folds: each row's label sits on its own line above its two values.
 */
export function FreeVsPaid({ view, fmt, l, unit }: { view: CatalogView; fmt: Formatter; l: L; unit?: string }) {
  const { stream } = view;
  const plans = stream.live.filter((p) => p.subjects.length > 1);
  if (!plans.length) return null;
  const from = Math.min(...plans.map((p) => p.price.final));
  const liveFact = (stream.main?.facts ?? []).find((f) => /লাইভ ক্লাস/.test(f)) ?? l.comparePaidLiveAny;

  // "৳৫,৫০০ থেকে" / "From ৳5,500": the amount large, the word around it small.
  const [before, after] = l.comparePaidFrom.split("{price}");
  const small = "text-sm font-medium text-muted";
  const rows: { label: string; icon: LucideIcon; free: ReactNode; paid: ReactNode }[] = [
    {
      label: l.comparePrice,
      icon: Wallet,
      free: (
        <span className="grid">
          <span className="type-title tabular-nums">৳{fmt.number(0)}</span>
          <span className={small}>{l.compareFreeNote}</span>
        </span>
      ),
      paid: (
        <span className="grid">
          <span className="type-title tabular-nums">
            {before && <span className={small}>{before}</span>}৳{fmt.number(from)}
            {after && <span className={small}>{after}</span>}
            {unit && <span className={small}> {unit}</span>}
          </span>
          <span className={small}>{l.comparePaidNote}</span>
        </span>
      ),
    },
    { label: l.compareLive, icon: Radio, free: fill(l.compareFreeLive, { n: fmt.number(LIVE_PASSES) }), paid: liveFact },
    { label: l.compareRecorded, icon: PlayCircle, free: l.compareFreeRecorded, paid: l.comparePaidRecorded },
    // CT86 (lab `free-routine` v13): what the paid batch has, from the designer; the free batch doesn't (a dash), the paid a tick.
    ...(
      [
        ["compareTenTen", Bot],
        ["compareHomework", NotebookPen],
        ["compareSlides", Presentation],
        ["compareNotes", FileText],
        ["compareSimulations", Atom],
        ["compareChapterExam", ClipboardCheck],
        ["compareExplainer", Clapperboard],
        ["compareArchive", Archive],
        ["compareSuperPrep", Zap],
        ["compareExercise", PenLine],
      ] as const
    ).map(([key, icon]) => ({
      label: l[key],
      icon,
      free: (
        <span className="inline-flex items-center text-subtle">
          <Minus className="size-5" aria-hidden />
          <span className="sr-only">{l.compareNo}</span>
        </span>
      ),
      paid: (
        <span className="inline-flex items-center text-brand-text">
          <Check className="size-5" strokeWidth={3} aria-hidden />
          <span className="sr-only">{l.compareYes}</span>
        </span>
      ),
    })),
  ];

  /** The paid column's tint, on every cell of it, so the column reads as one band down the table. */
  const paidCol = "bg-brand-soft/50";
  const td = "px-4 py-4 align-top sm:px-5";

  return (
    <section aria-labelledby="compare-title" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="compare-title" className={cn("type-title", SECTION_TITLE_BIG)}>
          {l.compareTitle}
        </h2>
        <p className="text-sm text-muted sm:text-base">{l.compareLead}</p>
      </div>

      <Card as="div" className="overflow-hidden p-0">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">{l.compareTitle}</caption>
          <colgroup>
            <col className="w-1/4 max-md:hidden" />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-border">
              <td className="max-md:hidden" />
              <th scope="col" className={cn(td, "type-subtitle")}>
                {l.compareFree}
              </th>
              <th scope="col" className={cn(td, paidCol, "type-subtitle")}>
                <span className="flex flex-wrap items-center gap-2">
                  {l.comparePaid}
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-on-primary">
                    <Sparkles className="size-3" aria-hidden />
                    {l.compareBand}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          {rows.map((r) => (
            <tbody key={r.label} className="border-b border-border">
              {/* Phones: the label on its own line above the two values; the paid half keeps its tint, so the band runs unbroken. */}
              <tr className="md:hidden">
                <th scope="colgroup" colSpan={1} className="px-4 pt-3 text-xs font-semibold whitespace-nowrap text-subtle">
                  {r.label}
                </th>
                <td aria-hidden className={paidCol} />
              </tr>
              <tr>
                <th scope="row" className={cn(td, "font-semibold max-md:hidden")}>
                  <span className="flex items-center gap-2.5">
                    <r.icon className="size-5 shrink-0 text-subtle" aria-hidden />
                    {r.label}
                  </span>
                </th>
                <td className={cn(td, "text-muted max-md:pt-1.5")}>{r.free}</td>
                <td className={cn(td, paidCol, "font-semibold max-md:pt-1.5")}>
                  <span className="flex items-start gap-2">
                    {typeof r.paid === "string" && <Check className="mt-1 size-4 shrink-0 text-brand-text" strokeWidth={3} aria-hidden />}
                    {r.paid}
                  </span>
                </td>
              </tr>
            </tbody>
          ))}
        </table>
      </Card>
    </section>
  );
}
