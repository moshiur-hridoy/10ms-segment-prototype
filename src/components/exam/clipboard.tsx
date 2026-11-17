import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The exam desk: the question paper clipped to a board in the subject's cover colour, so a set
 * reads as a page taken out of its book (`OpenBook`). The clip grips a strip of paper at the top;
 * the sheet under it is `children` (one element with `bg-paper` and `rounded-b-xs`), so a question
 * can flip up from the clip's jaw while the clip and the strip hold still. The next sheet peeks
 * out under the bottom edge. On phones the board narrows to a thin rim and the clip shrinks.
 */
export function Clipboard({ accent, className, children }: { accent: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative pt-4", className)}>
      <div
        className="rounded-lg px-1.5 pt-5 pb-3 sm:px-3.5 sm:pt-7 sm:pb-6"
        style={{ backgroundColor: accent, backgroundImage: "var(--clipboard-board)", boxShadow: "var(--book-board-bevel), var(--shadow-book)" }}
      >
        <div className="relative">
          {/* The next sheet, a little out of line under this one. */}
          <span aria-hidden className="absolute inset-x-0.5 top-3 -bottom-1 rotate-[0.4deg] rounded-xs bg-paper" style={{ boxShadow: "var(--clipboard-sheet-shadow)" }} />
          <div className="relative rounded-xs" style={{ boxShadow: "var(--clipboard-sheet-shadow)" }}>
            <div aria-hidden className="h-6 rounded-t-xs bg-paper" />
            {children}
          </div>
        </div>
      </div>
      <Clip />
    </div>
  );
}

/** The metal clip: a wire lever above the board's edge, the plate with its rolled hinge and two rivets, the jaw on the paper. */
function Clip() {
  return (
    <span aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-13 w-36 -translate-x-1/2 sm:h-15 sm:w-48">
      <span className="absolute top-0 left-1/2 h-6 w-20 -translate-x-1/2 rounded-t-full border-[3px] border-b-0 sm:w-24" style={{ borderColor: "var(--clipboard-wire)" }} />
      <span className="absolute inset-x-0 top-3 bottom-0 rounded-t-lg rounded-b-sm" style={{ backgroundImage: "var(--clipboard-metal)", boxShadow: "var(--clipboard-clip-shadow)" }} />
      <span className="absolute inset-x-2 top-3.5 h-2.5 rounded-full" style={{ backgroundImage: "var(--clipboard-hinge)" }} />
      <span className="absolute top-8 left-5 size-2 rounded-full" style={{ backgroundImage: "var(--clipboard-rivet)" }} />
      <span className="absolute top-8 right-5 size-2 rounded-full" style={{ backgroundImage: "var(--clipboard-rivet)" }} />
    </span>
  );
}
