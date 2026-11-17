"use client";

import { useState, type ReactNode } from "react";
import { Segmented } from "@/design-system/molecules/segmented";

/** Client-side switch between two server-rendered panels. */
export function ClassesTabs({
  labels,
  missedDot,
  upcoming,
  missed,
  action,
}: {
  labels: { tabs: string; upcoming: string; missed: string };
  missedDot: boolean;
  upcoming: ReactNode;
  missed: ReactNode;
  action: ReactNode;
}) {
  const [tab, setTab] = useState("upcoming");
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label={labels.tabs}
          value={tab}
          onChange={setTab}
          items={[
            { id: "upcoming", label: labels.upcoming },
            { id: "missed", label: labels.missed, dot: missedDot },
          ]}
        />
        {action}
      </div>
      <div role="tabpanel" aria-label={tab === "upcoming" ? labels.upcoming : labels.missed}>
        {tab === "upcoming" ? upcoming : missed}
      </div>
    </>
  );
}
