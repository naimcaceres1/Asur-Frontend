/*
NOTE: 
Este helper llama a *nuestra API backend* desde Server Components/acciones.
- Lee el JWT que guardamos en la sesión de Next-Auth (`session.apiToken`).
- Adjunta `Authorization: Bearer <token>` automáticamente.
- Siempre responde `.json()` o lanza un error si no es 2xx.
Usarlo evita duplicar headers y lógica de sesión en cada fetch.
*/

import { auth } from "@/auth";

const BASE_SERVER = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE!;

console.log(">>> api-server BASE_SERVER:", BASE_SERVER);

export async function api(path: string, init: RequestInit = {}) {
  const session = await auth();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  const token = (session as any)?.userData?.accessToken || (session as any)?.accessToken;
  
  if (token) { 
    headers.set("Authorization", `Bearer ${token}`);
    console.log(`🔐 api-server - Token incluido para: ${path}`);
  } else {
    console.warn(`⚠️ api-server - Sin token para: ${path}`);
    console.log('🔐 Session structure:', {
      hasAccessToken: !!(session as any)?.accessToken,
      hasUserData: !!(session as any)?.userData,
      userDataHasToken: !!(session as any)?.userData?.accessToken,
      sessionKeys: session ? Object.keys(session) : 'no session'
    });
  }

  const res = await fetch(`${BASE_SERVER}${path}`, { ...init, headers, cache: "no-store" });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Error en API [${res.status} ${res.statusText}] en ${path}: ${errorText}`);
    throw new Error(errorText || res.statusText);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}