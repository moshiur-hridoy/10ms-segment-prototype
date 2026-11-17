import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";

/** Subject page while it loads: title, player and the syllabus panel. */
export function SubjectSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid grid-cols-1 gap-5">
      <Skeleton radius="md" className="h-10 w-72" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid content-start gap-4">
          <Skeleton radius="lg" className="aspect-video" />
          <Skeleton className="h-7 w-3/4" />
        </div>
        <Skeleton radius="lg" className="h-[32rem]" />
      </div>
    </SkeletonGroup>
  );
}
