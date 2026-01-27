"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type { Espacios } from "@/interfaces";
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
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  initialEspacios: Espacios[];
};

type FormState = {
  nombre: string;
  capacidad: number | "";
  tarifaSocio: number | "";
  tarifaNoSocio: number | "";
  fechaVigenciaPrecio: string;
  preHorExtra: number | "";
  preLimpieza: number | "";
  observaciones: string;
};

type ModoForm = "crear" | "editar";

export function SpacesPageClient({ initialEspacios }: Props) {
  const [espacios, setEspacios] = useState<Espacios[]>(initialEspacios);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // filtros
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<
    "todos" | "activos" | "inactivos"
  >("todos");

  // modal crear/editar
  const [showDialog, setShowDialog] = useState(false);
  const [modo, setModo] = useState<ModoForm>("crear");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    nombre: "",
    capacidad: "",
    tarifaSocio: "",
    tarifaNoSocio: "",
    fechaVigenciaPrecio: "",
    preHorExtra: "",
    preLimpieza: "",
    observaciones: "",
  });

  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  // --- helpers de form ---

  function resetForm() {
    setForm({
      nombre: "",
      capacidad: "",
      tarifaSocio: "",
      tarifaNoSocio: "",
      fechaVigenciaPrecio: "",
      preHorExtra: "",
      preLimpieza: "",
      observaciones: "",
    });
    setEditingId(null);
  }

  function openCrearDialog() {
    setModo("crear");
    resetForm();
    setShowDialog(true);
  }

  function openEditarDialog(espacio: Espacios) {
    setModo("editar");
    setEditingId(espacio.idEspacio);

    setForm({
      nombre: espacio.nombre ?? "",
      capacidad: espacio.capacidad ?? "",
      tarifaSocio: espacio.tarifaSocio ?? "",
      tarifaNoSocio: espacio.tarifaNoSocio ?? "",
      fechaVigenciaPrecio: espacio.fechaVigenciaPrecio ?? "",
      preHorExtra: (espacio as any).preHorExtra ?? "",
      preLimpieza: (espacio as any).preLimpieza ?? "",
      observaciones: espacio.observaciones ?? "",
    });

    setShowDialog(true);
  }

  // --- cambiar estado (activar / desactivar) ---

  async function handleToggleEstado(espacio: Espacios) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    const nuevoEstado = !Boolean((espacio as any).estado);

    try {
      setLoadingId(espacio.idEspacio);

      await apiClient<void>("/espacios/estado", token, {
        method: "PATCH",
        body: JSON.stringify({
          idEspacio: espacio.idEspacio,
          estado: nuevoEstado,
        }),
      });

      setEspacios((prev) =>
        prev.map((e) =>
          e.idEspacio === espacio.idEspacio ? { ...e, estado: nuevoEstado } : e
        )
      );

      toast.success(
        `Espacio ${nuevoEstado ? "activado" : "desactivado"} correctamente.`
      );
    } catch (error: any) {
      console.error("Error cambiando estado:", error);
      toast.error(error?.message || "Error al cambiar el estado del espacio");
    } finally {
      setLoadingId(null);
    }
  }

  // --- helpers de fecha ---

  function isPastDate(isoDate: string) {
    if (!isoDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(isoDate + "T00:00:00");
    return selected < today;
  }

  // --- submit crear / editar ---

  async function handleSubmit() {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    // ------------------ VALIDACIONES ------------------

    if (!form.nombre.trim()) {
      toast.error("El nombre del espacio es obligatorio.");
      return;
    }

    const capacidadNum =
      form.capacidad === "" ? 0 : Number(form.capacidad);

    // capacidad: entero > 0
    if (
      !capacidadNum ||
      capacidadNum <= 0 ||
      !Number.isInteger(capacidadNum)
    ) {
      toast.error("La capacidad debe ser un número entero mayor a cero.");
      return;
    }

    const tarifaSocioNum =
      form.tarifaSocio === "" ? 0 : Number(form.tarifaSocio);
    if (!Number.isInteger(tarifaSocioNum)) {
      toast.error("La tarifa socio debe ser un número entero.");
      return;
    }
    if (tarifaSocioNum < 0) {
      toast.error("La tarifa socio no puede ser negativa.");
      return;
    }

    const tarifaNoSocioNum =
      form.tarifaNoSocio === "" ? 0 : Number(form.tarifaNoSocio);
    if (!Number.isInteger(tarifaNoSocioNum)) {
      toast.error("La tarifa no socio debe ser un número entero.");
      return;
    }
    if (tarifaNoSocioNum < 0) {
      toast.error("La tarifa no socio no puede ser negativa.");
      return;
    }

    const preHorExtraNum =
      form.preHorExtra === "" ? 0 : Number(form.preHorExtra);
    if (!Number.isInteger(preHorExtraNum)) {
      toast.error("El precio por hora extra debe ser un número entero.");
      return;
    }
    if (preHorExtraNum < 0) {
      toast.error("El precio por hora extra no puede ser negativo.");
      return;
    }

    const preLimpiezaNum =
      form.preLimpieza === "" ? 0 : Number(form.preLimpieza);
    if (!Number.isInteger(preLimpiezaNum)) {
      toast.error("El precio de limpieza debe ser un número entero.");
      return;
    }
    if (preLimpiezaNum < 0) {
      toast.error("El precio de limpieza no puede ser negativo.");
      return;
    }

    if (form.fechaVigenciaPrecio && isPastDate(form.fechaVigenciaPrecio)) {
      toast.error("La fecha de vigencia debe ser hoy o una fecha futura.");
      return;
    }

    // ------------------ PAYLOAD ------------------

    const payload = {
      nombre: form.nombre.trim(),
      capacidad: capacidadNum,
      tarifaSocio: tarifaSocioNum,
      tarifaNoSocio: tarifaNoSocioNum,
      fechaVigenciaPrecio: form.fechaVigenciaPrecio || null,
      preHorExtra: preHorExtraNum,
      preLimpieza: preLimpiezaNum,
      observaciones: form.observaciones.trim() || null,
    };

    try {
      setIsSubmitting(true);

      if (modo === "crear") {
        // 1) Creo el espacio
        await apiClient<void>("/espacios/create", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        // 2) Traigo la lista actualizada desde el backend
        const nuevosEspacios = await apiClient<Espacios[]>(
          "/espacios/list",
          token
        );

        // 3) Actualizo el estado, así la tabla se refresca al instante
        setEspacios(nuevosEspacios);

        toast.success("Espacio creado con éxito.");
      } else if (modo === "editar" && editingId != null) {
        await apiClient<void>(`/espacios/update/${editingId}`, token, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        setEspacios((prev) =>
          prev.map((e) =>
            e.idEspacio === editingId
              ? {
                  ...e,
                  nombre: payload.nombre,
                  capacidad: payload.capacidad,
                  tarifaSocio: payload.tarifaSocio,
                  tarifaNoSocio: payload.tarifaNoSocio,
                  fechaVigenciaPrecio: payload.fechaVigenciaPrecio ?? "",
                  preHorExtra: payload.preHorExtra,
                  preLimpieza: payload.preLimpieza,
                  observaciones: payload.observaciones ?? "",
                }
              : e
          )
        );

        toast.success("Espacio actualizado correctamente.");
      }

      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      console.error("Error guardando espacio:", error);
      toast.error(error?.message || "Error al guardar el espacio");
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- filtrado en memoria ---

  const espaciosFiltrados = espacios.filter((e) => {
    const coincideNombre = filtroNombre
      ? e.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      : true;

    const estadoBool = Boolean((e as any).estado);

    const coincideEstado =
      filtroEstado === "todos"
        ? true
        : filtroEstado === "activos"
        ? estadoBool
        : !estadoBool;

    return coincideNombre && coincideEstado;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros y botón crear */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <Label htmlFor="filtro-nombre">Buscar por nombre</Label>
            <Input
              id="filtro-nombre"
              placeholder="Sala de reuniones..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              className="w-full md:w-64"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="filtro-estado">Estado</Label>
            <Select
              value={filtroEstado}
              onValueChange={(v: "todos" | "activos" | "inactivos") =>
                setFiltroEstado(v)
              }
            >
              <SelectTrigger id="filtro-estado" className="w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={openCrearDialog}>Nuevo espacio</Button>
      </div>

      {/* Tabla de espacios */}
      <div className="w-full overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px] ">Nombre</TableHead>
              <TableHead className="whitespace-nowrap">Capacidad</TableHead>
              <TableHead className="whitespace-nowrap">Tarifa socio</TableHead>
              <TableHead className="whitespace-nowrap">
                Tarifa no socio
              </TableHead>
              <TableHead className="whitespace-nowrap">
                Vigencia precio
              </TableHead>
              <TableHead className="min-w-[200px] text-center">
                Observaciones
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                Estado
              </TableHead>
              <TableHead className="whitespace-nowrap text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {espaciosFiltrados.map((espacio) => {
              const anyEsp = espacio as any;
              const estadoBool = Boolean(anyEsp.estado);
              const estadoDescripcion = estadoBool ? "Activo" : "Inactivo";

              return (
                <TableRow key={espacio.idEspacio}>
                  <TableCell className="font-medium min-w-[150px] ">
                    {espacio.nombre}
                  </TableCell>
                  <TableCell className="text-center">
                    {espacio.capacidad}
                  </TableCell>
                  <TableCell className="text-center">
                    {espacio.tarifaSocio}
                  </TableCell>
                  <TableCell className="text-center">
                    {espacio.tarifaNoSocio}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-center">
                    {espacio.fechaVigenciaPrecio}
                  </TableCell>
                  <TableCell
                    className="min-w-[200px] max-w-[300px] truncate"
                    title={espacio.observaciones ?? "-"}
                  >
                    {espacio.observaciones ?? "-"}
                  </TableCell>
                  <TableCell className="text-center w-32">
                    <Badge
                      variant={
                        estadoDescripcion === "Activo" ? "default" : "secondary"
                      }
                      className={`px-2 py-1 w-24 h-6 flex items-center justify-center ${
                        estadoDescripcion === "Activo"
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "bg-gray-500 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {estadoDescripcion === "Activo" ? (
                        <IconCircleCheckFilled className="fill-white size-3 mr-1" />
                      ) : (
                        <IconLoader className="size-3 mr-1" />
                      )}
                      {estadoDescripcion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditarDialog(espacio)}
                        className="w-[100px] justify-center"
                      >
                        Editar
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingId === espacio.idEspacio}
                        onClick={() => handleToggleEstado(espacio)}
                        className={`w-[100px] justify-center ${
                          !estadoBool
                            ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                            : "bg-red-600 hover:bg-red-700 text-white border-red-600"
                        }`}
                      >
                        {loadingId === espacio.idEspacio
                          ? "Guardando..."
                          : estadoBool
                          ? "Desactivar"
                          : "Activar"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {espaciosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  No hay espacios que coincidan con los filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>Listado de espacios</TableCaption>
        </Table>
      </div>

      {/* Modal crear / editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modo === "crear" ? "Crear nuevo espacio" : "Editar espacio"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
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
              <Label>Capacidad</Label>
              <Input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={form.capacidad}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    capacidad:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Tarifa socio</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.tarifaSocio}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tarifaSocio:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Tarifa no socio</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.tarifaNoSocio}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tarifaNoSocio:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Fecha vigencia precio</Label>
              <Input
                type="date"
                value={form.fechaVigenciaPrecio}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fechaVigenciaPrecio: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Precio hora extra (opcional)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.preHorExtra}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    preHorExtra:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Precio limpieza (opcional)</Label>
              <Input
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={form.preLimpieza}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    preLimpieza:
                      e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label>Observaciones</Label>
              <Textarea
                rows={3}
                value={form.observaciones}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    observaciones: e.target.value,
                  }))
                }
              />
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
                ? "Crear espacio"
                : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
