"use client";

import { NotebookPen, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/design-system/atoms/button";
import { IconButton } from "@/design-system/atoms/icon-button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { createFormatter, fill } from "@/lib/format";
import { addNote, onNoteRequest } from "./notes";
import { usePlayback } from "./playback";

/*
 * Lab `class` v15 (P67): "নোট লেখো" in the row under the title (or `N` in the player). It takes the
 * moment the video is at, pauses it, and opens a sheet (a dialog in the middle on wider screens) to
 * write in; saving puts the note on the class card at that time and plays on, if it was playing.
 */
export function NoteComposer({ item, locale, labels: l }: { item: string; locale: Locale; labels: Dictionary["syllabus"]["notes"] }) {
  const pb = usePlayback();
  const fmt = createFormatter(locale, 0);
  const dialog = useRef<HTMLDialogElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [at, setAt] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [resume, setResume] = useState(false);

  const open = () => {
    if (at !== null) return;
    setResume(pb.phase === "playing");
    pb.pause?.();
    setAt(pb.time);
    setText("");
  };
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });
  useEffect(() => onNoteRequest(() => openRef.current()), []);

  useEffect(() => {
    if (at === null) return;
    dialog.current?.showModal();
    field.current?.focus();
  }, [at]);

  const close = () => dialog.current?.close();
  const save = () => {
    const words = text.trim();
    if (at !== null && words) addNote(item, at, words);
    close();
  };

  return (
    <>
      <IconButton label={l.write} tooltip variant="subtle" size="lg" onClick={open}>
        <NotebookPen className="size-5" aria-hidden />
      </IconButton>
      <dialog
        ref={dialog}
        aria-labelledby="note-title"
        onClose={() => {
          setAt(null);
          if (resume) pb.play?.();
          setResume(false);
        }}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="sheet mx-auto mt-auto mb-0 w-full max-w-lg rounded-t-lg border-0 bg-surface p-0 text-text shadow-pop backdrop:bg-text/30 sm:mb-auto sm:rounded-lg"
      >
        {at !== null && (
          <form method="dialog" onSubmit={(e) => (e.preventDefault(), save())} className="grid gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <h2 id="note-title" className="type-subtitle">
                {l.title}
              </h2>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-text tabular-nums">
                {fill(l.at, { time: fmt.duration(at) })}
              </span>
              <IconButton label={l.cancel} size="md" className="ml-auto -mr-2" onClick={close}>
                <X className="size-5" aria-hidden />
              </IconButton>
            </div>
            <textarea
              ref={field}
              value={text}
              onChange={(e) => setText(e.target.value)}
              // Ctrl or ⌘ + Enter saves, as in most note boxes.
              onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && (e.preventDefault(), save())}
              rows={4}
              placeholder={l.placeholder}
              className="w-full resize-none rounded-md border border-border bg-raised p-3 text-base outline-none placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <div className="flex items-center gap-2">
              {resume && <p className="mr-auto text-xs text-subtle">{l.paused}</p>}
              <Button type="button" variant="secondary" className="ml-auto" onClick={close}>
                {l.cancel}
              </Button>
              <Button type="submit" disabled={!text.trim()}>
                {l.save}
              </Button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
