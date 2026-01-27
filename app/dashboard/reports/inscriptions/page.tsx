"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import type { InscriptionFilters, StatusFilter } from "@/types";
import {
  INITIAL_INSCRIPTION_FILTERS,
  getAuthToken,
  sendInscriptionReportEmail,
} from "@/helpers/api-reports";

export default function InscriptionsReportsPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<InscriptionFilters>(
    INITIAL_INSCRIPTION_FILTERS
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const token = getAuthToken(session);

  function handleChange<K extends keyof InscriptionFilters>(
    key: K,
    value: InscriptionFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendEmail() {
    try {
      setIsSendingEmail(true);
      await sendInscriptionReportEmail(token, filters);
    } catch (error) {
      console.error("Error al enviar reporte de inscripciones:", error);
    } finally {
      setIsSendingEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reportes de inscripciones
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desde aquí vas a poder consultar y enviar por correo las
          inscripciones a actividades.
        </p>
      </div>

      <Separator />

      {/* Filtros */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="fromDate">Fecha desde</Label>
          <Input
            id="fromDate"
            type="date"
            value={filters.fromDate}
            onChange={(e) => handleChange("fromDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toDate">Fecha hasta</Label>
          <Input
            id="toDate"
            type="date"
            value={filters.toDate}
            onChange={(e) => handleChange("toDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="activityId">Actividad (ID)</Label>
          <Input
            id="activityId"
            type="number"
            placeholder="Ej: 10"
            value={filters.activityId}
            onChange={(e) =>
              handleChange("activityId", e.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="typeId">Tipo de actividad (ID)</Label>
          <Input
            id="typeId"
            type="number"
            placeholder="Ej: 3"
            value={filters.typeId}
            onChange={(e) => handleChange("typeId", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Estado de inscripción</Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              handleChange("status", value as StatusFilter)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="PENDIENTE">Pendiente</SelectItem>
              <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Correo para envío del reporte{" "}
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={filters.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Acciones - Botón con variant="outline" para consistencia */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleSendEmail}
          disabled={isSendingEmail || !filters.email}
        >
          {isSendingEmail ? "Enviando correo..." : "Enviar por correo"}
        </Button>

        <Link
          href="/dashboard/reports"
          className="ml-auto text-sm text-primary hover:underline"
        >
          ← Volver a reportes
        </Link>
      </div>
    </div>
  );
}