import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Rich } from "./rich";

export type OptionState = "idle" | "chosen" | "right" | "wrongChoice" | "dimmed";

const box: Record<OptionState, string> = {
  idle: "border-border bg-surface hover:border-border-strong",
  // Neutral, like a pencil mark: green would read as "correct" before anything is marked.
  chosen: "border-text/50 bg-raised",
  right: "border-success bg-success-soft",
  wrongChoice: "border-danger bg-danger-soft",
  dimmed: "border-border bg-surface opacity-70",
};

const badge: Record<OptionState, string> = {
  idle: "border border-border-strong text-muted",
  chosen: "bg-text text-surface",
  right: "bg-success text-on-fill",
  wrongChoice: "bg-danger text-on-fill",
  dimmed: "border border-border text-subtle",
};

/**
 * One answer option: a letter (ক খ গ ঘ), the typeset text, and, once revealed, a ✓ or ✗
 * so right and wrong never rest on colour alone. `tag` is the small "তোমার উত্তর" note.
 */
export function OptionBox({ letter, html, state, tag }: { letter: string; html: string; state: OptionState; tag?: string }) {
  return (
    <span className={cn("flex min-h-14 w-full items-start gap-3 rounded-md border-[1.5px] px-3.5 py-3 text-left transition-colors", box[state])}>
      <span aria-hidden className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold", badge[state])}>
        {letter}
      </span>
      <Rich html={html} className="min-w-0 flex-1 self-center leading-relaxed" />
      {(tag || state === "right" || state === "wrongChoice") && (
        <span className="flex shrink-0 items-center gap-1.5 self-center">
          {tag && <span className="hidden text-xs font-semibold text-muted sm:inline">{tag}</span>}
          {state === "right" && <CheckCircle2 className="size-5 text-success" aria-hidden />}
          {state === "wrongChoice" && <XCircle className="size-5 text-danger" aria-hidden />}
        </span>
      )}
    </span>
  );
}

/** What an option shows, given the answer and whether the answer is revealed. */
export function optionState(i: number, chosen: number | null, answer: number, revealed: boolean): OptionState {
  if (!revealed) return chosen === i ? "chosen" : "idle";
  if (i === answer) return "right";
  if (i === chosen) return "wrongChoice";
  return "dimmed";
}
