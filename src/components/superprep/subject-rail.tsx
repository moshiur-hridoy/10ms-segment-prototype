import Link from "next/link";
import type { PrepSubject } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Formatter } from "@/lib/format";
import { BOOK_COLOR } from "@/design-system/foundations/book";

/**
 * The other books in a row, each with its name and progress; the open one stands out, so
 * switching books doesn't need the shelf. Each book is marked by a tiny closed copy of itself.
 * Switching replaces the history entry, so "back" leaves for the shelf, not the book before.
 */
export function SubjectRail({
  subjects,
  currentId,
  href,
  label,
  fmt,
}: {
  subjects: PrepSubject[];
  currentId: string;
  href: (id: string) => string;
  label: string;
  fmt: Formatter;
}) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_92%,transparent)] sm:-mx-6 sm:px-6">
      <ul className="flex w-max gap-2 py-0.5">
        {subjects.map((s) => {
          const current = s.id === currentId;
          return <li key={s.id}><CoverChip subject={s} current={current} href={href(s.id)} fmt={fmt} /></li>;
        })}
      </ul>
    </nav>
  );
}

type ChipProps = { subject: PrepSubject; current: boolean; href: string; fmt: Formatter };

/** Name and progress beside a tiny closed book: its cover, spine shading and page edges. */
function CoverChip({ subject, current, href, fmt }: ChipProps) {
  return (
    <Link
      href={href}
      replace
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2.5 rounded-md border pr-3 pl-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
        current ? "border-border-strong bg-paper text-text shadow-raised" : "border-border bg-surface text-muted hover:border-border-strong hover:text-text",
      )}
    >
      <span
        aria-hidden
        className="h-5 w-3.5 shrink-0 rounded-r-xs"
        style={{ backgroundColor: BOOK_COLOR[subject.family], backgroundImage: "var(--book-spine)", boxShadow: "1px 1px 0 var(--color-paper), 2px 1px 0 var(--color-paper-edge)" }}
      />
      <span className="max-w-56 truncate">{subject.name}</span>
      <span className="text-xs font-normal text-subtle tabular-nums">{fmt.percent(subject.totals.pct)}</span>
    </Link>
  );
}
