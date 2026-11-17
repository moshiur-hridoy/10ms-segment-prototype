/**
 * Light / dark / auto. The choice lives in localStorage and is applied by an inline script in
 * <head> before first paint (no flash, and the layout stays static; see Next's "Preventing
 * flash before hydration" guide). Default is light until every page has had its dark-mode pass.
 */
export const themePrefs = ["light", "dark", "system"] as const;
export type ThemePref = (typeof themePrefs)[number];

export const THEME_KEY = "theme";
export const DEFAULT_THEME: ThemePref = "light";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/*
 * Warm tone, an experiment (design-audit LP6): light with sand neutrals instead of grey.
 * `?theme=warm` turns it on for the whole site and `?theme=gray` turns it off; the choice is kept
 * in localStorage. Dark stays dark.
 */
export const TONE_KEY = "tone";
const toneRead = `var q=new URLSearchParams(location.search).get("theme");if(q==="warm"||q==="gray")localStorage.setItem("${TONE_KEY}",q);var w=localStorage.getItem("${TONE_KEY}")==="warm";`;

/*
 * Lab `dark` (design-audit DS70–DS72): new dark palettes, one per lab version (modes.css, [data-dark="<v>"]).
 * `?lab=dark` opens the latest, `?lab=dark@1` an earlier one; `?dark=2` / `?dark=1` the same. Each also switches
 * to dark, and the choice is kept in localStorage so every page shows it. `?dark=main` goes back to the
 * current dark mode (ink). Bump DARK_LATEST with each new version.
 */
export const DARK_KEY = "dark";
const DARK_LATEST = 3;
const darkRead = `var dq=new URLSearchParams(location.search),dv=dq.get("dark"),dl=/^dark(?:@(\\d+))?$/.exec(dq.get("lab")||"");if(dl)dv=dl[1]||"${DARK_LATEST}";if(dv==="main")localStorage.removeItem("${DARK_KEY}");else if(/^\\d+$/.test(dv||"")){localStorage.setItem("${DARK_KEY}",dv);localStorage.setItem("${THEME_KEY}","dark")}var ds=localStorage.getItem("${DARK_KEY}");if(ds)document.documentElement.dataset.dark=ds;`;

/** Runs before paint. "system" follows the OS, live. Kept tiny and dependency-free. */
export const themeScript = `(function(){try{${darkRead}var d=document.documentElement,p=localStorage.getItem("${THEME_KEY}")||"${DEFAULT_THEME}",m=matchMedia("${DARK_QUERY}");${toneRead}function a(){d.dataset.mode=p==="dark"||(p==="system"&&m.matches)?"dark":w?"warm":"light"}a();if(p==="system")m.addEventListener("change",a);window.__themeApply=function(n){p=n;a();m[n==="system"?"addEventListener":"removeEventListener"]("change",a)}}catch(e){}})()`;

export function readThemePref(): ThemePref {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return (themePrefs as readonly string[]).includes(saved ?? "") ? (saved as ThemePref) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {}
  const apply = (window as Window & { __themeApply?: (p: ThemePref) => void }).__themeApply;
  if (apply) return apply(pref);
  // The head script hasn't run in this document (e.g. it was loaded before the script existed):
  // apply directly. "Auto" then follows the OS from the next page load.
  const dark = pref === "dark" || (pref === "system" && matchMedia(DARK_QUERY).matches);
  document.documentElement.dataset.mode = dark ? "dark" : readWarm() ? "warm" : "light";
}

function readWarm() {
  try {
    return localStorage.getItem(TONE_KEY) === "warm";
  } catch {
    return false;
  }
}

/** The landing pages' head script: the same tone switch, light only (they have no dark pass yet). */
export const toneScript = `(function(){try{${toneRead}if(w)document.documentElement.dataset.mode="warm"}catch(e){}})()`;
