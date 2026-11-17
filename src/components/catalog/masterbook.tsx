import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * CT105 (lab `segment-home` v14): the store's masterbook covers drawn as printed books, and a
 * bundle as its own books tied together with a ribbon.
 */

/** The store's covers are 79:100; nothing on them is cut. */
const COVER = "aspect-[79/100]";

/**
 * One printed book, cover out: the store's cover with a shaded spine, the paperback's hinge crease
 * and a sheen, the page block showing at the fore-edge, and a soft shadow on the table. Inside a
 * `group/mb`, hovering lifts the book and swings its cover a little open on the spine, so the first
 * page shows; with reduced motion it only lifts.
 */
export function MasterbookCover({ img, sizes = "128px", className }: { img: string; sizes?: string; className?: string }) {
  return (
    <span className={cn("relative block [perspective:1000px]", className)}>
      {/* The book's shadow on the table; it softens as the book rises. */}
      <span
        aria-hidden
        className="absolute inset-x-[8%] -bottom-1.5 h-3 rounded-[50%] bg-black/25 blur-md transition-[opacity,scale] duration-300 ease-out group-hover/mb:scale-x-90 group-hover/mb:opacity-60 motion-reduce:transition-none"
      />
      <span className="relative block transition-[translate] duration-300 ease-out group-hover/mb:-translate-y-1.5 group-focus-visible/mb:-translate-y-1.5 motion-reduce:transition-none">
        {/* The page block: the fore-edge peeks out right and below; under the cover, the first page. */}
        <span
          aria-hidden
          className="absolute top-[1.5%] -right-[3.5%] -bottom-[1.5%] left-0 rounded-r-sm bg-paper shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08),inset_6px_0_6px_-4px_rgb(0_0_0/0.18)]"
          style={{ backgroundImage: "var(--book-leaves)" }}
        />
        <span
          className={cn(
            "relative block origin-left overflow-hidden rounded-l-[3px] rounded-r-md bg-raised shadow-raised transition-transform duration-500 ease-out motion-reduce:transition-none",
            "group-hover/mb:[transform:rotateY(-24deg)] group-focus-visible/mb:[transform:rotateY(-24deg)] motion-reduce:group-hover/mb:transform-none motion-reduce:group-focus-visible/mb:transform-none",
            COVER,
          )}
        >
          <Image src={img} alt="" fill sizes={sizes} className="object-cover" />
          <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-sheen)" }} />
          <span aria-hidden className="absolute inset-y-0 left-0 w-[4%]" style={{ background: "var(--book-spine)" }} />
          <span aria-hidden className="absolute inset-y-0 left-[5%] w-[2.5%]" style={{ background: "var(--book-hinge)" }} />
        </span>
      </span>
    </span>
  );
}

/** A cover in the bundle's pile: the same book, still (the pile moves as one). */
function PileBook({ img }: { img: string }) {
  return (
    <span className="relative block">
      <span
        aria-hidden
        className="absolute top-[1.5%] -right-[3.5%] -bottom-[1.5%] left-0 rounded-r-sm bg-paper shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08),inset_6px_0_6px_-4px_rgb(0_0_0/0.18)]"
        style={{ backgroundImage: "var(--book-leaves)" }}
      />
      <span className={cn("relative block overflow-hidden rounded-l-[3px] rounded-r-md bg-raised shadow-raised", COVER)}>
        <Image src={img} alt="" fill sizes="176px" className="object-cover" />
        <span aria-hidden className="absolute inset-0" style={{ background: "var(--book-sheen)" }} />
        <span aria-hidden className="absolute inset-y-0 left-0 w-[4%]" style={{ background: "var(--book-spine)" }} />
        <span aria-hidden className="absolute inset-y-0 left-[5%] w-[2.5%]" style={{ background: "var(--book-hinge)" }} />
      </span>
    </span>
  );
}

/** The bow, drawn in the ribbon's gold: two loops, two tails cut in a V, and the knot. */
function Bow({ className }: { className?: string }) {
  const id = useId();
  const gold = `${id}-gold`;
  const shade = `${id}-shade`;
  return (
    <svg aria-hidden viewBox="0 0 100 70" className={className}>
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7da74" />
          <stop offset="0.5" stopColor="#e3b12c" />
          <stop offset="1" stopColor="#a87b0a" />
        </linearGradient>
        <linearGradient id={shade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6406" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#8a6406" stopOpacity="0" />
          <stop offset="1" stopColor="#8a6406" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* Tails. */}
      <path d="M47 34 L33 66 L39 62 L43 69 L53 36 Z" fill={`url(#${gold})`} stroke="#8a6406" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M53 34 L67 66 L61 62 L57 69 L47 36 Z" fill={`url(#${gold})`} stroke="#8a6406" strokeWidth="0.8" strokeLinejoin="round" />
      {/* Loops, with their inner fold in shadow. */}
      <path d="M50 32 C34 6 4 6 8 28 C11 44 34 42 50 32 Z" fill={`url(#${gold})`} stroke="#8a6406" strokeWidth="0.8" />
      <path d="M50 32 C66 6 96 6 92 28 C89 44 66 42 50 32 Z" fill={`url(#${gold})`} stroke="#8a6406" strokeWidth="0.8" />
      <path d="M50 32 C38 16 20 14 18 26 C24 22 38 24 50 32 Z" fill="#8a6406" opacity="0.35" />
      <path d="M50 32 C62 16 80 14 82 26 C76 22 62 24 50 32 Z" fill="#8a6406" opacity="0.35" />
      {/* The knot. */}
      <rect x="42" y="23" width="16" height="18" rx="5" fill={`url(#${gold})`} stroke="#8a6406" strokeWidth="0.8" />
      <rect x="42" y="23" width="16" height="18" rx="5" fill={`url(#${shade})`} />
    </svg>
  );
}

/**
 * A bundle as what you get: its subjects' books in a pile (the first paper of each, the front one
 * first), tied across and down with a gold ribbon and a bow, and a tag on a string that says how many
 * books are in it. Inside a `group/bundle`, hovering lifts the pile and the bow tips.
 */
export function BundlePile({ covers, tag, className }: { covers: string[]; tag: string; className?: string }) {
  const pile = covers.slice(0, 4);
  const n = pile.length;
  // Each book behind sits a step right and a step up; the front book is 68% of the pile's width.
  const step = n > 1 ? 24 / (n - 1) : 0;
  const rise = n > 1 ? 7 / (n - 1) : 0;
  return (
    <span className={cn("relative block aspect-[1/1] shrink-0", className)}>
      <span
        aria-hidden
        className="absolute inset-x-[4%] bottom-[0%] h-4 rounded-[50%] bg-black/25 blur-md transition-[opacity,scale] duration-300 ease-out group-hover/bundle:scale-x-90 group-hover/bundle:opacity-60 motion-reduce:transition-none"
      />
      <span className="absolute inset-0 transition-[translate] duration-300 ease-out group-hover/bundle:-translate-y-1.5 motion-reduce:transition-none">
        {pile
          .map((img, i) => (
            <span key={img} className="absolute w-[68%]" style={{ left: `${i * step}%`, bottom: `${4 + i * rise}%`, zIndex: n - i }}>
              <PileBook img={img} />
            </span>
          ))
          .reverse()}
        {/* The ribbon: across the whole pile at the books' middle, and down the front book. */}
        <span
          aria-hidden
          className="absolute left-0 z-10 h-[7%] shadow-sm"
          style={{ right: `${100 - 68 - (n - 1) * step - 2}%`, bottom: "40%", background: "var(--ribbon-across)" }}
        />
        <span
          aria-hidden
          className="absolute bottom-[4%] left-[42%] z-10 w-[7%] shadow-sm"
          style={{ height: "86.1%", background: "var(--ribbon-down)" }}
        />
        <span className="absolute bottom-[26%] left-[22.5%] z-20 block w-[46%] origin-[50%_45%] drop-shadow-md transition-transform duration-300 ease-out group-hover/bundle:-rotate-6 motion-reduce:transition-none">
          <Bow className="block w-full" />
          {/* The tag hangs from the knot on a string, centred under it so it stays over the pile at any size (CT115). */}
          <span aria-hidden className="absolute top-[58%] left-[52%] h-5 w-px rotate-[-18deg] origin-top bg-[#8a6406]" />
          <span className="absolute top-[calc(58%+1.1rem)] left-[54%] -translate-x-1/2 rotate-[-8deg] rounded-sm bg-paper px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap text-text shadow-raised ring-1 ring-black/10">
            {tag}
          </span>
        </span>
      </span>
    </span>
  );
}
