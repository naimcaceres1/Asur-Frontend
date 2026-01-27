import { Suspense } from "react";

import { ChartSkeleton } from "@/components/chart-skeleton";
import { DashboardUsoChartClient } from "@/components/dashboard-uso-chart-client";

export function ChartWrapper() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <DashboardUsoChartClient />
    </Suspense>
  );
}
