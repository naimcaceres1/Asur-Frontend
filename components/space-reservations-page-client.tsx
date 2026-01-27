"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type {
  ReservaEspacioListado,
  SpringPage,
  EspacioDisponible,
} from "@/interfaces/main-interfaces";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { GuideInitializer } from "@/lib/drive/GuideInitializer";

type Props = {
  initialPage: SpringPage<ReservaEspacioListado> | null;
  initialPageIndex: number;
  initialPageSize: number;
  isAdminOrAux: boolean;
};

type BuscarForm = {
  fechaEvento: string;
  horaInicio: string;
  horaFin: string;
  cantidadPersonas: number | "";
  limpieza: boolean;
};

export function SpaceReservationsPageClient({
  initialPage,
  initialPageIndex,
  initialPageSize,
  isAdminOrAux,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const [pageData, setPageData] =
    useState<SpringPage<ReservaEspacioListado> | null>(initialPage);
  const [pageIndex, setPageIndex] = useState(initialPageIndex);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const reservas = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? reservas.length;
  const totalPages = pageData?.totalPages ?? 1;

  const [isCancellingId, setIsCancellingId] = useState<number | null>(null);
  const [viewScope, setViewScope] = useState<"MINE" | "ALL">("MINE");

  const [filtroEspacio, setFiltroEspacio] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");

  const [buscarForm, setBuscarForm] = useState<BuscarForm>({
    fechaEvento: "",
    horaInicio: "",
    horaFin: "",
    cantidadPersonas: "",
    limpieza: false,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState<
    EspacioDisponible[]
  >([]);
  const [isCreatingReservaId, setIsCreatingReservaId] = useState<number | null>(
    null
  );

  const [reservarParaOtro, setReservarParaOtro] = useState(false);
  const [documentoOtro, setDocumentoOtro] = useState("");
  const [cancelDialog, setCancelDialog] = useState<{
    isOpen: boolean;
    reserva: ReservaEspacioListado | null;
    message: string;
  }>({
    isOpen: false,
    reserva: null,
    message: "",
  });

  function ensureToken() {
    if (!token) {
      toast.error("No se encontró el token de sesión. Volvé a iniciar sesión.");
      return false;
    }
    return true;
  }

  function timeToBackendFormat(time: string): string {
    if (!time) return "";
    return time.length === 5 ? `${time}:00` : time;
  }

  // ----------------- fetch mis reservas -----------------

  async function fetchMisReservas(page: number, size: number) {
    if (!ensureToken()) return;

    try {
      const url = `/reservas/mis?page=${page}&size=${size}`;
      const data = await apiClient<SpringPage<ReservaEspacioListado>>(
        url,
        token,
        { method: "GET" }
      );
      setPageData(data);
      setPageIndex(page);
      setPageSize(size);

      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("page", String(page));
      params.set("size", String(size));
      router.push(`/dashboard/reservationSpace?${params.toString()}`, {
        scroll: false,
      });
    } catch (error: any) {
      console.error("Error recargando mis reservas:", error);
      toast.error(
        error?.message || "No se pudieron obtener tus reservas actualmente."
      );
    }
  }

  // ----------------- fetch todas las reservas (admin/aux) -----------------

  async function fetchReservasActivas(page: number, size: number) {
    if (!ensureToken()) return;
    if (!isAdminOrAux) {
      return fetchMisReservas(page, size);
    }

    try {
      const url = `/reservas/activas?page=${page}&size=${size}`;
      const data = await apiClient<SpringPage<ReservaEspacioListado>>(
        url,
        token,
        { method: "GET" }
      );
      setPageData(data);
      setPageIndex(page);
      setPageSize(size);

      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set("page", String(page));
      params.set("size", String(size));
      router.push(`/dashboard/reservationSpace?${params.toString()}`, {
        scroll: false,
      });
    } catch (error: any) {
      console.error("Error recargando reservas activas:", error);
      toast.error(
        error?.message ||
          "No se pudieron obtener las reservas activas actualmente."
      );
    }
  }

  // ----------------- cambiar alcance (mis / todas) -----------------

  function handleScopeChange(scope: "MINE" | "ALL") {
    if (scope === viewScope) return;
    setViewScope(scope);
    if (scope === "MINE") {
      fetchMisReservas(0, pageSize);
    } else {
      fetchReservasActivas(0, pageSize);
    }
  }

  // ----------------- buscar espacios disponibles -----------------

  async function handleBuscarEspacios() {
    if (!ensureToken()) return;

    const { fechaEvento, horaInicio, horaFin, cantidadPersonas, limpieza } =
      buscarForm;

    if (!fechaEvento) {
      toast.error("La fecha del evento es obligatoria.");
      return;
    }
    if (!horaInicio || !horaFin) {
      toast.error("Debe indicar hora de inicio y hora de fin.");
      return;
    }
    if (cantidadPersonas === "" || Number(cantidadPersonas) <= 0) {
      toast.error("La cantidad de personas debe ser mayor a cero.");
      return;
    }

    const hoy = new Date().toISOString().slice(0, 10);
    if (fechaEvento < hoy) {
      toast.error("La fecha del evento no puede ser una fecha pasada.");
      return;
    }

    if (horaFin <= horaInicio) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }

    const body = {
      fechaEvento,
      horaInicio: timeToBackendFormat(horaInicio),
      horaFin: timeToBackendFormat(horaFin),
      cantidadPersonas: Number(cantidadPersonas),
      limpieza,
    };

    try {
      setIsSearching(true);
      const data = await apiClient<EspacioDisponible[]>(
        "/reservas/disponibles",
        token,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
      setEspaciosDisponibles(data);
      if (data.length === 0) {
        toast.info(
          "No se encontraron espacios disponibles con esos datos. Probá cambiar el horario o la fecha."
        );
      } else {
        toast.success("Espacios disponibles cargados correctamente.");
      }
    } catch (error: any) {
      console.error("Error consultando espacios disponibles:", error);
      toast.error(
        error?.message ||
          "Ocurrió un error al buscar espacios disponibles. Revisá los datos."
      );
    } finally {
      setIsSearching(false);
    }
  }

  // ----------------- crear reserva -----------------

  async function handleCrearReserva(espacio: EspacioDisponible) {
    if (!ensureToken()) return;

    const { fechaEvento, horaInicio, horaFin, cantidadPersonas, limpieza } =
      buscarForm;

    if (!fechaEvento || !horaInicio || !horaFin || !cantidadPersonas) {
      toast.error(
        "Completá los datos de fecha, horario y cantidad de personas."
      );
      return;
    }

    let url = "/reservas/create-by-user";
    let body: any = {
      idEspacio: espacio.idEspacio,
      fechaEvento,
      horaInicio: timeToBackendFormat(horaInicio),
      horaFin: timeToBackendFormat(horaFin),
      cantidadPersonas: Number(cantidadPersonas),
      cantidadHoraExtra: null,
      limpieza,
    };

    // Admin / Aux reservando para otro (por CI)
    if (isAdminOrAux && reservarParaOtro) {
      const doc = documentoOtro.trim();

      // 7 u 8 dígitos sin puntos ni guiones
      if (!/^[0-9]{7,8}$/.test(doc)) {
        toast.error(
          "Debés indicar una cédula válida (7 u 8 dígitos, sin puntos ni guiones)."
        );
        return;
      }

      url = "/reservas/create";
      body = {
        ...body,
        documento: doc,
      };
    }

    try {
      setIsCreatingReservaId(espacio.idEspacio);

      await apiClient(url, token, {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success(
        `Reserva creada con éxito para "${espacio.nombre}" en la fecha seleccionada.`
      );

      if (viewScope === "ALL" && isAdminOrAux) {
        await fetchReservasActivas(0, pageSize);
      } else {
        await fetchMisReservas(0, pageSize);
      }
    } catch (error: any) {
      console.error("Error creando reserva:", error);
      toast.error(
        error?.message ||
          "Ocurrió un error al crear la reserva. Revisá los datos."
      );
    } finally {
      setIsCreatingReservaId(null);
    }
  }

  // ----------------- cancelar reserva -----------------

  // async function handleCancelarReserva(reserva: ReservaEspacioListado) {
  //   if (!ensureToken()) return;

  //   const isAdminViewAll = isAdminOrAux && viewScope === "ALL";

  //   const mensajeConfirmacion = isAdminViewAll
  //     ? `¿Seguro que querés cancelar la reserva #${reserva.idReserva} del usuario "${reserva.nombreUsuario}" en el espacio "${reserva.nombreEspacio}"?`
  //     : `¿Seguro que querés cancelar la reserva #${reserva.idReserva} del espacio "${reserva.nombreEspacio}"?`;

  //   if (!confirm(mensajeConfirmacion)) return;

  //   try {
  //     setIsCancellingId(reserva.idReserva);

  //     const url = isAdminViewAll
  //       ? "/reservas/cancelar"
  //       : "/reservas/cancelar-by-user";

  //     await apiClient(url, token, {
  //       method: "PATCH",
  //       body: JSON.stringify({ idReserva: reserva.idReserva }),
  //     });

  //     toast.success("Reserva cancelada correctamente.");

  //     setPageData((prev) =>
  //       prev
  //         ? {
  //             ...prev,
  //             content: prev.content.filter(
  //               (r) => r.idReserva !== reserva.idReserva
  //             ),
  //             totalElements: prev.totalElements - 1,
  //           }
  //         : prev
  //     );
  //   } catch (error: any) {
  //     console.error("Error cancelando reserva:", error);
  //     toast.error(error?.message || "Ocurrió un error al cancelar la reserva.");
  //   } finally {
  //     setIsCancellingId(null);
  //   }
  // }

  function openCancelDialog(reserva: ReservaEspacioListado) {
    const isAdminViewAll = isAdminOrAux && viewScope === "ALL";

    const mensajeConfirmacion = isAdminViewAll
      ? `¿Seguro que querés cancelar la reserva #${reserva.idReserva} del usuario "${reserva.nombreUsuario}" en el espacio "${reserva.nombreEspacio}"?`
      : `¿Seguro que querés cancelar la reserva #${reserva.idReserva} del espacio "${reserva.nombreEspacio}"?`;

    setCancelDialog({
      isOpen: true,
      reserva,
      message: mensajeConfirmacion,
    });
  }

  async function handleConfirmCancel() {
    if (!cancelDialog.reserva || !ensureToken()) return;

    try {
      setIsCancellingId(cancelDialog.reserva.idReserva);

      const isAdminViewAll = isAdminOrAux && viewScope === "ALL";
      const url = isAdminViewAll
        ? "/reservas/cancelar"
        : "/reservas/cancelar-by-user";

      await apiClient(url, token, {
        method: "PATCH",
        body: JSON.stringify({ idReserva: cancelDialog.reserva.idReserva }),
      });

      toast.success("Reserva cancelada correctamente.");

      setPageData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.filter(
                (r) => r.idReserva !== cancelDialog.reserva!.idReserva
              ),
              totalElements: prev.totalElements - 1,
            }
          : prev
      );
    } catch (error: any) {
      console.error("Error cancelando reserva:", error);
      toast.error(error?.message || "Ocurrió un error al cancelar la reserva.");
    } finally {
      setIsCancellingId(null);
      setCancelDialog({ isOpen: false, reserva: null, message: "" });
    }
  }

  // ----------------- paginación -----------------

  function handlePageChange(newPage: number) {
    if (newPage < 0 || newPage >= totalPages) return;
    if (viewScope === "ALL" && isAdminOrAux) {
      fetchReservasActivas(newPage, pageSize);
    } else {
      fetchMisReservas(newPage, pageSize);
    }
  }

  function handlePageSizeChange(newSize: number) {
    if (newSize <= 0) return;
    if (viewScope === "ALL" && isAdminOrAux) {
      fetchReservasActivas(0, newSize);
    } else {
      fetchMisReservas(0, newSize);
    }
  }

  // ----------------- filtros en memoria -----------------

  const reservasFiltradas = reservas.filter((r) => {
    const matchEspacio = filtroEspacio
      ? r.nombreEspacio.toLowerCase().includes(filtroEspacio.toLowerCase())
      : true;
    const matchFecha = filtroFecha ? r.fechaEvento === filtroFecha : true;
    return matchEspacio && matchFecha;
  });

  // ----------------- render -----------------

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <GuideInitializer />
      {/* ----- Formulario de búsqueda / alta de reservas ----- */}
      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold">Reservar un espacio</h2>

          {isAdminOrAux && (
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                id="reservarOtro"
                checked={reservarParaOtro}
                onCheckedChange={(checked) =>
                  setReservarParaOtro(Boolean(checked))
                }
              />
              <Label htmlFor="reservarOtro">
                Reservar para otro usuario (Cédula)
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{7,8}"
                maxLength={8}
                className="w-32"
                disabled={!reservarParaOtro}
                value={documentoOtro}
                onChange={(e) =>
                  setDocumentoOtro(e.target.value.replace(/\D/g, ""))
                }
              />
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Fecha del evento</Label>
            <Input
              type="date"
              value={buscarForm.fechaEvento}
              onChange={(e) =>
                setBuscarForm((f) => ({ ...f, fechaEvento: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Hora de inicio</Label>
            <Input
              type="time"
              value={buscarForm.horaInicio}
              onChange={(e) =>
                setBuscarForm((f) => ({ ...f, horaInicio: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Hora de fin</Label>
            <Input
              type="time"
              value={buscarForm.horaFin}
              onChange={(e) =>
                setBuscarForm((f) => ({ ...f, horaFin: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Cantidad de personas</Label>
            <Input
              type="number"
              min={1}
              value={buscarForm.cantidadPersonas}
              onChange={(e) =>
                setBuscarForm((f) => ({
                  ...f,
                  cantidadPersonas:
                    e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <Checkbox
              id="limpieza"
              checked={buscarForm.limpieza}
              onCheckedChange={(checked) =>
                setBuscarForm((f) => ({
                  ...f,
                  limpieza: Boolean(checked),
                }))
              }
            />
            <Label htmlFor="limpieza">¿Requiere servicio de limpieza?</Label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleBuscarEspacios}
            disabled={isSearching}
          >
            {isSearching ? "Buscando..." : "Buscar espacios disponibles"}
          </Button>
        </div>

        {/* Lista de espacios disponibles */}
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Espacios disponibles
          </h3>
          <div className="w-full overflow-x-auto">
            {espaciosDisponibles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay espacios listados todavía. Completá los datos y presioná{" "}
                <strong>“Buscar espacios disponibles”</strong>.
              </p>
            ) : (
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Espacio</TableHead>
                    <TableHead>Capacidad</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {espaciosDisponibles.map((espacio) => (
                    <TableRow key={espacio.idEspacio}>
                      <TableCell>{espacio.nombre}</TableCell>
                      <TableCell>{espacio.capacidad}</TableCell>
                      <TableCell>{espacio.observaciones ?? "-"}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleCrearReserva(espacio)}
                          disabled={isCreatingReservaId === espacio.idEspacio}
                        >
                          {isCreatingReservaId === espacio.idEspacio
                            ? "Creando..."
                            : "Reservar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Espacios activos y disponibles para los datos ingresados.
                </TableCaption>
              </Table>
            )}
          </div>
        </div>
      </section>

      {/* ----- Mis reservas / Todas las reservas ----- */}
      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              {viewScope === "ALL" && isAdminOrAux
                ? "Todas las reservas activas"
                : "Mis reservas activas"}
            </h2>

            {isAdminOrAux && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={viewScope === "MINE" ? "default" : "outline"}
                  onClick={() => handleScopeChange("MINE")}
                >
                  Mis reservas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewScope === "ALL" ? "default" : "outline"}
                  onClick={() => handleScopeChange("ALL")}
                >
                  Todas las reservas
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-end">
            <div className="space-y-1">
              <Label>Filtrar por espacio</Label>
              <Input
                placeholder="Salón, sala..."
                value={filtroEspacio}
                onChange={(e) => setFiltroEspacio(e.target.value)}
                className="w-full md:w-64"
              />
            </div>

            <div className="space-y-1">
              <Label>Filtrar por fecha</Label>
              <Input
                type="date"
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground md:ml-4">
              Página {pageIndex + 1} de {totalPages} · Total: {totalElements}{" "}
              reservas
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                {isAdminOrAux && viewScope === "ALL" && (
                  <TableHead>Usuario</TableHead>
                )}
                <TableHead>Espacio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Personas</TableHead>
                <TableHead>Monto total</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Vto. seña</TableHead>
                <TableHead>Pago seña</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservasFiltradas.map((r) => (
                <TableRow key={r.idReserva}>
                  {isAdminOrAux && viewScope === "ALL" && (
                    <TableCell>{r.nombreUsuario ?? "-"}</TableCell>
                  )}
                  <TableCell>{r.nombreEspacio}</TableCell>
                  <TableCell>{r.fechaEvento}</TableCell>
                  <TableCell>
                    {r.horaInicio} - {r.horaFin}{" "}
                    {r.duracion ? `(${r.duracion})` : null}
                  </TableCell>
                  <TableCell>{r.cantidadPersonas}</TableCell>
                  <TableCell>{r.montoTotal}</TableCell>
                  <TableCell>{r.saldo}</TableCell>
                  <TableCell>{r.fechaVtoSenia ?? "-"}</TableCell>
                  <TableCell>{r.fechaPagoSenia ?? "-"}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isCancellingId === r.idReserva}
                      onClick={() => openCancelDialog(r)}
                    >
                      {isCancellingId === r.idReserva
                        ? "Cancelando..."
                        : "Cancelar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {reservasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={isAdminOrAux && viewScope === "ALL" ? 10 : 9}
                  >
                    No hay reservas activas que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableCaption>
              {viewScope === "ALL" && isAdminOrAux
                ? "Listado de todas las reservas activas del sistema."
                : "Listado de tus reservas activas de espacios."}
            </TableCaption>
          </Table>
        </div>

        {/* Controles de paginación */}
        <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Filas por página</Label>
            <select
              className="h-8 rounded-md border px-2 text-sm"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              {[5, 10, 20, 30].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(0)}
              disabled={pageIndex === 0}
            >
              {"<<"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageIndex - 1)}
              disabled={pageIndex === 0}
            >
              {"<"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              {">"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={pageIndex >= totalPages - 1}
            >
              {">>"}
            </Button>
          </div>
        </div>
      </section>

      {/* AlertDialog para confirmar cancelación */}
      <AlertDialog
        open={cancelDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setCancelDialog({ isOpen: false, reserva: null, message: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isCancellingId !== null}
            >
              {isCancellingId ? "Cancelando..." : "Sí"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
