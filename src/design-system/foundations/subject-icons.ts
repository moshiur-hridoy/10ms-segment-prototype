import { Atom, Book, Calculator, FlaskConical, Globe, Languages, Leaf, Mic, type LucideIcon } from "lucide-react";
import type { SubjectCard } from "@/lib/api";

/** One icon per subject, shared by subject cards, course home folders and library books. */
export const subjectIcons: Record<SubjectCard["subjects"][number]["icon"], LucideIcon> = {
  calculator: Calculator,
  flask: FlaskConical,
  atom: Atom,
  leaf: Leaf,
  book: Book,
  languages: Languages,
  mic: Mic,
  globe: Globe,
};
