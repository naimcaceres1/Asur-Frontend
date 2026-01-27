"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type { Funcionalidad, FuncionalidadPage } from "@/interfaces";
import { apiClient } from "@/helpers/api-client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  initialPage: FuncionalidadPage;
};

type EstadoFiltro = "todos" | "activos" | "inactivos";
type ModoForm = "crear" | "editar";

type FormState = {
  nombre: string;
  descripcion: string;
  estado: boolean;
};

const PAGE_SIZE = 10;

export function FunctionalitiesPageClient({ initialPage }: Props) {
  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const [pageData, setPageData] = useState<FuncionalidadPage>(initialPage);
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>("todos");
  const [nombreFiltro, setNombreFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(
    initialPage.number ?? 0
  );
  const [isLoading, setIsLoading] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [modo, setModo] = useState<ModoForm>("crear");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>({
    nombre: "",
    descripcion: "",
    estado: true,
  });

  function ensureToken(): string | null {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return null;
    }
    return token;
  }

  function resetForm() {
    setForm({ nombre: "", descripcion: "", estado: true });
    setEditingId(null);
  }

  function openCrearDialog() {
    setModo("crear");
    resetForm();
    setShowDialog(true);
  }

  function openEditarDialog(func: Funcionalidad) {
    setModo("editar");
    setEditingId(func.idFuncionalidad);
    setForm({
      nombre: func.nombre ?? "",
      descripcion: func.descripcion ?? "",
      estado: func.estado ?? true,
    });
    setShowDialog(true);
  }

  async function loadPage(page: number) {
    const tk = ensureToken();
    if (!tk) return;

    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.set("estado", estadoFiltro);
      if (nombreFiltro.trim()) {
        params.set("nombre", nombreFiltro.trim());
      }
      params.set("page", String(page));
      params.set("size", String(PAGE_SIZE));

      const qs = params.toString();

      const nuevaPage = await apiClient<FuncionalidadPage>(
        `/funcionalidades/listar-filtros?${qs}`,
        tk
      );

      setPageData(nuevaPage);
      setCurrentPage(nuevaPage.number ?? page);
    } catch (error: any) {
      console.error("Error listando funcionalidades:", error);
      toast.error(
        error?.message || "Error al cargar el listado de funcionalidades."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    const tk = ensureToken();
    if (!tk) return;

    const nombreTrim = form.nombre.trim();
    const descripcionTrim = form.descripcion.trim();

    if (!nombreTrim) {
      toast.error("El nombre de la funcionalidad es obligatorio.");
      return;
    }

    if (!descripcionTrim) {
      toast.error("La descripción de la funcionalidad es obligatoria.");
      return;
    }

    try {
      setIsSubmitting(true);

      if (modo === "crear") {
        await apiClient<Funcionalidad>("/funcionalidades/create", tk, {
          method: "POST",
          body: JSON.stringify({
            nombre: nombreTrim,
            descripcion: descripcionTrim,
          }),
        });

        toast.success("Funcionalidad creada correctamente.");
      } else if (modo === "editar" && editingId != null) {
        await apiClient<Funcionalidad>(
          `/funcionalidades/update/${editingId}`,
          tk,
          {
            method: "PUT",
            body: JSON.stringify({
              nombre: nombreTrim,
              descripcion: descripcionTrim,
              estado: form.estado,
            }),
          }
        );

        toast.success("Funcionalidad actualizada correctamente.");
      }

      setShowDialog(false);
      resetForm();
      await loadPage(0);
    } catch (error: any) {
      console.error("Error guardando funcionalidad:", error);
      toast.error(
        error?.message ||
          "Error al guardar la funcionalidad. Verificá los datos."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(func: Funcionalidad) {
    const tk = ensureToken();
    if (!tk) return;

    if (!func.estado) {
      toast.error("La funcionalidad ya está inactiva.");
      return;
    }

    try {
      setDeletingId(func.idFuncionalidad);

      await apiClient<void>(
        `/funcionalidades/delete/${func.idFuncionalidad}`,
        tk,
        { method: "PUT" }
      );

      toast.success("Funcionalidad dada de baja correctamente.");
      await loadPage(currentPage);
    } catch (error: any) {
      console.error("Error dando de baja la funcionalidad:", error);
      toast.error(
        error?.message || "Error al dar de baja la funcionalidad."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const rows = pageData.content ?? [];
  const totalPages = pageData.totalPages || 1;

  function handleSearch() {
    loadPage(0);
  }

  function handlePreviousPage() {
    if (currentPage <= 0) return;
    loadPage(currentPage - 1);
  }

  function handleNextPage() {
    if (currentPage >= totalPages - 1) return;
    loadPage(currentPage + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros y botones de acciones */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor="filtro-nombre">Buscar por nombre</Label>
            <Input
              id="filtro-nombre"
              placeholder="Nombre de la funcionalidad..."
              value={nombreFiltro}
              onChange={(e) => setNombreFiltro(e.target.value)}
              className="w-full md:w-64"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="filtro-estado">Estado</Label>
            <Select
              value={estadoFiltro}
              onValueChange={(v: EstadoFiltro) => setEstadoFiltro(v)}
            >
              <SelectTrigger id="filtro-estado" className="w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activas</SelectItem>
                <SelectItem value="inactivos">Inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            className="mt-1 md:mt-0"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Buscar
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button asChild variant="outline">
            <Link href="/dashboard/functionalities/profile">
              Administrar por perfil
            </Link>
          </Button>

          <Button onClick={openCrearDialog}>Nueva funcionalidad</Button>
        </div>
      </div>

      {/* Tabla de funcionalidades */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[220px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((func) => (
            <TableRow key={func.idFuncionalidad}>
              <TableCell>{func.nombre}</TableCell>
              <TableCell>{func.descripcion}</TableCell>
              <TableCell>{func.estado ? "Activa" : "Inactiva"}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditarDialog(func)}
                >
                  Editar
                </Button>

                <Button
                  variant={func.estado ? "destructive" : "outline"}
                  size="sm"
                  disabled={
                    deletingId === func.idFuncionalidad || !func.estado
                  }
                  onClick={() => handleDelete(func)}
                >
                  {deletingId === func.idFuncionalidad
                    ? "Guardando..."
                    : func.estado
                    ? "Dar de baja"
                    : "Inactiva"}
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                No hay funcionalidades que coincidan con los filtros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableCaption>Listado de funcionalidades del sistema</TableCaption>
      </Table>

      {/* Paginación simple */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {currentPage + 1} de {totalPages || 1}
        </span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={isLoading || currentPage === 0}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={isLoading || currentPage >= totalPages - 1}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {/* Modal crear / editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {modo === "crear"
                ? "Crear nueva funcionalidad"
                : "Editar funcionalidad"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                rows={3}
                value={form.descripcion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descripcion: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Estado</Label>
              <Select
                value={form.estado ? "activa" : "inactiva"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, estado: v === "activa" }))
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activa">Activa</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : modo === "crear"
                ? "Crear funcionalidad"
                : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
