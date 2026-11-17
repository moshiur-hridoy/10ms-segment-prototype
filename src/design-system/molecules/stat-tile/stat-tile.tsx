import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CountUp } from "@/design-system/atoms/count-up";
import { Card } from "@/design-system/atoms/card";

/** One number with its label; extras (change, sparkline) only when there is a value. Render inside a <ul>. */
export function StatTile({ label, value, empty, children }: { label: string; value: string | null; empty: string; children?: ReactNode }) {
  return (
    <Card as="li" className="grid min-w-0 content-start gap-2 p-4">
      <p className="text-sm font-medium text-muted">{label}</p>
      {value === null ? (
        <p className="py-1 text-sm text-subtle">{empty}</p>
      ) : (
        <>
          <p className="type-headline">
            <CountUp value={value} />
          </p>
          {children}
        </>
      )}
    </Card>
  );
}

/**
 * Signed change with an icon, so direction never rests on colour alone. Up reads as good;
 * a change smaller than `flatBelow` reads as "about the same".
 */
export function Delta({
  diff,
  text,
  vs,
  flatBelow = 3,
}: {
  diff: number | null;
  text: (d: number) => string;
  vs: string;
  flatBelow?: number;
}) {
  if (diff === null) return null;
  const flat = Math.abs(diff) < flatBelow;
  const Icon = flat ? Minus : diff > 0 ? TrendingUp : TrendingDown;
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
      <span className={cn("inline-flex items-center gap-1 font-semibold", flat ? "text-muted" : diff > 0 ? "text-success" : "text-danger")}>
        <Icon className="size-4" aria-hidden />
        {!flat && text(diff)}
      </span>
      <span className="text-subtle">{vs}</span>
    </p>
  );
}
