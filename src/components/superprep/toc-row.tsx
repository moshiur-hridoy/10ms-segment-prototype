import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/design-system/atoms/badge";
import type { Tone } from "@/design-system/foundations/tone";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { PrepChapter } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { AnswerBar } from "./answer-bar";

export type RowBadge = { tone: Tone; label: string; hint?: string };

/**
 * A chapter as a line of the book's contents page: number, title, a dotted leader, the count;
 * below it the answer bar and accuracy. Without `href` (no questions yet) it is plain text.
 */
export function TocRow({ ch, href, badges, accent, fmt, t }: { ch: PrepChapter; href: string | null; badges: RowBadge[]; accent: string; fmt: Formatter; t: Dictionary }) {
  const p = t.superprepPage;
  const label = fill(p.chapter, { n: fmt.number(ch.number) });
  const count =
    ch.questions === 0 ? p.noQuestions : ch.answered === 0 ? fill(p.questions, { n: fmt.number(ch.questions) }) : `${fmt.number(ch.answered)}/${fmt.number(ch.questions)}`;
  const body = (
    <>
      <span className="text-lg leading-7 font-bold tabular-nums" style={{ color: accent }}>
        <span aria-hidden>{fmt.number(ch.number)}</span>
        <span className="sr-only">{label}</span>
      </span>
      <span className="grid min-w-0 gap-1.5">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 leading-7 font-semibold">{ch.title}</span>
          {badges.map((b) => (
            <Badge key={b.label} tone={b.tone} title={b.hint} className="self-center">
              {b.label}
            </Badge>
          ))}
          <span aria-hidden className="mb-1.5 hidden min-w-6 flex-1 border-b-2 border-dotted border-border-strong sm:block" />
          <span className="shrink-0 text-sm text-muted tabular-nums">{count}</span>
        </span>
        {ch.questions > 0 && (
          <span className="flex items-center gap-3">
            <AnswerBar
              correct={ch.correct}
              wrong={ch.wrong}
              total={ch.questions}
              label={`${ch.title}: ${fill(p.bar, { correct: fmt.number(ch.correct), wrong: fmt.number(ch.wrong), left: fmt.number(ch.remaining) })}`}
              className="h-1.5 max-w-64"
            />
            {ch.accuracy !== null && <span className="shrink-0 text-xs text-subtle tabular-nums">{fill(p.accuracy, { pct: fmt.percent(ch.accuracy) })}</span>}
          </span>
        )}
      </span>
      {href && <ChevronRight className="mt-1.5 size-4 text-subtle transition-transform group-hover/row:translate-x-0.5" aria-hidden />}
    </>
  );
  const box = "grid grid-cols-[2rem_minmax(0,1fr)_1rem] items-start gap-x-3 rounded-md px-2 py-3";
  return (
    <li>
      {href ? (
        <Link href={href} className={`group/row ${box} transition-colors hover:bg-raised`}>
          {body}
        </Link>
      ) : (
        <div className={`${box} text-muted`}>{body}</div>
      )}
    </li>
  );
}
