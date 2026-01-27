
/**
 * Done:
 * Bridge de autenticación (NextAuth)
 *
 * Reexporta `GET` y `POST` desde `@/auth` para exponer las rutas HTTP
 * que Next.js espera. Mantén la lógica de autenticación (providers,
 * callbacks y adaptadores) dentro del módulo `@/auth`.
 *
 * Contrato mínimo:
 * - `handlers.GET` y `handlers.POST` deben aceptar un `Request` y
 *   devolver `Response` o `Promise<Response>`.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
