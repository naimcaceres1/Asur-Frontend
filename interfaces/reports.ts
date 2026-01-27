
// Estados que usa el backend (EstadoInscripcionActividad)
export type InscriptionStatus = "PENDIENTE" | "CONFIRMADA" | "CANCELADA";

// Filtro básico que usaremos en el front
export interface InscriptionFilters {
  fromDate: string;
  toDate: string;
  activityId: string;
  typeId: string;
  status: InscriptionStatus | "ALL";
  email: string;
}

// Payload para /reportes/actividades/inscripciones (sin correo)
export interface FiltroInscripcionesExcelDTO {
  fechaDesde: string | null;
  fechaHasta: string | null;
  idActividades: number[];
  idTiposActividad: number[];
  estados: InscriptionStatus[];
}

// Payload para /reportes/actividades/inscripciones/excel/email
// mapea a tu FiltroInscripcionesExcelEmailDTO del backend
export interface FiltroInscripcionesExcelEmailDTO
  extends FiltroInscripcionesExcelDTO {
  correo: string;
}
