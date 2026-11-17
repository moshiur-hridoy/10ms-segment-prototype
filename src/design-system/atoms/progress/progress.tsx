import { cn } from "@/lib/cn";

const clamp = (v: number) => Math.min(100, Math.max(0, v));

const barTones = {
  brand: "bg-brand",
  info: "bg-info",
  subject: "bg-subject",
  superprep: "bg-superprep-pink", // solid: the SuperPrep gradient is reserved for its ring
} as const;

export function ProgressBar({
  value,
  label,
  tone = "brand",
  thin = false,
  color,
  className,
}: {
  value: number;
  label: string;
  tone?: keyof typeof barTones;
  thin?: boolean;
  /** A colour of its own (a subject's book colour), in place of the tone's fill. */
  color?: string;
  className?: string;
}) {
  const v = clamp(value);
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "w-full overflow-hidden rounded-full",
        thin ? "h-1.5" : "h-2",
        tone === "superprep" ? "bg-superprep-track" : "bg-raised ring-1 ring-border ring-inset",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", !color && barTones[tone])}
        style={{ width: `${v}%`, backgroundColor: color }}
      />
    </div>
  );
}

/** Circular progress. The arc length comes from `value`, so label and ring always agree. */
const ringTones = {
  brand: { arc: "stroke-brand", track: "stroke-border" },
  subject: { arc: "stroke-subject", track: "stroke-border" },
  /** On the course hero. */
  hero: { arc: "stroke-on-hero", track: "stroke-on-hero/25" },
  /** Small SuperPrep rings (subject switcher); the gradient stays on the main ring. */
  superprep: { arc: "stroke-superprep-pink", track: "stroke-superprep-track" },
} as const;

export function ProgressRing({
  value,
  size = 140,
  stroke = 14,
  tone = "brand",
  children,
  label,
  color,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: keyof typeof ringTones;
  /** A colour of its own for the arc (a subject's book colour). */
  color?: string;
  children?: React.ReactNode;
  label: string;
  className?: string;
}) {
  const v = clamp(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={ringTones[tone].track} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className={cn("transition-[stroke-dashoffset] duration-700 ease-out", !color && ringTones[tone].arc)}
          style={color ? { stroke: color } : undefined}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
