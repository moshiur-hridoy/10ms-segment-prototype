import type { ReactNode } from "react";
import { Logo } from "@/design-system/atoms/logo";
import { cn } from "@/lib/cn";

export type ReceiptLine = { id: string; label: ReactNode; value: string; saving?: boolean; muted?: boolean };

/**
 * A paper receipt with a torn bottom edge: the landing's order receipt (L47) on the app's tokens (CT42), so the
 * segment page's subject picker can fill one in line by line. Paper and its rules use `paper` / `paper-edge` (or the page grey and the grey border, `tone="page"`),
 * which have a dark version. Lines run label … value with a dotted leader; the total sits under a dashed rule.
 */
export function Receipt({
  title,
  lines,
  empty,
  totalLabel,
  total,
  note,
  children,
  className,
  tone = "paper",
}: {
  title: string;
  lines: ReceiptLine[];
  /** Shown in place of the lines while there are none. */
  empty?: ReactNode;
  totalLabel: string;
  total: string;
  /** Under the total, in green: what the student saves. */
  note?: ReactNode;
  /** Under the receipt's lines, inside the paper (a hint, a button). */
  children?: ReactNode;
  className?: string;
  /** `paper`: cream, for a grey page. `page`: the page background's grey, for a receipt on a white band (CT46). */
  tone?: "paper" | "page";
}) {
  const ground = tone === "page" ? "var(--color-bg)" : "var(--color-paper)";
  // The rules follow the paper: cream edges on cream, the grey border colour on the page grey (CT47).
  const rule = tone === "page" ? "border-border-strong" : "border-paper-edge";
  return (
    <div className={cn("relative", className)}>
      <div className={cn("rounded-t-xs px-5 pt-6 pb-6 text-text", tone === "page" ? "bg-bg" : "bg-paper shadow-raised")}>
        <div className={cn("flex items-center justify-between border-b-[3px] border-double pb-3", rule)}>
          <Logo className="h-5 w-auto" />
          <span className="type-subtitle">{title}</span>
        </div>
        <div className="mt-4 grid gap-2.5" aria-live="polite">
          {lines.length === 0 && empty ? (
            <p className="py-3 text-center text-sm text-subtle">{empty}</p>
          ) : (
            lines.map((line) => <Line key={line.id} {...line} rule={rule} />)
          )}
        </div>
        <p className={cn("mt-5 flex items-baseline gap-2 border-t border-dashed pt-4", rule)}>
          <span className="font-semibold">{totalLabel}</span>
          <span aria-hidden className={cn("mb-1 flex-1 border-b-2 border-dotted", rule)} />
          <span key={total} className="type-headline tabular-nums">
            {total}
          </span>
        </p>
        {note && <p className="mt-1 text-right text-sm text-success">{note}</p>}
        {children && <div className="mt-5 grid gap-3">{children}</div>}
      </div>
      {/* The torn bottom edge: the paper's colour in small teeth. */}
      <div
        aria-hidden
        className="h-3 bg-repeat-x"
        style={{
          backgroundImage: `linear-gradient(135deg, ${ground} 50%, transparent 50%), linear-gradient(225deg, ${ground} 50%, transparent 50%)`,
          backgroundSize: "16px 12px",
        }}
      />
    </div>
  );
}

function Line({ label, value, saving, muted, rule }: ReceiptLine & { rule: string }) {
  return (
    <p className={cn("flex items-baseline gap-2", muted && "text-muted")}>
      <span className="min-w-0">{label}</span>
      <span aria-hidden className={cn("mb-1 min-w-4 flex-1 border-b border-dotted", rule)} />
      <span className={cn("shrink-0 font-medium tabular-nums", saving && "text-success")}>{value}</span>
    </p>
  );
}
