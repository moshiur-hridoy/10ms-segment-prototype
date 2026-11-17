"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { FreeClass, LiveSoon } from "@/lib/api";
import type { CatalogView } from "@/lib/api/catalog";
import { fill, type Formatter } from "@/lib/format";
import { saveFreeStart } from "@/lib/free-start";

/**
 * OB15: where onboarding lands a class 11 or 12 student, at the top of their batch's segment page: what the page
 * was arranged for (the batch, the stream, their boss levels) and one thing to do, keep the free classes on the
 * dashboard (on HSC 28 with the free batch too). After the tap the student stays here and the strip says it's done,
 * with a way to the dashboard.
 */
export function ForYou({
  view,
  classes,
  hard,
  live,
  added,
  lang,
  fmt,
  l,
}: {
  view: CatalogView;
  classes: FreeClass[];
  /** The student's hard subjects (onboarding), any stream. */
  hard: string[];
  live: LiveSoon[];
  /** Already kept for this batch and stream (the cookie, read on the server). */
  added: boolean;
  lang: Locale;
  fmt: Formatter;
  l: Dictionary["segment"];
}) {
  const [done, setDone] = useState(added);
  const names = new Map([...view.stream.group, ...view.stream.compulsory].map((s) => [s.id, s.name]));
  const count = classes.filter((k) => names.has(k.subject)).length;
  const bosses = hard.filter((id) => names.has(id));
  const freeBatch = view.stream.recorded && view.stream.recorded.price.final === 0 ? view.stream.recorded : null;

  const line = [
    view.batch.name,
    view.stream.name,
    bosses.length ? fill(l.forYouBoss, { subjects: fmt.list(bosses.map((id) => names.get(id)!)) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const what = [count ? fill(l.forYouClasses, { n: fmt.number(count) }) : null, live.length ? l.forYouLive : null, freeBatch?.title ?? null].filter(
    (x): x is string => Boolean(x),
  );

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
      <Image src="/assets/tenten.svg" alt="" width={48} height={48} className="size-12 shrink-0" />
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="text-sm font-semibold text-brand-text">{l.forYouLabel}</p>
        <h2 className="type-title">{l.forYouTitle}</h2>
        <p className="text-sm font-semibold text-text">{line}</p>
        {what.length > 0 && <p className="text-sm text-muted">{fill(bosses.length ? l.forYouLeadBoss : l.forYouLead, { what: fmt.list(what) })}</p>}
      </div>
      {done ? (
        <div className="grid shrink-0 justify-items-start gap-1 sm:justify-items-end">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-success">
            <CheckCircle2 className="size-4" aria-hidden />
            {l.forYouAdded}
          </p>
          <Link href={`/${lang}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
            {l.forYouSee}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <Button
          size="lg"
          className="shrink-0"
          onClick={() => {
            saveFreeStart({ batch: view.batch.id, stream: view.stream.id, hard: bosses });
            setDone(true);
          }}
        >
          {freeBatch ? l.forYouAddBatch : l.forYouAdd}
        </Button>
      )}
    </Card>
  );
}
