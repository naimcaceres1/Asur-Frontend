"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import type { AuditFilters } from "@/types";
import {
  INITIAL_AUDIT_FILTERS,
  getAuthToken,
  sendAuditReportEmail,
} from "@/helpers/api-reports";

export default function AuditReportsPage() {
  const { data: session } = useSession();
  const [filters, setFilters] =
    useState<AuditFilters>(INITIAL_AUDIT_FILTERS);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const token = getAuthToken(session);

  function handleChange<K extends keyof AuditFilters>(
    key: K,
    value: AuditFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSendEmail() {
    try {
      setIsSendingEmail(true);
      await sendAuditReportEmail(token, filters);
      // Toast de éxito se maneja en el helper
    } catch (error) {
      console.error("Error al enviar reporte de auditoría:", error);
    } finally {
      setIsSendingEmail(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Reportes de auditoría
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generá y enviá reportes de auditoría filtrados por fecha,
          usuario o funcionalidad.
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
          <Label htmlFor="userId">ID de usuario</Label>
          <Input
            id="userId"
            type="number"
            placeholder="Ej: 6"
            value={filters.userId}
            onChange={(e) => handleChange("userId", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="functionalityId">ID de funcionalidad</Label>
          <Input
            id="functionalityId"
            type="number"
            placeholder="Ej: 12"
            value={filters.functionalityId}
            onChange={(e) =>
              handleChange("functionalityId", e.target.value)
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2 lg:col-span-1">
          <Label htmlFor="email">
            Correo de destino <span className="text-red-500">*</span>
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

      {/* Acciones - Botón consistente con las otras páginas */}
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