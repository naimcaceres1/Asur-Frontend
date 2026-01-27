"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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

import type { SpacesFilters, ReservaEstadoFilter } from "@/types";
import {
  INITIAL_SPACES_FILTERS,
  getAuthToken,
  sendSpacesReportEmail,
} from "@/helpers/api-reports";

export default function SpacesReportsPage() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState<SpacesFilters>(
    INITIAL_SPACES_FILTERS
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const token = getAuthToken(session);

  function handleChange<K extends keyof SpacesFilters>(
    key: K,
    value: SpacesFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendEmail() {
    try {
      // ÚNICO obligatorio: email (el botón ya se deshabilita si está vacío)
      // Acá solo hacemos una validación suave del rango de fechas SI ambas están cargadas.
      if (filters.fromDate && filters.toDate) {
        const from = new Date(filters.fromDate);
        const to = new Date(filters.toDate);

        if (from > to) {
          toast.error(
            "La fecha desde no puede ser mayor que la fecha hasta"
          );
          return;
        }
      }

      setIsSendingEmail(true);
      await sendSpacesReportEmail(token, filters);
      // El toast se maneja en el helper según la respuesta de la API
    } catch (error) {
      console.error(
        "Error al enviar reporte de espacios por correo:",
        error
      );
    } finally {
      setIsSendingEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reportes de reservas de espacios
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generá y enviá por correo un Excel con las reservas de espacios,
          filtrando por fechas, espacio y estado.
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
          <Label htmlFor="spaceId">Espacio (ID)</Label>
          <Input
            id="spaceId"
            type="number"
            placeholder="Ej: 5"
            value={filters.spaceId}
            onChange={(e) => handleChange("spaceId", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Estado de la reserva</Label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              handleChange("status", value as ReservaEstadoFilter)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="ACTIVAS">Solo activas</SelectItem>
              <SelectItem value="CANCELADAS">
                Solo canceladas
              </SelectItem>
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
          />
        </div>
      </div>

      {/* Acciones - Ya tiene variant="outline" */}
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