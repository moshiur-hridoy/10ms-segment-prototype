import { cn } from "@/lib/cn";

/**
 * A tick that draws itself in when it appears, like a pen stroke. Same shape as lucide's Check;
 * render it only while checked, so it draws on each tick. Decorative: the control carries the state.
 */
export function CheckMark({ className, strokeWidth = 3 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-4", className)}
    >
      <path
        d="M20 6 9 17l-5-5"
        pathLength={1}
        strokeDasharray={1}
        className="motion-safe:animate-[check-draw_var(--motion-base)_var(--ease-emphasis)_both]"
      />
    </svg>
  );
}
