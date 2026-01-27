"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type {
  InscripcionActividadListado,
  SpringPage,
} from "@/interfaces";
import { apiClient } from "@/helpers/api-client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type FiltrosInscripciones = {
  nombre: string;      // <-- nuevo filtro por nombre
  fechaDesde: string;
  fechaHasta: string;
  estado: string;
  pagado: string;
};

export function ActivitiesAllInscriptionsAdminClient() {
  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const [filtros, setFiltros] = useState<FiltrosInscripciones>({
    nombre: "",
    fechaDesde: "",
    fechaHasta: "",
    estado: "all",
    pagado: "all",
  });

  const [inscripciones, setInscripciones] = useState<
    InscripcionActividadListado[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Cargar listado general desde /inscripciones/activas
  // ---------------------------------------------------------------------------
  const loadInscripciones = useCallback(
    async (showToast = false) => {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const url = `/inscripciones/activas?page=0&size=200`;

        const resp = await apiClient<SpringPage<InscripcionActividadListado>>(
          url,
          token
        );

        setInscripciones(resp.content ?? []);
        if (showToast) {
          toast.success("Inscripciones activas cargadas correctamente.");
        }
      } catch (err: any) {
        console.error(
          "Error cargando listado general de inscripciones activas:",
          err
        );
        let msg =
          typeof err?.message === "string"
            ? err.message
            : "No se pudieron obtener las inscripciones.";
        setError(msg);
        setInscripciones([]);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) {
      loadInscripciones();
    }
  }, [token, loadInscripciones]);

  // ---------------------------------------------------------------------------
  // Filtros en el FRONT sobre lo que vino de /activas
  // ---------------------------------------------------------------------------
  const inscripcionesFiltradas = useMemo(() => {
    return inscripciones.filter((ins) => {
      const termino = filtros.nombre.trim().toLowerCase();

      const nombreUsuario = (ins.nombreUsuario ?? "").toLowerCase();
      const actividadNombre =
        (
          (ins as any).nombreActividad ??
          (ins as any).actividadNombre ??
          ""
        ).toLowerCase();

      if (
        termino &&
        !nombreUsuario.includes(termino) &&
        !actividadNombre.includes(termino)
      ) {
        return false;
      }

      if (filtros.fechaDesde && ins.fechaActividad < filtros.fechaDesde) {
        return false;
      }

      if (filtros.fechaHasta && ins.fechaActividad > filtros.fechaHasta) {
        return false;
      }

      if (filtros.estado !== "all" && ins.estado !== filtros.estado) {
        return false;
      }

      if (filtros.pagado === "SI" && !ins.pagado) return false;
      if (filtros.pagado === "NO" && ins.pagado) return false;

      return true;
    });
  }, [inscripciones, filtros]);

  if (!token) return null;

  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Listado general de inscripciones activas
          </h2>
          <p className="text-sm text-muted-foreground">
            Visualizá y filtrá todas las inscripciones activas del sistema
            (no canceladas).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => loadInscripciones(true)}
          disabled={loading}
        >
          Refrescar
        </Button>
      </div>

      {/* Filtros (aplicados en el front) */}
      <div className="space-y-4 border-b px-4 py-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div className="md:col-span-1">
            <label className="text-sm font-medium">
              Nombre (usuario o actividad)
            </label>
            <Input
              value={filtros.nombre}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Ej: Martín, Taller, Conferencia..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fecha desde</label>
            <Input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Fecha hasta</label>
            <Input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={filtros.estado}
              onValueChange={(v) =>
                setFiltros((f) => ({ ...f, estado: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Pagado</label>
            <Select
              value={filtros.pagado}
              onValueChange={(v) =>
                setFiltros((f) => ({ ...f, pagado: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="SI">Sí</SelectItem>
                <SelectItem value="NO">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setFiltros({
                nombre: "",
                fechaDesde: "",
                fechaHasta: "",
                estado: "all",
                pagado: "all",
              })
            }
          >
            Limpiar filtros
          </Button>
          <Button onClick={() => loadInscripciones(true)} disabled={loading}>
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto p-4">
        {loading && inscripcionesFiltradas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Cargando inscripciones...
          </p>
        )}

        {!loading && error && inscripcionesFiltradas.length === 0 && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && inscripcionesFiltradas.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No se encontraron inscripciones con esos filtros.
          </p>
        )}

        {inscripcionesFiltradas.length > 0 && (
          <Table className="min-w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Actividad</TableHead>
                <TableHead>Fecha act.</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Inscripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pagado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscripcionesFiltradas.map((ins) => {
                const nombreActividad =
                  (ins as any).nombreActividad ??
                  (ins as any).actividadNombre ??
                  "Actividad";

                return (
                  <TableRow key={ins.idInscripcion}>
                    <TableCell>{ins.nombreUsuario}</TableCell>
                    <TableCell>{nombreActividad}</TableCell>
                    <TableCell>{ins.fechaActividad}</TableCell>
                    <TableCell>
                      {ins.horaComienzo.slice(0, 5)} -{" "}
                      {ins.horaFin.slice(0, 5)}
                    </TableCell>
                    <TableCell>{ins.fechaInscripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[0.65rem]">
                        {ins.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={ins.pagado ? "default" : "outline"}
                        className="text-[0.65rem]"
                      >
                        {ins.pagado ? "Sí" : "No"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
