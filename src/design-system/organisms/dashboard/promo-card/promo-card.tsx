import Image from "next/image";
import { Button } from "@/design-system/atoms/button";
import type { Promo } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fill } from "@/lib/format";
import { PromoCarousel } from "@/design-system/organisms/dashboard/promo-card/promo-carousel";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Formatter } from "@/lib/format";

const tones = {
  blue: "text-on-fill [background-image:var(--grad-promo)]",
  green: "bg-primary text-on-primary",
  warm: "text-text [background-image:var(--grad-superprep)] border border-border",
} as const;

function Slide({ promo }: { promo: Promo }) {
  if (promo.variant === "image") {
    return (
      <a href={promo.url} className="block">
        <Image src={promo.image} alt={promo.alt} width={720} height={290} className="aspect-[720/290] w-full rounded-lg object-cover" />
      </a>
    );
  }
  return (
    <div className={cn("flex aspect-[720/290] flex-col justify-between gap-2 rounded-lg p-4", tones[promo.tone])}>
      <div className="grid gap-1">
        <p className="line-clamp-2 leading-snug font-semibold">{promo.title}</p>
        <p className="line-clamp-2 text-sm opacity-90">{promo.body}</p>
      </div>
      <Button size="sm" href={promo.cta.url} variant={promo.tone === "warm" ? "primary" : "secondary"} className="max-w-full self-start">
        <span className="truncate">{promo.cta.label}</span>
      </Button>
    </div>
  );
}

/** The promo carousel; the page leaves it out when there are no slides. */
export function PromoCard({ slides, fmt, t }: { slides: Promo[]; fmt: Formatter; t: Dictionary }) {

  return (
    <PromoCarousel
      labels={{
        label: t.promos.label,
        slide: slides.map((_, i) => fill(t.promos.goTo, { n: fmt.number(i + 1) })),
      }}
      slides={slides.map((p) => ({ id: p.id, node: <Slide promo={p} /> }))}
    />
  );
}
