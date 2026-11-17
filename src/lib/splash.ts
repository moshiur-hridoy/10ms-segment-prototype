/**
 * The phone splash (components/layout/splash.tsx): this runs it, from a script in <head>, so it
 * never waits for React to load (on a slow network the page is readable long before it hydrates).
 *
 * Before first paint: on a wide screen, or once the splash has been seen this session, it marks
 * <html data-no-splash> and CSS hides it. Only a phone-width load counts as seen. `?splash=1`
 * always shows it, and holds it at least 2s (for review).
 *
 * Then it waits for the HTML to be parsed and for no skeleton (SkeletonGroup, aria-busy) to be left
 * in view, and leaves: if the logo had shown (it fades in at 300ms), it flies into the header's
 * logo while the white fades off; else, or with reduced motion or no header, it just goes. It gives
 * up 10s after the page was opened. Done, it marks <html data-splash-done>.
 *
 * Written as a function so it can be read and type-checked, and sent as its source: it must stay
 * self-contained (no imports, no outside names).
 */
function runSplash(key: string, giveUpMs: number, previewMs: number, flyMs: number) {
  const root = document.documentElement;
  const preview = /[?&]splash=1(&|$)/.test(location.search);
  try {
    if (!preview && (matchMedia("(min-width: 64rem)").matches || sessionStorage.getItem(key))) {
      root.setAttribute("data-no-splash", "");
      return;
    }
    if (!preview) sessionStorage.setItem(key, "1");
  } catch {
    root.setAttribute("data-no-splash", "");
    return;
  }

  let done = false;
  let observer: MutationObserver | undefined;
  const end = () => {
    root.removeAttribute("data-splash-flying");
    root.setAttribute("data-splash-done", "");
  };

  const loadingInView = (splash: Element) =>
    Array.from(document.querySelectorAll('[aria-busy="true"]')).some((el) => {
      if (splash.contains(el)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    });

  const leave = () => {
    const splash = document.querySelector<HTMLElement>(".splash");
    const logo = splash?.querySelector<SVGSVGElement>(".splash-logo");
    if (!splash || !logo || Number(getComputedStyle(logo).opacity) < 0.5) return end();
    splash.classList.add("splash-leaving");
    const target = document.querySelector<SVGSVGElement>("[data-site-logo]");
    const to = target?.getBoundingClientRect();
    if (!to || to.width === 0 || to.bottom <= 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-out", fill: "forwards" }).finished.then(end, end);
      return;
    }
    const from = logo.getBoundingClientRect();
    root.setAttribute("data-splash-flying", "");
    const timing = { duration: flyMs, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "forwards" } as const;
    splash.animate([{ backgroundColor: getComputedStyle(splash).backgroundColor }, { backgroundColor: "transparent" }], timing);
    logo
      .animate([{ transform: "none" }, { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})` }], timing)
      .finished.then(end, end);
  };

  const finish = () => {
    if (done) return;
    done = true;
    observer?.disconnect();
    window.clearTimeout(giveUp);
    window.setTimeout(leave, preview ? Math.max(0, previewMs - performance.now()) : 0);
  };
  const giveUp = window.setTimeout(finish, giveUpMs);

  const watch = () => {
    const splash = document.querySelector(".splash");
    if (!splash) return end();
    const check = () => {
      if (!loadingInView(splash)) finish();
    };
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-busy"] });
    check();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch, { once: true });
  else watch();
}

export const SPLASH_KEY = "splash-seen";

export const splashScript = `(${runSplash.toString()})(${JSON.stringify(SPLASH_KEY)},10000,2000,480)`;
