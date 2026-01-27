// app/dashboard/update-account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { Usuario } from "@/interfaces/main-interfaces";
import {
  AdminEditUserForm,
  type PerfilOption,
} from "@/components/admin-edit-user-form";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export default function UpdateAccountPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [perfiles, setPerfiles] = useState<PerfilOption[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const idUsuario = searchParams.get("id");

  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session) {
      router.push("/auth/login");
      return;
    }

    const rawRole =
      (session as any).user?.role ??
      (session as any).userData?.role ??
      (session as any).userData?.extra?.nombrePerfil ??
      null;

    const roleStr = rawRole ? String(rawRole) : "";

    const isAdmin =
      roleStr === "ADMIN" || roleStr === "Administrador";
    const isAux =
      roleStr === "AUXILIAR_ADMIN" ||
      roleStr === "Auxiliar administrativo";

    if (!isAdmin && !isAux) {
      toast.error("No tiene permisos para editar otros usuarios");
      router.push("/dashboard");
      return;
    }

    const accessToken =
      (session as any).accessToken ??
      (session as any).userData?.accessToken ??
      null;

    if (!idUsuario || !accessToken) {
      toast.error("Faltan datos para cargar el usuario");
      router.push("/dashboard/main");
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);

        // 1) Traer usuario por ID
        const userRes = await fetch(`${API_BASE}/users/${idUsuario}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (userRes.status === 401 || userRes.status === 403) {
          throw new Error("No tiene permisos para ver este usuario");
        }

        if (userRes.status === 404) {
          throw new Error("Usuario no encontrado");
        }

        if (!userRes.ok) {
          const text = await userRes.text();
          console.error(
            "Error inesperado en GET /users/{id}:",
            userRes.status,
            text
          );
          throw new Error(`Error ${userRes.status} al cargar usuario`);
        }

        const userJson = await userRes.json();
        const userData: Usuario =
          (userJson as any)?.user ??
          (userJson as any)?.usuario ??
          (userJson as any);

        // 2) Traer perfiles activos
        const perfilesRes = await fetch(
          `${API_BASE}/perfiles/getall?estado=true`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!perfilesRes.ok) {
          const text = await perfilesRes.text();
          console.error(
            "Error al cargar perfiles:",
            perfilesRes.status,
            text
          );
          throw new Error("No se pudieron cargar los perfiles");
        }

        const perfilesJson = await perfilesRes.json();
        const perfilesData: PerfilOption[] = Array.isArray(perfilesJson)
          ? perfilesJson
          : perfilesJson.content ?? perfilesJson.items ?? [];

        if (cancelled) return;

        setUsuario(userData);
        setPerfiles(perfilesData);
      } catch (error: any) {
        console.error("Error cargando datos de edición:", error);
        toast.error(error.message || "No se pudieron cargar los datos");
        router.push("/dashboard/main");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [status, session, idUsuario, router]);

  if (loading || !usuario) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <AdminEditUserForm
      usuario={usuario}
      perfiles={perfiles}
      onUpdateSuccess={() => {
        toast.success("Usuario actualizado");
        router.push("/dashboard/main");
      }}
    />
  );
}
