// components/functionalities-page-dialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { apiClient } from "@/helpers/api-client";
import type { Funcionalidad } from "@/interfaces";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type Mode = "create" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  funcionalidad?: Funcionalidad | null;
  onClose: () => void;
  onSaved: () => void;
};

export function FunctionalitiesPageDialog({
  open,
  mode,
  funcionalidad,
  onClose,
  onSaved,
}: Props) {
  const { data: session } = useSession();

  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const isEdit = mode === "edit";

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && isEdit && funcionalidad) {
      setNombre(funcionalidad.nombre ?? "");
      setDescripcion(funcionalidad.descripcion ?? "");
      setEstado(funcionalidad.estado);
    } else if (open && !isEdit) {
      setNombre("");
      setDescripcion("");
      setEstado(true);
    }
  }, [open, isEdit, funcionalidad]);

  function ensureToken(): string | null {
    if (!token) {
      toast.error("No se encontró el token de sesión.");
      return null;
    }
    return token;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (!descripcion.trim()) {
      toast.error("La descripción es obligatoria.");
      return;
    }

    const tk = ensureToken();
    if (!tk) return;

    try {
      setSubmitting(true);

      if (isEdit && funcionalidad) {
        await apiClient(
          `/funcionalidades/update/${funcionalidad.idFuncionalidad}`,
          tk,
          {
            method: "PUT",
            body: JSON.stringify({
              nombre: nombre.trim(),
              descripcion: descripcion.trim(),
              estado,
            }),
          }
        );
        toast.success("Funcionalidad actualizada correctamente.");
      } else {
        await apiClient("/funcionalidades/create", tk, {
          method: "POST",
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
          }),
        });
        toast.success("Funcionalidad creada correctamente.");
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error guardando funcionalidad:", error);
      const msg =
        error?.message ||
        (isEdit
          ? "No se pudo actualizar la funcionalidad."
          : "No se pudo crear la funcionalidad.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar funcionalidad" : "Nueva funcionalidad"}
          </DialogTitle>
          <DialogDescription>
            Completá los datos de la funcionalidad. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre de la funcionalidad <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Login de Usuario"
              value={nombre}
              maxLength={100}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="descripcion"
              placeholder="¿Qué hace esta funcionalidad?"
              value={descripcion}
              maxLength={255}
              rows={3}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Máximo 255 caracteres.
            </p>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <Label>Estado</Label>
                <p className="text-xs text-muted-foreground">
                  Si está inactiva, no debería usarse en asignaciones a perfiles.
                </p>
              </div>
              <div className="w-32">
                <Select
                  value={estado ? "true" : "false"}
                  onValueChange={(value) => setEstado(value === "true")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? "Guardando..."
                  : "Creando..."
                : isEdit
                ? "Guardar cambios"
                : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
