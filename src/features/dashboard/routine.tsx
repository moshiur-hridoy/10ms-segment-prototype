import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { ClassesSection } from "./classes";
import { TasksSection } from "./tasks";
import type { DashboardSectionProps } from "./types";

/*
 * Two versions of the routine section live side by side while the team compares them:
 *   tasks   → TasksSection   (today's tasks with progress), the default
 *   classic → ClassesSection (upcoming / missed tabs), kept as the secondary version
 * Pick the old one with ?routine=classic. Once one is chosen, delete the other and this file.
 */

export type RoutineVersion = "classic" | "tasks";
type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const pick = (sp: SearchParams): RoutineVersion => (first(sp.routine) === "classic" ? "classic" : "tasks");

export const routineVersion = async (searchParams: Promise<SearchParams>): Promise<RoutineVersion> =>
  pick(await searchParams);

export async function RoutineSection({ searchParams, ...props }: DashboardSectionProps) {
  return (await routineVersion(searchParams)) === "tasks" ? (
    <TasksSection {...props} searchParams={searchParams} />
  ) : (
    <ClassesSection {...props} searchParams={searchParams} />
  );
}

/** Floating switch for demos. Keeps every other query param (?fixture=stress etc.). */
export async function RoutineSwitch({ searchParams, t }: { searchParams: Promise<SearchParams>; t: Dictionary }) {
  const sp = await searchParams;
  const current = pick(sp);

  const hrefFor = (version: RoutineVersion) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(sp)) {
      if (key === "routine" || value === undefined) continue;
      for (const v of Array.isArray(value) ? value : [value]) next.append(key, v);
    }
    if (version === "classic") next.set("routine", "classic");
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };

  return (
    <nav
      aria-label={t.compare.label}
      className="fixed right-4 bottom-[calc(var(--bottom-nav-h)+1rem)] z-50 flex items-center gap-2 rounded-full border border-border bg-overlay p-1 pl-3 text-sm shadow-pop backdrop-blur-md"
    >
      <span className="text-xs font-medium text-subtle">{t.compare.label}</span>
      <div className="flex gap-0.5">
        {(["tasks", "classic"] as const).map((version) => (
          <Link
            key={version}
            href={hrefFor(version)}
            scroll={false}
            aria-current={current === version ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 font-semibold transition-colors",
              current === version ? "bg-text text-surface" : "text-muted hover:bg-raised hover:text-text",
            )}
          >
            {t.compare[version]}
          </Link>
        ))}
      </div>
    </nav>
  );
}
