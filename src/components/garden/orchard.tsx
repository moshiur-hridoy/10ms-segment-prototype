"use client";

import { useEffect, useId, useState } from "react";
import { TreeFigure } from "@/design-system/atoms/tree-art";
import { dhakaMinutes, nightMatrix, skyAt } from "@/lib/sky";
import { growthIn, type TreeSpecies, type TreeStage } from "@/lib/tree";

type Grown = { id: string; species: TreeSpecies; tip: string };

/**
 * Where grown trees stand: two rows on the far hills, oldest first in the nearer row, smaller as
 * they recede. The front row is kept for the tree growing now and the next plot.
 */
const SLOTS: { x: number; y: number; s: number }[] = [
  { x: 240, y: 256, s: 0.74 },
  { x: 770, y: 254, s: 0.74 },
  { x: 400, y: 248, s: 0.7 },
  { x: 620, y: 246, s: 0.7 },
  { x: 90, y: 266, s: 0.76 },
  { x: 915, y: 264, s: 0.76 },
  { x: 170, y: 212, s: 0.56 },
  { x: 330, y: 206, s: 0.54 },
  { x: 510, y: 204, s: 0.54 },
  { x: 685, y: 206, s: 0.54 },
  { x: 845, y: 210, s: 0.56 },
];
export const ORCHARD_CAPACITY = SLOTS.length;
// The landscape is drawn 1000 wide; the sky above y=70 is cropped so the trees fill the frame.

const place = (x: number, y: number, s: number) => `translate(${x - 100 * s} ${y - 161 * s}) scale(${s})`;

/**
 * The orchard: one landscape in the streak tree's style (sky, sun, drifting clouds, three hills,
 * a little fence), every tree taken to fruit standing in it with its own species, the tree growing
 * now in front, and a marked plot for the next one. Hovering a tree names it (its <title>).
 */
export function Orchard({
  grown,
  current,
  label,
  nextPlot,
  minutes: start,
}: {
  grown: Grown[];
  current: { species: TreeSpecies; growth: number; stage: TreeStage };
  label: string;
  nextPlot: string;
  /** The request's time of day (minutes after midnight, Bangladesh); the sky then follows the clock. */
  minutes: number;
}) {
  const id = useId().replace(/:/g, "");
  const [minutes, setMinutes] = useState(start);
  useEffect(() => {
    const sync = () => setMinutes(dhakaMinutes(Date.now()));
    sync();
    const t = window.setInterval(sync, 60_000);
    return () => window.clearInterval(t);
  }, []);
  // The same day as the streak card: sky colours, the sun or moon on its arc, the land dimmed at night.
  const sky = skyAt(minutes);
  const dusk = 1 - sky.light;
  const orb = { x: Math.round(30 + sky.arc * 940), y: Math.round(250 - sky.height * 150) };
  const matrix = nightMatrix(dusk);
  // The trees at night: a lighter tint than the land and a rim of moonlight, as one CSS filter (it would override an SVG filter attribute).
  const treeLight = dusk > 0.01 ? { filter: `url(#${id}-night-tree)${dusk > 0.2 ? ` drop-shadow(0 0 ${Math.round(3 + dusk * 4)}px var(--tree-moonlit))` : ""}` } : undefined;
  const shown = grown.slice(-ORCHARD_CAPACITY);
  const trees = shown.map((t, i) => ({ ...t, ...SLOTS[i] })).sort((a, b) => a.y - b.y);

  return (
    <svg
      viewBox="0 70 1000 310"
      role="img"
      aria-label={label}
      className="block h-auto w-full"
      style={{ ["--tree-sky-top" as string]: sky.top, ["--tree-sky-bottom" as string]: sky.bottom, ["--tree-cloud" as string]: sky.cloud, ["--tree-sun" as string]: sky.sun }}
    >
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--tree-sky-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--tree-sky-bottom)" }} />
        </linearGradient>
        <radialGradient id={`${id}-sun`}>
          <stop offset="0.45" style={{ stopColor: "var(--tree-sun)" }} />
          <stop offset="1" style={{ stopColor: "var(--tree-sun)" }} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`}>
          <stop offset="0.3" style={{ stopColor: "var(--tree-moon)" }} stopOpacity="0.35" />
          <stop offset="1" style={{ stopColor: "var(--tree-moon)" }} stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-night`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={matrix} />
        </filter>
        <filter id={`${id}-night-tree`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={nightMatrix(dusk * 0.5)} />
        </filter>
      </defs>

      <rect y="70" width="1000" height="310" fill={`url(#${id}-sky)`} />
      {dusk > 0.02 && (
        <g opacity={Math.round(dusk * 100) / 100}>
          {[[60, 90], [150, 130], [240, 84], [330, 120], [420, 96], [520, 140], [610, 88], [700, 126], [790, 92], [880, 132], [950, 100], [180, 170], [560, 176], [840, 168]].map(([x, y], i) => (
            <circle key={i} className="tree-star" style={{ ["--i" as string]: i }} cx={x} cy={y} r={i % 3 ? 1.4 : 2} fill="var(--tree-star)" />
          ))}
        </g>
      )}
      {sky.body === "sun" ? (
        <g>
          <circle cx={orb.x} cy={orb.y} r="50" fill={`url(#${id}-sun)`} opacity="0.75" />
          <circle cx={orb.x} cy={orb.y} r="20" fill="var(--tree-sun)" />
        </g>
      ) : (
        <g>
          <circle cx={orb.x} cy={orb.y} r="44" fill={`url(#${id}-moon)`} />
          <circle cx={orb.x} cy={orb.y} r="16" fill="var(--tree-moon)" />
          <circle cx={orb.x + 5} cy={orb.y - 4} r="3" fill="var(--tree-moon-shade)" opacity="0.5" />
        </g>
      )}
      <g className="tree-clouds" fill="var(--tree-cloud)" opacity="0.9">
        <path d="M700 110 a12 12 0 0 1 20 -8 a15 15 0 0 1 28 5 a10 10 0 0 1 3 19 h-48 a9 9 0 0 1 -3 -16 z" />
        <path d="M400 96 a9 9 0 0 1 15 -6 a11 11 0 0 1 21 4 a8 8 0 0 1 2.5 14.5 h-36 a7 7 0 0 1 -2.5 -12.5 z" opacity="0.8" />
        <path d="M880 140 a8 8 0 0 1 13 -5 a10 10 0 0 1 18 3.5 a7 7 0 0 1 2 12.5 h-31 a6 6 0 0 1 -2 -11 z" opacity="0.75" />
      </g>

      <g filter={dusk > 0.01 ? `url(#${id}-night)` : undefined}>
      <path d="M0 214 Q180 166 380 200 T760 190 T1000 200 V380 H0 Z" fill="var(--tree-hill-back)" />
      <path d="M0 256 Q250 210 520 240 T1000 234 V380 H0 Z" fill="var(--tree-hill)" opacity="0.7" />
      <path d="M0 304 Q500 252 1000 304 V380 H0 Z" fill="var(--tree-hill)" />
      <path d="M0 344 Q500 316 1000 344 V380 H0 Z" fill="var(--tree-hill-shade)" opacity="0.55" />

      </g>

      {/* The trees, lit apart from the land at night (a lighter tint and a rim of moonlight). */}
      <g style={treeLight}>
      {trees.map((t, i) => (
        <TreeFigure key={t.id} stage={8} species={t.species} transform={place(t.x, t.y, t.s)} delay={i * 0.9}>
          <title>{t.tip}</title>
        </TreeFigure>
      ))}

      </g>

      <g filter={dusk > 0.01 ? `url(#${id}-night)` : undefined}>
      {/* A little fence along the front. */}
      <g stroke="var(--tree-trunk)" strokeLinecap="round">
        <path d="M18 336 L18 312 M58 333 L58 309 M98 331 L98 307 M138 330 L138 306" strokeWidth="5" />
        <path d="M14 318 Q78 312 142 312 M14 328 Q78 322 142 322" strokeWidth="3.5" opacity="0.85" />
        <path d="M862 330 L862 306 M902 331 L902 307 M942 333 L942 309 M982 336 L982 312" strokeWidth="5" />
        <path d="M858 312 Q922 312 986 318 M858 322 Q922 322 986 328" strokeWidth="3.5" opacity="0.85" />
      </g>

      </g>

      {/* The tree growing now, front and centre. */}
      <g style={treeLight}>
        <TreeFigure stage={current.stage} species={current.species} growth={growthIn(current.growth)} transform={place(480, 330, 1.05)} delay={2} />
      </g>

      <g filter={dusk > 0.01 ? `url(#${id}-night)` : undefined}>

      {/* The next plot: dug soil and a little sign. */}
      <g>
        <ellipse cx="700" cy="330" rx="30" ry="7" fill="var(--tree-soil-dark)" opacity="0.55" />
        <ellipse cx="700" cy="329" rx="25" ry="5" fill="none" stroke="var(--tree-soil)" strokeWidth="2" strokeDasharray="5 4" />
        <path d="M736 332 L736 296" stroke="var(--tree-trunk)" strokeWidth="4" strokeLinecap="round" />
        <rect x="706" y="282" width="60" height="21" rx="4" fill="var(--tree-trunk-light)" />
        <text x="736" y="297" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--tree-trunk-shade)">
          {nextPlot}
        </text>
      </g>
      </g>
    </svg>
  );
}
