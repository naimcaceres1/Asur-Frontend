import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminUserSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2 rounded-md border bg-muted/40 p-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}
