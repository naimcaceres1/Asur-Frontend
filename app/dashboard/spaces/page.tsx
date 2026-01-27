import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { api } from "@/helpers/api-server";
import type { Espacios } from "@/interfaces/main-interfaces"; 
import { SpacesPageClient } from "@/components/spaces-page-client";

export default async function SpacesPage() {
  const session = (await auth()) as Session & {
    user?: { role?: string };
  };

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userRole = session.user.role;

  const isAdminOrAux =
    userRole === "Administrador" || userRole === "Auxiliar administrativo";

  if (!isAdminOrAux) {
    return <div className="p-4">No tenés permisos para administrar espacios.</div>;
  }

  let espacios: Espacios[] = [];

  try {
    espacios = await api("/espacios/list");
  } catch (error) {
    console.error("Error cargando espacios:", error);
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold">Gestión de Espacios</h1>
      <SpacesPageClient initialEspacios={espacios} />
    </div>
  );
}
