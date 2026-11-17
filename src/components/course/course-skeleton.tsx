import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";

/** Course home while it loads: breadcrumb, hero, a section, and the side column. */
export function CourseSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid grid-cols-1 gap-5">
      <Skeleton className="h-5 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid content-start gap-6">
          <Skeleton radius="lg" className="h-36" />
          <Skeleton radius="lg" className="h-80" />
        </div>
        <Skeleton radius="lg" className="h-60" />
      </div>
    </SkeletonGroup>
  );
}
