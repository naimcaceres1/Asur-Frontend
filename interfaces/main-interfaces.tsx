// main-interfaces.tsx

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: "Administrador" | "Auxiliar administrativo" | "Socio" | "No Socio";
}

export type EstadoActividad = "PROGRAMADA" | "CANCELADA" | "FINALIZADA";

export type TipoPago = string;
export type FormaPago = string;

export interface Actividad {
  idActividad: number;
  nombre: string;
  fechaActividad: string;
  horaComienzo: string;
  horaFin: string;
  idTipoActividad: number;
  nombreTipoActividad: string;
  idEspacio: number;
  nombreEspacio: string;
  estado: EstadoActividad;

  costo?: number | null;
  requiereInscripcion?: boolean;
  fechaAperturaInscripcion?: string | null;
}

export interface TipoActividadDTO {
  idTipoActividad: number;
  nombreTipoActividad: string;
  descripcionTipoActividad?: string | null;
  estadoTipoActividad: boolean;
  fechaBajaTipoActividad?: string | null;
  razonBajaTipoActividad?: string | null;
  comentariosBajaTipoActividad?: string | null;
}

export type EstadoInscripcionActividad =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "CANCELADA";

export interface InscripcionActividadListado {
  idInscripcion: number;
  nombreUsuario: string;
  nombreActividad: string;
  fechaActividad: string;
  horaComienzo: string;
  horaFin: string;
  fechaInscripcion: string;
  estado: EstadoInscripcionActividad;
  pagado: boolean;
}

export interface Pagos {
  idPago: number;
  idUsuario: number;
  idUsuarioRegistro: number;
  fechaPago: string; // ISO string
  monto: number;
  tipoPago: TipoPago;
  formaPago: FormaPago;
  idCuota?: number | null;
  idInscripcionActividad?: number | null;
  idReservaEspacio?: number | null;
  observaciones?: string | null;
  estadoPago: boolean;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size?: number;
  number?: number;
}

export interface Cuota {
  idCuota: number;
  idUsuario: number;
  mes: number;
  anio: number;
  fechaVencimiento: string; // "YYYY-MM-DD"
  monto: number;
  estado: "PENDIENTE" | "VENCIDA" | "PAGADA";
}

export interface ReservaEspacioListado {
  idReserva: number;
  nombreUsuario: string;
  fechaEvento: string; // "YYYY-MM-DD"
  horaInicio: string; // "HH:MM:SS"
  horaFin: string; // "HH:MM:SS"
  duracion: string;
  cantidadPersonas: number;
  montoTotal: number;
  fechaVtoSenia: string | null;
  fechaPagoSenia: string | null;
  saldo: number;
  nombreEspacio: string;
}

export interface Usuario {
  idUsuario: number;
  nombre: string;
  apellido: string;
  correo: string;
  tipoDocumento: string;
  documento: string;
  calle: string;
  nroPuerta: number | null;
  nroApto: string | null;
  fechaNacimiento: string;
  estadoDescripcion: string;
  nombrePerfil: string;
  telefonos: string[] | null;
}

export interface DataTableProps {
  data: Usuario[];
  paginationData?: SpringPage<Usuario>;
}

// ---------- Espacios----------

export interface Espacios {
  idEspacio: number;
  nombre: string;
  capacidad: number;
  tarifaSocio: number;
  tarifaNoSocio: number;
  fechaVigenciaPrecio: string; // "YYYY-MM-DD"
  precioHoraExtra: number | null;
  precioLimpieza: number | null;
  estado: boolean;
  observaciones: string | null;
}

export interface EspacioCreate {
  nombre: string;
  capacidad: number;
  tarifaSocio: number;
  tarifaNoSocio: number;
  fechaVigenciaPrecio: string; // "YYYY-MM-DD"
  precioHoraExtra?: number | null;
  precioLimpieza?: number | null;
  observaciones?: string | null;
}

export interface EspacioUpdate {
  nombre: string;
  capacidad: number;
  tarifaSocio: number;
  tarifaNoSocio: number;
  fechaVigenciaPrecio: string; // "YYYY-MM-DD"
  precioHoraExtra?: number | null;
  precioLimpieza?: number | null;
  observaciones?: string | null;
}

export interface EspacioEstado {
  idEspacio: number;
  estado: boolean;
}

// ----------espacios disponibles para reservas ----------

export interface EspacioDisponible {
  idEspacio: number;
  nombre: string;
  capacidad: number;
  observaciones?: string | null;
}

/// ---------- Funcionalidades del sistema ----------

export interface Funcionalidad {
  idFuncionalidad: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

// Usamos el paginado estándar de Spring
export type FuncionalidadPage = SpringPage<Funcionalidad>;

// Payload genérico para los endpoints que usan AccesoFuncionalidadDTO
export interface AccesoFuncionalidadPayload {
  idsFuncionalidades: number[];
}

// Graficos

export interface GraficoUsoPunto {
  fecha: string;
  registros: number;
  logins: number;
  reservas: number;
  inscripciones: number;
}

