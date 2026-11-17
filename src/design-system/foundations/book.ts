import type { SubjectGroup } from "@/lib/api";
import type { PrepSubject } from "@/lib/api/superprep";

export type BookFamily = PrepSubject["family"];

/** Cover colour per subject family (fixed component tokens, white text ≥ 5:1 on each). */
export const BOOK_COLOR: Record<BookFamily, string> = {
  physics: "var(--color-book-physics)",
  chemistry: "var(--color-book-chemistry)",
  biology: "var(--color-book-biology)",
  math: "var(--color-book-math)",
  ict: "var(--color-book-ict)",
  bangla: "var(--color-book-bangla)",
  english: "var(--color-book-english)",
  other: "var(--color-book-other)",
};

/** Shared-element name: the shelf's cover and the open book's pages morph into each other. */
export const bookTransition = (id: string) => `book-${id}`;

/** Book colour from a subject card's icon, until subject groups carry SuperPrep's `family`. */
export const ICON_FAMILY: Record<SubjectGroup["subjects"][number]["icon"], BookFamily> = {
  atom: "physics",
  flask: "chemistry",
  leaf: "biology",
  calculator: "math",
  globe: "ict",
  book: "bangla",
  languages: "english",
  mic: "other",
};
