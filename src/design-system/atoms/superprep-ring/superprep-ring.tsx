/** Point on a ring of radius `r` around `center`, at `pct` percent clockwise from 12 o'clock. */
const pointAt = (pct: number, center: number, r: number) => {
  const a = (pct / 100) * 2 * Math.PI;
  return { x: center + r * Math.sin(a), y: center - r * Math.cos(a) };
};

/**
 * The SuperPrep ring: the one place its gradient appears (dashboard card, hub, paper page).
 * The solid arc is what's done; when a target exists, a faint arc runs to it and a marker pins it.
 * The value sits in the middle, so the label always matches the arc.
 */
export function SuperPrepRing({
  done,
  target = 0,
  label,
  value,
  size = 112,
  stroke = 10,
  muted = false,
}: {
  done: number;
  target?: number;
  label: string;
  /** Formatted percentage shown in the middle. */
  value: string;
  size?: number;
  stroke?: number;
  /** Not started: grey number, no arc. */
  muted?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  const marker = target > 0 ? pointAt(target, center, r) : null;
  const arc = (pct: number) => `${(c * Math.min(100, Math.max(0, pct))) / 100} ${c}`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <defs>
          {/* Drawn inside the rotated group: local right (x=1) is 12 o'clock on screen. */}
          <linearGradient id="sp-ring" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-superprep-orange)" />
            <stop offset="55%" stopColor="var(--color-superprep-pink)" />
            <stop offset="100%" stopColor="var(--color-superprep-violet)" />
          </linearGradient>
        </defs>
        <g transform={`rotate(-90 ${center} ${center})`} fill="none" strokeWidth={stroke}>
          <circle cx={center} cy={center} r={r} stroke="var(--color-superprep-track)" />
          {target > 0 && <circle cx={center} cy={center} r={r} stroke="url(#sp-ring)" strokeOpacity={0.22} strokeLinecap="round" strokeDasharray={arc(target)} />}
          {done > 0 && (
            <circle
              cx={center}
              cy={center}
              r={r}
              stroke="url(#sp-ring)"
              strokeLinecap="round"
              strokeDasharray={arc(done)}
              style={{ animation: "ring-draw 1s ease-out both" }}
            />
          )}
        </g>
        {marker && (
          <g>
            <circle cx={marker.x} cy={marker.y} r={7} fill="var(--color-surface)" stroke="var(--color-superprep-violet)" strokeWidth={2.5} />
            <circle cx={marker.x} cy={marker.y} r={2.5} fill="var(--color-superprep-violet)" />
          </g>
        )}
      </svg>
      <span aria-hidden className={`absolute inset-0 grid place-items-center type-figure ${muted ? "text-subtle" : ""}`}>
        {value}
      </span>
    </div>
  );
}
