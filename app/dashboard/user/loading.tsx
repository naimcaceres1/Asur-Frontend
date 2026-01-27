// app/dashboard/main/loading.tsx
import { UserPageSkeleton } from "@/components/user-page-skeleton";

export default function Loading() {
  return <UserPageSkeleton showAdminSections={true} />;
}