// app/dashboard/update-user/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { EditUserForm } from "@/components/edit-user-form";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

type UserFormData = {
  idUsuario: number;
  nombre: string;
  apellido: string;
  calle: string;
  nroPuerta: number | null;
  nroApto?: string | null;
  fechaNacimiento: string | null;
  telefonos: string[];
  nombrePerfil: string;
};

export default function UpdateUserPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [userDataForForm, setUserDataForForm] =
    useState<UserFormData | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" || !session) {
      router.push("/auth/login");
      return;
    }

    const accessToken =
      (session as any).accessToken ??
      (session as any).userData?.accessToken ??
      null;

    if (!accessToken) {
      toast.error("Error de sesión");
      router.push("/auth/login");
      return;
    }

    let cancelled = false;

    async function loadUser() {
      try {
        setIsLoading(true);

        const res = await fetch(`${API_BASE}/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (res.status === 401 || res.status === 403) {
          router.push("/auth/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Error ${res.status}`);
        }

        const apiUser = await res.json();
        if (cancelled) return;

        const u = apiUser.user ?? apiUser.usuario ?? apiUser;

        const backendId = u.idUsuario ?? u.id;
        const finalId = backendId ?? (session.user as any)?.id;

        const telefonosArray = Array.isArray(u.telefonos)
          ? u.telefonos
          : u.telefonos
          ? [u.telefonos]
          : [];

        const nombrePerfil =
          u.perfil?.nombre ??
          u.nombrePerfil ??
          ((session.user as any)?.role as string) ??
          "";

        setUserDataForForm({
          idUsuario: finalId,
          nombre: u.nombre ?? "",
          apellido: u.apellido ?? "",
          calle: u.calle ?? "",
          nroPuerta: u.nroPuerta ?? null,
          nroApto: u.nroApto ?? "",
          fechaNacimiento: u.fechaNacimiento ?? null,
          telefonos: telefonosArray,
          nombrePerfil,
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Error cargando usuario:", err);
          toast.error("No se pudieron cargar tus datos");
          router.push("/dashboard/profile");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [status, session, router]);

  const handleUpdateSuccess = async () => {
    try {
      await update();
    } catch (e) {
      console.error("Error refrescando sesión tras update:", e);
    }

    toast.success("¡Perfil actualizado!", {
      description: "Tus datos han sido editados.",
    });

    router.push("/dashboard/profile");
  };

  if (isLoading || !userDataForForm) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <EditUserForm 
      usuario={userDataForForm} 
      onUpdateSuccess={handleUpdateSuccess} 
    />
  );
}