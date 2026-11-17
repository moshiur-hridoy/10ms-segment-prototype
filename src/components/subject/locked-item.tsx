import { Lock } from "lucide-react";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { LoginButton } from "@/components/catalog/segment";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SyllabusItem } from "@/lib/api";
import { cn } from "@/lib/cn";

/**
 * Someone outside the batch opened a locked item: where the player would be, the item's cover behind a lock, why it's
 * locked, and the way in. `buy`: a class, which opens with the batch (see the plans). `login`: a material (slide, sheet,
 * exam), which opens, downloads included, once logged in. Either way the paper's free class is one tap away.
 */
export function LockedItem({
  item,
  title,
  reason,
  freeHref,
  plansHref,
  lang,
  t,
}: {
  item: SyllabusItem;
  title: string;
  reason: "buy" | "login";
  /** The paper's free class; else the segment page. */
  freeHref: { href: string; label: string };
  plansHref: string;
  lang: Locale;
  t: Dictionary;
}) {
  const l = t.segment;
  const cover = Boolean(item.youtubeId);
  const buy = reason === "buy";
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
          <h2 className="type-title">{buy ? l.lockBuyTitle : l.lockLoginTitle}</h2>
          <p className="text-sm text-muted">{buy ? l.lockBuyLead : l.lockLoginLead}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {buy ? (
            <Button href={plansHref} size="lg">
              {l.seePlans}
            </Button>
          ) : (
            <LoginButton lang={lang} label={l.login} size="lg" />
          )}
          <Button href={freeHref.href} variant="secondary" size="lg">
            {freeHref.label}
          </Button>
        </div>
      </div>
    </Card>
  );
}
