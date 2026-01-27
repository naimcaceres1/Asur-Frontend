// helpers/api-reports.ts
import { toast } from "sonner";
import type {
  AuditFilters,
  InscriptionFilters,
  SpacesFilters,
} from "@/types";


// Filtros iniciales


export const INITIAL_AUDIT_FILTERS: AuditFilters = {
  fromDate: "",
  toDate: "",
  userId: "",
  functionalityId: "",
  email: "",
};

export const INITIAL_INSCRIPTION_FILTERS: InscriptionFilters = {
  fromDate: "",
  toDate: "",
  activityId: "",
  typeId: "",
  status: "ALL",
  email: "",
};

export const INITIAL_SPACES_FILTERS: SpacesFilters = {
  fromDate: "",
  toDate: "",
  spaceId: "",
  status: "ALL",
  email: "",
};


// Helper para token


export function getAuthToken(session: any): string {
  return (
    session?.accessToken ||
    session?.userData?.accessToken ||
    ""
  );
}


// Caller genérico a la API interna de Next


type ReportApiType = "audit" | "inscriptions" | "spaces";

async function callReportEmailApi<TFilters extends { email: string }>(
  reportType: ReportApiType,
  token: string,
  filters: TFilters,
  options: {
    successMessage: string;
    missingEmailMessage: string;
  }
): Promise<void> {
  // Normalizamos el correo: quitamos espacios (caso "algo @gmail.com")
  const normalizedEmail = filters.email.replace(/\s+/g, "");

  if (!token) {
    toast.error("No se encontró token de sesión");
    throw new Error("Sin token de autenticación");
  }

  if (!normalizedEmail) {
    toast.error(options.missingEmailMessage);
    throw new Error("Email requerido");
  }

  const normalizedFilters = {
    ...filters,
    email: normalizedEmail,
  } as TFilters;

  const response = await fetch(`/api/reports/${reportType}/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, filters: normalizedFilters }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const msg =
      data?.message ||
      `No se pudo enviar el reporte (${reportType})`;
    toast.error(msg);
    throw new Error(msg);
  }

  toast.success(options.successMessage, {
    style: { background: "#10b981", color: "white" },
  });
}
// Funciones específicas para la UI
export async function sendAuditReportEmail(
  token: string,
  filters: AuditFilters
): Promise<void> {
  return callReportEmailApi("audit", token, filters, {
    successMessage: "Reporte de auditoría enviado correctamente",
    missingEmailMessage: "Ingresá un correo de destino",
  });
}

export async function sendInscriptionReportEmail(
  token: string,
  filters: InscriptionFilters
): Promise<void> {
  return callReportEmailApi("inscriptions", token, filters, {
    successMessage: "Reporte de inscripciones enviado correctamente",
    missingEmailMessage: "Ingresá un correo para enviar el reporte",
  });
}

export async function sendSpacesReportEmail(
  token: string,
  filters: SpacesFilters
): Promise<void> {
  return callReportEmailApi("spaces", token, filters, {
    successMessage:
      "Reporte de reservas de espacios enviado correctamente",
    missingEmailMessage: "Ingresá un correo para enviar el reporte",
  });
}