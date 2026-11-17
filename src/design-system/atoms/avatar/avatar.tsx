import Image from "next/image";
import { cn } from "@/lib/cn";

/** Profile photo, or the first letter of the name when there is no photo. */
export function Avatar({ src, name, size = 32, className }: { src: string | null; name: string; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (!src) {
    return (
      <span
        aria-hidden
        style={{ ...style, fontSize: size * 0.42 }}
        className={cn("grid shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand-text", className)}
      >
        {Array.from(name.trim())[0] ?? "?"}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      style={style}
      className={cn("shrink-0 rounded-full object-cover ring-1 ring-border", className)}
    />
  );
}
