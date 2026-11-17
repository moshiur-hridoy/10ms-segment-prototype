import type { ReactNode } from "react";

/**
 * The login page's layout: the form on the left and the brand panel on the right from `lg`;
 * below that only the form (the panel is decoration, so phones skip it). Both fill the screen.
 * The form side carries a faint brand glow in its top corner.
 */
export function LoginTemplate({ form, aside }: { form: ReactNode; aside: ReactNode }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 bg-bg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative isolate flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14">
        {/* A faint brand glow in the corner, so the form side shares the panel's light. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(70% 45% at 0% 0%, color-mix(in srgb, var(--color-brand) 12%, transparent), transparent 70%)" }}
        />
        {form}
      </div>
      <div className="hidden p-4 pl-0 lg:block">{aside}</div>
    </main>
  );
}
