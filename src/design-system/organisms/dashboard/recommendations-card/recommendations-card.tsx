import { ChevronRight, GraduationCap } from "lucide-react";
import Image from "next/image";
import { Button } from "@/design-system/atoms/button";
import { Card } from "@/design-system/atoms/card";
import { Badge } from "@/design-system/atoms/badge";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { Product, Shelf } from "@/lib/api";
import { fill, type Formatter } from "@/lib/format";
import { ShelfTabs } from "@/design-system/molecules/shelf-tabs";

/*
 * Discovery, kept below everything the student studies with.
 * The live site's three shelves become one section: pills switch the shelf,
 * and each shelf scrolls sideways (the next card peeks in on phones).
 * Hidden entirely when there is nothing to recommend.
 */
/** Hidden by the page when there are no shelves. */
export function RecommendationsCard({ shelves, fmt, t }: { shelves: Shelf[]; fmt: Formatter; t: Dictionary }) {

  return (
    <Card aria-labelledby="recommend-title" className="grid grid-cols-1 gap-5 p-5 sm:p-6">
      <ShelfTabs
        title={
          <h2 id="recommend-title" className="type-title">
            {t.recommend.title}
          </h2>
        }
        label={t.recommend.shelvesLabel}
        shelves={shelves.map((shelf) => ({
          id: shelf.id,
          label: shelf.label,
          panel: <ShelfPanel shelf={shelf} fmt={fmt} t={t} />,
        }))}
      />
    </Card>
  );
}

function ShelfPanel({ shelf, fmt, t }: { shelf: Shelf; fmt: Formatter; t: Dictionary }) {
  return (
    <div className="grid gap-3">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <p className="text-sm text-subtle">{shelf.title}</p>
        {shelf.seeAllUrl && (
          <Button variant="ghost" size="sm" href={shelf.seeAllUrl}>
            {t.common.seeAll}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
      {/* Bleeds to the card edge so cards scroll under the padding; three fit from sm up. `relative`
          so absolutely placed children (the cards' sr-only text) are clipped too, not laid out
          against the page: that widened the whole page to 562px on a phone. */}
      <ul className="relative -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] sm:-mx-6 sm:scroll-px-6 sm:px-6">
        {shelf.items.map((product) => (
          <li key={product.id} className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)]">
            <ProductCard product={product} fmt={fmt} t={t} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const modalities = ["online_batch", "live_course", "crash_course", "recorded"] as const;

function ProductCard({ product, fmt, t }: { product: Product; fmt: Formatter; t: Dictionary }) {
  const modality = modalities.find((m) => m === product.modality);
  const meta = [modality && t.recommend.modality[modality], product.instructor].filter(Boolean).join(" · ");

  return (
    <a href={product.url} className="group grid content-start gap-3 rounded-lg focus-visible:outline-offset-4">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-raised ring-1 ring-border">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 78vw, 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span aria-hidden className="grid size-full place-items-center text-subtle">
            <GraduationCap className="size-8" />
          </span>
        )}
      </div>
      <div className="grid gap-1">
        {/* Two lines reserved so prices line up across a shelf. */}
        <h3 className="line-clamp-2 min-h-[2lh] leading-snug font-semibold group-hover:underline">{product.title}</h3>
        {meta && <p className="truncate text-sm text-subtle">{meta}</p>}
        <Price price={product.price} fmt={fmt} t={t} />
      </div>
    </a>
  );
}

function Price({ price, fmt, t }: { price: Product["price"]; fmt: Formatter; t: Dictionary }) {
  if (price === null) return <p className="text-sm font-semibold text-success">{t.recommend.free}</p>;
  const taka = (n: number) => `৳${fmt.number(n)}`;
  const discounted = price.final < price.original;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
      {discounted && (
        <span className="sr-only">{fill(t.recommend.priceLabel, { final: taka(price.final), original: taka(price.original) })}</span>
      )}
      <span className="font-semibold" aria-hidden={discounted}>
        {taka(price.final)}
      </span>
      {discounted && (
        <>
          <s className="text-subtle" aria-hidden>
            {taka(price.original)}
          </s>
          <Badge tone="success" size="sm" aria-hidden>
            {fill(t.recommend.off, { pct: fmt.percent(((price.original - price.final) / price.original) * 100) })}
          </Badge>
        </>
      )}
    </p>
  );
}
