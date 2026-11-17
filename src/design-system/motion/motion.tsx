import { Suspense, ViewTransition, type ReactNode } from "react";

/**
 * Wraps a page's content (not its header) so it cross-fades between routes (".page" in globals.css).
 * `default="none"`: state changes inside the page never animate.
 */
export function PageMotion({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page" exit="page" default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * A shared-element morph (`share` names the CSS animation). Without a `name` it renders the children
 * as they are: used when a component is drawn several times on one page (style guide), since two
 * mounted transitions with the same name break the morph.
 */
export function Morph({ name, share, children }: { name?: string; share: string; children: ReactNode }) {
  if (!name) return children;
  return (
    <ViewTransition name={name} share={share} default="none">
      {children}
    </ViewTransition>
  );
}

/**
 * A Suspense boundary whose skeleton fades out and whose content fades in when it arrives. It runs
 * when the content first mounts, so later re-renders and state changes stay still.
 */
export function Reveal({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="reveal-out" default="none">
          {fallback}
        </ViewTransition>
      }
    >
      <ViewTransition enter="reveal" default="none">
        {children}
      </ViewTransition>
    </Suspense>
  );
}
