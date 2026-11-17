"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Numbers, QuoteStack, StageBoard, VideoBox, type StageVideo } from "@/components/landing/desktop/proof";
import type { CatalogView } from "@/lib/api/catalog";
import { cn } from "@/lib/cn";
import { FeatureBento } from "./feature-bento";
import { SECTION_TITLE_BIG } from "./section-title";

/**
 * CT72: "কেন ১০ মিনিট স্কুল?" as the landing's results board (L22), in place of the dark green band (CT31), filled with
 * the live batch page's own reviews: the video reviews as prints on the small blackboard (each opens the landing's
 * video box), the written ones as the stack of paper that turns, the landing's numbers as sticky notes, and what every
 * live batch has as paper cards. On phones the prints run sideways and everything stacks.
 */
export function ProofBoard({
  view,
  labels,
  dark = false,
  bento = false,
  bentoNumbers = false,
  column = false,
}: {
  view: Pick<CatalogView, "features" | "testimonials" | "videoTestimonials">;
  labels: { title: string; videos: string; video: string; quotes: string; features: string };
  /** CT110: on the segment page's dark end the board drops its white band (the page sets the dark one); the paper on it stays paper. */
  dark?: boolean;
  /** CT111 (lab `segment-home` v19): what every live batch has as a bento instead of eight equal closed cards. */
  bento?: boolean;
  /** CT113 (v21): the three numbers go into the bento, which then takes the full width; no sticky notes beside it. */
  bentoNumbers?: boolean;
  /** CT156 (lab `segment-home` v54): the page's one 960px column instead of the page width. */
  column?: boolean;
}) {
  const videos: StageVideo[] = view.videoTestimonials.map((v) => ({
    videoId: v.videoId,
    title: v.title,
    name: v.name,
    school: v.role,
    img: v.imageUrl,
  }));
  const quotes = view.testimonials.map((r) => ({ quote: r.text, name: r.name, role: r.role, photo: r.imageUrl }));
  const [playing, setPlaying] = useState<number | null>(null);
  if (!videos.length && !quotes.length && !view.features.length) return null;
  const numbersIn = bento && bentoNumbers && view.features.length > 0;

  return (
    <section
      aria-labelledby="trust-title"
      className={cn(dark ? "pt-16 pb-10 sm:pt-20 sm:pb-12" : "my-16 border-y border-border bg-surface py-14 sm:py-16")}
    >
      <div className={cn("mx-auto grid gap-8 px-4 sm:px-6", column ? "max-w-column" : "max-w-page")}>
        <h2 id="trust-title" className={cn("type-title", SECTION_TITLE_BIG)}>
          {labels.title}
        </h2>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {videos.length > 0 && (
            <>
              <StageBoard className="h-[400px] max-md:hidden lg:col-span-7" videos={videos} label={labels.videos} kicker={labels.video} />
              {/* Phones: the prints in a sideways row; a tap opens the same video box. */}
              <div className="md:hidden">
                <p className="mb-3 text-sm font-medium text-subtle">{labels.videos}</p>
                <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
                  {videos.map((v, j) => (
                    <li key={v.videoId} className="w-[132px] shrink-0 snap-start">
                      <button type="button" onClick={() => setPlaying(j)} aria-label={v.title} className="block w-full text-left">
                        <span className="block bg-[#fbf8f1] p-1.5 pb-0 shadow-[0_6px_14px_-6px_rgb(0_0_0/0.45)]">
                          <span className="relative block aspect-[9/16] overflow-hidden">
                            <Image src={v.img} alt="" fill sizes="132px" className="object-cover" />
                            <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-on-fill/90 text-ink">
                              <svg aria-hidden viewBox="0 0 12 12" className="ml-0.5 size-3.5" fill="currentColor">
                                <path d="M2.5 1.2v9.6c0 .5.5.8.9.5l7.3-4.8c.4-.3.4-.8 0-1L3.4.7c-.4-.3-.9 0-.9.5z" />
                              </svg>
                            </span>
                          </span>
                          <span className="block truncate px-0.5 py-1.5 text-xs font-semibold text-[#3d3a33]">{v.name}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {playing !== null && (
                  <VideoBox videos={videos} kicker={labels.video} index={playing} onIndex={setPlaying} onClose={() => setPlaying(null)} />
                )}
              </div>
            </>
          )}
          {quotes.length > 0 && (
            <Paper on={dark}>
              <QuoteStack label={labels.quotes} quotes={quotes} height="h-[360px] lg:h-[400px]" className="lg:col-span-5" />
            </Paper>
          )}

          {view.features.length > 0 && (
            <div className={cn("grid content-start gap-3", numbersIn ? "lg:col-span-12" : "lg:col-span-9")}>
              <p className="text-sm font-medium text-subtle">{labels.features}</p>
              <Paper on={dark}>
                {bento ? (
                  <FeatureBento features={view.features} numbers={numbersIn} />
                ) : (
                  <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {view.features.map((f) => (
                      <li key={f.title}>
                        <details className="group h-full rounded-lg bg-paper shadow-[0_1px_2px_rgb(52_36_16/0.15),0_12px_24px_-20px_rgb(52_36_16/0.4)] transition-colors">
                          <summary className="flex cursor-pointer list-none flex-col items-start gap-2.5 p-3.5 sm:flex-row sm:items-center sm:gap-3 [&::-webkit-details-marker]:hidden">
                            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface ring-1 ring-border">
                              <Image src={f.iconUrl} alt="" width={24} height={24} className="size-6 object-contain" />
                            </span>
                            <span className="min-w-0 flex-1 text-sm font-semibold sm:text-base">{f.title}</span>
                            <ChevronDown
                              className="size-4 shrink-0 text-subtle transition-transform group-open:rotate-180 max-sm:hidden"
                              aria-hidden
                            />
                          </summary>
                          <p className="px-3.5 pb-3.5 text-sm text-muted">{f.description}</p>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </Paper>
            </div>
          )}
          {!numbersIn && (
            <Paper on={dark}>
              <Numbers className="lg:col-span-3 lg:self-end" />
            </Paper>
          )}
        </div>
      </div>
    </section>
  );
}

/** CT110: on a dark band, the board's paper (the quotes, the feature cards, the sticky notes) keeps the light mode's colours. */
function Paper({ on, children }: { on: boolean; children: ReactNode }) {
  return on ? (
    <div data-mode="light" className="contents text-text">
      {children}
    </div>
  ) : (
    children
  );
}
