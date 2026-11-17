import { Logo } from "@/design-system/atoms/logo";

/**
 * The first open of the site on a phone, like the native app's splash: white, with the 10MS logo
 * and the header's red ring running round its "0". It is first in <body>, so it covers the page
 * from the first paint; the logo only fades in after 300ms, so a quick load looks like any page
 * load, and after 4s a line says the network is slow. A script in <head> runs it (lib/splash.ts):
 * once a session, below `lg`, leaving as soon as what's on screen has loaded, by 10s at the latest.
 * When it's done, CSS hides it (<html data-splash-done>). `?splash=1` shows it again.
 */
export function Splash({ slowLabel }: { slowLabel: string }) {
  return (
    <div aria-hidden className="splash fixed inset-0 z-[200] grid place-items-center bg-surface text-text lg:hidden">
      {/* The note hangs below, so the logo stays in the middle. */}
      <div className="relative">
        <Logo className="splash-logo h-auto w-44 origin-top-left" />
        <p className="splash-note absolute top-full left-1/2 mt-6 -translate-x-1/2 text-sm whitespace-nowrap text-muted">{slowLabel}</p>
      </div>
    </div>
  );
}
