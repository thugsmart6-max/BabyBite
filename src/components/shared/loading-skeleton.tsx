import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 skeleton-shimmer" />
      <Skeleton className="h-4 w-72 skeleton-shimmer" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full skeleton-shimmer" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64 skeleton-shimmer" />
      <Skeleton className="h-4 w-96 skeleton-shimmer" />
      <DashboardSkeleton />
    </div>
  );
}
