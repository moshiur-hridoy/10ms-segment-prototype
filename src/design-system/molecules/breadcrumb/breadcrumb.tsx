import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** "ড্যাশবোর্ড › আমার কোর্স". A crumb without `href` is the current page; `node` (CT218) draws a crumb of its own, a button say. */
export function Breadcrumb({ items, label, className }: { items: { label: string; href?: string; node?: ReactNode }[]; label: string; className?: string }) {
  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1 text-sm text-subtle">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            // Only the first crumb keeps its full width; a long course name truncates rather than widening the page.
            <li key={`${i}-${item.label}`} className={cn("flex items-center gap-1", i === 0 ? "shrink-0" : "min-w-0", last && "shrink-[0.5]")}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
              {item.node ? (
                item.node
              ) : item.href ? (
                <Link
                  href={item.href}
                  title={item.label}
                  className="relative truncate rounded-sm after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] hover:text-text hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-medium text-muted">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
