// app/dashboard/functionalities/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { api } from "@/helpers/api-server";
import type { FuncionalidadPage } from "@/interfaces";
import { FunctionalitiesPageClient } from "@/components/functionalities-page-client";

export default async function FunctionalitiesPage() {
  const session = (await auth()) as Session & {
    user?: { role?: string };
  };

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userRole = session.user.role;
  const isAdmin = userRole === "Administrador";

  if (!isAdmin) {
    return (
      <div className="p-4">
        No tenés permisos para administrar funcionalidades.
      </div>
    );
  }

  let initialPage: FuncionalidadPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
  };

  try {
    const data = (await api(
      "/funcionalidades/listar-filtros?estado=todos&page=0&size=10"
    )) as FuncionalidadPage;

    initialPage = data;
  } catch (error) {
    console.error("Error cargando funcionalidades:", error);
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold">Gestión de Funcionalidades</h1>
      <FunctionalitiesPageClient initialPage={initialPage} />
    </div>
  );
}