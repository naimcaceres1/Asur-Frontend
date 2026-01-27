import { DataTable } from "@/components/data-table";
import { DataTableSkeleton } from "@/components/data-table-skeleton";
import { Suspense } from "react";
import { Usuario, SpringPage } from "@/interfaces/main-interfaces";

interface DataTableWrapperProps {
  data: Usuario[];
  paginationData: SpringPage<Usuario> | null;
}

export function DataTableWrapper({ data, paginationData }: DataTableWrapperProps) {
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <DataTable data={data} paginationData={paginationData} />
    </Suspense>
  );
}
