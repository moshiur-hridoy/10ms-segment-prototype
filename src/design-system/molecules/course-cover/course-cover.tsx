import { GraduationCap, Languages, Sparkles, type LucideIcon } from "lucide-react";
import { softTones, type Tone } from "@/design-system/foundations/tone";
import type { Category, DataOf } from "@/lib/api";
import { cn } from "@/lib/cn";

type Course = DataOf<"courses">["enrolled"][number];

const placeholders: Record<Category, { Icon: LucideIcon; tone: Tone }> = {
  academic: { Icon: GraduationCap, tone: "success" },
  english: { Icon: Languages, tone: "info" },
  skills: { Icon: Sparkles, tone: "highlight" },
};

/** 16:9 course cover. Until the API sends thumbnails, a category-tinted tile stands in. */
export function Cover({ course, className }: { course: Course; className?: string }) {
  const base = cn("aspect-video shrink-0 overflow-hidden rounded-md ring-1 ring-border", className);
  if (course.thumbnailUrl) {
    return (
      // Remote CDN images; switch to next/image once its domain is in images.remotePatterns.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={course.thumbnailUrl} alt="" loading="lazy" className={cn(base, "object-cover")} />
    );
  }
  const { Icon, tone } = placeholders[course.category];
  return (
    <span aria-hidden className={cn(base, "grid place-items-center", softTones[tone])}>
      <Icon className="size-6 opacity-80" />
    </span>
  );
}
