import Image from "next/image";
import { Card } from "@/design-system/atoms/card";
import { Logo } from "@/design-system/atoms/logo";
import { cn } from "@/lib/cn";

export type CardTone = "junior" | "ssc" | "hsc" | "adm" | "eng";

/** One colour per class family, from the app's tokens (the landing's tones live in its own stylesheet). */
export const CARD_TONES: Record<CardTone, string> = {
  junior: "var(--color-success)",
  ssc: "var(--color-info)",
  hsc: "var(--color-brand)",
  adm: "var(--color-superprep-violet)",
  eng: "var(--color-warning)",
};

export type StudentCardLabels = {
  label: string;
  student: string;
  name: string;
  class: string;
  focus: string;
  stamp: string;
  flip: string;
  member: string;
  sign: string;
};

/**
 * The student's 10MS card, filled in as they answer (OB1, OB7): each answer lands on it like a
 * stamp, the side stripe takes the class's colour, and an empty field shows a soft bar, so the card
 * reads as something being built. While the name is typed, a cursor blinks after it on the card.
 * At the end the student stamps it themselves (OB10): the "ready" stamp lands, the card turns over to
 * its back (TenTen's signature, a code made from the answers, how long it's valid) and can be turned
 * again by pressing it. The front carries `data-card-front`, which the saved picture is drawn from.
 */
export function StudentCard({
  name,
  avatar,
  tone,
  classLine,
  badge,
  focus,
  stamped,
  writing,
  side = "front",
  onFlip,
  valid,
  labels,
  className,
}: {
  name: string;
  avatar: string | null;
  tone: CardTone | null;
  /** e.g. "একাদশ শ্রেণি · HSC ২৮". */
  classLine: string | null;
  /** The group or the admission unit. */
  badge: string | null;
  /** The subjects the student finds hard. */
  focus: string[];
  stamped: boolean;
  /** The name is being typed: a cursor blinks where it goes. */
  writing?: boolean;
  side?: "front" | "back";
  /** Turns the card over; the whole card becomes the button. */
  onFlip?: () => void;
  /** The back's "valid until" line, e.g. "মেয়াদ: HSC ২৮ পর্যন্ত"; none for a class without a board exam. */
  valid?: string | null;
  labels: StudentCardLabels;
  className?: string;
}) {
  const colour = tone ? CARD_TONES[tone] : "var(--color-border-strong)";
  const empty = !name && !classLine;
  const initial = name.trim().charAt(0);
  // The design system's card, as the two faces of one turning card.
  const face = "absolute inset-0 overflow-hidden [backface-visibility:hidden]";

  return (
    <figure aria-label={labels.label} className={cn("relative aspect-[1.586] w-full [perspective:1200px]", className)}>
      <div
        className={cn(
          "relative size-full transition-[transform,opacity] duration-700 ease-out [transform-style:preserve-3d]",
          empty && "opacity-70",
          stamped && "motion-safe:animate-card-press",
        )}
        style={{ transform: side === "back" ? "rotateY(180deg)" : undefined }}
      >
        <Card as="div" elevation="pop" data-card-front className={face} aria-hidden={side === "back" || undefined}>
          <Glow colour={colour} />
          <span aria-hidden className="absolute inset-y-0 left-0 w-2 transition-colors duration-500" style={{ background: colour }} />

          <div className="relative flex h-full flex-col px-5 py-4 pl-7 sm:px-6 sm:pl-8">
            <div className="flex items-center justify-between">
              <Logo className="h-5 w-auto text-text sm:h-6" />
              <span className="text-xs font-bold tracking-[0.2em] transition-colors duration-500" style={{ color: colour }}>
                {labels.student}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-4 sm:mt-6">
              <span
                className={cn(
                  "grid size-14 shrink-0 place-items-center rounded-full text-3xl sm:size-18 sm:text-4xl",
                  avatar || initial ? "bg-raised" : "border-2 border-dashed border-border-strong",
                )}
              >
                {avatar ? (
                  <span key={avatar} className="motion-safe:animate-stamp">
                    {avatar}
                  </span>
                ) : (
                  initial && <span className="type-headline text-muted">{initial}</span>
                )}
              </span>
              <div className="grid min-w-0 gap-1.5">
                {name || writing ? (
                  <span className="flex min-w-0 items-center type-title text-text sm:type-headline">
                    <span className="truncate">{name}</span>
                    {writing && <span aria-hidden className="ml-0.5 h-[1.1em] w-0.5 shrink-0 rounded-full bg-brand motion-safe:animate-caret" />}
                  </span>
                ) : (
                  <Placeholder className="w-32" label={labels.name} />
                )}
                {classLine ? (
                  <span key={classLine} className="truncate text-sm font-semibold text-muted motion-safe:animate-stamp">
                    {classLine}
                  </span>
                ) : (
                  <Placeholder className="w-24" label={labels.class} />
                )}
                {badge && (
                  <span
                    key={badge}
                    className="w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold text-text motion-safe:animate-stamp"
                    style={{ background: `color-mix(in srgb, ${colour} 16%, transparent)` }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            </div>

            {focus.length > 0 && (
              <div className="mt-auto flex flex-wrap items-center gap-1.5 pr-16 text-xs">
                <span className="font-semibold text-subtle">{labels.focus}</span>
                {focus.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-border bg-surface px-2 py-0.5 font-semibold text-text motion-safe:animate-stamp"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

            {stamped && (
              <span
                aria-hidden
                className="absolute right-5 bottom-4 grid size-16 rotate-[-14deg] place-items-center rounded-full border-[3px] text-xs font-bold motion-safe:animate-thunk sm:size-18"
                style={{ borderColor: colour, color: colour }}
              >
                ✓ {labels.stamp}
              </span>
            )}
          </div>
        </Card>

        {/* The back exists once the card is stamped, so nothing shows through before the turn. */}
        {stamped && (
          // The turn sits on a wrapper: on the turned element itself Chrome drops the rounded corners.
          <div
            className="absolute inset-0 [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
            aria-hidden={side === "front" || undefined}
          >
            <Card as="div" elevation="pop" className="relative size-full overflow-hidden">
              <Glow colour={colour} />
              <span aria-hidden className="absolute inset-y-0 right-0 w-2" style={{ background: colour }} />
              {/* Like a real card's magnetic strip. */}
              <span aria-hidden className="absolute inset-x-0 top-4 h-9 bg-text sm:top-5 sm:h-10" />

              <div className="relative flex h-full flex-col justify-end gap-3 px-5 py-4 pr-7 sm:px-6 sm:pr-8">
                <div className="grid gap-0.5">
                  <span className="text-sm font-semibold text-text">{labels.member}</span>
                  {valid && <span className="text-xs text-muted">{valid}</span>}
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="grid gap-1">
                    <span className="flex items-center gap-2">
                      <Image src="/assets/tenten.svg" alt="" width={28} height={28} className="size-7" />
                      <span className="-rotate-6 font-display text-lg leading-none" style={{ color: colour }}>
                        TenTen
                      </span>
                    </span>
                    <span className="border-t border-border-strong pt-1 text-xs text-subtle">{labels.sign}</span>
                  </div>
                  <Barcode seed={`${name}|${classLine ?? ""}|${badge ?? ""}`} />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {onFlip && (
        <button
          type="button"
          onClick={onFlip}
          aria-label={labels.flip}
          aria-pressed={side === "back"}
          className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        />
      )}
    </figure>
  );
}

function Glow({ colour }: { colour: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 transition-[background] duration-500"
      style={{ background: `radial-gradient(80% 70% at 100% 0%, color-mix(in srgb, ${colour} 16%, transparent), transparent 70%)` }}
    />
  );
}

/** Bars made from the student's answers: the same answers always give the same code. Decoration, not a number. */
export function barcodeBars(seed: string, count = 34) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const w = 1 + ((h >>> 0) % 3);
    // Every other step is a gap.
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  }
  return { bars, width: x };
}

function Barcode({ seed }: { seed: string }) {
  const { bars, width } = barcodeBars(seed);
  return (
    <svg aria-hidden viewBox={`0 0 ${width} 32`} preserveAspectRatio="none" className="h-8 w-24 shrink-0 fill-text sm:h-9 sm:w-28">
      {bars.map((b) => (
        <rect key={b.x} x={b.x} width={b.w} height={32} />
      ))}
    </svg>
  );
}

function Placeholder({ className, label }: { className: string; label: string }) {
  return (
    <span className={cn("block h-3.5 rounded-full bg-border", className)}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
