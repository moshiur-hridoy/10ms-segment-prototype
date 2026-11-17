"use client";

import { GraduationCap, Languages, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Segmented, type SegmentedItem } from "@/design-system/molecules/segmented";

type Category = "academic" | "english" | "skills";

const icons: Record<Category, ReactNode> = {
  academic: <GraduationCap className="size-4" aria-hidden />,
  english: <Languages className="size-4" aria-hidden />,
  skills: <Sparkles className="size-4" aria-hidden />,
};

/**
 * Title row with category filter pills, then the matching server-rendered items.
 * Categories with no items are hidden; the filter hides itself if only one remains
 * (or when `filterable` is false).
 *
 * Optional `groups` split the items under headings (e.g. "in progress" / "not started");
 * filtering applies inside each group and empty groups disappear.
 */
export function CategoryFilter({
  title,
  label,
  labels,
  items,
  groups,
  filterable = true,
  footer,
}: {
  title: ReactNode;
  label: string;
  /** Already formatted, e.g. { all: "সব", academic: "একাডেমিক (৫)" }. */
  labels: Record<"all" | Category, string>;
  items: { id: string; category: Category; node: ReactNode; group?: string }[];
  /** `counts` are pre-formatted per filter on the server (e.g. "৪টি"), since functions can't cross to the client. */
  groups?: { id: string; label: string; counts?: Record<"all" | Category, string>; className?: string }[];
  filterable?: boolean;
  footer?: ReactNode;
}) {
  const [filter, setFilter] = useState<"all" | Category>("all");
  const present = (["academic", "english", "skills"] as const).filter((c) => items.some((i) => i.category === c));

  const options: SegmentedItem[] = [
    { id: "all", label: labels.all },
    ...present.map((c) => ({ id: c, label: labels[c], icon: icons[c] })),
  ];
  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {title}
        {filterable && present.length > 1 && (
          <Segmented variant="pills" label={label} value={filter} onChange={(id) => setFilter(id as typeof filter)} items={options} />
        )}
      </div>
      {groups ? (
        groups.map((g) => {
          const inGroup = visible.filter((i) => i.group === g.id);
          if (inGroup.length === 0) return null;
          return (
            <section key={g.id} aria-label={g.label} className="grid gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-subtle">
                {g.label}
                {g.counts && <span className="font-normal"> · {g.counts[filter]}</span>}
              </h3>
              <ul className={g.className ?? "grid grid-cols-1 gap-3"}>
                {inGroup.map((i) => (
                  <li key={i.id} className="min-w-0">
                    {i.node}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {visible.map((i) => (
            <div key={i.id} className="min-w-0">
              {i.node}
            </div>
          ))}
        </div>
      )}
      {footer}
    </>
  );
}
