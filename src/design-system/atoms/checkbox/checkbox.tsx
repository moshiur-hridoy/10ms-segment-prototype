import { Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { CheckMark } from "@/design-system/atoms/check-mark";

/** The box itself, decorative: the native input next to it carries the state. The tick draws in. */
export function Checkbox({ checked, indeterminate, className }: { checked: boolean; indeterminate?: boolean; className?: string }) {
  const on = checked || indeterminate;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-xs border-[1.5px] transition-colors",
        on ? "border-primary bg-primary text-on-primary" : "border-border-strong bg-surface",
        className,
      )}
    >
      {indeterminate ? <Minus className="size-3.5" strokeWidth={3} /> : checked && <CheckMark className="size-3.5" />}
    </span>
  );
}
