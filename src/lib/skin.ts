/*
 * The UI skin: `new` (the live site's twin, the default) or `old` (the prototype's look before the alignment).
 * Only the look changes (tokens in modes.css); pages, content and behaviour are the same in both.
 * The choice lives in localStorage; `?ui=old` or `?ui=new` in a link sets it too, so a review link can open either.
 * The head script applies it before the first paint, so the page never flashes the other skin.
 */

export type Skin = "new" | "old";
const SKIN_KEY = "ui-skin";

export const skinScript = `(function(){try{var q=new URLSearchParams(location.search).get("ui");if(q==="old"||q==="new")localStorage.setItem("${SKIN_KEY}",q);if(localStorage.getItem("${SKIN_KEY}")==="old")document.documentElement.dataset.skin="old"}catch(e){}})()`;

export function readSkin(): Skin {
  return typeof document !== "undefined" && document.documentElement.dataset.skin === "old" ? "old" : "new";
}

export function setSkin(skin: Skin) {
  try {
    localStorage.setItem(SKIN_KEY, skin);
  } catch {}
  if (skin === "old") document.documentElement.dataset.skin = "old";
  else delete document.documentElement.dataset.skin;
}
