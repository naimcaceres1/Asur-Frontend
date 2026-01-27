// app/dashboard/main/loading.tsx
import { MainPageSkeleton } from "@/components/main-page-skeleton";

export default function Loading() {
  return <MainPageSkeleton showAdminSections={true} />;
}