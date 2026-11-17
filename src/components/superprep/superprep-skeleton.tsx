import { Skeleton, SkeletonGroup } from "@/design-system/atoms/skeleton";

/** Hub or paper page while it loads: breadcrumb, hero, the list, and the side column. */
export function SuperPrepSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid grid-cols-1 gap-5">
      <Skeleton className="h-5 w-64" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-6">
          <Skeleton radius="lg" className="h-72" />
          <Skeleton radius="lg" className="h-96" />
        </div>
        <Skeleton radius="lg" className="h-48" />
      </div>
    </SkeletonGroup>
  );
}

/** A paper's page while it loads: the open book's two pages. */
export function BookSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label} className="grid grid-cols-1 gap-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton radius="md" className="h-10 w-full max-w-3xl" />
      <div className="grid gap-8 rounded-lg border border-border bg-paper p-8 lg:grid-cols-2">
        <div className="grid content-start gap-5">
          <Skeleton className="h-8 w-56" />
          <Skeleton radius="full" className="size-28" />
          <Skeleton radius="md" className="h-36" />
        </div>
        <div className="grid content-start gap-4">
          <Skeleton className="h-7 w-32" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
    </SkeletonGroup>
  );
}
