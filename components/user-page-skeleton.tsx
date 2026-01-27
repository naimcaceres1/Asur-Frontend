import { AdminUserSkeleton } from "./admin-user-skeleton";
import { DataTableSkeleton } from "./data-table-skeleton";

interface UserPageSkeletonProps {
  showAdminSections?: boolean;
}

export function UserPageSkeleton({
  showAdminSections = false,
}: UserPageSkeletonProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {showAdminSections && (
            <>
              <div className="px-4 lg:px-6">
                <AdminUserSkeleton />
              </div>
              <div className="px-4 lg:px-6"></div>
              <DataTableSkeleton />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
