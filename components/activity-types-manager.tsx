"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed } from "lucide-react";

import type { TipoActividadDTO } from "@/interfaces";
import { apiClient } from "@/helpers/api-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

type Props = {
    /** Lista de tipos ACTIVOS que está usando el módulo de actividades */
    tiposActivos: TipoActividadDTO[];
    /** Callback para que el widget actualice los tipos activos del padre */
    onTiposActivosChange?: (nuevos: TipoActividadDTO[]) => void;
};

export function ActivityTypesManager({
    tiposActivos,
    onTiposActivosChange,
}: Props) {
    const [tiposAll, setTiposAll] = useState<TipoActividadDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const [nombreNuevo, setNombreNuevo] = useState("");
    const [descripcionNueva, setDescripcionNueva] = useState("");

    const [editTipo, setEditTipo] = useState<TipoActividadDTO | null>(null);
    const [editDescripcion, setEditDescripcion] = useState("");

    const [bajaTipo, setBajaTipo] = useState<TipoActividadDTO | null>(null);
    const [bajaRazon, setBajaRazon] = useState("");
    const [bajaComentarios, setBajaComentarios] = useState("");

    const { data: session } = useSession();
    const token =
        (session as any)?.userData?.accessToken ||
        (session as any)?.accessToken ||
        "";

    async function loadAll() {
        if (!token) return;
        setLoading(true);
        try {
            const data = await apiClient<TipoActividadDTO[]>(
                "/tipos-actividad/listall",
                token
            );
            setTiposAll(data);
        } catch (err: any) {
            console.error("Error cargando tipos:", err);
            toast.error(
                err?.message || "No se pudieron obtener los tipos de actividad."
            );
        } finally {
            setLoading(false);
        }
    }

    async function syncActivos() {
        if (!token) return;
        try {
            const activos = await apiClient<TipoActividadDTO[]>(
                "/tipos-actividad/listactivos",
                token
            );
            onTiposActivosChange?.(activos);
        } catch (err: any) {
            console.error("Error cargando tipos activos:", err);
            toast.error("No se pudieron actualizar los tipos activos.");
        }
    }

    useEffect(() => {
        if (token) {
            loadAll();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function handleCrear() {
        const nombre = nombreNuevo.trim();
        const desc = descripcionNueva.trim();

        if (!nombre) {
            toast.error("El nombre del tipo es obligatorio.");
            return;
        }
        if (!token) {
            toast.error("No se encontró el token de sesión.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nombreTipoActividad: nombre,
                descripcionTipoActividad: desc || null,
            };

            await apiClient<TipoActividadDTO>("/tipos-actividad/create", token, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            toast.success(
                "Tipo de actividad creado. Recordá activarlo antes de usarlo en actividades."
            );

            setNombreNuevo("");
            setDescripcionNueva("");

            await loadAll();
            await syncActivos();
        } catch (err: any) {
            console.error("Error creando tipo:", err);
            toast.error(err?.message || "No se pudo crear el tipo de actividad.");
        } finally {
            setLoading(false);
        }
    }

    function abrirEdicion(tipo: TipoActividadDTO) {
        setEditTipo(tipo);
        setEditDescripcion(tipo.descripcionTipoActividad || "");
    }

    async function guardarEdicion() {
        if (!editTipo) return;
        if (!token) {
            toast.error("No se encontró el token de sesión.");
            return;
        }

        const desc = editDescripcion.trim();

        setLoading(true);
        try {
            const payload = {
                descripcionTipoActividad: desc || null,
            };

            const actualizado = await apiClient<TipoActividadDTO>(
                `/tipos-actividad/update/${editTipo.idTipoActividad}`,
                token,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                }
            );

            setTiposAll((prev) =>
                prev.map((t) =>
                    t.idTipoActividad === actualizado.idTipoActividad ? actualizado : t
                )
            );

            toast.success("Descripción actualizada correctamente.");
            setEditTipo(null);
            setEditDescripcion("");
        } catch (err: any) {
            console.error("Error actualizando tipo:", err);
            toast.error(
                err?.message || "No se pudo actualizar el tipo de actividad."
            );
        } finally {
            setLoading(false);
        }
    }

    async function handleActivar(tipo: TipoActividadDTO) {
        if (!token) {
            toast.error("No se encontró el token de sesión.");
            return;
        }

        setLoading(true);
        try {
            const actualizado = await apiClient<TipoActividadDTO>(
                `/tipos-actividad/activate/${tipo.idTipoActividad}`,
                token,
                {
                    method: "PUT",
                }
            );

            setTiposAll((prev) =>
                prev.map((t) =>
                    t.idTipoActividad === actualizado.idTipoActividad ? actualizado : t
                )
            );

            toast.success("Tipo de actividad activado.");
            await syncActivos();
        } catch (err: any) {
            console.error("Error activando tipo:", err);
            toast.error(err?.message || "No se pudo activar el tipo de actividad.");
        } finally {
            setLoading(false);
        }
    }

    function abrirBaja(tipo: TipoActividadDTO) {
        setBajaTipo(tipo);
        setBajaRazon("");
        setBajaComentarios("");
    }

    async function confirmarBaja() {
        if (!bajaTipo) return;
        if (!token) {
            toast.error("No se encontró el token de sesión.");
            return;
        }

        const razon = bajaRazon.trim();
        const comentarios = bajaComentarios.trim();

        if (!razon) {
            toast.error("La razón de baja es obligatoria.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                razonBajaTipoActividad: razon,
                comentariosBajaTipoActividad: comentarios || null,
            };

            await apiClient<string>(
                `/tipos-actividad/delete/${bajaTipo.idTipoActividad}`,
                token,
                {
                    method: "PUT",
                    body: JSON.stringify(payload),
                }
            );

            toast.success("Tipo de actividad dado de baja correctamente.");

            setBajaTipo(null);
            setBajaRazon("");
            setBajaComentarios("");

            await loadAll();
            await syncActivos();
        } catch (err: any) {
            console.error("Error dando de baja tipo:", err);
            toast.error(
                err?.message || "No se pudo dar de baja el tipo de actividad."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
                <span className="max-w-xl text-sm text-muted-foreground">
                    Administrá los tipos de actividad. Los tipos activos son los que
                    aparecen en el formulario de actividades.
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAll}
                    disabled={loading}
                    className="whitespace-nowrap"
                >
                    Refrescar
                </Button>
            </div>

            <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-semibold">Crear nuevo tipo</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="nuevo-tipo-nombre">Nombre</Label>
                        <Input
                            id="nuevo-tipo-nombre"
                            value={nombreNuevo}
                            onChange={(e) => setNombreNuevo(e.target.value)}
                            placeholder="Ej: Taller, Curso, Charla"
                        />
                    </div>

                    <div className="space-y-1 md:col-span-1">
                        <Label htmlFor="nuevo-tipo-desc">
                            Descripción (opcional)
                        </Label>
                        <Textarea
                            id="nuevo-tipo-desc"
                            rows={2}
                            value={descripcionNueva}
                            onChange={(e) => setDescripcionNueva(e.target.value)}
                            placeholder="Descripción breve para uso interno / catálogo"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-muted-foreground">
                        Al crear un nuevo tipo queda <strong>INACTIVO</strong>. Activalo
                        para que esté disponible en el alta de actividades.
                    </p>
                    <Button size="sm" onClick={handleCrear} disabled={loading}>
                        Crear tipo
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <Table className="min-w-full text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="whitespace-nowrap">
                                    Estado
                                </TableHead>
                                <TableHead className="whitespace-nowrap text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        Cargando tipos...
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading && tiposAll.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="py-6 text-center text-sm text-muted-foreground"
                                    >
                                        No hay tipos de actividad cargados.
                                    </TableCell>
                                </TableRow>
                            )}

                            {!loading &&
                                tiposAll.map((t) => (
                                    <TableRow key={t.idTipoActividad}>
                                        <TableCell className="font-medium">
                                            {t.nombreTipoActividad}
                                        </TableCell>
                                        <TableCell className="max-w-md text-sm">
                                            {t.descripcionTipoActividad || (
                                                <span className="text-muted-foreground">
                                                    Sin descripción
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="w-32">
                                            {t.estadoTipoActividad ? (
                                                <Badge
                                                    variant="default"
                                                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Activo
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="inline-flex items-center gap-1 rounded-full bg-gray-500 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-gray-600"
                                                >
                                                    <CircleDashed className="h-3 w-3" />
                                                    Inactivo
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => abrirEdicion(t)}
                                                >
                                                    Editar desc.
                                                </Button>

                                                {t.estadoTipoActividad ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => abrirBaja(t)}
                                                    >
                                                        Dar de baja
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleActivar(t)}
                                                    >
                                                        Activar
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog
                open={!!editTipo}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditTipo(null);
                        setEditDescripcion("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar descripción</DialogTitle>
                        {editTipo && (
                            <DialogDescription>
                                Tipo:{" "}
                                <span className="font-semibold">
                                    {editTipo.nombreTipoActividad}
                                </span>
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="edit-desc">Descripción</Label>
                        <Textarea
                            id="edit-desc"
                            rows={3}
                            value={editDescripcion}
                            onChange={(e) => setEditDescripcion(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setEditTipo(null);
                                setEditDescripcion("");
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button type="button" onClick={guardarEdicion} disabled={loading}>
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!bajaTipo}
                onOpenChange={(open) => {
                    if (!open) {
                        setBajaTipo(null);
                        setBajaRazon("");
                        setBajaComentarios("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dar de baja tipo de actividad</DialogTitle>
                        {bajaTipo && (
                            <DialogDescription>
                                Tipo:{" "}
                                <span className="font-semibold">
                                    {bajaTipo.nombreTipoActividad}
                                </span>
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <Label htmlFor="baja-razon">Razón de baja</Label>
                            <Input
                                id="baja-razon"
                                value={bajaRazon}
                                onChange={(e) => setBajaRazon(e.target.value)}
                                placeholder="Motivo principal (obligatorio)"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="baja-comentarios">
                                Comentarios (opcional)
                            </Label>
                            <Textarea
                                id="baja-comentarios"
                                rows={3}
                                value={bajaComentarios}
                                onChange={(e) => setBajaComentarios(e.target.value)}
                                placeholder="Detalles adicionales para auditoría interna"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setBajaTipo(null);
                                setBajaRazon("");
                                setBajaComentarios("");
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={confirmarBaja}
                            disabled={loading}
                        >
                            Confirmar baja
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
