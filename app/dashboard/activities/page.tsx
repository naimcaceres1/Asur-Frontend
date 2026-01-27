// app/dashboard/activities/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { api } from "@/helpers/api-server";
import type { Actividad, Espacios, TipoActividadDTO } from "@/interfaces";
import { ActivitiesAdminClient } from "@/components/activities-admin-client";


export default async function ActivitiesPage() {
  const session = (await auth()) as Session & { user?: { role?: string } };

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  const isAdminOrAux =
    role === "Administrador" || role === "Auxiliar administrativo";

  // Si NO es admin ni auxiliar → que vaya al módulo de inscripciones
  if (!isAdminOrAux) {
    redirect("/dashboard/activities-inscriptions");
  }

  // Gestión de actividades (solo Admin / Aux)
  let actividades: Actividad[] = [];
  let tipos: TipoActividadDTO[] = [];
  let espacios: Espacios[] = [];

  try {
    actividades = await api("/actividades/listado-filtros");
  } catch (err) {
    console.error("Error cargando actividades:", err);
  }

  try {
    tipos = await api("/tipos-actividad/listactivos");
  } catch (err) {
    console.error("Error cargando tipos de actividad:", err);
  }

  try {
    espacios = await api("/espacios/list");
  } catch (err) {
    console.error("Error cargando espacios:", err);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Gestión de actividades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Desde aquí podés filtrar, listar, crear y administrar las actividades
          y sus tipos.
        </p>
      </div>

      <ActivitiesAdminClient
        initialActividades={actividades}
        initialTipos={tipos}
        initialEspacios={espacios}
      />
    </div>
  );
}
