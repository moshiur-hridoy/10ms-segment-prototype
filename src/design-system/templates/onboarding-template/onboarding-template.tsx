import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Onboarding's layout, like the login's (LoginTemplate): the conversation on the left and, from
 * `lg`, the student card on a soft TenTen panel on the right. On phones the card sits above the
 * question, small, so the answers stay near the thumb at the bottom (OB8). `done` lets the card
 * take the middle of the phone screen for the reveal.
 */
export function OnboardingTemplate({ header, card, children, done }: { header: ReactNode; card: ReactNode; children: ReactNode; done?: boolean }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 bg-bg lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="relative isolate flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(70% 45% at 0% 0%, color-mix(in srgb, var(--color-brand) 12%, transparent), transparent 70%)" }}
        />
        {header}
        <div className={cn("mx-auto mt-5 w-full max-w-xs transition-[max-width] duration-500 lg:hidden", done && "max-w-sm")}>{card}</div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-6 lg:justify-center lg:pt-0">{children}</div>
      </div>
      <div className="hidden p-4 pl-0 lg:block">
        <div className="grid h-full place-items-center rounded-xl px-10" style={{ background: "var(--grad-tenten)" }}>
          <div className="w-full max-w-md -rotate-2">{card}</div>
        </div>
      </div>
    </main>
  );
}
