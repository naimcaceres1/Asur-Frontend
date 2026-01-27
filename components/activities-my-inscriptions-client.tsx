"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ChevronUp, ChevronDown } from "lucide-react";

import type {
    SpringPage,
    InscripcionActividadListado,
} from "@/interfaces";
import { apiClient } from "@/helpers/api-client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MisInscripcion = InscripcionActividadListado;

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

export function ActivitiesMyInscriptionsClient() {
    const { data: session } = useSession();
    const token =
        (session as any)?.userData?.accessToken ||
        (session as any)?.accessToken ||
        "";

    const [inscripciones, setInscripciones] = useState<MisInscripcion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSection, setShowSection] = useState(true);

    const hoyStr = new Date().toISOString().slice(0, 10);

    function puedeCancelar(ins: MisInscripcion) {
        if (ins.estado === "CANCELADA") return false;
        if (ins.fechaActividad && ins.fechaActividad < hoyStr) return false;
        return true;
    }

    const loadMisInscripciones = useCallback(async () => {
        if (!token) return;

        setLoading(true);
        try {
            const resp = await apiClient<SpringPage<MisInscripcion>>(
                "/inscripciones/mis?page=0&size=50",
                token
            );

            setInscripciones(resp.content ?? []);
            setError(null);
        } catch (err: any) {
            console.error("Error cargando mis inscripciones:", err);
            let msg = "No se pudieron cargar tus inscripciones.";
            if (typeof err?.message === "string") msg = err.message;
            setError(msg);
            setInscripciones([]);
        } finally {
            setLoading(false);
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

    async function handleCancelarInscripcion(idInscripcion: number) {
        if (!token) {
            toast.error("No se encontró el token de sesión.");
            return;
        }

        try {
            await apiClient("/inscripciones/cancelar-propia", token, {
                method: "PATCH",
                body: JSON.stringify({ idInscripcion }),
            });

            toast.success("Inscripción cancelada correctamente.");
            await loadMisInscripciones();

            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("mis-inscripciones-actualizar")
                );
            }
        } catch (err: any) {
            console.error("Error cancelando inscripción:", err);
            toast.error(
                err?.message || "No se pudo cancelar la inscripción."
            );
        }
    }

    if (!token) {
        return null;
    }

    return (
        <section className="rounded-lg border bg-card shadow-sm">
            <section className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-lg font-semibold">Mis inscripciones</h2>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSection((v) => !v)}
                    className="flex items-center gap-1"
                >
                    {showSection ? (
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
            </section>

            {showSection && (
                <div className="space-y-4 p-4">
                    <div className="flex items-center justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMisInscripciones}
                            disabled={loading}
                        >
                            Refrescar
                        </Button>
                    </div>

                    {loading && inscripciones.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Cargando tus inscripciones...
                        </p>
                    )}

                    {error && inscripciones.length === 0 && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {!loading && !error && inscripciones.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No tenés inscripciones activas por el momento.
                        </p>
                    )}

                    {inscripciones.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {inscripciones.map((ins) => {
                                const nombreActividad =
                                    (ins as any).nombreActividad ??
                                    (ins as any).actividadNombre ??
                                    "Actividad";

                                const puedeCancelarEsta = puedeCancelar(ins);

                                return (
                                    <Card
                                        key={ins.idInscripcion}
                                        className="flex h-full flex-col justify-between"
                                    >
                                        <CardHeader className="space-y-1 pb-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-base font-semibold leading-tight">
                                                    {nombreActividad}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className="text-[0.65rem]"
                                                >
                                                    {ins.estado}
                                                </Badge>
                                            </div>

                                            <p className="text-xs text-muted-foreground">
                                                {ins.fechaActividad} · {ins.horaComienzo.slice(0, 5)} - {ins.horaFin.slice(0, 5)}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                Inscripción: {ins.fechaInscripcion}
                                            </p>
                                        </CardHeader>

                                        <CardContent className="flex flex-1 flex-col gap-2 text-sm">
                                            {"costoActividad" in ins && (
                                                <p>
                                                    <span className="font-medium">Costo: </span>
                                                    {formatCosto(
                                                        (ins as any).costoActividad as any
                                                    )}
                                                </p>
                                            )}

                                            <p className="text-xs text-muted-foreground">
                                                Pagado:{" "}
                                                <span className="font-semibold">
                                                    {ins.pagado ? "Sí" : "No"}
                                                </span>
                                            </p>

                                            <div className="mt-3 border-t pt-3">
                                                {puedeCancelarEsta ? (
                                                    <Button
                                                        className="w-full"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleCancelarInscripcion(
                                                                ins.idInscripcion
                                                            )
                                                        }
                                                    >
                                                        Cancelar inscripción
                                                    </Button>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground text-center">
                                                        Esta inscripción ya no se puede cancelar
                                                        desde el sistema.
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
