/*
 * The streak tree's sky through a day (Bangladesh time). The sun rises at 6:00 and sets at 18:00,
 * crossing an arc left to right; the moon takes the same arc by night. Colours blend between a few
 * keyframes (night, dawn, day, golden hour, sunset, dusk), so the world never jumps. Pure, so it is
 * tested directly and gives the same answer on the server and in the browser.
 */

export const SUNRISE = 6 * 60;
export const SUNSET = 18 * 60;
const DAY = 24 * 60;

type Stop = { at: number; top: string; bottom: string; cloud: string };

/** Sky colours at moments of the day (minutes after midnight). */
const STOPS: Stop[] = [
  { at: 0, top: "#0e1b38", bottom: "#22345e", cloud: "#3a4a74" },
  { at: 300, top: "#13234a", bottom: "#2b3e6c", cloud: "#3f4f7a" },
  { at: 345, top: "#3a3e72", bottom: "#e3a07c", cloud: "#b99aa6" },
  { at: 390, top: "#f7d8b8", bottom: "#f5c39b", cloud: "#fff1e6" },
  { at: 450, top: "#fdf7e1", bottom: "#f6e3ae", cloud: "#ffffff" },
  { at: 960, top: "#fdf7e1", bottom: "#f6e3ae", cloud: "#ffffff" },
  { at: 1020, top: "#fbe4b2", bottom: "#f3b878", cloud: "#fff4e2" },
  { at: 1080, top: "#e8a481", bottom: "#b8647b", cloud: "#f1c3b0" },
  { at: 1125, top: "#393a6d", bottom: "#6a4f7a", cloud: "#6e6585" },
  { at: 1170, top: "#13234a", bottom: "#26386a", cloud: "#3f4f7a" },
  { at: DAY, top: "#0e1b38", bottom: "#22345e", cloud: "#3a4a74" },
];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (rgb: number[]) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (a: string, b: string, k: number) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * k));
/** Drain a colour toward grey (a dead tree's world). */
export const drain = (c: string, k: number) => {
  const [r, g, b] = hex(c);
  const grey = r * 0.3 + g * 0.59 + b * 0.11;
  return toHex([r, g, b].map((v) => v + (grey - v) * k));
};

export type SkyPhase = "night" | "dawn" | "day" | "golden" | "dusk";

export type Sky = {
  phase: SkyPhase;
  /** 1 in full day, 0 at night; dims and cools the land between. */
  light: number;
  /** Where along its arc the sun (by day) or moon (by night) is: 0 = rising at the left, 1 = setting at the right. */
  arc: number;
  /** How high it is, 0 at the horizon to 1 at its peak. */
  height: number;
  body: "sun" | "moon";
  top: string;
  bottom: string;
  cloud: string;
  /** The sun warms toward orange near the horizon. */
  sun: string;
};

export function skyAt(minutes: number): Sky {
  const m = ((minutes % DAY) + DAY) % DAY;
  const i = STOPS.findIndex((s) => s.at > m);
  const a = STOPS[i - 1];
  const b = STOPS[i];
  const k = (m - a.at) / (b.at - a.at);

  const isDay = m >= SUNRISE && m < SUNSET;
  const arc = isDay ? (m - SUNRISE) / (SUNSET - SUNRISE) : (((m - SUNSET + DAY) % DAY) / (DAY - (SUNSET - SUNRISE)));
  const height = Math.sin(Math.PI * arc);
  // Light rises over the hour around sunrise and falls over the hour around sunset.
  const light = Math.max(0, Math.min(1, m < 720 ? (m - (SUNRISE - 30)) / 75 : (SUNSET + 45 - m) / 75));

  const phase: SkyPhase =
    m < SUNRISE - 30 || m >= SUNSET + 75 ? "night" : m < SUNRISE + 45 ? "dawn" : m < SUNSET - 75 ? "day" : m < SUNSET ? "golden" : "dusk";

  return {
    phase,
    light,
    arc,
    height,
    body: isDay ? "sun" : "moon",
    top: mix(a.top, b.top, k),
    bottom: mix(a.bottom, b.bottom, k),
    cloud: mix(a.cloud, b.cloud, k),
    sun: mix("#ffa45c", "#ffdf86", Math.min(1, height * 1.6)),
  };
}

/** Minutes after midnight in Bangladesh for a timestamp. */
export function dhakaMinutes(ms: number) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(ms);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/**
 * An SVG colour matrix for the land at night: identity by day, a dim blue moonlight at full night
 * (each channel darkened and pulled a little toward blue). `k` is how far into the night (0–1).
 */
export function nightMatrix(k: number) {
  const night = [0.26, 0.04, 0.04, 0, 0, 0.04, 0.3, 0.06, 0, 0, 0.06, 0.1, 0.42, 0, 0.03, 0, 0, 0, 1, 0];
  const id = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  return id.map((v, i) => Math.round((v + (night[i] - v) * k) * 100) / 100).join(" ");
}
