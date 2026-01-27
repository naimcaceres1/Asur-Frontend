"use client";

import {
    useMemo,
    useEffect,
    useState,
    useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import type {
    Actividad,
    InscripcionActividadListado,
    SpringPage,
} from "@/interfaces";
import { apiClient } from "@/helpers/api-client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
    initialActividades: Actividad[];
};

function getCategoriaFecha(fecha: string, hoy: string) {
    if (!fecha) return "desconocida" as const;
    if (fecha < hoy) return "pasada" as const;
    if (fecha === hoy) return "hoy" as const;
    return "futura" as const;
}

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

function puedeInscribirse(a: Actividad, hoyStr: string) {
    if (!a.requiereInscripcion) return false;
    if (a.estado !== "PROGRAMADA") return false;
    if (!a.fechaActividad) return false;

    // actividad en el pasado
    if (a.fechaActividad < hoyStr) return false;

    // apertura aún en el futuro
    if (
        a.fechaAperturaInscripcion &&
        a.fechaAperturaInscripcion > hoyStr
    ) {
        return false;
    }

    // si es HOY, solo permitir si todavía no empezó
    if (a.fechaActividad === hoyStr && a.horaComienzo) {
        const ahora = new Date();
        const [hh, mm] = a.horaComienzo
            .slice(0, 5)
            .split(":")
            .map(Number);
        const inicio = new Date(ahora);
        inicio.setHours(hh, mm, 0, 0);

        if (ahora >= inicio) return false;
    }

    return true;
}

function inscripcionAbreFuturo(a: Actividad, hoyStr: string) {
    return (
        a.requiereInscripcion &&
        !!a.fechaAperturaInscripcion &&
        a.fechaAperturaInscripcion > hoyStr
    );
}

// Helpers para poder matchear actividad <-> inscripción
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

export function ActivitiesInscriptionsClient({ initialActividades }: Props) {
    const todas = initialActividades ?? [];

    const { data: session } = useSession();
    const token =
        (session as any)?.userData?.accessToken ||
        (session as any)?.accessToken ||
        "";

    const hoyStr = new Date().toISOString().slice(0, 10);

    const actividades = useMemo(
        () =>
            (todas ?? []).filter((a) => {
                if (a.estado !== "PROGRAMADA") return false;
                if (!a.fechaActividad) return false;
                if (a.fechaActividad < hoyStr) return false;
                return true;
            }),
        [todas, hoyStr]
    );

    const [misInscripciones, setMisInscripciones] = useState<
        InscripcionActividadListado[]
    >([]);

    const loadMisInscripciones = useCallback(async () => {
        if (!token) return;
        try {
            const resp = await apiClient<SpringPage<InscripcionActividadListado>>(
                "/inscripciones/mis?page=0&size=50",
                token
            );
            setMisInscripciones(resp.content ?? []);
        } catch (err) {
            console.error("Error cargando mis inscripciones (cards):", err);
            setMisInscripciones([]);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            loadMisInscripciones();
        }
    }, [token, loadMisInscripciones]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handler = () => {
            if (token) {
                loadMisInscripciones();
            }
        };

        window.addEventListener("mis-inscripciones-actualizar", handler);
        return () =>
            window.removeEventListener("mis-inscripciones-actualizar", handler);
    }, [token, loadMisInscripciones]);

    const inscripcionesMap = useMemo(() => {
        const map = new Map<string, InscripcionActividadListado>();
        for (const ins of misInscripciones) {
            const k = keyFromInscripcion(ins);
            map.set(k, ins);
        }
        return map;
    }, [misInscripciones]);

    const proximaId = useMemo(() => {
        if (!actividades.length) return null;

        let mejorId: number | null = null;
        let mejorDiff = Number.POSITIVE_INFINITY;

        for (const a of actividades) {
            if (!a.fechaActividad) continue;
            const fecha = a.fechaActividad;

            if (fecha < hoyStr) continue;

            const diffMs =
                new Date(fecha).getTime() - new Date(hoyStr).getTime();

            if (diffMs >= 0 && diffMs < mejorDiff) {
                mejorDiff = diffMs;
                mejorId = a.idActividad;
            }
        }

        return mejorId;
    }, [actividades, hoyStr]);

    async function handleInscribirse(idActividad: number) {
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

    if (!actividades || actividades.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No hay actividades programadas para las próximas fechas.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-6">

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {actividades.map((a) => {
                    const categoria = getCategoriaFecha(a.fechaActividad, hoyStr);
                    const esProxima = proximaId === a.idActividad;
                    const puedeIns = puedeInscribirse(a, hoyStr);
                    const abreFuturo = inscripcionAbreFuturo(a, hoyStr);

                    const key = keyFromActividad(a);
                    const miInscripcion = inscripcionesMap.get(key) || null;
                    const yaInscripto =
                        !!miInscripcion && miInscripcion.estado !== "CANCELADA";

                    return (
                        <Card
                            key={a.idActividad}
                            className={`flex h-full flex-col justify-between transition-shadow hover:shadow-md ${esProxima ? "border-primary/60" : ""
                                }`}
                        >
                            <CardHeader className="space-y-1 pb-2">
                                <CardTitle className="text-base font-semibold leading-tight">
                                    {a.nombre}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {a.fechaActividad} · {a.horaComienzo.slice(0, 5)} - {a.horaFin.slice(0, 5)}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {esProxima && (
                                        <Badge className="text-[0.65rem]">Próxima</Badge>
                                    )}
                                    {categoria === "hoy" && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[0.65rem]"
                                        >
                                            Hoy
                                        </Badge>
                                    )}
                                    {categoria === "futura" && !esProxima && (
                                        <Badge
                                            variant="outline"
                                            className="text-[0.65rem]"
                                        >
                                            Futura
                                        </Badge>
                                    )}
                                    {a.requiereInscripcion && puedeIns && !yaInscripto && (
                                        <Badge
                                            variant="default"
                                            className="text-[0.65rem]"
                                        >
                                            Inscripción abierta
                                        </Badge>
                                    )}
                                    {abreFuturo && !yaInscripto && (
                                        <Badge
                                            variant="outline"
                                            className="text-[0.65rem]"
                                        >
                                            Inscripción próximamente
                                        </Badge>
                                    )}
                                    {!a.requiereInscripcion && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[0.65rem]"
                                        >
                                            Sin inscripción previa
                                        </Badge>
                                    )}
                                    {yaInscripto && (
                                        <Badge
                                            variant="secondary"
                                            className="text-[0.65rem]"
                                        >
                                            Ya estás inscripto
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="mt-1 flex flex-1 flex-col gap-2 text-sm">
                                <p>
                                    <span className="font-medium">Tipo: </span>
                                    {a.nombreTipoActividad}
                                </p>
                                <p>
                                    <span className="font-medium">Espacio: </span>
                                    {a.nombreEspacio}
                                </p>
                                <p>
                                    <span className="font-medium">Costo: </span>
                                    {formatCosto(a.costo)}
                                </p>

                                {a.requiereInscripcion && (
                                    <p className="text-xs text-muted-foreground">
                                        Inscripción:{" "}
                                        {a.fechaAperturaInscripcion
                                            ? `desde ${a.fechaAperturaInscripcion}.`
                                            : "abierta hasta el comienzo de la actividad."}
                                    </p>
                                )}

                                {!a.requiereInscripcion && (
                                    <p className="text-xs text-muted-foreground">
                                        No requiere inscripción previa: podés asistir
                                        directamente.
                                    </p>
                                )}

                                <div className="mt-3 border-t pt-3 space-y-2">
                                    {yaInscripto && (
                                        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-center text-xs font-medium text-emerald-400">
                                            Ya estás inscripto en esta actividad.
                                        </p>
                                    )}

                                    {!yaInscripto && puedeIns && (
                                        <Button
                                            className="w-full"
                                            onClick={() =>
                                                handleInscribirse(a.idActividad)
                                            }
                                        >
                                            Inscribirme
                                        </Button>
                                    )}

                                    {!yaInscripto &&
                                        a.requiereInscripcion &&
                                        abreFuturo && (
                                            <Button className="w-full" disabled>
                                                Inscripción aún no disponible
                                            </Button>
                                        )}

                                    {!yaInscripto &&
                                        !a.requiereInscripcion &&
                                        !puedeIns && (
                                            <Button className="w-full" disabled>
                                                No requiere inscripción
                                            </Button>
                                        )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
