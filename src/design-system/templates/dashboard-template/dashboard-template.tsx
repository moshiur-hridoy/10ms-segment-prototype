import { Fragment, type ReactNode } from "react";
import { PageMotion } from "@/design-system/motion/motion";

export type AsideSlot = { id: string; node: ReactNode; /** Spans both aside columns on tablets (lg), one column again on desktop (xl). */ wide?: boolean };

/**
 * The dashboard's layout, empty: header on top, then rail · main · aside.
 * Phones: one column. lg: rail + main, the aside drops below main as two columns. xl: three columns.
 * The page fills the slots; this file only knows the grid.
 */
export function DashboardTemplate({
  header,
  rail,
  main,
  aside,
  overlay,
}: {
  header: ReactNode;
  rail: ReactNode;
  main: { id: string; node: ReactNode }[];
  aside: AsideSlot[];
  /** Floating things outside the grid (e.g. the routine comparison switch). */
  overlay?: ReactNode;
}) {
  return (
    <>
      {header}
      <PageMotion>
      <div className="mx-auto grid max-w-page grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[96px_minmax(0,1fr)] xl:grid-cols-[96px_minmax(0,1fr)_340px]">
        {rail}
        <main className="grid min-w-0 grid-cols-1 content-start gap-6">
          {main.map((s) => (
            <Fragment key={s.id}>{s.node}</Fragment>
          ))}
        </main>
        <aside className="grid min-w-0 grid-flow-dense grid-cols-1 content-start gap-6 lg:col-start-2 lg:grid-cols-2 xl:col-start-auto xl:grid-cols-1">
          {aside.map((s) =>
            s.wide ? (
              <div key={s.id} className="min-w-0 lg:col-span-2 xl:col-span-1">
                {s.node}
              </div>
            ) : (
              <Fragment key={s.id}>{s.node}</Fragment>
            ),
          )}
        </aside>
      </div>
      </PageMotion>
      {overlay}
    </>
  );
}
