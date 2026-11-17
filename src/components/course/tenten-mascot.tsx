import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * TenTen's mascot. For now the static logo, nudged by its card (`group/ten`): it tilts
 * toward the prompt when that's focused and toward the chips when one is hovered.
 * Later this becomes the Rive mascot (states: idle · look · think · happy) behind the same props.
 */
export function TenTenMascot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "-m-1.5 size-[52px] shrink-0 motion-safe:transition-transform motion-safe:duration-300",
        "motion-safe:group-focus-within/ten:-translate-y-0.5 motion-safe:group-focus-within/ten:rotate-[-8deg]",
        "motion-safe:group-has-[li_a:hover]/ten:rotate-[8deg]",
        className,
      )}
    >
      {/* Its own shadow and rounded square are part of the SVG. */}
      <Image src="/assets/tenten.svg" alt="" width={52} height={52} className="size-full" />
    </span>
  );
}
