import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { softTones, type Tone } from "@/design-system/foundations/tone";

const sizes = {
  sm: "size-8 [&_svg]:size-4",
  md: "size-10 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-6",
} as const;

/** A decorative icon on a tinted tile: square for items (exam, folder), round for actions. */
export function IconTile({
  icon: Icon,
  tone = "neutral",
  size = "md",
  shape = "square",
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: keyof typeof sizes;
  shape?: "square" | "circle";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center",
        shape === "circle" ? "rounded-full" : "rounded-md",
        sizes[size],
        softTones[tone],
        className,
      )}
    >
      <Icon />
    </span>
  );
}
