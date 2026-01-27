// app/dashboard/activities-inscriptions/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { api } from "@/helpers/api-server";
import type { Actividad } from "@/interfaces";

import { ActivitiesInscriptionsClient } from "@/components/activity-inscription-client";
import { ActivitiesMyInscriptionsClient } from "@/components/activities-my-inscriptions-client";
import { ActivitiesEnrollAdminSelectorClient } from "@/components/activities-enroll-admin-selector-client";
import { ActivitiesAllInscriptionsAdminClient } from "@/components/activities-all-inscriptions-admin-client";

export default async function ActivitiesInscriptionsPage() {

  
    const session = (await auth()) as Session & {
    user?: { role?: string };
  };

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  // ---------------------------------------------------------------------------
  // Normalizar rol (para evitar problemas de mayúsculas, ROLE_, guiones, etc.)
  // ---------------------------------------------------------------------------
  const rawRole = session.user.role ?? "";
  let normalizedRole = rawRole.trim().toLowerCase();

  // Ejemplos que cubrimos:
  //  - "ROLE_ADMINISTRADOR"  -> "administrador"
  //  - "ROLE_SOCIO"          -> "socio"
  //  - "NO_SOCIO"            -> "no_socio"
  if (normalizedRole.startsWith("role_")) {
    normalizedRole = normalizedRole.slice(5);
  }

  const isAdminOrAux = [
    "administrador",
    "admin",
    "auxiliar administrativo",
    "aux_admin",
    "auxiliar_admin",
  ].includes(normalizedRole);

  const isSocioOrNoSocioOrInvitado = [
    "socio",
    "no socio",
    "no_socio",
    "no-socio",
    "invitado",
  ].includes(normalizedRole);

  // ---------------------------------------------------------------------------
  // Actividades inscribibles (para cards públicas Y para combo admin)
  // ---------------------------------------------------------------------------
  let actividadesInscribibles: Actividad[] = [];
  try {
    // usamos el endpoint SIN fecha, porque con ?fecha=... el back tira 500
    actividadesInscribibles = await api("/actividades/inscribibles");
  } catch (e) {
    console.error("Error cargando actividades inscribibles:", e);
    actividadesInscribibles = [];
  }

  // ---------------------------------------------------------------------------
  // VISTA ADMIN / AUXILIAR ADMINISTRATIVO
  // ---------------------------------------------------------------------------
  if (isAdminOrAux) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-semibold">Inscripción a actividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestioná las inscripciones a actividades, inscribí usuarios y
            consultá el listado general de inscripciones.
          </p>
        </div>

        {/* Panel para inscribir usuarios / ver inscriptos por actividad */}
        <section className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Inscripciones por actividad</h2>
          <ActivitiesEnrollAdminSelectorClient
            initialActividades={actividadesInscribibles}
          />
        </section>

        {/* Mis inscripciones (también para admin/aux) */}
        <ActivitiesMyInscriptionsClient />

        {/* Listado general de inscripciones activas */}
        <ActivitiesAllInscriptionsAdminClient />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VISTA SOCIO / NO SOCIO / INVITADO
  // ---------------------------------------------------------------------------
  if (isSocioOrNoSocioOrInvitado) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-semibold">Inscripción a actividades</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultá el detalle de cada actividad disponible. Si requiere
            inscripción y está abierta, vas a poder inscribirte desde aquí y
            revisar tus inscripciones.
          </p>
        </div>

        {/* Cards públicas de actividades inscribibles */}
        <ActivitiesInscriptionsClient
          initialActividades={actividadesInscribibles}
        />

        {/* Mis inscripciones del usuario logueado */}
        <ActivitiesMyInscriptionsClient />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Cualquier otro rol (fallback de debugging, muestra el rol que llegó)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-2 p-4">
      <p>No tenés permisos para ver actividades inscribibles.</p>
      <p className="text-xs text-muted-foreground">
        Rol detectado: <code>{rawRole || "Sin rol"}</code>
      </p>
    </div>
  );
}
