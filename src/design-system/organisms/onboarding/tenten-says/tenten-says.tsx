import Image from "next/image";

/**
 * TenTen asking, in a speech bubble (OB1). `reaction` is its word on the last answer, above the
 * question. The parent keys this by step, so each question rises in and TenTen wobbles once; a new
 * reaction within a step (a subject picked, OB11) rises in again and TenTen wobbles again.
 * The bubble is a polite live region, so a screen reader hears each new question.
 */
export function TenTenSays({ name, reaction, children }: { name: string; reaction?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-3">
      <span key={reaction} className="size-12 shrink-0 motion-safe:animate-wobble">
        {/* Its own shadow and rounded square are part of the SVG. */}
        <Image src="/assets/tenten.svg" alt={name} width={48} height={48} className="size-full" />
      </span>
      <div
        aria-live="polite"
        className="relative min-w-0 flex-1 rounded-lg rounded-bl-xs border border-border bg-surface px-4 py-3 shadow-card motion-safe:animate-rise"
      >
        {reaction && (
          <p key={reaction} className="mb-1 text-sm font-semibold text-brand-text motion-safe:animate-rise">
            {reaction}
          </p>
        )}
        <p className="type-subtitle text-text">{children}</p>
      </div>
    </div>
  );
}
