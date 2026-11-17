/**
 * Tinted background + matching foreground, one per role. The single place these pairs are
 * written, so badges, icon tiles and status rows always agree (and every pair is AA in
 * both modes, see modes.css).
 */
export const softTones = {
  neutral: "bg-raised text-muted",
  brand: "bg-brand-soft text-brand-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  highlight: "bg-highlight-soft text-highlight",
  live: "bg-danger-soft text-live",
} as const;

export type Tone = keyof typeof softTones;
