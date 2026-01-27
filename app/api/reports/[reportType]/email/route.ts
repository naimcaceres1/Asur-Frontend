// app/api/reports/[reportType]/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import type {
  AuditFilters,
  InscriptionFilters,
  SpacesFilters,
} from "@/types";

type ReportType = "audit" | "inscriptions" | "spaces";

export async function POST(
  req: NextRequest,
  // En Next 15 params viene como Promise, hay que esperarlo
  { params }: { params: Promise<{ reportType: ReportType }> }
) {
  const { reportType } = await params;

  console.log("API reports/email llamada con tipo:", reportType);

  if (!["audit", "inscriptions", "spaces"].includes(reportType)) {
    return NextResponse.json(
      { message: `Tipo de reporte no soportado: ${reportType}` },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const token = body.token as string | undefined;
    const filters = body.filters as
      | AuditFilters
      | InscriptionFilters
      | SpacesFilters;

    if (!token) {
      return NextResponse.json(
        { message: "Falta token de autenticación" },
        { status: 401 }
      );
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (!apiBase) {
      return NextResponse.json(
        { message: "NEXT_PUBLIC_API_BASE no está configurada" },
        { status: 500 }
      );
    }

    // Payload base: solo correo (ya viene normalizado desde el helper)
    const email = (filters as any).email;
    let url = "";
    const payload: any = { correo: email };

    // =========================
    // AUDITORÍA
    // =========================
    if (reportType === "audit") {
      const f = filters as AuditFilters;

      // Solo agregar userId si tiene un valor real ingresado por el usuario
      if (f.userId && f.userId.trim() !== "") {
        payload.idUsuario = Number(f.userId);
      }

      // Solo agregar functionalityId si tiene un valor real ingresado por el usuario
      if (f.functionalityId && f.functionalityId.trim() !== "") {
        payload.idFuncionalidad = Number(f.functionalityId);
      }

      const hasFrom = !!f.fromDate && f.fromDate.trim() !== "";
      const hasTo = !!f.toDate && f.toDate.trim() !== "";

      if (hasFrom && hasTo) {
        payload.fechaDesde = f.fromDate;
        payload.fechaHasta = f.toDate;
        payload.rangoFechasValido =
          new Date(f.fromDate) <= new Date(f.toDate);
      } else if (hasFrom || hasTo) {
        // Solo una de las fechas => error de uso, no de backend
        return NextResponse.json(
          {
            message:
              "Para filtrar por fechas en auditoría completá ambas: desde y hasta.",
          },
          { status: 400 }
        );
      }

      url = `${apiBase}/reportes/auditoria/excel/email`;
    }

    // =========================
    // INSCRIPCIONES
    // =========================
    else if (reportType === "inscriptions") {
      const f = filters as InscriptionFilters;

      const hasFrom = !!f.fromDate && f.fromDate.trim() !== "";
      const hasTo = !!f.toDate && f.toDate.trim() !== "";

      if (hasFrom && hasTo) {
        payload.fechaDesde = f.fromDate;
        payload.fechaHasta = f.toDate;
      } else if (hasFrom || hasTo) {
        return NextResponse.json(
          {
            message:
              "Para filtrar por fechas en inscripciones completá ambas: desde y hasta.",
          },
          { status: 400 }
        );
      }

      // Solo agregar activityId si tiene un valor real ingresado por el usuario
      if (f.activityId && f.activityId.trim() !== "") {
        payload.idActividades = [Number(f.activityId)];
      }

      // Solo agregar typeId si tiene un valor real ingresado por el usuario
      if (f.typeId && f.typeId.trim() !== "") {
        payload.idTiposActividad = [Number(f.typeId)];
      }

      // Solo agregar estados si no es "ALL"
      if (f.status && f.status !== "ALL") {
        payload.estados = [f.status];
      }

      url =
        `${apiBase}` +
        `/reportes/actividades/inscripciones/excel/email`;
    }

    // =========================
    // ESPACIOS
    // =========================
    else {
      const f = filters as SpacesFilters;

      const hasFrom = !!f.fromDate && f.fromDate.trim() !== "";
      const hasTo = !!f.toDate && f.toDate.trim() !== "";

      if (hasFrom && hasTo) {
        payload.fechaDesde = f.fromDate;
        payload.fechaHasta = f.toDate;
        // NO mandamos rangoFechasValido, el backend no lo necesita
      } else if (hasFrom || hasTo) {
        return NextResponse.json(
          {
            message:
              "Para filtrar por fechas en reservas completá ambas: desde y hasta.",
          },
          { status: 400 }
        );
      }

      // Solo agregar spaceId si tiene un valor real ingresado por el usuario
      if (f.spaceId && f.spaceId.trim() !== "") {
        payload.idEspacios = [Number(f.spaceId)];
      }

      // Solo agregar estados si no es "ALL"
      if (f.status && f.status !== "ALL") {
        if (f.status === "ACTIVAS") {
          payload.estados = [true];
        } else {
          payload.estados = [false];
        }
      }

      url = `${apiBase}/reportes/espacios/excel/email`;
    }

    console.log(
      `[REPORTS] Enviando a backend (${reportType}):`,
      JSON.stringify(payload, null, 2)
    );

    const backendResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const backendText = await backendResponse.text();
    console.log(
      `Respuesta backend (${reportType}):`,
      backendText || backendResponse.statusText
    );

    // Error HTTP real del backend
    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: backendText || "Error al enviar reporte en backend" },
        { status: backendResponse.status }
      );
    }

    // Caso especial: 200 pero sin datos -> lo tratamos como "no data"
    if (
      backendText &&
      backendText.toLowerCase().includes("no se encontraron")
    ) {
      return NextResponse.json(
        { message: backendText },
        { status: 404 }
      );
    }

    // Éxito real
    return NextResponse.json({
      ok: true,
      message:
        backendText || "Reporte generado y enviado correctamente",
    });
  } catch (error) {
    console.error(
      `Error en API route /api/reports/${reportType}/email:`,
      error
    );
    return NextResponse.json(
      { message: "Error interno en API de reportes" },
      { status: 500 }
    );
  }
}