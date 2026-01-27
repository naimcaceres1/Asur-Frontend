"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type {
  Actividad,
  Usuario,
  SpringPage,
  InscripcionActividadListado,
} from "@/interfaces";
import { apiClient } from "@/helpers/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Props = {
  actividad: Actividad;
  onClose?: () => void;
};

function formatCosto(costo: number | string | null | undefined) {
  if (costo === null || costo === undefined) return "Sin costo";

  const num =
    typeof costo === "number"
      ? costo
      : typeof costo === "string"
      ? Number(costo)
      : NaN;

  if (Number.isNaN(num)) return String(costo);
  if (num === 0) return "Sin costo";

  return `$ ${num.toLocaleString("es-UY")}`;
}

// Helpers para matchear actividad <-> inscripción
function keyFromActividad(a: Actividad) {
  return `${a.nombre}__${a.fechaActividad}__${a.horaComienzo?.slice(0, 5) ?? ""}`;
}

function keyFromInscripcion(i: InscripcionActividadListado) {
  const nombre =
    (i as any).nombreActividad ??
    (i as any).actividadNombre ??
    "";
  return `${nombre}__${i.fechaActividad}__${i.horaComienzo?.slice(0, 5) ?? ""}`;
}

export function ActivitiesEnrollAdminClient({ actividad, onClose }: Props) {
  const router = useRouter();

  const { data: session } = useSession();
  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<Usuario[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);

  const [inscripciones, setInscripciones] =
    useState<InscripcionActividadListado[]>([]);
  const [inscripcionesLoading, setInscripcionesLoading] = useState(false);
  const [inscripcionesError, setInscripcionesError] = useState<string | null>(
    null
  );
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const [misInscripciones, setMisInscripciones] = useState<
    InscripcionActividadListado[]
  >([]);

  const hoyStr = new Date().toISOString().slice(0, 10);

  const inscripcionAbierta = (() => {
    if (!actividad.requiereInscripcion) return false;
    if (actividad.estado !== "PROGRAMADA") return false;

    const fecha = actividad.fechaActividad;

    if (!fecha) return false;
    if (fecha < hoyStr) return false;

    if (
      actividad.fechaAperturaInscripcion &&
      actividad.fechaAperturaInscripcion > hoyStr
    ) {
      return false;
    }

    if (fecha === hoyStr && actividad.horaComienzo) {
      const ahora = new Date();
      const [hh, mm] = actividad.horaComienzo
        .slice(0, 5)
        .split(":")
        .map(Number);
      const inicio = new Date(ahora);
      inicio.setHours(hh, mm, 0, 0);

      if (ahora >= inicio) return false;
    }

    return true;
  })();

  // ------------------------------ CARGAR INSCRIPCIONES ------------------------------

  const loadInscripciones = useCallback(async () => {
    if (!token) return;

    if (!actividad.requiereInscripcion) {
      setInscripciones([]);
      setInscripcionesError("Esta actividad no requiere inscripción.");
      return;
    }

    if (actividad.estado === "CANCELADA") {
      setInscripciones([]);
      setInscripcionesError(
        "No se pueden ver inscripciones de actividades canceladas."
      );
      return;
    }

    setInscripcionesLoading(true);
    try {
      const resp = await apiClient<SpringPage<InscripcionActividadListado>>(
        `/inscripciones/actividad/${actividad.idActividad}?page=0&size=50`,
        token
      );

      setInscripciones(resp.content ?? []);
      setInscripcionesError(null);
    } catch (err: any) {
      const msg = typeof err?.message === "string" ? err.message : "";

      if (msg.includes("Recurso no encontrado")) {
        setInscripciones([]);
        setInscripcionesError(null);
        return;
      }

      console.error("Error cargando inscripciones:", err);
      let uiMsg = "No se pudieron cargar las inscripciones.";
      if (msg) uiMsg = msg;

      setInscripcionesError(uiMsg);
      setInscripciones([]);
    } finally {
      setInscripcionesLoading(false);
    }
  }, [actividad.idActividad, actividad.estado, actividad.requiereInscripcion, token]);

  const loadMisInscripciones = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await apiClient<SpringPage<InscripcionActividadListado>>(
        "/inscripciones/mis?page=0&size=50",
        token
      );
      setMisInscripciones(resp.content ?? []);
    } catch (err) {
      console.error("Error cargando mis inscripciones (admin panel):", err);
      setMisInscripciones([]);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadInscripciones();
      loadMisInscripciones();
    }
  }, [token, loadInscripciones, loadMisInscripciones]);

  // ------------------------------ BUSCAR USUARIOS ------------------------------

  useEffect(() => {
    if (!token) return;

    const term = userSearchTerm.trim();

    if (term.length < 3) {
      setUserSearchResults([]);
      setUserSearchError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const resp = await apiClient<SpringPage<Usuario>>(
          `/users/listado-filtros?documento=${encodeURIComponent(
            term
          )}&page=0&size=10`,
          token
        );

        setUserSearchResults(resp.content ?? []);
        setUserSearchError(null);
      } catch (err: any) {
        console.error("Error buscando usuarios:", err);

        let msg = "No se pudo buscar usuarios. Probá nuevamente.";
        if (typeof err?.message === "string") {
          msg = err.message;
        }

        setUserSearchError(msg);
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [userSearchTerm, token]);

  // ------------------------------ CREAR INSCRIPCIÓN (ADMIN) ------------------------------

  async function crearInscripcionAdmin(idActividad: number, idUsuario: number) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    try {
      await apiClient("/inscripciones/create", token, {
        method: "POST",
        body: JSON.stringify({ idUsuario, idActividad }),
      });
      toast.success("Inscripción creada correctamente.");

      setSelectedUsuario(null);
      setUserSearchTerm("");
      await loadInscripciones();
      await loadMisInscripciones();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mis-inscripciones-actualizar")
        );
      }
    } catch (err: any) {
      console.error("Error creando inscripción:", err);
      toast.error(err?.message || "No se pudo crear la inscripción.");
    }
  }

  // ------------------------------ BAJA DE INSCRIPCIÓN (ADMIN) ------------------------------

  async function cancelarInscripcionAdmin(idInscripcion: number) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    setCancellingId(idInscripcion);
    try {
      await apiClient("/inscripciones/cancelar", token, {
        method: "PATCH",
        body: JSON.stringify({ idInscripcion }),
      });

      toast.success("Inscripción cancelada correctamente.");
      await loadInscripciones();
      await loadMisInscripciones();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mis-inscripciones-actualizar")
        );
      }
    } catch (err: any) {
      console.error("Error cancelando inscripción:", err);

      let msg = "No se pudo cancelar la inscripción.";
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
    } finally {
        setCancellingId(null);
    }
  }

  // ------------------------------ INSCRIBIRSE COMO USUARIO ------------------------------

  async function inscribirmeEnActividad(idActividad: number) {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return;
    }

    try {
      await apiClient("/inscripciones/inscribirse", token, {
        method: "POST",
        body: JSON.stringify({ idActividad }),
      });
      toast.success("Te inscribiste correctamente a la actividad.");
      await loadInscripciones();
      await loadMisInscripciones();

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("mis-inscripciones-actualizar")
        );
      }
    } catch (err: any) {
      console.error("Error al inscribirse:", err);
      toast.error(err?.message || "No se pudo completar la inscripción.");
    }
  }

  async function handleConfirmarInscripcion() {
    if (!inscripcionAbierta) {
      toast.error("La actividad no está abierta a inscripción.");
      return;
    }

    if (!selectedUsuario) {
      toast.error("Seleccioná un usuario de la lista antes de confirmar.");
      return;
    }

    await crearInscripcionAdmin(
      actividad.idActividad,
      selectedUsuario.idUsuario
    );
  }

  function handleCancelar() {
    if (onClose) {
      onClose();
    } else {
      router.push("/dashboard/activities");
    }
  }

  // ------------------------------ CÁLCULOS PARA LOS BOTONES ------------------------------

  const yaEstoyInscripto = (() => {
    if (!misInscripciones.length) return false;
    const kActividad = keyFromActividad(actividad);
    return misInscripciones.some(
      (ins) =>
        keyFromInscripcion(ins) === kActividad &&
        ins.estado !== "CANCELADA"
    );
  })();

  // 👇 AQUÍ el cambio importante: también chequeo por documento
  const usuarioSeleccionadoYaInscripto =
    !!selectedUsuario &&
    inscripciones.some((ins: any) => {
      const mismoId =
        typeof ins.idUsuario === "number" &&
        ins.idUsuario === selectedUsuario.idUsuario;
      const mismoDoc =
        ins.documento &&
        selectedUsuario.documento &&
        ins.documento === selectedUsuario.documento;

      return (mismoId || mismoDoc) && ins.estado !== "CANCELADA";
    });

  // ------------------------------ RENDER ------------------------------

  return (
    <div className="space-y-6">
      {/* Detalle de la actividad */}
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{actividad.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              {actividad.fechaActividad} ·{" "}
              {actividad.horaComienzo.slice(0, 5)} -{" "}
              {actividad.horaFin.slice(0, 5)}
            </p>

            <p className="text-sm text-muted-foreground">
              {actividad.nombreTipoActividad} · {actividad.nombreEspacio}
            </p>
            <p className="text-sm">
              <span className="font-medium">Costo:</span>{" "}
              {formatCosto(actividad.costo)}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge>{actividad.estado}</Badge>
            {actividad.requiereInscripcion ? (
              <span className="text-xs text-muted-foreground">
                Requiere inscripción
                {actividad.fechaAperturaInscripcion &&
                  ` (apertura: ${actividad.fechaAperturaInscripcion})`}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                No requiere inscripción
              </span>
            )}

            {inscripcionAbierta && (
              <>
                {yaEstoyInscripto ? (
                  <Button variant="outline" size="sm" disabled>
                    Ya estás inscripto en esta actividad
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      inscribirmeEnActividad(actividad.idActividad)
                    }
                  >
                    Inscribirme a esta actividad
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {actividad.requiereInscripcion && !inscripcionAbierta && (
          <p className="mt-3 text-xs text-destructive">
            Esta actividad no está abierta a inscripción.
          </p>
        )}
      </div>

      {/* Buscar usuario para inscribir */}
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <Label htmlFor="buscar-usuario">
            Buscar usuario (por documento)
          </Label>
          <Input
            id="buscar-usuario"
            value={userSearchTerm}
            onChange={(e) => {
              setUserSearchTerm(e.target.value);
              setSelectedUsuario(null);
            }}
            placeholder="Ej: (C.I) 52933210"
            disabled={!inscripcionAbierta}
          />
        </div>

        <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border bg-muted/40 p-2 text-xs">
          {userSearchLoading && (
            <p className="text-muted-foreground">Buscando usuarios...</p>
          )}

          {!userSearchLoading && userSearchError && (
            <p className="text-destructive">{userSearchError}</p>
          )}

          {!userSearchLoading &&
            !userSearchError &&
            userSearchTerm.trim().length >= 3 &&
            userSearchResults.length === 0 && (
              <p className="text-muted-foreground">
                No se encontraron usuarios con ese filtro.
              </p>
            )}

          {userSearchResults.map((u) => {
            const isSelected = selectedUsuario?.idUsuario === u.idUsuario;
            return (
              <button
                key={u.idUsuario}
                type="button"
                onClick={() => setSelectedUsuario(u)}
                className={[
                  "flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left hover:bg-background",
                  isSelected ? "bg-background/80 border" : "",
                ].join(" ")}
              >
                <span className="font-medium">
                  {u.nombre} {u.apellido}
                </span>
                <span className="text-[0.7rem] text-muted-foreground">
                  CI: {u.documento} · {u.correo}
                </span>
                <span className="text-[0.7rem] text-muted-foreground">
                  Perfil: {u.nombrePerfil} · Estado: {u.estadoDescripcion}
                </span>
              </button>
            );
          })}
        </div>

        {selectedUsuario && (
          <p className="text-xs">
            Usuario seleccionado:{" "}
            <span className="font-semibold">
              {selectedUsuario.nombre} {selectedUsuario.apellido}
            </span>{" "}
            ({selectedUsuario.correo})
          </p>
        )}
      </div>

      {/* Botones de pie */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleCancelar}>
          Cancelar
        </Button>
        <Button
          onClick={
            usuarioSeleccionadoYaInscripto
              ? undefined
              : handleConfirmarInscripcion
          }
          disabled={
            !inscripcionAbierta ||
            !selectedUsuario ||
            usuarioSeleccionadoYaInscripto
          }
        >
          {usuarioSeleccionadoYaInscripto
            ? "Usuario ya inscripto en esta actividad"
            : "Confirmar inscripción para otro usuario"}
        </Button>
      </div>

      {/* Usuarios inscriptos */}
      <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            Usuarios inscriptos en esta actividad
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInscripciones}
            disabled={inscripcionesLoading}
          >
            Refrescar
          </Button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/40 p-2 text-xs">
          {inscripcionesLoading && (
            <p className="text-muted-foreground">
              Cargando inscripciones...
            </p>
          )}

          {!inscripcionesLoading && inscripcionesError && (
            <p className="text-destructive">{inscripcionesError}</p>
          )}

          {!inscripcionesLoading &&
            !inscripcionesError &&
            inscripciones.length === 0 && (
              <p className="text-muted-foreground">
                No hay usuarios inscriptos en esta actividad.
              </p>
            )}

          {inscripciones.map((ins) => {
            return (
              <div
                key={ins.idInscripcion}
                className="flex flex-col rounded-md border bg-background/80 px-3 py-2 text-left"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">
                      {ins.nombreUsuario}
                    </span>
                    <span className="text-[0.7rem] text-muted-foreground">
                      Inscripción: {ins.fechaInscripcion}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        ins.estado === "PENDIENTE" ? "secondary" : "default"
                      }
                      className="px-2 py-0.5 text-[0.65rem] font-semibold"
                    >
                      Estado: {ins.estado}
                    </Badge>

                    <Badge
                      variant={ins.pagado ? "default" : "outline"}
                      className="px-2 py-0.5 text-[0.65rem] font-semibold"
                    >
                      Pagado: {ins.pagado ? "Sí" : "No"}
                    </Badge>

                    <Button
  variant="outline"
  size="sm"
  className="text-[0.7rem]"
  onClick={() =>
    cancelarInscripcionAdmin(ins.idInscripcion)
  }
  disabled={cancellingId === ins.idInscripcion}
>
  {cancellingId === ins.idInscripcion
    ? "Cancelando..."
    : "Cancelar"}
</Button>

                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-[0.7rem] text-muted-foreground">
                    {ins.fechaActividad} ·{" "}
                    {ins.horaComienzo.slice(0, 5)} -{" "}
                    {ins.horaFin.slice(0, 5)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
