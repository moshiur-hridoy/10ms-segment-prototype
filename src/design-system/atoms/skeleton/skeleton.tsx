import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const radii = { sm: "rounded-sm", md: "rounded-md", lg: "rounded-lg", full: "rounded-full" } as const;

/**
 * A placeholder block with a soft band sweeping across it (`shimmer`; still with reduced motion).
 * Size comes from `className`; radius is a prop because `cn` doesn't merge conflicting utilities (rounded-sm + rounded-lg would be a coin toss).
 */
export function Skeleton({ radius = "sm", className, ...props }: ComponentProps<"div"> & { radius?: keyof typeof radii }) {
  return <div className={cn("shimmer bg-raised", radii[radius], className)} {...props} />;
}

/** Wraps a loading layout so assistive tech hears one "loading …" label. */
export function SkeletonGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}
