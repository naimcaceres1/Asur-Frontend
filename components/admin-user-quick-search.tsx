"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { apiClient } from "@/helpers/api-client";
import type { Usuario, SpringPage } from "@/interfaces/main-interfaces";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type CacheMap = Record<string, Usuario[]>;

export function AdminUserQuickSearch() {
  const router = useRouter();
  const { data: session } = useSession();

  const token =
    (session as any)?.userData?.accessToken ||
    (session as any)?.accessToken ||
    "";

  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // cache simple en memoria: clave = término, valor = lista de usuarios
  const cacheRef = useRef<CacheMap>({});

  useEffect(() => {
    if (!token) return;

    const trimmed = term.trim();

    // si está vacío o muy corto, reseteo
    if (trimmed.length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    // si ya lo tengo en cache, lo uso y no llamo a la API
    if (cacheRef.current[trimmed]) {
      setResults(cacheRef.current[trimmed]);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await apiClient<SpringPage<Usuario>>(
          `/users/listado-filtros?documento=${encodeURIComponent(
            trimmed
          )}&page=0&size=10`,
          token
        );

        const usuarios = resp.content ?? [];
        cacheRef.current[trimmed] = usuarios;
        setResults(usuarios);
        setError(null);
      } catch (err: any) {
        console.error("Error buscando usuarios:", err);
        let msg = "No se pudo buscar usuarios. Probá nuevamente.";
        if (typeof err?.message === "string") msg = err.message;
        setError(msg);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timeoutId);
  }, [term, token]);

  const handleClickUsuario = (u: Usuario) => {
    // redirige al formulario de edición de admin
    router.push(`/dashboard/update-account?id=${u.idUsuario}`);
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
      <div className="space-y-1">
        <Label htmlFor="buscar-usuario-main">
          Buscar usuario por documento
        </Label>
        <Input
          id="buscar-usuario-main"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="CI 52138588"
        />
      </div>

      <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border bg-muted/40 p-2 text-xs">
        {loading && (
          <p className="text-muted-foreground">Buscando usuarios...</p>
        )}

        {!loading && error && <p className="text-destructive">{error}</p>}

        {!loading &&
          !error &&
          term.trim().length >= 3 &&
          results.length === 0 && (
            <p className="text-muted-foreground">
              No se encontraron usuarios con ese documento.
            </p>
          )}

        {results.map((u) => (
          <button
            key={u.idUsuario}
            type="button"
            onClick={() => handleClickUsuario(u)}
            className="flex w-full flex-col items-start rounded-md border bg-background/80 px-3 py-2 text-left hover:bg-background"
          >
            <span className="font-medium">
              {u.nombre} {u.apellido}
            </span>
            <span className="text-[0.7rem] text-muted-foreground">
              CI: {u.documento} · {u.correo}
            </span>
            <span className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
              <span>Perfil: {u.nombrePerfil}</span>
              <Badge
                variant={
                  u.estadoDescripcion === "Activo" ? "default" : "secondary"
                }
                className="px-1.5 py-0 text-[0.65rem]"
              >
                {u.estadoDescripcion}
              </Badge>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
