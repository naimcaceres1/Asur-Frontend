"use client";

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconLoader,
  IconPlus,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { z } from "zod";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Usuario, DataTableProps } from "@/interfaces/main-interfaces";
import { apiClient } from "@/helpers/api-client";

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
});

// Estilos de badge según rol
const getRoleBadgeStyles = (rol: string) => {
  switch (rol) {
    case "Administrador":
      return "border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20";
    case "Auxiliar administrativo":
      return "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20";
    case "Coordinador":
      return "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20";
    case "Consultor":
      return "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20";
    case "Cliente":
      return "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/20";
    default:
      return "border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/20";
  }
};

// Detecta estado activo desde la fila
const isUserActive = (user: Usuario) => {
  if (typeof (user as any).estado === "boolean") {
    return (user as any).estado;
  }
  return (user as any).estadoDescripcion === "Activo";
};

export function DataTable({ data: initialData, paginationData }: DataTableProps) {
  const [data, setData] = useState<Usuario[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [pagination, setPagination] = useState({
    pageIndex: paginationData?.number || 0,
    pageSize: paginationData?.size || 10,
  });

  // Activar / desactivar usuario
  const handleToggleEstado = useCallback(
    async (user: Usuario) => {
      if (!token) {
        toast.error("No se encontró el token de sesión.");
        return;
      }

      if (!user.idUsuario) {
        toast.error("Usuario sin ID válido.");
        return;
      }

      const estaActivo = isUserActive(user);
      const endpoint = estaActivo
        ? `/users/delete/${user.idUsuario}`
        : `/users/activate/${user.idUsuario}`;
      const accionTexto = estaActivo ? "desactivar" : "activar";

      try {
        await apiClient(endpoint, token, { method: "PUT" });

        toast.success(`Usuario ${accionTexto}do correctamente.`);

        // Actualiza estado en memoria
        setData((prev) =>
          prev.map((u) =>
            u.idUsuario === user.idUsuario
              ? {
                  ...u,
                  estado: !estaActivo,
                  estadoDescripcion: !estaActivo ? "Activo" : "Inactivo",
                }
              : u
          )
        );
      } catch (err: any) {
        console.error("Error cambiando estado del usuario:", err);
        let msg = `No se pudo ${accionTexto} el usuario.`;
        if (typeof err?.message === "string" && err.message.trim() !== "") {
          msg = err.message;
        }
        toast.error(msg);
      }
    },
    [token]
  );

  const columns: ColumnDef<Usuario>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: ({ row }) => {
          const usuario = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {usuario.nombre} {usuario.apellido}
              </span>
              <span className="text-sm text-muted-foreground">
                {usuario.correo}
              </span>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "documento",
        header: "Documento",
        cell: ({ row }) => (
          <div className="w-32">
            <Badge variant="outline" className="text-muted-foreground px-1.5">
              {row.original.tipoDocumento}: {row.original.documento}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "nombrePerfil",
        header: "Rol",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={`px-2 py-1 text-xs font-medium ${getRoleBadgeStyles(
              row.original.nombrePerfil
            )}`}
          >
            {row.original.nombrePerfil}
          </Badge>
        ),
      },
      {
        accessorKey: "estadoDescripcion",
        header: "Estado",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.estadoDescripcion === "Activo"
                ? "default"
                : "secondary"
            }
            className={`px-1.5 ${
              row.original.estadoDescripcion === "Activo"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-gray-500 hover:bg-gray-600"
            }`}
          >
            {row.original.estadoDescripcion === "Activo" ? (
              <IconCircleCheckFilled className="fill-white size-3 mr-1" />
            ) : (
              <IconLoader className="size-3 mr-1" />
            )}
            {row.original.estadoDescripcion}
          </Badge>
        ),
      },
      {
  id: "actions",
  header: "Acciones",
  cell: ({ row }) => {
    const usuario = row.original;
    const activo = isUserActive(usuario);

    return (
      <div
        className="flex flex-col gap-2 min-w-[120px]"
        onClick={(e) => e.stopPropagation()} // evita que dispare el onClick de la fila
      >
        <Button
          variant={activo ? "destructive" : "outline"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleEstado(usuario);
          }}
        >
          {activo ? "Desactivar" : "Activar"}
        </Button>
      </div>
    );
  },
},
    ],
    [handleToggleEstado]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.idUsuario.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: paginationData?.totalPages || 1,
    rowCount: paginationData?.totalElements || data.length,
  });

  const handlePageChange = (newPageIndex: number) => {
    const totalPages = paginationData?.totalPages || 1;
    if (newPageIndex < 0 || newPageIndex >= totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPageIndex.toString());
    params.set("size", pagination.pageSize.toString());

    router.push(`/dashboard/main?${params.toString()}`, { scroll: false });
  };

  const handlePageSizeChange = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "0");
    params.set("size", newSize.toString());

    router.push(`/dashboard/main?${params.toString()}`, { scroll: false });
  };

  const totalElements = paginationData?.totalElements || 0;
  const totalPages = paginationData?.totalPages || 1;
  const currentPage = paginationData?.number || 0;

  return (
    <Tabs
      defaultValue="usuarios"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="hidden lg:inline">Columnas</span>
                <span className="lg:hidden">Columnas</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "nombre"
                        ? "Nombre y Email"
                        : column.id === "documento"
                        ? "Documento"
                        : column.id === "nombrePerfil"
                        ? "Rol"
                        : column.id === "estadoDescripcion"
                        ? "Estado"
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/new-account">
              <IconPlus className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline">Agregar Usuario</span>
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent
        value="usuarios"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => {
                      const usuario = row.original as Usuario;
                      if (usuario.idUsuario) {
                        router.push(
                          `/dashboard/update-account?id=${usuario.idUsuario}`
                        );
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No se encontraron usuarios.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} fila(s) en esta página.
            {` Total en BD: ${totalElements} usuarios`}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Filas por página
              </Label>
              <Select
                value={`${pagination.pageSize}`}
                onValueChange={(value) => handlePageSizeChange(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Página {currentPage + 1} de {totalPages}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(0)}
                disabled={currentPage === 0}
              >
                <span className="sr-only">Ir a la primera página</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <span className="sr-only">Ir a la página anterior</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <span className="sr-only">Ir a la página siguiente</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => handlePageChange(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <span className="sr-only">Ir a la última página</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig;
