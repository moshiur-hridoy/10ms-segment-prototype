import { Lock } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { LoginButton, UnlockList } from "@/components/catalog/segment";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SyllabusItem } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";

/**
 * A guest opened a locked item (CT28): where the player would be, the class's cover behind a lock,
 * what logging in opens, and a way to a free class instead. The list beside it stays as it is.
 */
export function LockedItem({
  item,
  title,
  freeCount,
  livePasses,
  free,
  lang,
  t,
  member,
}: {
  item: SyllabusItem;
  title: string;
  /** In the page's digits. */
  freeCount: string;
  livePasses: string;
  /** A free class to open instead: this paper's first, else the segment page. */
  free: { href: string; label: string };
  lang: Locale;
  t: Dictionary;
  /** CT104: a free student (signed in): the class opens with the batch; the materials and SuperPrep are theirs already. */
  member?: { plansHref: string; superprepHref: string };
}) {
  const l = t.segment;
  const cover = Boolean(item.youtubeId);
  return (
    // The list leaves the page with an item open, so wide screens keep a reading width instead of a full-width empty stage.
    <Card id="player" className="mx-auto grid w-full max-w-2xl scroll-mt-24 overflow-hidden">
      <div
        className="relative grid aspect-video place-items-center bg-raised bg-cover bg-center"
        style={item.youtubeId ? { backgroundImage: `url(https://i.ytimg.com/vi/${item.youtubeId}/sddefault.jpg)` } : undefined}
      >
        <span aria-hidden className={cn("absolute inset-0", cover ? "bg-text/60" : "bg-linear-to-br from-brand-soft to-raised")} />
        <span className="relative grid justify-items-center gap-3 px-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-surface text-text shadow-raised">
            <Lock className="size-6" aria-hidden />
          </span>
          <span className={cn("line-clamp-2 max-w-md text-sm font-semibold", cover ? "text-surface" : "text-muted")}>
            {t.syllabus.kind[item.kind]} · {title}
          </span>
        </span>
      </div>
      <div className="grid gap-4 p-5 sm:p-6">
        <div className="grid gap-1">
          <h2 className="type-title">{member ? l.lockTitleMember : l.lockTitle}</h2>
          <p className="text-sm text-muted">{member ? l.lockLeadMember : fill(l.lockLead, { n: freeCount })}</p>
        </div>
        {!member && <UnlockList n={livePasses} l={l} />}
        <div className="flex flex-wrap gap-2">
          {member ? (
            <Button href={member.plansHref} size="lg">
              {l.seePlans}
            </Button>
          ) : (
            <LoginButton lang={lang} label={l.login} size="lg" />
          )}
          <Button href={free.href} variant="secondary" size="lg">
            {free.label}
          </Button>
          {member && (
            <Button href={member.superprepHref} variant="ghost" size="lg">
              {l.seeSuperprep}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
