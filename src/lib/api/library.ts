import type { DataOf, LibraryBook } from "./schemas";

/*
 * The library ("কোর্স ও বইসমূহ"): each shelf with what the student owns first, then what they
 * could still add, so a shelf never opens on a row of books they can't read.
 */

type LibraryData = DataOf<"library">;
type RawShelf = LibraryData["shelves"][number];

export type ShelfBook = LibraryBook & { /** Reading progress of an owned paper, from `subjects.json`. */ progress: number | null };
export type ShelfGroup = { id: string; name?: string; books: ShelfBook[] };
export type LibraryShelf = Omit<RawShelf, "groups" | "suggestions"> & {
  /** Subjects (or courses) with the books the student owns, in the shelf's order. */
  owned: ShelfGroup[];
  /** The same subjects' books not yet owned (free or for sale), grouped the same way. */
  rest: ShelfGroup[];
  suggestions: ShelfBook[];
  count: { owned: number; total: number; rest: number };
};

const split = (groups: RawShelf["groups"], progress: ReadonlyMap<string, number>, keep: (b: LibraryBook) => boolean): ShelfGroup[] =>
  groups
    .map((g) => ({
      id: g.id,
      name: g.name,
      books: g.books.filter(keep).map((b) => ({ ...b, progress: b.paperId ? (progress.get(b.paperId) ?? null) : null })),
    }))
    .filter((g) => g.books.length > 0);

export function buildLibrary(data: LibraryData, progress: ReadonlyMap<string, number>) {
  const shelves: LibraryShelf[] = data.shelves.map(({ groups, suggestions, ...shelf }) => {
    const owned = split(groups, progress, (b) => b.state === "owned");
    const rest = split(groups, progress, (b) => b.state !== "owned");
    const n = (gs: ShelfGroup[]) => gs.reduce((sum, g) => sum + g.books.length, 0);
    return {
      ...shelf,
      owned,
      rest,
      suggestions: suggestions.map((b) => ({ ...b, progress: null })),
      count: { owned: n(owned), rest: n(rest), total: n(owned) + n(rest) },
    };
  });

  const owned = (kinds: RawShelf["kind"][]) =>
    shelves.filter((s) => kinds.includes(s.kind)).reduce((sum, s) => sum + s.count.owned, 0);

  return {
    shelves,
    /** For the page's summary line. */
    totals: { papers: owned(["batch"]), courses: owned(["skills", "english"]), ebooks: owned(["ebook"]) },
  };
}

export type Library = ReturnType<typeof buildLibrary>;
