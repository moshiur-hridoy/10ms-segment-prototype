import type { ComponentType } from "react";
import { Courses } from "./courses";
import { FreeStartSection } from "./free-start";
import { Notices } from "./notices";
import { PromosSection } from "./promos";
import { Recent } from "./recent";
import { Recommendations } from "./recommendations";
import { RoutineSection } from "./routine";
import { Streak } from "./streak";
import { SubjectsSection } from "./subjects";
import { SuperPrep } from "./superprep";
import type { DashboardSectionProps } from "./types";
import { Welcome } from "./welcome";

export type DashboardSection = {
  id: string;
  /** The container: loads its data and renders one organism. */
  section: ComponentType<DashboardSectionProps>;
  /** Rows in the loading skeleton. */
  rows: number;
  /** Aside only: spans both aside columns on tablets. */
  wide?: boolean;
  /** Loads without a skeleton: for a section that most students don't have, so the page doesn't jump (OB15). */
  quiet?: boolean;
};

/*
 * What the dashboard shows, where and in what order. To hide a section, remove its line;
 * to move one, move its line. Each section still loads, fails and retries on its own.
 */
export const dashboardLayout: { main: DashboardSection[]; aside: DashboardSection[] } = {
  main: [
    { id: "welcome", section: Welcome, rows: 1 },
    // OB15: only once the student kept the free classes from a segment page; otherwise it draws nothing.
    { id: "free-start", section: FreeStartSection, rows: 3, quiet: true },
    { id: "routine", section: RoutineSection, rows: 5 },
    { id: "subjects", section: SubjectsSection, rows: 4 },
    { id: "recent", section: Recent, rows: 5 },
    { id: "courses", section: Courses, rows: 2 },
    { id: "recommendations", section: Recommendations, rows: 2 },
  ],
  aside: [
    { id: "notices", section: Notices, rows: 3 },
    { id: "promos", section: PromosSection, rows: 1, wide: true },
    { id: "streak", section: Streak, rows: 2 },
    { id: "superprep", section: SuperPrep, rows: 4, wide: true },
  ],
};
