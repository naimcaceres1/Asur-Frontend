
/**
 * NOTE: Archivo de barril de interfaces.
 *
 * Propósito:
 * - Reexportar tipos e interfaces desde un único punto para simplificar
 *   imports (`import { X } from '@/interfaces'`).
 *
 * Buenas prácticas:
 * - Mantén aquí sólo reexports; la implementación de los tipos debe vivir
 *   en archivos separados (ej. `layout-interfaces.ts`).
 * - Evita ciclos de dependencia entre módulos.
 */
export * from "./layout-interfaces";
export * from "./main-interfaces"
export * from "./component-interface"
export * from "./profile-interfaces"
