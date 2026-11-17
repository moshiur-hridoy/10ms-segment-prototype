import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

/** Colourful Figma illustrations, shown at 40px (drawn at 30px in Figma). */
const ICON = "size-10";

function AssetIcon({ src }: { src: string }) {
  return <Image src={src} alt="" width={30} height={30} className={ICON} />;
}

/**
 * Super Solve's mark, the red sphere. `className` sets its size (40px in the rail); the glyph inside keeps its
 * proportions (35.4 × 16.6 of 40, raised 2.5px), so it can be drawn at other sizes.
 */
export function SuperSolveIcon({ className = ICON }: { className?: string }) {
  return (
    <span
      className={`relative grid ${className} place-items-center overflow-hidden rounded-full [background-image:var(--icon-supersolve)] shadow-[var(--icon-supersolve-sheen)]`}
    >
      <Image src="/assets/side-supersolve.svg" alt="" width={26.5546} height={12.4602} className="h-[41.5%] w-[88.5%] -translate-y-[15%]" />
    </span>
  );
}

/** SuperPrep's mark from the rail, at any size. */
export function SuperPrepIcon({ className = ICON }: { className?: string }) {
  return <Image src="/assets/side-superprep.svg" alt="" width={30} height={30} className={className} />;
}

function CallIcon() {
  return (
    <span className={`grid ${ICON} place-items-center rounded-full [background-image:var(--icon-call)]`}>
      <Image src="/assets/side-call.svg" alt="" width={19.8663} height={19.8663} className="size-[21px]" />
    </span>
  );
}

type Item = { label: string; href: string; icon: ReactNode };

/** One shortcut: in-app pages go through `Link` (client navigation, page motion); the rest are plain links. */
function RailLink({ label, href, icon }: Item) {
  const className = "group grid justify-items-center gap-2 rounded-xl px-1 py-3 text-center transition-colors hover:bg-raised";
  const body = (
    <>
      <span className="drop-shadow-[0_2px_4px_rgb(16_24_40/0.08)] transition-transform duration-200 ease-out will-change-transform group-hover:-translate-y-0.5 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:transform-none">{icon}</span>
      <span className="text-xs leading-tight font-medium text-muted group-hover:text-text">{label}</span>
    </>
  );
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <a href={href} className={className}>
      {body}
    </a>
  );
}

export function QuickRail({ lang, t }: { lang: Locale; t: Dictionary }) {
  const myCourses = { label: t.quick.myCourses, icon: <AssetIcon src="/assets/side-courses.svg" /> };
  const items: Item[] = [
    { label: t.quick.routine, href: `/${lang}/routine`, icon: <AssetIcon src="/assets/side-routine.svg" /> },
    { label: t.quick.superSolve, href: "#", icon: <SuperSolveIcon /> },
    { label: t.quick.freeClass, href: "#", icon: <AssetIcon src="/assets/side-freeclass.svg" /> },
    { label: t.quick.superPrep, href: `/${lang}/superprep`, icon: <SuperPrepIcon /> },
    { label: t.quick.subscription, href: "#", icon: <AssetIcon src="/assets/side-subscription.svg" /> },
    { label: t.quick.call, href: "tel:16910", icon: <CallIcon /> },
  ];

  return (
    <nav
      aria-label={t.quick.label}
      className="sticky top-[88px] hidden w-full flex-col items-stretch gap-1 self-start rounded-full border border-border bg-surface px-1.5 py-5 lg:flex"
    >
      {/* "আমার কোর্স" opens the library, like the header's "কোর্স ও বইসমূহ". */}
      <RailLink {...myCourses} href={`/${lang}/library`} />
      {items.map((item) => (
        <RailLink key={item.label} {...item} />
      ))}
    </nav>
  );
}
