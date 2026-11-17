"use client";

import { ChevronDown, ClipboardCheck, Folder, List, NotebookText, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { IconTile } from "@/design-system/atoms/icon-tile";
import { Segmented } from "@/design-system/molecules/segmented";
import type { PaperFolders } from "@/lib/api";
import { cn } from "@/lib/cn";

type Show = "all" | "exams" | "notes" | "resources";
type Kind = Exclude<Show, "all">;

// Lab `class` v46 (P139): which groups are open on a wide screen, kept in this browser. পরীক্ষা starts open.
const OPEN = "paper-open";
const DEFAULT_OPEN = "exams";
const openListeners = new Set<() => void>();
const subscribeOpen = (l: () => void) => {
  openListeners.add(l);
  return () => void openListeners.delete(l);
};
const readOpen = () => {
  try {
    return localStorage.getItem(OPEN) ?? DEFAULT_OPEN;
  } catch {
    return DEFAULT_OPEN;
  }
};
function writeOpen(value: string) {
  try {
    localStorage.setItem(OPEN, value);
  } catch {
    // Private mode: it holds until the next render only.
  }
  for (const l of openListeners) l();
}

/** A chapter's lecture sheet, opened on this page (lab `class` v42, P135). */
export type PaperNote = { id: string; label: string; href: string };

/**
 * The subject's exam and resource folders, in two groups. `filter` (lab `class` v41, P134): a
 * সব · পরীক্ষা · রিসোর্স control on top, like the syllabus's, the only split these folders have.
 * `notes` (v42, P135): the chapters' lecture sheets as a third group, between the two, with its own tab.
 * `fold` (v46, P139): on a wide screen, no tabs; each group's title opens and closes it, with its count.
 * পরীক্ষা starts open, several can be open at once, and the browser remembers which.
 */
export function PaperGroups({
  folders,
  notes = [],
  chapterExams = [],
  filter = false,
  fold = false,
  labels: l,
}: {
  folders: PaperFolders;
  notes?: PaperNote[];
  /** Lab `concept` v22 (P175): a chapter's own exams ("Chapter Final"), moved here from the chapter's "অন্যান্য"; they open on this page. */
  chapterExams?: PaperNote[];
  filter?: boolean;
  fold?: boolean;
  labels: { all: string; exams: string; notes: string; resources: string; filter: string };
}) {
  const [show, setShow] = useState<Show>("all");
  const examRows: Row[] = [
    ...chapterExams.map((r) => ({ ...r, inPage: true })),
    ...folders.exams.map((f) => ({ id: f.id, label: f.label, href: f.url })),
  ];
  const kinds = [examRows.length, notes.length, folders.resources.length].filter(Boolean).length;
  const both = kinds > 1;
  const openRaw = useSyncExternalStore(subscribeOpen, readOpen, () => DEFAULT_OPEN);

  if (fold) {
    const open = new Set(openRaw.split(" ").filter(Boolean));
    const toggle = (k: Kind) => {
      if (open.has(k)) open.delete(k);
      else open.add(k);
      writeOpen([...open].join(" "));
    };
    const groups: { k: Kind; title: string; rows: Row[]; icon: LucideIcon; tone: Tone; inPage?: boolean }[] = [
      {
        k: "exams",
        title: l.exams,
        rows: examRows,
        icon: ClipboardCheck,
        tone: "highlight",
      },
      { k: "notes", title: l.notes, rows: notes, icon: NotebookText, tone: "info", inPage: true },
      {
        k: "resources",
        title: l.resources,
        rows: folders.resources.map((f) => ({ id: f.id, label: f.label, href: f.url })),
        icon: Folder,
        tone: "warning",
      },
    ];
    return (
      <div className="grid divide-y divide-border border-y border-border">
        {groups.map((g) =>
          g.rows.length ? (
            <section key={g.k} aria-label={g.title}>
              <button
                type="button"
                aria-expanded={open.has(g.k)}
                onClick={() => toggle(g.k)}
                className="-mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-raised"
              >
                <span className="text-sm font-semibold text-text">{g.title}</span>
                <span className="text-sm text-subtle">{g.rows.length.toLocaleString("bn-BD")}</span>
                <ChevronDown
                  className={cn("ml-auto size-4 shrink-0 text-subtle transition-transform duration-(--motion-base)", open.has(g.k) && "rotate-180")}
                  aria-hidden
                />
              </button>
              {/* Opens by its own height (grid rows 0fr → 1fr). */}
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-(--motion-base) ease-standard",
                  open.has(g.k) ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden" inert={!open.has(g.k)}>
                  <div className="pb-3">
                    <Group title={g.title} rows={g.rows} icon={g.icon} tone={g.tone} bare inPage={g.inPage} />
                  </div>
                </div>
              </div>
            </section>
          ) : null,
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {filter && both && (
        <Segmented
          variant="segment"
          track="solid"
          emphasis="strong"
          fill="phone"
          label={l.filter}
          value={show}
          onChange={(id) => setShow(id as Show)}
          items={[
            { id: "all", label: l.all, icon: <List className="size-4" aria-hidden /> },
            { id: "exams", label: l.exams, icon: <ClipboardCheck className="size-4" aria-hidden /> },
            ...(notes.length ? [{ id: "notes", label: l.notes, icon: <NotebookText className="size-4" aria-hidden /> }] : []),
            { id: "resources", label: l.resources, icon: <Folder className="size-4" aria-hidden /> },
          ]}
        />
      )}
      <div className="grid gap-5">
        {/* One kind chosen: the tab names it, so no heading over the list. */}
        {(show === "all" || show === "exams") && (
          <Group title={l.exams} rows={examRows} icon={ClipboardCheck} tone="highlight" bare={show !== "all"} />
        )}
        {(show === "all" || show === "notes") && <Group title={l.notes} rows={notes} icon={NotebookText} tone="info" bare={show !== "all"} inPage />}
        {(show === "all" || show === "resources") && (
          <Group
            title={l.resources}
            rows={folders.resources.map((f) => ({ id: f.id, label: f.label, href: f.url }))}
            icon={Folder}
            tone="warning"
            bare={show !== "all"}
          />
        )}
      </div>
    </div>
  );
}

type Row = { id: string; label: string; href: string; inPage?: boolean };
type Tone = "highlight" | "info" | "warning";

function Group({
  title,
  rows,
  icon,
  tone,
  bare = false,
  inPage = false,
}: {
  title: string;
  rows: Row[];
  icon: LucideIcon;
  tone: "highlight" | "info" | "warning";
  bare?: boolean;
  /** Opens on this page (a lecture sheet), so a client link; folders go elsewhere. */
  inPage?: boolean;
}) {
  if (rows.length === 0) return null;
  const row = "-mx-2 flex min-h-12 items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-raised";
  return (
    <section aria-label={title} className="grid gap-1">
      {!bare && <h3 className="text-xs font-semibold tracking-wide text-subtle">{title}</h3>}
      <ul className="grid grid-cols-1 divide-y divide-border">
        {rows.map((f) => {
          const inner = (
            <>
              <IconTile icon={icon} tone={tone} size="sm" />
              <span className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold">{f.label}</span>
            </>
          );
          return (
            <li key={f.id}>
              {(f.inPage ?? inPage) ? (
                <Link href={f.href} className={row}>
                  {inner}
                </Link>
              ) : (
                <a href={f.href} className={row}>
                  {inner}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
