import { Suspense } from "react";

import { AdminUserSkeleton } from "@/components/admin-user-skeleton";
import { AdminUserQuickSearch } from "@/components/admin-user-quick-search";

export function AdminUserWrapper() {
  return (
    <Suspense fallback={<AdminUserSkeleton />}>
      <AdminUserQuickSearch />
    </Suspense>
  );
}
