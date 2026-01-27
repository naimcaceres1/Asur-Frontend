/*
NOTE: 
Este helper llama a nuestra API backend desde COMPONENTES DE CLIENTE.
- NO llama a `auth()` (que es solo de servidor).
- Requiere que le pases el 'accessToken' manualmente (obtenido de `useSession`).
- Adjunta `Authorization: Bearer <token>` automáticamente.
- Siempre responde `.json()` o lanza un error si no es 2xx.
*/

const BASE_CLIENT = process.env.NEXT_PUBLIC_API_BASE!;

if (!BASE_CLIENT) {
  throw new Error("NEXT_PUBLIC_API_BASE no está definido");
}

/**
 * Realiza una llamada API autenticada desde el lado del cliente.
 * @param path La ruta del endpoint (ej. "/users/activate/1")
 * @param token El accessToken del JWT (de useSession)
 * @param init Las opciones de fetch (ej. { method: 'PUT' })
 */

export async function apiClient<T>(
  path: string,
  token?: string,
  init: RequestInit = {}
): Promise<T> {
  // Usamos un objeto plano para evitar el problema de HeadersInit
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_CLIENT}${path}`, {
    ...init,
    headers,
  });

  // Leemos SIEMPRE como texto primero
  const raw = await res.text();

  // -------- Manejo de errores --------
  if (!res.ok) {
    let message = `Error ${res.status}`;

    if (raw) {
      // Intentamos parsear JSON de error para sacar message/error
      try {
        const json = JSON.parse(raw);
        message =
          json.message ||
          json.error ||
          json.detail ||
          JSON.stringify(json);
      } catch {
        // No era JSON, usamos el texto tal cual
        message = raw;
      }
    }

    throw new Error(message);
  }

  // -------- Respuesta OK --------
  // Sin contenido → devolvemos undefined 
  if (!raw) {
    return undefined as T;
  }

  // Intentamos parsear JSON; si falla, devolvemos undefined
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined as T;
  }
}