import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function SubmissionCardSkeleton() {
  return (
    <Card className="overflow-hidden py-0 gap-0 border-white/10">
      <Skeleton className="aspect-video w-full rounded-none" />
      <CardContent className="space-y-2 pt-3 pb-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
      <CardContent className="py-3">
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function SubmissionGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SubmissionCardSkeleton key={i} />
      ))}
    </div>
  );
}
