import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";

/** Learning report while it loads: title, scope bar, the story and actions, four stat tiles and a section. */
export function ReportSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid grid-cols-1 gap-5 pt-6">
      <Skeleton radius="md" className="h-9 w-56" />
      <Skeleton radius="full" className="h-12" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Skeleton radius="lg" className="h-40 lg:col-span-7" />
        <Skeleton radius="lg" className="h-40 lg:col-span-5" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} radius="lg" className="h-32" />
        ))}
      </div>
      <Skeleton radius="lg" className="h-80" />
    </SkeletonGroup>
  );
}
