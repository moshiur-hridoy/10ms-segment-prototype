import { Backpack, BookOpen, CalendarCheck, Lightbulb } from "lucide-react";

/** The catalogue lives outside the dashboard, so these are plain links into the main site.
 *  `local`: rebuilt here already (the HSC 28 page, for new students, stands in for class 6–12 for now). */
export const EXPLORE_ITEMS = [
  { key: "classes", href: "https://10minuteschool.com/categories/academic/", local: "/hsc/hsc-28", Icon: Backpack, tone: "text-info", more: true },
  { key: "english", href: "https://10minuteschool.com/categories/english/", Icon: Backpack, tone: "text-superprep-pink", more: true },
  { key: "bookStore", href: "https://10minuteschool.com/store/all/", Icon: BookOpen, tone: "text-highlight", more: false },
  { key: "skills", href: "https://10minuteschool.com/categories/skills/", Icon: Lightbulb, tone: "text-chart-cat-1", more: false },
  { key: "freeCourses", href: "https://10minuteschool.com/categories/free/", Icon: CalendarCheck, tone: "text-brand", more: false },
] as const;
