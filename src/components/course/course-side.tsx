import { ArrowUpRight, BookMarked, ChartPie, ChevronRight, Phone, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ChipLink } from "@/design-system/atoms/chip";
import { FacebookMark } from "@/design-system/atoms/facebook-mark";
import { IconTile } from "@/design-system/atoms/icon-tile";
import type { Tone } from "@/design-system/foundations/tone";
import { Card } from "@/design-system/atoms/card";
import { SuperPrepLink } from "@/design-system/molecules/superprep-link";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/cn";
import { TenTenMascot } from "./tenten-mascot";
import { TenTenPrompt } from "./tenten-prompt";

/** Course-scoped tools and offers. Small cards: they support the course, they don't headline it. */
export function CourseSide({
  communityUrl,
  academic,
  subjects,
  chapters,
  reportHref,
  superprepHref,
  t,
}: {
  communityUrl: string | null;
  /** The learning report, already scoped to this course. */
  reportHref: string;
  /** The SuperPrep shelf (as the dashboard card); `null` hides the card. */
  superprepHref: string | null;
  academic: boolean;
  /** Subject names of this course; TenTen is entered subject → chapter. */
  subjects: string[];
  /** Real chapter names, cycled in TenTen's prompt. */
  chapters: string[];
  t: Dictionary;
}) {
  const s = t.courseHome.side;
  return (
    <aside className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {subjects.length > 0 && <TenTenCard subjects={subjects} chapters={chapters} t={t} />}
      {academic && superprepHref && <SuperPrepLink href={superprepHref} hint={s.superprepHint} />}
      <SideLink href={reportHref} icon={ChartPie} tone="info" title={s.report} hint={s.reportHint} />
      {communityUrl && <SideLink href={communityUrl} external={t.common.newTab} mark={<FacebookMark className="size-10 shrink-0" />} tone="highlight" title={s.community} hint={s.communityHint} />}
      {academic && (
        <SideLink href="#" icon={BookMarked} tone="warning" title={s.masterbook} hint={s.masterbookHint}>
          <span className="inline-flex h-9 shrink-0 items-center rounded-full border border-border-strong px-3.5 text-sm font-semibold text-brand-text">
            {s.buy}
          </span>
        </SideLink>
      )}
      <a href="tel:16910" className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-brand-text hover:bg-brand-soft sm:col-span-2 lg:col-span-1">
        <Phone className="size-4" aria-hidden />
        {s.call}
      </a>
    </aside>
  );
}

/**
 * A card-sized link: tinted icon, title and hint, then a chevron (or a custom action).
 * `external` (its screen-reader note) opens it in a new tab, marked with ↗ instead of the chevron.
 */
/** `mark` replaces the tinted icon tile with a brand's own round logo (the Facebook group). */
export function SideLink({ href, external, icon, mark, tone, title, hint, children }: { href: string; external?: string; icon?: LucideIcon; mark?: ReactNode; tone: Tone; title: ReactNode; hint: string; children?: ReactNode }) {
  const Trail = external ? ArrowUpRight : ChevronRight;
  return (
    <Card as="a" interactive href={href} {...(external && { target: "_blank", rel: "noopener noreferrer" })} className="group/side flex items-center gap-3 p-4">
      {mark ?? (icon && <IconTile icon={icon} tone={tone} shape="circle" />)}
      <span className="grid min-w-0 flex-1">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-subtle">{hint}</span>
      </span>
      {children ?? (
        <Trail
          className={cn(
            "size-5 shrink-0 text-subtle transition-transform",
            external ? "group-hover/side:translate-x-0.5 group-hover/side:-translate-y-0.5" : "group-hover/side:translate-x-0.5",
          )}
          aria-hidden
        />
      )}
      {external && <span className="sr-only">{external}</span>}
    </Card>
  );
}

/**
 * TenTen gets the highlighted slot at the top: it is practice, opened chapter by chapter.
 * It's a new product, so it looks the part: the logo's red → blue on the edge, an
 * AI-style prompt to name a chapter, and subjects as quick picks.
 */
function TenTenCard({ subjects, chapters, t }: { subjects: string[]; chapters: string[]; t: Dictionary }) {
  const s = t.courseHome.side;
  return (
    <section
      aria-labelledby="tenten-title"
      className="group/ten grid gap-3.5 rounded-lg border-[1.5px] border-transparent p-4 [background:var(--grad-tenten)_padding-box,var(--tenten-edge)_border-box] sm:col-span-2 lg:col-span-1"
    >
      <a href="#" className="group/tt flex items-center gap-3">
        <TenTenMascot />
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span id="tenten-title" className="type-subtitle">
            {s.tenten}
          </span>
          <span className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-semibold text-on-fill [background-image:var(--tenten-edge)]">
            <Sparkles className="size-3" aria-hidden />
            {s.tentenNew}
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-subtle transition-transform group-hover/tt:translate-x-0.5" aria-hidden />
      </a>
      <TenTenPrompt href="#" chapters={chapters} labels={{ prompt: s.tentenPrompt, example: s.tentenExample, start: s.tentenStart }} />
      <div className="grid gap-2">
        <span className="text-xs text-subtle">{s.tentenOr}</span>
        <ul aria-label={s.tentenSubjects} className="flex flex-wrap gap-1.5">
          {subjects.map((name) => (
            <li key={name}>
              <ChipLink href="#" hover="highlight">
                {name}
              </ChipLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
