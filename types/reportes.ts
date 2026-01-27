// types/index.ts o types/reports.ts (depende de tu estructura)
// Tipos base para reportes
export interface BaseReport {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: ReportStatus;
}

// Reporte de Auditoría
export interface AuditReport extends BaseReport {
  type: "audit";
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  idUsuario?: number | null;
  idFuncionalidad?: number | null;
}

// Reporte de Inscripciones
export interface InscriptionReport extends BaseReport {
  type: "inscription";
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  idActividades?: number[];
  idTiposActividad?: number[];
  estados?: InscriptionStatus[];
}

// Estados
export enum ReportStatus {
  DRAFT = "draft",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export type InscriptionStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";
export type StatusFilter = InscriptionStatus | "ALL";

// Filtros para los formularios de reportes
export interface AuditFilters {
  fromDate: string;
  toDate: string;
  userId: string;
  functionalityId: string;
  email: string;
}

export interface InscriptionFilters {
  fromDate: string;
  toDate: string;
  activityId: string;
  typeId: string;
  status: StatusFilter;
  email: string;
}

// DTOs para envío al backend
export interface ReportEmailPayload {
  correo: string;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
}

export interface AuditEmailPayload extends ReportEmailPayload {
  idUsuario?: number | null;
  idFuncionalidad?: number | null;
}

export interface InscriptionEmailPayload extends ReportEmailPayload {
  idActividades?: number[];
  idTiposActividad?: number[];
  estados?: InscriptionStatus[];
}

// Reporte de reservas de espacios
export type ReservaEstadoFilter = "ALL" | "ACTIVAS" | "CANCELADAS";

export interface SpacesFilters {
  fromDate: string;
  toDate: string;
  spaceId: string;
  status: ReservaEstadoFilter;
  email: string;
}