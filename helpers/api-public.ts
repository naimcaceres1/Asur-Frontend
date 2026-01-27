/*
NOTE: 
 Cliente ligero para consumir endpoints públicos (sin Authorization).
 - Funciona tanto en Server como Client Components.
 - Soporta `searchParams`, distintos métodos HTTP y parseo automático
   de JSON o text según el Content-Type.
 - En caso de respuesta no 2xx intenta leer y propagar el body del error.

 Contrato rápido:
 - `apiPublic(path, init?)` => parsea y retorna JSON/text como T.
 - `apiPublicGet` / `apiPublicPost` son helpers que delegan en `apiPublic`.

 Ejemplo mínimo:
   const r = await apiPublicGet<T>('/public/items');
*/

import type { SearchParams } from "@/types";

const BASE_PUBLIC = process.env.NEXT_PUBLIC_API_BASE;
if (!BASE_PUBLIC) {
  throw new Error(
    "Falta NEXT_PUBLIC_API_BASE en .env.local para usar apiPublic()"
  );
}

function buildUrl(path: string, searchParams?: SearchParams) {
  // Normaliza doble slash
  const base = BASE_PUBLIC!.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${p}`);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (res.status === 204) return undefined as unknown as T; // No Content
  if (contentType.includes("application/json")) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

export interface ApiPublicInit extends RequestInit {
  searchParams?: SearchParams;
}

/** Llamado genérico (cualquier método) */
export async function apiPublic<T = unknown>(
  path: string,
  init: ApiPublicInit = {}
): Promise<T> {
  const { searchParams, headers, ...rest } = init;

  const url = buildUrl(path, searchParams);

  const h = new Headers(headers);
  // Si mandás body y no especificaste Content-Type, asumimos JSON
  if (rest.body && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  // Aceptá JSON por defecto
  if (!h.has("Accept")) h.set("Accept", "application/json");

  const res = await fetch(url, {
    cache: "no-store",
    ...rest,
    headers: h,
  });

  if (!res.ok) {
    // Intenta leer mensaje del backend para errores más claros
    let errData: any;
    let errMsg: string;
    try {
      errData = await parseResponse<any>(res);
      errMsg =
        typeof errData === "string"
          ? errData
          : errData?.message || JSON.stringify(errData);
    } catch {
      errMsg = `${res.status} ${res.statusText}`;
    }
    const error = new Error(errMsg);
    (error as any).data = errData; // Adjuntamos el cuerpo del error
    (error as any).status = res.status;
    throw error;
  }

  return parseResponse<T>(res);
}

export function apiPublicGet<T = unknown>(
  path: string,
  init?: Omit<ApiPublicInit, "method" | "body">
) {
  return apiPublic<T>(path, { ...init, method: "GET" });
}

export function apiPublicPost<T = unknown>(
  path: string,
  body?: unknown,
  init?: Omit<ApiPublicInit, "method" | "body">
) {
  const payload =
    body && typeof body === "object"
      ? JSON.stringify(body)
      : (body as BodyInit);
  return apiPublic<T>(path, { ...init, method: "POST", body: payload });
}
