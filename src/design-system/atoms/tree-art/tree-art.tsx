"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { drain, nightMatrix, skyAt } from "@/lib/sky";

/*
 * The streak's apple tree, drawn by hand in SVG (viewBox 200 × 200, the plant's base at 100,160).
 * One light source (top left), a few tones per material, soft contact shadows. Every part is its
 * own group, so the motion layer can sway, water and grow it later. Colours are the --tree-*
 * tokens; a scene's `mood` swaps some of them (components.css).
 */

import type { TreeMood, TreeSpecies, TreeStage } from "@/lib/tree";

export type { TreeMood, TreeSpecies, TreeStage } from "@/lib/tree";

const r2 = (v: number) => Math.round(v * 100) / 100;

/** The scene's id, so the crown's clip paths are unique when several trees share a page. */
const SceneId = createContext("tree");

/* ---------- Parts ---------- */

/** A pointed leaf along +x from its stalk, lit on its upper half, with a midrib. */
function Leaf({ x, y, len, w, rot, tone = "leaf", lit = true }: { x: number; y: number; len: number; w: number; rot: number; tone?: string; lit?: boolean }) {
  const body = `M0 0 C${r2(len * 0.22)} ${r2(-w)} ${r2(len * 0.72)} ${r2(-w * 0.95)} ${len} 0 C${r2(len * 0.72)} ${r2(w * 0.95)} ${r2(len * 0.22)} ${r2(w)} 0 0 Z`;
  const top = `M0 0 C${r2(len * 0.22)} ${r2(-w)} ${r2(len * 0.72)} ${r2(-w * 0.95)} ${len} 0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={body} fill={`var(--tree-${tone})`} />
      {lit && <path d={top} fill="var(--tree-leaf-glint)" opacity="0.35" />}
      <path d={`M${r2(len * 0.06)} 0 Q${r2(len * 0.5)} ${r2(-w * 0.12)} ${r2(len * 0.86)} 0`} fill="none" stroke="var(--tree-leaf-vein)" strokeWidth={r2(Math.max(0.35, w * 0.11))} strokeLinecap="round" opacity="0.45" />
    </g>
  );
}

/** A tapered limb from (x1,y1) to (x2,y2), widths w1 → w2, bowed by `bend`; round at the tip. */
function Limb({ x1, y1, x2, y2, w1, w2, bend = 0, fill = "var(--tree-trunk)" }: { x1: number; y1: number; x2: number; y2: number; w1: number; w2: number; bend?: number; fill?: string }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const mx = (x1 + x2) / 2 + nx * bend;
  const my = (y1 + y2) / 2 + ny * bend;
  const wm = (w1 + w2) / 4;
  const p = (x: number, y: number) => `${r2(x)} ${r2(y)}`;
  const d = `M${p(x1 + (nx * w1) / 2, y1 + (ny * w1) / 2)} Q${p(mx + nx * wm, my + ny * wm)} ${p(x2 + (nx * w2) / 2, y2 + (ny * w2) / 2)} L${p(x2 - (nx * w2) / 2, y2 - (ny * w2) / 2)} Q${p(mx - nx * wm, my - ny * wm)} ${p(x1 - (nx * w1) / 2, y1 - (ny * w1) / 2)} Z`;
  return (
    <g>
      <path d={d} fill={fill} />
      <circle cx={x2} cy={y2} r={r2(w2 / 2)} fill={fill} />
    </g>
  );
}

/** A trunk with its shaded right side and a lit edge on the left. */
function Trunk({ top, w1, w2, dead = false }: { top: number; w1: number; w2: number; dead?: boolean }) {
  const base = dead ? "var(--tree-dead-bark)" : "var(--tree-trunk)";
  const shade = dead ? "var(--tree-dead-bark-shade)" : "var(--tree-trunk-shade)";
  return (
    <g>
      <Limb x1={100} y1={161} x2={100} y2={top} w1={w1} w2={w2} bend={0.8} fill={base} />
      <path d={`M${100 + w1 * 0.08} 161 L${100 + w2 * 0.1} ${top} L${100 + w2 / 2} ${top} Q${100 + w1 * 0.42} ${(161 + top) / 2} ${100 + w1 / 2} 161 Z`} fill={shade} opacity="0.8" />
      {!dead && <path d={`M${100 - w1 * 0.34} 158 Q${100 - w1 * 0.3} ${(161 + top) / 2} ${100 - w2 * 0.32} ${top + 4}`} fill="none" stroke="var(--tree-trunk-light)" strokeWidth={r2(w1 * 0.12)} strokeLinecap="round" opacity="0.7" />}
      {/* Bark marks. */}
      <path d={`M${100 - w1 * 0.1} ${top + (161 - top) * 0.35} q2 3 0 6 M${100 + w1 * 0.12} ${top + (161 - top) * 0.62} q-2 3 0 6`} fill="none" stroke={shade} strokeWidth="0.9" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

/** The roots flaring into the soil. */
function Roots({ spread, w }: { spread: number; w: number }) {
  return (
    <g>
      <Limb x1={100} y1={158.5} x2={100 - spread} y2={162} w1={w} w2={1} bend={1.5} />
      <Limb x1={100} y1={158.5} x2={100 + spread} y2={162} w1={w} w2={1} bend={-1.5} />
      <Limb x1={101} y1={159} x2={100 + spread * 0.45} y2={163.5} w1={w * 0.6} w2={0.8} fill="var(--tree-trunk-shade)" />
    </g>
  );
}

type Blob = [x: number, y: number, r: number];

/**
 * A crown of leaf clumps, back to front: a dark mass, then mid-tone clumps each lit on its upper
 * left (a lighter cap clipped to the clump, the way a flat illustration shades foliage), then a few
 * bright clumps in front. Leaves break the outline, and small leaves over the top give it texture,
 * so it reads as foliage, not bubbles.
 */
function Crown({ dark, mid, light, edge, sprinkle = [] }: { dark: Blob[]; mid: Blob[]; light: Blob[]; edge: [number, number, number, number][]; sprinkle?: [number, number, number][] }) {
  const sid = useContext(SceneId);
  const clump = (layer: string, i: number, [x, y, r]: Blob, base: string, cap: string, capScale: number) => {
    const cid = `${sid}-${layer}${i}`;
    return (
      <g key={cid}>
        <clipPath id={cid}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
        <circle cx={x} cy={y} r={r} fill={`var(--tree-${base})`} />
        <circle cx={r2(x - r * 0.32)} cy={r2(y - r * 0.38)} r={r2(r * capScale)} fill={`var(--tree-${cap})`} clipPath={`url(#${cid})`} />
      </g>
    );
  };
  return (
    <g>
      {edge.map(([x, y, rot, len], i) => (
        <Leaf key={`e${i}`} x={x} y={y} len={len} w={len * 0.42} rot={rot} tone={i % 3 === 0 ? "leaf" : "leaf-dark"} lit={false} />
      ))}
      {dark.map(([x, y, r], i) => (
        <circle key={`d${i}`} cx={x} cy={y} r={r} fill="var(--tree-leaf-dark)" />
      ))}
      {mid.map((b, i) => clump("m", i, b, "leaf", "leaf-light", 0.78))}
      {light.map((b, i) => clump("l", i, b, "leaf-light", "leaf-glint", 0.62))}
      {sprinkle.map(([x, y, rot], i) => (
        <Leaf key={`s${i}`} x={x} y={y} len={5.5} w={2.3} rot={rot} tone={i % 2 ? "leaf-dark" : "leaf-light"} lit={false} />
      ))}
    </g>
  );
}

/** Apple blossom: five petals, a blush toward the centre, yellow stamens. */
function Blossom({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy={-r * 0.62} rx={r * 0.5} ry={r * 0.62} fill="var(--tree-blossom)" transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.45} fill="var(--tree-blossom-pink)" opacity="0.8" />
      <circle r={r * 0.22} fill="var(--tree-blossom-center)" />
    </g>
  );
}

/** An apple: dimpled silhouette, shade on the lower right, a gloss, stem and leaf. `ripe` 0 green → 1 red. */
function Apple({ x, y, r, ripe, rot = 0 }: { x: number; y: number; r: number; ripe: number; rot?: number }) {
  const body = `M0 ${-r * 0.62} C${r * 0.75} ${-r * 1.15} ${r * 1.32} ${-r * 0.2} ${r * 0.62} ${r * 0.88} C${r * 0.32} ${r * 1.12} ${-r * 0.32} ${r * 1.12} ${-r * 0.62} ${r * 0.88} C${-r * 1.32} ${-r * 0.2} ${-r * 0.75} ${-r * 1.15} 0 ${-r * 0.62} Z`;
  const pct = Math.round(Math.max(0, Math.min(1, ripe)) * 100);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 ${-r * 0.55} q${r * 0.1} ${-r * 0.45} ${r * 0.32} ${-r * 0.62}`} fill="none" stroke="var(--tree-trunk-shade)" strokeWidth={r * 0.18} strokeLinecap="round" />
      <path d={body} style={{ fill: `color-mix(in srgb, var(--tree-apple) ${pct}%, var(--tree-apple-green))` }} />
      <path d={`M${r * 0.7} ${-r * 0.3} C${r * 0.95} ${r * 0.35} ${r * 0.55} ${r * 0.95} ${-r * 0.1} ${r * 1.02} C${r * 0.45} ${r * 0.6} ${r * 0.72} ${r * 0.2} ${r * 0.7} ${-r * 0.3} Z`} fill="var(--tree-apple-shade)" opacity="0.35" />
      <ellipse cx={-r * 0.38} cy={-r * 0.2} rx={r * 0.16} ry={r * 0.3} fill="var(--tree-apple-light)" opacity="0.75" transform={`rotate(25 ${-r * 0.38} ${-r * 0.2})`} />
      <Leaf x={r * 0.2} y={-r * 0.95} len={r * 0.9} w={r * 0.32} rot={-25} tone="leaf-light" lit={false} />
    </g>
  );
}

/** A fruit's colour from unripe to ripe: `ripe` 0 → 1, mixed in CSS from two tokens. */
const ripen = (ripe: number, ripeToken: string, greenToken: string) =>
  ({ fill: `color-mix(in srgb, var(${ripeToken}) ${Math.round(Math.max(0, Math.min(1, ripe)) * 100)}%, var(${greenToken}))` });

/** A mango: a long kidney shape hanging on its stalk, a blush on the shoulder as it ripens. */
function Mango({ x, y, r, ripe, rot = 0 }: { x: number; y: number; r: number; ripe: number; rot?: number }) {
  const body = `M0 0 C${r * 0.95} ${r * 0.05} ${r * 1.05} ${r * 1.55} ${r * 0.25} ${r * 2.15} C${-r * 0.45} ${r * 2.6} ${-r * 0.95} ${r * 1.7} ${-r * 0.6} ${r * 0.7} C${-r * 0.42} ${r * 0.22} ${-r * 0.22} 0 0 0 Z`;
  return (
    <g transform={`translate(${x} ${y - r * 1.2}) rotate(${rot})`}>
      <path d={`M0 0 q${-r * 0.1} ${-r * 0.7} ${r * 0.2} ${-r * 1.1}`} fill="none" stroke="var(--tree-trunk-shade)" strokeWidth={r * 0.16} strokeLinecap="round" />
      <path d={body} style={ripen(ripe, "--tree-mango", "--tree-mango-green")} />
      <ellipse cx={r * 0.35} cy={r * 0.55} rx={r * 0.35} ry={r * 0.5} fill="var(--tree-mango-blush)" opacity={0.55 * ripe} />
      <path d={`M${r * 0.45} ${r * 0.6} C${r * 0.75} ${r * 1.2} ${r * 0.55} ${r * 1.8} ${r * 0.05} ${r * 2.2} C${r * 0.4} ${r * 1.6} ${r * 0.5} ${r * 1.1} ${r * 0.45} ${r * 0.6} Z`} fill="var(--tree-apple-shade)" opacity="0.18" />
      <ellipse cx={-r * 0.3} cy={r * 0.7} rx={r * 0.13} ry={r * 0.36} fill="var(--tree-apple-light)" opacity="0.7" transform={`rotate(15 ${-r * 0.3} ${r * 0.7})`} />
    </g>
  );
}

/** Lychees: a bunch of three small bumpy fruits on thin stalks. */
function Lychee({ x, y, r, ripe }: { x: number; y: number; r: number; ripe: number; rot?: number }) {
  const fruit = (cx: number, cy: number, k: number) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r * k} style={ripen(ripe, "--tree-lychee", "--tree-lychee-green")} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={r2(cx + Math.cos((a * Math.PI) / 180) * r * k * 0.55)} cy={r2(cy + Math.sin((a * Math.PI) / 180) * r * k * 0.55)} r={r2(r * k * 0.12)} fill="var(--tree-apple-shade)" opacity="0.35" />
      ))}
      <circle cx={cx - r * k * 0.35} cy={cy - r * k * 0.35} r={r * k * 0.2} fill="var(--tree-apple-light)" opacity="0.6" />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y - r})`}>
      <path d={`M0 ${-r * 0.4} L${-r * 0.55} ${r * 0.7} M0 ${-r * 0.4} L${r * 0.6} ${r * 0.6} M0 ${-r * 0.4} L0 ${r * 1.2}`} stroke="var(--tree-trunk-shade)" strokeWidth={r * 0.12} strokeLinecap="round" />
      {fruit(-r * 0.6, r * 1.05, 0.58)}
      {fruit(r * 0.65, r * 0.95, 0.55)}
      {fruit(0, r * 1.65, 0.62)}
    </g>
  );
}

/** An orange: round, a pitted peel, a gloss and a leaf at the stalk. */
function Orange({ x, y, r, ripe, rot = 0 }: { x: number; y: number; r: number; ripe: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 ${-r * 0.9} q${r * 0.05} ${-r * 0.35} ${r * 0.25} ${-r * 0.5}`} fill="none" stroke="var(--tree-trunk-shade)" strokeWidth={r * 0.16} strokeLinecap="round" />
      <circle r={r * 0.95} style={ripen(ripe, "--tree-orange", "--tree-orange-green")} />
      <path d={`M${r * 0.75} ${-r * 0.4} A${r * 0.95} ${r * 0.95} 0 0 1 ${-r * 0.2} ${r * 0.93} A${r * 1.1} ${r * 1.1} 0 0 0 ${r * 0.75} ${-r * 0.4} Z`} fill="var(--tree-apple-shade)" opacity="0.2" />
      {[[0.3, 0.2], [-0.2, 0.45], [0.45, -0.25], [-0.45, -0.05], [0.05, -0.5]].map(([dx, dy], i) => (
        <circle key={i} cx={r * dx} cy={r * dy} r={r * 0.06} fill="var(--tree-apple-shade)" opacity="0.25" />
      ))}
      <ellipse cx={-r * 0.38} cy={-r * 0.35} rx={r * 0.16} ry={r * 0.28} fill="var(--tree-apple-light)" opacity="0.75" transform={`rotate(30 ${-r * 0.38} ${-r * 0.35})`} />
      <Leaf x={r * 0.2} y={-r * 1.3} len={r * 0.95} w={r * 0.34} rot={-20} tone="leaf" lit={false} />
    </g>
  );
}

/** Mango and lychee flower in small cone-shaped clusters (মুকুল) instead of open blossoms. */
function Panicle({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  const dots: [number, number, number][] = [[0, -1.6, 0.32], [-0.35, -1, 0.34], [0.35, -1, 0.34], [-0.6, -0.35, 0.36], [0, -0.45, 0.38], [0.6, -0.35, 0.36], [-0.3, 0.25, 0.36], [0.3, 0.25, 0.36]];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 ${r * 0.7} L0 ${-r * 1.5}`} stroke="var(--tree-trunk-light)" strokeWidth={r * 0.14} strokeLinecap="round" />
      {dots.map(([dx, dy, k], i) => (
        <circle key={i} cx={r * dx} cy={r * dy} r={r * k} fill={i % 3 === 0 ? "var(--tree-blossom-center)" : "var(--tree-blossom)"} />
      ))}
    </g>
  );
}

const FRUIT: Record<TreeSpecies, typeof Apple> = { apple: Apple, mango: Mango, lychee: Lychee, orange: Orange };

/* ---------- The full-grown tree (stages 6–8 share it) ---------- */

const CROWN = {
  dark: [[68, 92, 23], [132, 90, 23], [100, 62, 30], [82, 66, 24], [118, 64, 24], [100, 98, 22]] as Blob[],
  mid: [[76, 82, 21], [124, 80, 21], [100, 52, 23], [89, 92, 19], [112, 90, 19], [100, 73, 24]] as Blob[],
  light: [[86, 62, 12], [109, 50, 10], [72, 82, 8.5], [120, 70, 9.5]] as Blob[],
  sprinkle: [
    [64, 100, 120], [78, 104, 200], [122, 104, 340], [138, 96, 40], [112, 44, 300], [88, 44, 230], [70, 72, 210], [132, 70, 330],
    [96, 102, 160], [106, 66, 20], [86, 80, 250], [118, 84, 10],
  ] as [number, number, number][],
  edge: [
    [52, 96, 160, 11], [48, 84, 200, 10], [58, 70, 225, 11], [74, 50, 240, 10], [92, 38, 265, 11], [110, 37, 285, 10],
    [128, 47, 305, 11], [142, 64, 320, 10], [150, 82, 345, 11], [150, 98, 15, 10], [136, 110, 40, 9], [64, 110, 140, 9],
  ] as [number, number, number, number][],
};

function GrownTree({ children }: { children?: ReactNode }) {
  return (
    <g>
      <Roots spread={13} w={5} />
      <Trunk top={96} w1={14} w2={7} />
      <Limb x1={98.5} y1={120} x2={76} y2={94} w1={6} w2={2.5} bend={-2} />
      <Limb x1={101.5} y1={113} x2={126} y2={90} w1={6} w2={2.5} bend={2} />
      <Limb x1={100} y1={102} x2={97} y2={72} w1={5} w2={2} />
      <Crown {...CROWN} />
      {/* The crown's shadow falling on the trunk below it. */}
      <ellipse cx="100" cy="117" rx="9" ry="3" fill="var(--tree-trunk-shade)" opacity="0.55" />
      {children}
    </g>
  );
}

const BLOSSOMS: [number, number, number, number][] = [
  [72, 74, 4.2, 10], [88, 56, 4, 30], [104, 44, 3.8, 0], [120, 58, 4.2, 20], [134, 78, 4, 40], [62, 92, 3.6, 15], [80, 90, 4, 50],
  [96, 70, 4.4, 5], [114, 76, 4, 25], [128, 96, 3.6, 35], [92, 98, 3.4, 12], [108, 96, 3.8, 44], [100, 56, 3.2, 18], [76, 62, 3.2, 8],
  [126, 66, 3.2, 28], [142, 92, 3, 0],
];

const APPLES: [number, number, number, number][] = [
  [74, 84, 6.4, -8], [93, 63, 6.2, 6], [115, 61, 6.4, -4], [131, 84, 6.6, 8], [101, 89, 6.8, 0], [84, 102, 6, -10], [119, 100, 6.2, 10],
  [64, 99, 5.4, -6], [139, 100, 5.4, 6],
];

/* ---------- Stages ---------- */

function Plant({ stage, ripe, species }: { stage: TreeStage; ripe: number; species: TreeSpecies }) {
  switch (stage) {
    case 1:
      return (
        <g>
          <path d="M79 161 C85 150.5 115 150.5 121 161 Z" fill="var(--tree-soil)" />
          <path d="M84 156 C90 151.5 110 151.5 116 156" fill="none" stroke="var(--tree-soil-light)" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
          <g transform="rotate(-24 101 153.5)">
            <ellipse cx="101" cy="153.5" rx="5.8" ry="4" fill="var(--tree-seed)" />
            <ellipse cx="99.4" cy="152.3" rx="2.4" ry="1.3" fill="var(--tree-seed-light)" opacity="0.8" />
          </g>
          <path d="M93 158.5 l-3 1.6 M108 157.5 l3.4 1.2 M100 159.5 l0.4 1.6" stroke="var(--tree-soil-dark)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="88" cy="159" r="0.9" fill="var(--tree-soil-dark)" />
          <circle cx="113" cy="159.5" r="0.8" fill="var(--tree-soil-dark)" />
        </g>
      );
    case 2:
      return (
        <g>
          <path d="M86 161 C90 155 110 155 114 161 Z" fill="var(--tree-soil)" />
          <path d="M100 159 C100.5 152 98.6 147 100.2 139.5" fill="none" stroke="var(--tree-stem)" strokeWidth="2.4" strokeLinecap="round" />
          <Leaf x={100.2} y={139.8} len={13} w={5.6} rot={-158} tone="leaf-light" />
          <Leaf x={100.2} y={139.8} len={14} w={6} rot={-24} tone="leaf-light" />
          <ellipse cx="94.5" cy="157.5" rx="2.6" ry="1.5" fill="var(--tree-seed)" transform="rotate(-30 94.5 157.5)" />
        </g>
      );
    case 3:
      return (
        <g>
          <path d="M100 160.5 C101.5 150 98 140 100 123" fill="none" stroke="var(--tree-stem)" strokeWidth="2.7" strokeLinecap="round" />
          <Leaf x={100.4} y={149} len={15} w={6} rot={-152} tone="leaf" />
          <Leaf x={100.6} y={146.5} len={16} w={6.4} rot={-28} tone="leaf" />
          <Leaf x={99.6} y={136.5} len={13} w={5.4} rot={-140} tone="leaf-light" />
          <Leaf x={99.8} y={133.5} len={13} w={5.4} rot={-38} tone="leaf-light" />
          <Leaf x={100} y={123.5} len={8} w={3.4} rot={-112} tone="leaf-light" />
          <Leaf x={100} y={123.5} len={8.5} w={3.6} rot={-68} tone="leaf-light" />
        </g>
      );
    case 4:
      return (
        <g>
          <Limb x1={100} y1={161} x2={100.5} y2={100} w1={4.6} w2={1.8} bend={1.2} fill="var(--tree-trunk)" />
          <Limb x1={100.2} y1={130} x2={85} y2={116} w1={1.8} w2={0.8} bend={-1} fill="var(--tree-trunk)" />
          <Limb x1={100.4} y1={120} x2={116} y2={106} w1={1.8} w2={0.8} bend={1} fill="var(--tree-trunk)" />
          <Leaf x={85} y={116} len={13} w={5.2} rot={-160} tone="leaf-dark" />
          <Leaf x={85} y={116} len={12} w={5} rot={-110} tone="leaf" />
          <Leaf x={92} y={123} len={11} w={4.6} rot={-200} tone="leaf" />
          <Leaf x={116} y={106} len={13} w={5.2} rot={-20} tone="leaf-dark" />
          <Leaf x={116} y={106} len={12} w={5} rot={-72} tone="leaf" />
          <Leaf x={109} y={113} len={11} w={4.6} rot={20} tone="leaf" />
          <Leaf x={100.4} y={140} len={12} w={4.8} rot={-150} tone="leaf" />
          <Leaf x={100.4} y={137} len={12} w={4.8} rot={-30} tone="leaf-light" />
          <Leaf x={100.5} y={101} len={11} w={4.4} rot={-125} tone="leaf-light" />
          <Leaf x={100.5} y={101} len={11} w={4.4} rot={-58} tone="leaf-light" />
          <Leaf x={100.5} y={101} len={9} w={3.6} rot={-90} tone="leaf-light" />
        </g>
      );
    case 5:
      return (
        <g>
          <Roots spread={7} w={3} />
          <Trunk top={104} w1={7.5} w2={4} />
          <Limb x1={99.5} y1={120} x2={87} y2={100} w1={3} w2={1.4} bend={-1} />
          <Limb x1={100.5} y1={114} x2={113} y2={96} w1={3} w2={1.4} bend={1} />
          <Crown
            dark={[[86, 98, 15], [114, 96, 15], [100, 84, 17]]}
            mid={[[90, 92, 13], [110, 90, 13], [100, 78, 13], [100, 96, 12]]}
            light={[[94, 82, 7], [106, 78, 6]]}
            sprinkle={[[84, 104, 200], [116, 102, 340], [100, 70, 280], [108, 92, 20]]}
            edge={[[72, 100, 175, 8], [76, 88, 215, 8], [88, 70, 250, 8], [104, 66, 280, 8], [118, 76, 315, 8], [127, 92, 350, 8], [124, 106, 30, 7], [78, 108, 150, 7]]}
          />
          <ellipse cx="100" cy="111" rx="5" ry="1.8" fill="var(--tree-trunk-shade)" opacity="0.5" />
        </g>
      );
    case 6:
      return <GrownTree />;
    case 7:
      return (
        <GrownTree>
          {BLOSSOMS.map(([x, y, r, rot], i) => (
            <g key={i} className="tree-pop" style={{ ["--i" as string]: i, transformOrigin: `${x}px ${y}px` }}>
              {species === "mango" || species === "lychee" ? <Panicle x={x} y={y} r={r * 0.9} rot={rot - 15} /> : <Blossom x={x} y={y} r={r} rot={rot} />}
            </g>
          ))}
        </GrownTree>
      );
    case 8:
      const Fruit = FRUIT[species];
      return (
        <GrownTree>
          {APPLES.map(([x, y, r, rot], i) => (
            <g key={i} className="tree-pop" style={{ ["--i" as string]: i, transformOrigin: `${x}px ${y - r * 0.6}px` }}>
              <Fruit x={x} y={y} r={species === "lychee" ? r * 0.95 : r} rot={rot} ripe={Math.min(1, ripe + (i % 3) * 0.08)} />
            </g>
          ))}
        </GrownTree>
      );
  }
}

/** Three days without water: a bare, grey trunk, broken twigs, its leaves fallen on dry ground. */
function DeadTree() {
  const bark = "var(--tree-dead-bark)";
  return (
    <g>
      <Limb x1={100} y1={158.5} x2={88} y2={162} w1={4.5} w2={1} bend={1.5} fill={bark} />
      <Limb x1={100} y1={158.5} x2={112} y2={162} w1={4.5} w2={1} bend={-1.5} fill={bark} />
      <Trunk top={92} w1={12} w2={5} dead />
      <Limb x1={99} y1={122} x2={78} y2={98} w1={5} w2={1.6} bend={-3} fill={bark} />
      <Limb x1={78} y1={98} x2={70} y2={90} w1={1.6} w2={0.6} fill={bark} />
      <Limb x1={82} y1={103} x2={79} y2={88} w1={1.4} w2={0.5} fill={bark} />
      <Limb x1={101} y1={113} x2={124} y2={92} w1={5} w2={1.6} bend={3} fill={bark} />
      <Limb x1={124} y1={92} x2={132} y2={82} w1={1.6} w2={0.6} fill={bark} />
      <Limb x1={119} y1={97} x2={128} y2={99} w1={1.2} w2={0.5} fill={bark} />
      <Limb x1={100} y1={96} x2={96} y2={72} w1={4} w2={1.4} bend={-1} fill={bark} />
      <Limb x1={96} y1={72} x2={90} y2={64} w1={1.4} w2={0.5} fill={bark} />
      <Limb x1={97} y1={76} x2={104} y2={66} w1={1.2} w2={0.5} fill={bark} />
      {/* Fallen leaves. */}
      <Leaf x={76} y={164} len={8} w={3.2} rot={-10} tone="dead-leaf" lit={false} />
      <Leaf x={118} y={165} len={7} w={3} rot={200} tone="dead-leaf" lit={false} />
      <Leaf x={130} y={163} len={6.5} w={2.8} rot={160} tone="dead-leaf" lit={false} />
      <Leaf x={86} y={166} len={6} w={2.6} rot={30} tone="dead-leaf" lit={false} />
      {/* Cracked soil. */}
      <path d="M86 162.5 l4 1.5 l3 -1 M106 163 l3 1.4 l4 -0.6 M96 164.5 l2 1.6" fill="none" stroke="var(--tree-soil-dark)" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  );
}

/* ---------- The scene ---------- */

/** How wide the plant's contact shadow and soil patch are at each stage. */
const FOOT: Record<TreeStage | "dead", number> = { 1: 20, 2: 16, 3: 14, 4: 15, 5: 20, 6: 34, 7: 34, 8: 34, dead: 26 };

function Tuft({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d={`M${x - 3 * s} ${y} q${1 * s} ${-4 * s} ${0.4 * s} ${-6 * s} M${x} ${y} q${0.2 * s} ${-5 * s} ${1.4 * s} ${-7.5 * s} M${x + 3 * s} ${y} q${-0.4 * s} ${-3.5 * s} ${1.6 * s} ${-5 * s}`}
      fill="none"
      stroke="var(--tree-grass)"
      strokeWidth={1.3 * s}
      strokeLinecap="round"
    />
  );
}

/* ---------- Moments (only drawn while one plays) ---------- */

/**
 * - `water`: a watering can tips in, drops fall on the soil, the soil darkens, the plant perks up.
 * - `grow`: a new stage arrives: sparkles, and blossoms or apples pop in one by one.
 * - `rain`: a cloud drifts over and rains on it (a saved rainy day).
 * - `wilt`: a missed day: leaves fall as it steps back a stage.
 * - `plant`: a new seed: the soil puffs up.
 */
export type TreeAction = "none" | "water" | "grow" | "rain" | "wilt" | "plant";

/** A small four-point star. */
function Sparkle({ x, y, r, i }: { x: number; y: number; r: number; i: number }) {
  return (
    <path
      className="tree-sparkle"
      style={{ ["--i" as string]: i, transformOrigin: `${x}px ${y}px` }}
      d={`M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`}
      fill="var(--tree-sparkle)"
    />
  );
}

function Moments({ action, stage }: { action: TreeAction; stage: TreeStage | "dead" }) {
  const big = stage === "dead" || stage >= 5;
  const crownY = big ? 70 : 128;
  if (action === "water") {
    return (
      <g>
        <g className="tree-can" style={{ transformOrigin: "150px 84px" }}>
          <path d="M138 78 h22 a4 4 0 0 1 4 4 v14 a6 6 0 0 1 -6 6 h-18 a6 6 0 0 1 -6 -6 v-14 a4 4 0 0 1 4 -4 z" fill="var(--tree-can)" />
          <path d="M134 86 L116 76 L114.5 79 L132.5 92 Z" fill="var(--tree-can)" />
          <ellipse cx="115" cy="77.5" rx="2.6" ry="3.6" transform="rotate(-30 115 77.5)" fill="var(--tree-can-shade)" />
          <path d="M160 82 q10 2 8 12 q-1 5 -6 6" fill="none" stroke="var(--tree-can-shade)" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M140 82 h10" stroke="var(--tree-can-light)" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            className="tree-drop"
            style={{ ["--i" as string]: i }}
            d={`M${112 + (i % 3) * 2.5} ${96 + (i % 2) * 4} q2 3.2 0 4.4 q-2 -1.2 0 -4.4 z`}
            fill="var(--tree-water)"
          />
        ))}
        <ellipse className="tree-wet" cx="100" cy="160.4" rx="12" ry="2.4" fill="var(--tree-soil-dark)" opacity="0" />
      </g>
    );
  }
  if (action === "grow") {
    const pts: [number, number, number][] = big
      ? [[56, 64, 5], [146, 58, 4.5], [72, 34, 3.5], [134, 32, 4], [100, 22, 4.5], [154, 100, 3.5], [48, 104, 3.5]]
      : [[84, crownY - 4, 3.5], [118, crownY - 8, 3.2], [100, crownY - 22, 4], [80, crownY + 14, 2.8], [122, crownY + 10, 3]];
    return <g>{pts.map(([x, y, r], i) => <Sparkle key={i} x={x} y={y} r={r} i={i} />)}</g>;
  }
  if (action === "rain") {
    return (
      <g className="tree-raincloud">
        <path d="M72 30 a10 10 0 0 1 17 -6 a13 13 0 0 1 24 4 a9 9 0 0 1 3 17 h-42 a8 8 0 0 1 -2 -15 z" fill="var(--tree-rain-cloud)" />
        <path d="M78 34 a9 9 0 0 1 14 -4" fill="none" stroke="var(--tree-cloud)" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <path key={i} className="tree-rain" style={{ ["--i" as string]: i }} d={`M${78 + i * 5.5} ${48 + (i % 2) * 3} l-2 7`} stroke="var(--tree-water)" strokeWidth="1.6" strokeLinecap="round" />
        ))}
      </g>
    );
  }
  if (action === "wilt") {
    const leaves: [number, number, number][] = big ? [[70, 80, 20], [124, 74, 160], [100, 60, 80], [84, 96, 120], [118, 94, 40], [140, 86, 200]] : [[90, crownY, 20], [112, crownY - 6, 160], [100, crownY - 14, 80]];
    return (
      <g>
        {leaves.map(([x, y, rot], i) => (
          <g key={i} className="tree-fall" style={{ ["--i" as string]: i, transformOrigin: `${x}px ${y}px` }}>
            <Leaf x={x} y={y} len={7} w={3} rot={rot} tone={i % 2 ? "dead-leaf" : "leaf-light"} lit={false} />
          </g>
        ))}
      </g>
    );
  }
  if (action === "plant") {
    return (
      <g>
        {[[-1, 0], [1, 0], [-0.6, 1], [0.6, 1], [0, 1.4]].map(([dx, k], i) => (
          <circle key={i} className="tree-dirt" style={{ ["--i" as string]: i, ["--dx" as string]: `${dx * 16}px`, ["--dy" as string]: `${-10 - k * 6}px` }} cx="100" cy="156" r={1.6 + (i % 2) * 0.6} fill="var(--tree-soil)" />
        ))}
      </g>
    );
  }
  return null;
}

/* ---------- The scene ---------- */

/** Stars in the landscape's sky (x, y, r); the disc squeezes them in. */
const STARS: [number, number, number][] = [
  [-44, 18, 0.9], [-20, 44, 0.7], [4, 12, 1.1], [26, 58, 0.6], [48, 26, 0.8], [70, 8, 0.7], [92, 40, 0.6], [118, 16, 1],
  [140, 50, 0.7], [162, 24, 0.9], [186, 8, 0.6], [206, 40, 1], [228, 20, 0.7], [248, 56, 0.8],
];

/** Fireflies drifting around the crown at night. */
const FIREFLIES: [number, number][] = [[62, 112], [80, 70], [126, 64], [140, 108], [96, 128], [118, 138], [70, 140]];

/** Where the world sits: a round disc (art review, badges) or a wide landscape that fills a card's top. */
export type TreeFrame = "disc" | "landscape";

/**
 * The tree in its little world: sky with the sun and two clouds, rolling hills with grass, the soil
 * it's planted in, and the plant. `growth` (0–1) is the day's progress through its stage, so the
 * plant fills out a little each day instead of jumping; `ripe` colours the apples (stage 8).
 * `action` plays one moment (CSS in globals.css, "Streak tree", keyed off data attributes).
 */
export function TreeScene({
  stage,
  mood = "fresh",
  growth = 1,
  ripe = 1,
  action = "none",
  frame = "disc",
  species = "apple",
  minutes,
  fireflies = false,
  className,
}: {
  stage: TreeStage;
  species?: TreeSpecies;
  /** Minutes after midnight (Bangladesh): the sky follows the day. Omitted, it's always day (the discs). */
  minutes?: number;
  /** At night, fireflies around a tree that was watered today. */
  fireflies?: boolean;
  mood?: TreeMood;
  growth?: number;
  ripe?: number;
  action?: TreeAction;
  frame?: TreeFrame;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const dead = mood === "dead";
  const foot = FOOT[dead ? "dead" : stage];
  const scale = r2(0.9 + 0.1 * Math.max(0, Math.min(1, growth)));
  const wide = frame === "landscape";
  // The landscape is the disc's world widened: same plant, centred, with more hill either side.
  const box = wide ? "-60 0 320 196" : "0 0 200 200";
  const span = wide ? { x: -60, w: 320 } : { x: 0, w: 200 };

  // The time of day: sky colours, where the sun or moon is, and how dim and cool the land gets.
  const sky = minutes === undefined ? null : skyAt(minutes);
  const dusk = sky ? 1 - sky.light : 0;
  const skyVars = sky
    ? {
        ["--tree-sky-top" as string]: dead ? drain(sky.top, 0.6) : sky.top,
        ["--tree-sky-bottom" as string]: dead ? drain(sky.bottom, 0.6) : sky.bottom,
        ["--tree-cloud" as string]: sky.cloud,
        ["--tree-sun" as string]: sky.sun,
      }
    : undefined;
  // Where the night halo sits: around the crown, which climbs and widens as the tree grows.
  const halo = dead || stage >= 6 ? { cy: 80, r: 70 } : stage === 5 ? { cy: 96, r: 46 } : { cy: 132, r: 30 };
  const orb = sky && { x: r2(wide ? -45 + sky.arc * 290 : 14 + sky.arc * 172), y: r2((wide ? 124 : 122) - sky.height * (wide ? 100 : 90)) };

  const world = (
    <>
      <rect x={span.x} y="-10" width={span.w} height="220" fill={`url(#${id}-sky)`} />
      {sky && orb ? (
        <>
          {dusk > 0.02 && (
            <g opacity={r2(dusk)}>
              {STARS.map(([x, y, r], i) => (
                <circle key={i} className="tree-star" style={{ ["--i" as string]: i }} cx={wide ? x : (x + 60) * 0.62} cy={y} r={r} fill="var(--tree-star)" />
              ))}
            </g>
          )}
          {sky.body === "sun" ? (
            <g>
              <circle cx={orb.x} cy={orb.y} r={r2(28 + (1 - sky.height) * 10)} fill={`url(#${id}-sun)`} opacity="0.75" />
              <circle cx={orb.x} cy={orb.y} r="11" fill="var(--tree-sun)" />
            </g>
          ) : (
            <g>
              <circle cx={orb.x} cy={orb.y} r="24" fill={`url(#${id}-moon)`} />
              <circle cx={orb.x} cy={orb.y} r="9" fill="var(--tree-moon)" />
              <circle cx={orb.x + 2.5} cy={orb.y - 2} r="1.8" fill="var(--tree-moon-shade)" opacity="0.5" />
              <circle cx={orb.x - 3} cy={orb.y + 2.5} r="1.2" fill="var(--tree-moon-shade)" opacity="0.45" />
            </g>
          )}
        </>
      ) : (
        <>
          <circle cx={wide ? -6 : 46} cy={wide ? 40 : 50} r="28" fill={`url(#${id}-sun)`} opacity="0.75" />
          <circle cx={wide ? -6 : 46} cy={wide ? 40 : 50} r="11" fill="var(--tree-sun)" />
        </>
      )}
      <g className="tree-clouds" fill="var(--tree-cloud)" opacity={dead ? 0.6 : 0.9}>
        <path d={wide ? "M180 34 a7 7 0 0 1 12 -5 a9 9 0 0 1 17 3 a6 6 0 0 1 2 11.5 h-29 a5.5 5.5 0 0 1 -2 -9.5 z" : "M126 38 a7 7 0 0 1 12 -5 a9 9 0 0 1 17 3 a6 6 0 0 1 2 11.5 h-29 a5.5 5.5 0 0 1 -2 -9.5 z"} />
        <path d={wide ? "M-40 92 a5 5 0 0 1 8.5 -3.5 a6.5 6.5 0 0 1 12 2.2 a4.5 4.5 0 0 1 1.5 8.3 h-20.5 a4 4 0 0 1 -1.5 -7 z" : "M22 96 a5 5 0 0 1 8.5 -3.5 a6.5 6.5 0 0 1 12 2.2 a4.5 4.5 0 0 1 1.5 8.3 h-20.5 a4 4 0 0 1 -1.5 -7 z"} opacity="0.8" />
      </g>
      {/* The land: dimmed and cooled by the night (an SVG colour matrix), so the tree stays itself, just in moonlight. */}
      <g filter={dusk > 0.01 ? `url(#${id}-night)` : undefined}>
      <path d={wide ? "M-70 146 Q-10 118 60 136 T200 126 T280 132 V230 H-70 Z" : "M-10 148 Q40 122 96 138 T210 128 V210 H-10 Z"} fill="var(--tree-hill-back)" />
      <path d={wide ? "M-70 168 Q100 128 270 168 V230 H-70 Z" : "M-10 166 Q100 134 210 166 V210 H-10 Z"} fill="var(--tree-hill)" />
      <path d={wide ? "M-70 184 Q100 158 270 184 V230 H-70 Z" : "M-10 182 Q100 160 210 182 V210 H-10 Z"} fill="var(--tree-hill-shade)" opacity="0.55" />
      <Tuft x={34} y={168} />
      <Tuft x={58} y={160} s={0.8} />
      <Tuft x={146} y={159} s={0.85} />
      <Tuft x={170} y={168} />
      {wide && <Tuft x={-30} y={170} s={0.9} />}
      {wide && <Tuft x={226} y={164} s={0.9} />}
      {!dead && (
        <g fill="var(--tree-flower)">
          <circle cx="46" cy="172" r="1.6" />
          <circle cx="158" cy="172" r="1.5" />
          <circle cx="136" cy="168" r="1.2" />
          {wide && <circle cx="-14" cy="166" r="1.4" />}
          {wide && <circle cx="214" cy="170" r="1.4" />}
        </g>
      )}

      {/* Where it's planted: the soft shadow, then the soil patch. */}
      <ellipse cx="100" cy="162" rx={foot} ry={foot * 0.16 + 1.5} fill="var(--tree-shadow)" filter={`url(#${id}-soft)`} />
      <ellipse cx="100" cy="161" rx={foot * 0.7} ry={foot * 0.1 + 1.6} fill="var(--tree-soil-dark)" />
      <ellipse cx="100" cy="160.4" rx={foot * 0.6} ry={foot * 0.07 + 1} fill="var(--tree-soil)" />

      </g>

      {/* At night the tree is lit apart from the land: a moonlit halo behind its crown, a lighter
          night tint than the hills, and a soft rim of light around its outline. */}
      {dusk > 0.01 && <ellipse cx="100" cy={halo.cy} rx={halo.r} ry={halo.r * 0.9} fill={`url(#${id}-halo)`} opacity={r2(dusk)} />}
      {/* One CSS filter (it would override an SVG filter attribute): the lighter night tint, then the rim of moonlight. */}
      <g style={dusk > 0.01 ? { filter: `url(#${id}-night-tree)${dusk > 0.2 ? ` drop-shadow(0 0 ${r2(2 + dusk * 3)}px var(--tree-moonlit))` : ""}` } : undefined}>
        <g className="tree-plant" style={{ ["--s" as string]: scale }}>
          <SceneId value={id}>{dead ? <DeadTree /> : <Plant stage={stage} ripe={ripe} species={species} />}</SceneId>
        </g>
        <Moments action={action} stage={dead ? "dead" : stage} />
      </g>
      {fireflies && !dead && dusk > 0.6 && (
        <g>
          {FIREFLIES.map(([x, y], i) => (
            <circle key={i} className="tree-firefly" style={{ ["--i" as string]: i }} cx={x} cy={y} r="1.6" fill="var(--tree-firefly)" />
          ))}
        </g>
      )}
    </>
  );

  return (
    <div aria-hidden data-mood={mood} data-action={action} data-frame={frame} data-species={species} className={cn("tree-scene", className)} style={skyVars}>
      <svg viewBox={box} preserveAspectRatio={wide ? "xMidYMax slice" : undefined} className="h-full w-full">
        <defs>
          <clipPath id={`${id}-disc`}>
            <circle cx="100" cy="100" r="96" />
          </clipPath>
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
            <feColorMatrix type="matrix" values={nightMatrix(dusk)} />
          </filter>
          <filter id={`${id}-night-tree`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={nightMatrix(dusk * 0.5)} />
          </filter>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" style={{ stopColor: "var(--tree-moonlit)" }} stopOpacity="0.42" />
            <stop offset="0.6" style={{ stopColor: "var(--tree-moonlit)" }} stopOpacity="0.14" />
            <stop offset="1" style={{ stopColor: "var(--tree-moonlit)" }} stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {wide ? (
          world
        ) : (
          <>
            <g clipPath={`url(#${id}-disc)`}>{world}</g>
            <circle cx="100" cy="100" r="95" fill="none" stroke="var(--tree-cloud)" strokeOpacity="0.6" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  );
}

type StackScene = { stage: TreeStage; mood?: TreeMood; action?: TreeAction; growth?: number; ripe?: number; species?: TreeSpecies };

/**
 * The landscape scene, cross-faded when `sceneKey` changes: the new one fades in over the old (which
 * then goes), so a stage change, a wilt or a replant reads as a transformation, not a cut. The tree
 * is held per key; the sky's time and the fireflies apply live. Used by the streak card.
 */
export function TreeSceneStack({
  sceneKey,
  minutes,
  fireflies,
  className,
  ...scene
}: StackScene & {
  sceneKey: string;
  minutes?: number;
  fireflies?: boolean;
  className?: string;
}) {
  const [layers, setLayers] = useState({ key: sceneKey, cur: scene, prev: null as null | StackScene, prevKey: "" });
  if (layers.key !== sceneKey) setLayers({ key: sceneKey, cur: scene, prev: layers.cur, prevKey: layers.key });
  return (
    <div className={className}>
      {layers.prev && <TreeScene key={`p-${layers.prevKey}`} frame="landscape" {...layers.prev} action="none" minutes={minutes} className="absolute inset-0 size-full" />}
      <TreeScene
        key={`c-${layers.key}`}
        frame="landscape"
        {...layers.cur}
        minutes={minutes}
        fireflies={fireflies}
        className={cn("absolute inset-0 size-full", layers.prev && "motion-safe:animate-[fade-in_600ms_ease-out_both]")}
      />
    </div>
  );
}

/**
 * Just the planted tree (soil, shadow and plant, no sky), for placing several in one landscape: the
 * orchard. Drawn in the scene's coordinates (base at 100,161) and moved by `transform`. It carries
 * its own species and mood, so each tree in a row can differ, and it sways like the scene's tree.
 */
export function TreeFigure({ stage, species, growth = 1, ripe = 1, transform, delay = 0, children }: { stage: TreeStage; species: TreeSpecies; growth?: number; ripe?: number; transform: string; delay?: number; children?: ReactNode }) {
  const id = useId().replace(/:/g, "");
  const foot = FOOT[stage];
  const scale = r2(0.9 + 0.1 * Math.max(0, Math.min(1, growth)));
  return (
    <g className="tree-scene" data-mood="fresh" data-species={species} transform={transform}>
      {children}
      <ellipse cx="100" cy="162" rx={foot} ry={foot * 0.16 + 1.5} fill="var(--tree-shadow)" opacity="0.8" />
      <ellipse cx="100" cy="161" rx={foot * 0.7} ry={foot * 0.1 + 1.6} fill="var(--tree-soil-dark)" />
      <ellipse cx="100" cy="160.4" rx={foot * 0.6} ry={foot * 0.07 + 1} fill="var(--tree-soil)" />
      <g className="tree-plant" style={{ ["--s" as string]: scale, animationDelay: `${-delay}s` }}>
        <SceneId value={id}>
          <Plant stage={stage} ripe={ripe} species={species} />
        </SceneId>
      </g>
    </g>
  );
}
