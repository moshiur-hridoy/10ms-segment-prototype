import type { ReactNode } from "react";
import { Checkbox } from "@/design-system/atoms/checkbox";
import { cn } from "@/lib/cn";

/**
 * A whole clickable row: a visually hidden native checkbox, the box, then the label content.
 * `row` = a list row with padding and a hover tint (add -mx-2 to line its text up with the column);
 * `inline` = just box + text, e.g. a "select all" in a header. Both show a focus ring for keyboard users.
 */
export function CheckboxRow({
  checked,
  indeterminate = false,
  onChange,
  disabled,
  variant = "row",
  align = "start",
  className,
  children,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  disabled?: boolean;
  variant?: "row" | "inline";
  /** start: box on the first line of a two-line label · center: single-line rows. */
  align?: "start" | "center";
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex rounded-md has-focus-visible:ring-3 has-focus-visible:ring-brand/30",
        align === "start" ? "items-start" : "items-center",
        variant === "row" ? "gap-3 p-2 transition-colors" : "gap-2",
        disabled ? "cursor-not-allowed" : cn("cursor-pointer", variant === "row" && "hover:bg-raised"),
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
      />
      <Checkbox checked={checked} indeterminate={indeterminate} className={cn(align === "start" && "mt-0.5", disabled && "opacity-40")} />
      {children}
    </label>
  );
}
