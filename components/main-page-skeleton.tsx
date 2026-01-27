import { SectionCardsSkeleton } from "./section-cards-skeleton";
import { ChartSkeleton } from "./chart-skeleton";
import { AdminUserSkeleton } from "./admin-user-skeleton";

interface MainPageSkeletonProps {
  showAdminSections?: boolean;
}

export function MainPageSkeleton({
  showAdminSections = false,
}: MainPageSkeletonProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCardsSkeleton />

          {showAdminSections && (
            <>
              <div className="px-4 lg:px-6">
                <AdminUserSkeleton />
              </div>
              <div className="px-4 lg:px-6">
                <ChartSkeleton />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
