import { ChevronRight, Sparkles } from "lucide-react";
import { TenTenMascot } from "@/components/course/tenten-mascot";
import { TenTenPrompt } from "@/components/course/tenten-prompt";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";

/**
 * TenTen on a paper's page: its prompt with the subject already chosen (type a chapter and go;
 * the hints cycle through this paper's chapters), so no subject chips. Quieter than the course
 * home's TenTen card (a thin gradient edge, no tint), since it sits beside the syllabus.
 * `titleId` must be unique on the page: the card is drawn once in the side column and once for phones.
 */
export function TenTenPaperCard({ titleId, subject, chapters, t, className }: { titleId: string; subject: string; chapters: string[]; t: Dictionary; className?: string }) {
  const side = t.courseHome.side;
  return (
    <section
      aria-labelledby={titleId}
      className={cn("group/ten grid gap-3 rounded-lg border border-transparent p-3.5 [background:linear-gradient(var(--color-surface))_padding-box,var(--tenten-edge)_border-box]", className)}
    >
      <a href="#" className="group/tt flex items-center gap-2.5">
        <TenTenMascot className="size-10" />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span id={titleId} className="font-semibold">
            {side.tenten}
          </span>
          <span className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-semibold text-on-fill [background-image:var(--tenten-edge)]">
            <Sparkles className="size-3" aria-hidden />
            {side.tentenNew}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover/tt:translate-x-0.5" aria-hidden />
      </a>
      <TenTenPrompt href="#" chapters={chapters} subject={subject} labels={{ prompt: side.tentenPrompt, example: side.tentenExample, start: side.tentenStart }} />
    </section>
  );
}
