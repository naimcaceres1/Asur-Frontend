"use client";

import { useEffect, useState, useRef } from "react";

import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type {
  Actividad,
  EstadoActividad,
  Espacios,
  TipoActividadDTO,
} from "@/interfaces";
import { apiClient } from "@/helpers/api-client";
import { ActivityTypesManager } from "@/components/activity-types-manager";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  CheckCircle2,
  Flag,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

const nombreActividadRegex =
  /^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{2,}(?:\s?[A-Za-zÁÉÍÓÚÑáéíóúñ0-9]*)*$/;

function isTimeAfter(a: string, b: string) {
  return a > b;
}

function isDateAfter(a: string, b: string) {
  return a > b;
}

function formatCosto(costo: number | string | null | undefined) {
  if (costo === null || costo === undefined) {
    return "Sin costo";
  }

  const num =
    typeof costo === "number"
      ? costo
      : typeof costo === "string"
      ? Number(costo)
      : NaN;

  if (Number.isNaN(num)) {
    return String(costo);
  }

  if (num === 0) return "Sin costo";
  return `$ ${num.toLocaleString("es-UY")}`;
}

function getEstadoVisual(a: Actividad): string {
  // Si la base ya dice FINALIZADA o CANCELADA, respetamos
  if (a.estado === "FINALIZADA" || a.estado === "CANCELADA") {
    return a.estado;
  }

  // Para cualquier otro estado distinto de PROGRAMADA, lo dejamos igual
  if (a.estado !== "PROGRAMADA") {
    return a.estado;
  }

  // Si no tenemos datos suficientes de fecha/hora, mostramos lo que viene
  if (!a.fechaActividad || !a.horaComienzo) {
    return a.estado;
  }

  const inicio = new Date(
    `${a.fechaActividad}T${a.horaComienzo.slice(0, 5)}:00`
  );

  // 👉 Ahora exigimos que haya horaFin; si falta, devolvemos lo que venga de BD
  if (!a.horaFin) {
    return a.estado;
  }

  const fin = new Date(`${a.fechaActividad}T${a.horaFin.slice(0, 5)}:00`);

  const ahora = new Date();

  if (ahora < inicio) {
    return "PROGRAMADA";
  }

  if (ahora >= inicio && ahora < fin) {
    return "COMENZADA";
  }

  return "FINALIZADA";
}

const actividadFormSchema = z
  .object({
    nomActividad: z
      .string()
      .trim()
      .min(2, { message: "El nombre es obligatorio" })
      .max(100, { message: "El nombre admite hasta 100 caracteres" })
      .regex(nombreActividadRegex, {
        message: "El nombre debe contener letras y no solo símbolos o números",
      }),
    fecActividad: z
      .string()
      .min(1, { message: "La fecha es obligatoria" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Usá formato YYYY-MM-DD",
      }),
    horComienzo: z
      .string()
      .min(1, { message: "La hora de comienzo es obligatoria" })
      .regex(/^\d{2}:\d{2}$/, {
        message: "Usá formato HH:MM",
      }),
    horFin: z
      .string()
      .min(1, { message: "La hora de fin es obligatoria" })
      .regex(/^\d{2}:\d{2}$/, {
        message: "Usá formato HH:MM",
      }),
    descripcion: z
      .string()
      .max(100, { message: "Máximo 100 caracteres" })
      .optional(),
    costo: z.coerce
      .number()
      .int({ message: "El costo debe ser un entero" })
      .min(0, { message: "Debe ser igual o mayor a 0" }),
    requiereInscripcion: z.boolean().default(false),
    fechaAperturaInscripcion: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), {
        message: "Usá formato YYYY-MM-DD",
      }),
    observaciones: z
      .string()
      .max(200, { message: "Máximo 200 caracteres" })
      .optional(),
    idTipoActividad: z.coerce
      .number()
      .min(1, { message: "Seleccioná el tipo de actividad" }),
    idEspacio: z.coerce.number().min(1, { message: "Seleccioná el espacio" }),
  })
  .superRefine((values, ctx) => {
    if (values.horComienzo && values.horFin) {
      if (!isTimeAfter(values.horFin, values.horComienzo)) {
        ctx.addIssue({
          code: "custom",
          path: ["horFin"],
          message: "La hora de fin debe ser posterior a la hora de comienzo.",
        });
      }
    }

    if (!values.requiereInscripcion) return;

    if (!values.fechaAperturaInscripcion) {
      ctx.addIssue({
        code: "custom",
        path: ["fechaAperturaInscripcion"],
        message: "Requerido si la actividad requiere inscripción.",
      });
      return;
    }

    if (
      values.fecActividad &&
      values.fechaAperturaInscripcion > values.fecActividad
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["fechaAperturaInscripcion"],
        message:
          "La fecha de apertura no puede ser posterior a la fecha de la actividad.",
      });
    }
  });

type ActividadFormValues = z.infer<typeof actividadFormSchema>;

type Props = {
  initialActividades: Actividad[];
  initialTipos: TipoActividadDTO[];
  initialEspacios: Espacios[];
};

export function ActivitiesAdminClient({
  initialActividades,
  initialTipos,
  initialEspacios,
}: Props) {
  const [actividades, setActividades] =
    useState<Actividad[]>(initialActividades);
  const [tipos, setTipos] = useState<TipoActividadDTO[]>(initialTipos);
  const [espacios, setEspacios] = useState<Espacios[]>(initialEspacios);

  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const [filters, setFilters] = useState({
    nombre: "",
    idTipoActividad: "",
    fecha: "",
    costo: "",
    estado: "",
  });

  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(
    null
  );

  const [showTiposSection, setShowTiposSection] = useState(true);
  const [showCreateSection, setShowCreateSection] = useState(true);
  const [showTablaSection, setShowTablaSection] = useState(true);
  const [showEditSection, setShowEditSection] = useState(true);

  // 🔽 NUEVO: refs para scroll
  const tableSectionRef = useRef<HTMLElement | null>(null);
  const editSectionRef = useRef<HTMLElement | null>(null);

  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const hoyStr = new Date().toISOString().slice(0, 10);

  const createForm = useForm<ActividadFormValues>({
    resolver: zodResolver(actividadFormSchema) as any,
    defaultValues: {
      nomActividad: "",
      fecActividad: "",
      horComienzo: "",
      horFin: "",
      descripcion: "",
      costo: 0,
      requiereInscripcion: false,
      fechaAperturaInscripcion: "",
      observaciones: "",
      idTipoActividad: 0,
      idEspacio: 0,
    },
  });

  const editForm = useForm<ActividadFormValues>({
    resolver: zodResolver(actividadFormSchema) as any,
  });

  const {
    formState: { errors, touchedFields, dirtyFields },
  } = createForm;

  function fieldStatus(name: string) {
    const hasError = !!(errors as any)[name];
    const touched = (touchedFields as any)[name];
    const dirty = (dirtyFields as any)[name];

    if (hasError && (touched || dirty)) return "error";
    if (!hasError && (touched || dirty)) return "success";
    return "default";
  }

  function inputClasses(name: string) {
    const status = fieldStatus(name);
    if (status === "error") {
      return "border-destructive focus-visible:ring-destructive";
    }
    if (status === "success") {
      return "border-emerald-500 focus-visible:ring-emerald-500";
    }
    return "";
  }

  useEffect(() => {
    setActividades(initialActividades);
    setTipos(initialTipos);
    setEspacios(initialEspacios);
  }, [initialActividades, initialTipos, initialEspacios]);

  // 🔽 NUEVO: cuando se selecciona actividad para editar → scroll al panel de edición
  useEffect(() => {
    if (selectedActividad && showEditSection && editSectionRef.current) {
      editSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedActividad, showEditSection]);

  function actividadYaComenzo(a: Actividad) {
    if (!a.fechaActividad || !a.horaComienzo) return false;
    const inicio = new Date(
      `${a.fechaActividad}T${a.horaComienzo.slice(0, 5)}:00`
    );
    return inicio <= new Date();
  }

  function canEditActivity(a: Actividad): boolean {
    if (a.estado !== "PROGRAMADA") return false;
    if (actividadYaComenzo(a)) return false;
    return true;
  }

  function canCancelActivity(a: Actividad): boolean {
    if (a.estado !== "PROGRAMADA") return false;
    if (actividadYaComenzo(a)) return false;
    return true;
  }

  function buildQueryFromFilters() {
    const params = new URLSearchParams();
    if (filters.nombre.trim()) params.append("nombre", filters.nombre.trim());
    if (filters.idTipoActividad)
      params.append("idTipoActividad", filters.idTipoActividad);
    if (filters.fecha) params.append("fecha", filters.fecha);
    if (filters.costo) params.append("costo", filters.costo);
    if (filters.estado) params.append("estado", filters.estado);
    const q = params.toString();
    return q ? `?${q}` : "";
  }

  async function loadActividades(showToast = false) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    setLoading(true);
    setNoResults(false);
    try {
      await apiClient("/actividades/verificar-finalizadas", token, {
        method: "POST",
      });

      const query = buildQueryFromFilters();
      const data = await apiClient<Actividad[]>(
        `/actividades/listado-filtros${query}`,
        token
      );
      setActividades(data);
      if (showToast) toast.success("Actividades actualizadas.");
    } catch (err: any) {
      console.error("Error al obtener actividades:", err);

      let msg = "Error al obtener actividades.";
      let esSinCoincidencias = false;

      if (typeof err?.message === "string") {
        if (err.message.includes("No se han encontrado coincidencias")) {
          esSinCoincidencias = true;
        } else {
          msg = err.message;
        }
      }

      if (esSinCoincidencias) {
        setActividades([]);
        setNoResults(true);

        if (showToast) {
          toast.info("No se encontraron actividades con esos filtros.");
        }
      } else {
        toast.error(msg);
        setActividades([]);
        setNoResults(false);
      }
    } finally {
      setLoading(false);
    }
  }

  function resetCreateForm() {
    createForm.reset({
      nomActividad: "",
      fecActividad: "",
      horComienzo: "",
      horFin: "",
      descripcion: "",
      costo: 0,
      requiereInscripcion: false,
      fechaAperturaInscripcion: "",
      observaciones: "",
      idTipoActividad: 0,
      idEspacio: 0,
    });
    setShowCreateSection(true);
  }

  function handleEditClick(a: Actividad) {
    setSelectedActividad(a);
    setShowEditSection(true);

    editForm.reset({
      nomActividad: a.nombre,
      fecActividad: a.fechaActividad,
      horComienzo: a.horaComienzo ? a.horaComienzo.slice(0, 5) : "",
      horFin: a.horaFin ? a.horaFin.slice(0, 5) : "",
      descripcion: "",
      costo: typeof a.costo === "number" ? a.costo : 0,
      requiereInscripcion: !!a.requiereInscripcion,
      fechaAperturaInscripcion: a.fechaAperturaInscripcion || "",
      observaciones: "",
      idTipoActividad: a.idTipoActividad,
      idEspacio: a.idEspacio,
    });
  }

  function handleCancelEdit() {
    setSelectedActividad(null);
    setShowEditSection(false);
    editForm.reset();
  }

  async function onSubmitCreate(values: ActividadFormValues) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    try {
      const payload = {
        nomActividad: values.nomActividad,
        fecActividad: values.fecActividad,
        horComienzo: `${values.horComienzo}:00`,
        horFin: `${values.horFin}:00`,
        descripcion: values.descripcion || null,
        costo: values.costo,
        requiereInscripcion: values.requiereInscripcion,
        fechaAperturaInscripcion:
          values.requiereInscripcion && values.fechaAperturaInscripcion
            ? values.fechaAperturaInscripcion
            : null,
        observaciones: values.observaciones || null,
        idTipoActividad: values.idTipoActividad,
        idEspacio: values.idEspacio,
      };

      await apiClient("/actividades/create", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Actividad creada correctamente.");

      resetCreateForm();
      await loadActividades();
    } catch (err: any) {
      console.error("Error guardando actividad:", err);
      toast.error(err?.message || "Error guardando la actividad.");
    }
  }

  async function onSubmitEdit(values: ActividadFormValues) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }
    if (!selectedActividad) {
      toast.error("No hay actividad seleccionada para editar.");
      return;
    }

    try {
      const payloadUpdate = {
        fecActividad: values.fecActividad,
        horComienzo: `${values.horComienzo}:00`,
        horFin: `${values.horFin}:00`,
        descripcion: values.descripcion || null,
        costo: values.costo,
        requiereInscripcion: values.requiereInscripcion,
        fechaAperturaInscripcion:
          values.requiereInscripcion && values.fechaAperturaInscripcion
            ? values.fechaAperturaInscripcion
            : null,
        formaPago: null as string | null,
        observaciones: values.observaciones || null,
        idTipoActividad: values.idTipoActividad,
        idEspacio: values.idEspacio,
      };

      await apiClient(
        `/actividades/updateactividad/${selectedActividad.idActividad}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify(payloadUpdate),
        }
      );
      toast.success("Actividad actualizada correctamente.");

      setSelectedActividad(null);
      setShowEditSection(false);
      editForm.reset();
      setShowTablaSection(true);
      await loadActividades();

      if (tableSectionRef.current) {
        tableSectionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    } catch (err: any) {
      console.error("Error guardando actividad:", err);
      toast.error(err?.message || "Error guardando la actividad.");
    }
  }

  async function handleCambiarEstado(
    actividad: Actividad,
    nuevoEstado: EstadoActividad
  ) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }
    if (nuevoEstado === actividad.estado) return;

    try {
      await apiClient(`/actividades/estado/${actividad.idActividad}`, token, {
        method: "PATCH",
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      toast.success(`Estado cambiado a ${nuevoEstado}.`);
      await loadActividades();
    } catch (err: any) {
      console.error("Error cambiando estado:", err);

      let msg = "No se pudo cambiar el estado.";
      if (typeof err?.message === "string") {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed?.message) {
            msg = parsed.message;
          } else {
            msg = err.message;
          }
        } catch {
          msg = err.message;
        }
      }

      toast.error(msg);
    }
  }

  async function handleVerificarFinalizadas() {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    try {
      const res = await apiClient<{ finalizadas: number }>(
        "/actividades/verificar-finalizadas",
        token,
        { method: "POST" }
      );
      const total = res?.finalizadas ?? 0;
      toast.success(
        `Proceso ejecutado. Actividades marcadas como FINALIZADAS: ${total}`
      );
      await loadActividades();
    } catch (err: any) {
      console.error("Error verificando finalizadas:", err);
      toast.error("Error al verificar actividades finalizadas.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground"></p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadActividades(true)}
            disabled={loading}
          >
            Refrescar listado
          </Button>
          <Button variant="outline" onClick={handleVerificarFinalizadas}>
            Verificar finalizadas
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-semibold">
          Filtros de listado de actividades
        </h2>

        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="text-sm font-medium">Nombre</label>
            <Input
              value={filters.nombre}
              onChange={(e) =>
                setFilters((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Nombre de actividad"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={filters.idTipoActividad || "all"}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  idTipoActividad: v === "all" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {tipos.map((t) => (
                  <SelectItem
                    key={t.idTipoActividad}
                    value={String(t.idTipoActividad)}
                  >
                    {t.nombreTipoActividad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Fecha</label>
            <Input
              type="date"
              value={filters.fecha}
              onChange={(e) =>
                setFilters((f) => ({ ...f, fecha: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Costo exacto</label>
            <Input
              type="number"
              min={0}
              value={filters.costo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, costo: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium">Estado</label>
            <Select
              value={filters.estado || "all"}
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  estado: v === "all" ? "" : v,
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PROGRAMADA">Programada</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
                <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setFilters({
                nombre: "",
                idTipoActividad: "",
                fecha: "",
                costo: "",
                estado: "",
              });
              setNoResults(false);
            }}
          >
            Limpiar
          </Button>
          <Button onClick={() => loadActividades(true)} disabled={loading}>
            Aplicar filtros
          </Button>
        </div>
      </section>

      {/* Tabla de actividades */}
      <section
        ref={tableSectionRef}
        className="rounded-lg border bg-card shadow-sm"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Listado de actividades</h2>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTablaSection((v) => !v)}
            className="flex items-center gap-1"
          >
            {showTablaSection ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar
              </>
            )}
          </Button>
        </div>
        {showTablaSection && (
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center">
                      Cargando actividades...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && actividades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-6 text-center">
                      {noResults
                        ? "No se han encontrado coincidencias."
                        : "No hay actividades para mostrar."}
                    </TableCell>
                  </TableRow>
                )}

                {actividades.map((a) => {
                  const estadoVisual = getEstadoVisual(a);

                  return (
                    <TableRow key={a.idActividad}>
                      <TableCell className="font-medium">{a.nombre}</TableCell>
                      <TableCell>{a.fechaActividad}</TableCell>
                      <TableCell>
                        {a.horaComienzo.slice(0, 5)} - {a.horaFin.slice(0, 5)}
                      </TableCell>

                      <TableCell>{a.nombreTipoActividad}</TableCell>
                      <TableCell>{a.nombreEspacio}</TableCell>
                      <TableCell>{formatCosto(a.costo)}</TableCell>
                      <TableCell>
                        {estadoVisual === "PROGRAMADA" && (
                          <Badge
                            variant="default"
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Programada
                          </Badge>
                        )}

                        {estadoVisual === "COMENZADA" && (
                          <Badge
                            variant="default"
                            className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            <Clock className="h-3 w-3" />
                            Comenzada
                          </Badge>
                        )}

                        {estadoVisual === "FINALIZADA" && (
                          <Badge
                            variant="secondary"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-600 px-2.5 py-0.5 text-xs font-semibold text-white"
                          >
                            <Flag className="h-3 w-3" />
                            Finalizada
                          </Badge>
                        )}

                        {estadoVisual === "CANCELADA" && (
                          <Badge
                            variant="destructive"
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          >
                            <XCircle className="h-3 w-3" />
                            Cancelada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canEditActivity(a) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(a)}
                            >
                              Editar
                            </Button>
                          )}

                          {canCancelActivity(a) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleCambiarEstado(a, "CANCELADA")
                              }
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Crear nueva actividad */}
      <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold">Crear nueva actividad</h2>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateSection((v) => !v)}
            className="flex items-center gap-1"
          >
            {showCreateSection ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar
              </>
            )}
          </Button>
        </div>

        {showCreateSection && (
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onSubmitCreate)}
              className="grid gap-4 md:grid-cols-2"
            >
              <FormField
                control={createForm.control}
                name="nomActividad"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={inputClasses("nomActividad")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="fecActividad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className={inputClasses("fecActividad")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="horComienzo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className={inputClasses("horComienzo")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="horFin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora fin</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className={inputClasses("horFin")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="idTipoActividad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de actividad</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={inputClasses("idTipoActividad")}
                        >
                          <SelectValue placeholder="Seleccioná un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipos.map((t) => (
                          <SelectItem
                            key={t.idTipoActividad}
                            value={String(t.idTipoActividad)}
                          >
                            {t.nombreTipoActividad}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="idEspacio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espacio</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className={inputClasses("idEspacio")}>
                          <SelectValue placeholder="Seleccioná un espacio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {espacios
                          .filter((e) => e.estado)
                          .map((e) => (
                            <SelectItem
                              key={e.idEspacio}
                              value={String(e.idEspacio)}
                            >
                              {e.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="costo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        className={inputClasses("costo")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="requiereInscripcion"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 pt-6">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel className="mt-0">Requiere inscripción</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {createForm.watch("requiereInscripcion") && (
                <FormField
                  control={createForm.control}
                  name="fechaAperturaInscripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha apertura inscripción</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={createForm.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción breve" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Observaciones (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Notas internas, comentarios, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCreateForm}
                >
                  Cancelar
                </Button>
                <Button type="submit">Crear actividad</Button>
              </div>
            </form>
          </Form>
        )}
      </section>

      {/* Editar actividad */}
      {selectedActividad && (
        <section
          ref={editSectionRef}
          id="panel-editar-actividad"
          className="space-y-4 rounded-lg border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold">Editar actividad</h2>
              <p className="text-sm text-muted-foreground">
                {selectedActividad.nombre}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditSection((v) => !v)}
                className="flex items-center gap-1"
              >
                {showEditSection ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Mostrar
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Cerrar edición
              </Button>
            </div>
          </div>

          {showEditSection && (
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(onSubmitEdit)}
                className="grid gap-4 md:grid-cols-2"
              >
                <FormField
                  control={editForm.control}
                  name="nomActividad"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nombre (no editable)</FormLabel>
                      <FormControl>
                        <Input {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="fecActividad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="horComienzo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="horFin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora fin</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="idTipoActividad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de actividad</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tipos.map((t) => (
                            <SelectItem
                              key={t.idTipoActividad}
                              value={String(t.idTipoActividad)}
                            >
                              {t.nombreTipoActividad}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="idEspacio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Espacio</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná un espacio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {espacios
                            .filter((e) => e.estado)
                            .map((e) => (
                              <SelectItem
                                key={e.idEspacio}
                                value={String(e.idEspacio)}
                              >
                                {e.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="costo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="requiereInscripcion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 pt-6">
                      <FormControl>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                      </FormControl>
                      <FormLabel className="mt-0">
                        Requiere inscripción
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editForm.watch("requiereInscripcion") && (
                  <FormField
                    control={editForm.control}
                    name="fechaAperturaInscripcion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha apertura inscripción</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className={inputClasses(
                              "fechaAperturaInscripcion"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={editForm.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descripción (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción breve" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observaciones (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Notas internas, comentarios, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar cambios</Button>
                </div>
              </form>
            </Form>
          )}
        </section>
      )}

      {/* Tipos de actividad */}
      <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold">Tipos de actividad</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTiposSection((v) => !v)}
            className="flex items-center gap-1"
          >
            {showTiposSection ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Mostrar
              </>
            )}
          </Button>
        </div>

        {showTiposSection && (
          <ActivityTypesManager
            tiposActivos={tipos}
            onTiposActivosChange={(nuevos) => setTipos(nuevos)}
          />
        )}
      </section>

      {/* Botón volver al inicio */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = "/dashboard/main";
          }}
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
