"use client";

import { useEffect, useMemo, useState } from "react";

import type { Actividad } from "@/interfaces";
import { ActivitiesEnrollAdminClient } from "@/components/activities-enroll-admin-client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  initialActividades: Actividad[];
  defaultActividadId?: number | null;
  onClose?: () => void;
};

export function ActivitiesEnrollAdminSelectorClient({
  initialActividades,
  defaultActividadId = null,
  onClose,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(
    defaultActividadId ?? null
  );

  // sincronizar si cambia default
  useEffect(() => {
    setSelectedId(defaultActividadId ?? null);
  }, [defaultActividadId]);

  const hoyStr = new Date().toISOString().slice(0, 10);

  // 👉 SOLO actividades inscribibles para admin:
  // - requieren inscripción
  // - no canceladas ni finalizadas
  // - fecha de actividad >= hoy
  // - si hay fechaAperturaInscripcion, ya empezó
  const actividadesSeleccionables = useMemo(
    () =>
      (initialActividades ?? []).filter((a) => {
        if (!a.requiereInscripcion) return false;

        if (a.estado === "CANCELADA" || a.estado === "FINALIZADA") {
          return false;
        }

        if (!a.fechaActividad) return false;
        if (a.fechaActividad < hoyStr) return false;

        if (
          a.fechaAperturaInscripcion &&
          a.fechaAperturaInscripcion > hoyStr
        ) {
          // todavía no empezó la inscripción
          return false;
        }

        return true;
      }),
    [initialActividades, hoyStr]
  );

  // actividad seleccionada (la buscamos entre todas las que vinieron)
  const selectedActividad = useMemo(
    () =>
      (initialActividades ?? []).find((a) => a.idActividad === selectedId) ??
      null,
    [initialActividades, selectedId]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2 rounded-lg border bg-card p-4">
        <Label>Actividad</Label>
        <Select
          value={selectedId ? String(selectedId) : ""}
          onValueChange={(v) => {
            if (!v) {
              setSelectedId(null);
              return;
            }
            const id = Number(v);
            setSelectedId(Number.isNaN(id) ? null : id);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccioná una actividad" />
          </SelectTrigger>
          <SelectContent>
            {actividadesSeleccionables.length === 0 ? (
              <SelectItem value="none" disabled>
                No hay actividades con inscripción abierta para administrar.
              </SelectItem>
            ) : (
              actividadesSeleccionables.map((a) => (
                <SelectItem
                  key={a.idActividad}
                  value={String(a.idActividad)}
                >
                  {a.nombre} · {a.fechaActividad}{" "}
                  {a.horaComienzo?.slice(0, 5)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedActividad ? (
        <ActivitiesEnrollAdminClient
          actividad={selectedActividad}
          onClose={onClose}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          Seleccioná una actividad de la lista para ver los usuarios inscriptos,
          inscribir a un usuario o inscribirte.
        </p>
      )}
    </div>
  );
}
