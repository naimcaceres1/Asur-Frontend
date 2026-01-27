import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { api } from "@/helpers/api-server";
import {
  Actividad,
  Espacios,
  Pagos,
  SpringPage,
  ReservaEspacioListado,
  Cuota,
} from "@/interfaces/main-interfaces";
import type { InscripcionActividadListado } from "@/interfaces";
import { SectionCardsProps } from "@/types/main-type";

// ================= SOCIO / NO SOCIO =================

// ================= SOCIO / NO SOCIO =================

async function SocioWidgets() {
  // Contador de próximas actividades inscriptas
  let proximasActividadesInscriptas = 0;

  // Contador de reservas activas del usuario
  let totalMisReservas = 0;

  // Hoy en formato YYYY-MM-DD (día local)
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const hoyISO = hoyLocal.toISOString().split("T")[0];

  // ---------- 1) MIS INSCRIPCIONES ----------
  try {
    const misInscripciones = (await api(
      "/inscripciones/mis?page=0&size=50"
    )) as SpringPage<InscripcionActividadListado>;

    const lista = misInscripciones.content ?? [];

    proximasActividadesInscriptas = lista.filter((ins) => {
      const fecha = ins.fechaActividad ?? "";
      if (!fecha) return false;
      if (fecha < hoyISO) return false;
      return ins.estado !== "CANCELADA";
    }).length;
  } catch (error: any) {
    console.log(
      "Error obteniendo inscripciones del socio:",
      error?.message ?? error
    );
    proximasActividadesInscriptas = 0;
  }

  // ---------- 2) MIS RESERVAS ----------
  try {
    const misReservas = (await api(
      "/reservas/mis?page=0&size=50"
    )) as SpringPage<ReservaEspacioListado>;

    // El endpoint ya devuelve solo "activas", así que contamos todo
    totalMisReservas =
      misReservas.totalElements ?? misReservas.content?.length ?? 0;
  } catch (error: any) {
    console.log(
      "Error obteniendo reservas del socio:",
      error?.message ?? error
    );
    totalMisReservas = 0;
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2">
      {/* Card 1: Actividades para Socios */}
      <Link href="/dashboard/activities-inscriptions">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Mis Actividades</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {proximasActividadesInscriptas}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground font-medium">
              Próximas actividades inscritas
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* Card 2: Reservas para Socios */}
      <Link href="/dashboard/reservationSpace">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Mis Reservas</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalMisReservas}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground font-medium">
              Espacios reservados
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
}


// --- Función para obtener datos Aux administrativo y Administrador ---
async function getDataByRole(role: string) {
  let actividadesData: Actividad[] = [];
  let espaciosData: Espacios[] = [];
  let pagosData: Pagos[] = [];
  let pagosPage: SpringPage<Pagos> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
  };

  let cuotasTotalPendiente: { totalPendiente: number } = { totalPendiente: 0 };
  let reservasActivasPage: SpringPage<ReservaEspacioListado> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
  };

  try {
    actividadesData = (await api(
      "/actividades/listado-filtros"
    )) as Actividad[];
  } catch (error: any) {
    console.log("Error en actividades:", error.message);
  }

  try {
    espaciosData = (await api("/espacios/list")) as Espacios[];
  } catch (error: any) {
    console.log("Error en espacios:", error.message);
  }

  try {
    reservasActivasPage = (await api(
      "/reservas/activas"
    )) as SpringPage<ReservaEspacioListado>;
  } catch (error: any) {
    console.log("Error en reservas activas:", error.message);
  }

  if (role === "Auxiliar administrativo") {
    try {
      pagosData = (await api("/pagos/list")) as Pagos[];
    } catch (error: any) {
      console.log("Error en pagos:", error.message);
    }

    try {
      cuotasTotalPendiente = (await api("/cuotas/total-pendientes")) as {
        totalPendiente: number;
      };
    } catch (error: any) {
      console.log("Error en cuotas:", error.message);
      cuotasTotalPendiente = { totalPendiente: 0 };
    }
  }

  return {
    actividades: actividadesData,
    espacios: espaciosData,
    pagos: pagosPage,
    totalCuotasPendientes: cuotasTotalPendiente.totalPendiente,
    reservasActivas: reservasActivasPage,
  };
}

export async function SectionCards({ role }: SectionCardsProps) {
  const isAdminOrAux =
    role === "Administrador" || role === "Auxiliar administrativo";

  // Socio / No Socio → widgets especiales
  if (!isAdminOrAux) {
    return <SocioWidgets />;
  }

  // Obtener datos para Administrador y Auxiliar administrativo
  const data = await getDataByRole(role);

  // ========= CÁLCULOS PARA LAS TARJETAS =========

  // Hoy en formato YYYY-MM-DD (día local)
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const hoyISO = hoyLocal.toISOString().split("T")[0];

  // 1) Actividades **programadas** para hoy (solo estado PROGRAMADA)
  const actividadesProgramadasHoy = data.actividades.filter(
    (act) => act.fechaActividad === hoyISO && act.estado === "PROGRAMADA"
  );
  const conteoActividadesProgramadasHoy = actividadesProgramadasHoy.length;

  // 2) Total de actividades transcurridas -> TODAS las FINALIZADAS
  const totalActividadesTranscurridas = data.actividades.filter(
    (act) => act.estado === "FINALIZADA"
  ).length;

  // 3) Próximas actividades -> futuras y en estado PROGRAMADA
  const proxActividades = data.actividades.filter(
    (act) => act.fechaActividad > hoyISO && act.estado === "PROGRAMADA"
  ).length;

  // Card 2: Espacios Disponibles
  const totalEspacios = data.espacios.length;
  const conteoEspaciosActivos = data.espacios.filter(
    (esp) => esp.estado === true
  ).length;
  const conteoEspaciosMantenimiento = totalEspacios - conteoEspaciosActivos;

  // Card 3: Pagos
  const totalPendienteCuotas = data.totalCuotasPendientes;
  const totalPendienteReservas = data.reservasActivas.content
    .filter((reserva) => reserva.saldo > 0)
    .reduce((sum, reserva) => sum + reserva.saldo, 0);
  const totalConteoPagos = totalPendienteCuotas + totalPendienteReservas;

  // Qué cards mostrar según el rol
  const showPagosCard = role === "Auxiliar administrativo";
  const showResumenCard = role === "Auxiliar administrativo";
  const gridCols =
    role === "Administrador"
      ? "@xl/main:grid-cols-2"
      : "@xl/main:grid-cols-2 @5xl/main:grid-cols-4";

  return (
    <div
      className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 ${gridCols}`}
    >
      {/* Card 1: Actividades (Dinámico) */}
      <Link href="/dashboard/activities">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Actividades para hoy</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {conteoActividadesProgramadasHoy}
            </CardTitle>
            <CardAction />
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground font-medium">
              Total de actividades transcurridas {totalActividadesTranscurridas}
            </div>
            <div className="text-muted-foreground font-medium">
              Próximas actividades: {proxActividades}
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* Card 2: Espacios (Dinámico) */}
      <Link href="/dashboard/spaces">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Espacios disponibles</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {conteoEspaciosActivos}
            </CardTitle>
            <CardAction />
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="text-muted-foreground font-medium">
              {conteoEspaciosMantenimiento > 0
                ? `Espacios en mantenimiento: ${conteoEspaciosMantenimiento}`
                : "Todos los espacios están habilitados"}
            </div>
            <div className="text-muted-foreground">
              Total de {totalEspacios} espacios.
            </div>
          </CardFooter>
        </Card>
      </Link>

      {/* Card 3: Pagos (Dinámico) */}
      {showPagosCard && (
        <Link href="/dashboard/payments">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Pagos mensuales pendientes</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                ${totalConteoPagos.toLocaleString("es-UY")}
              </CardTitle>
              <CardAction />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                ${totalPendienteCuotas.toLocaleString("es-UY")} Cuotas Socios
              </div>
              ${totalPendienteReservas.toLocaleString("es-UY")} Reservas
              Espacios
            </CardFooter>
          </Card>
        </Link>
      )}

      {/* Card 4: Resumen (Dinámico) */}
      {showResumenCard && (
        <Link href="/dashboard/summary">
          <Card className="@container/card">
            <CardHeader>
              <CardDescription>Resumen</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                4.5%
              </CardTitle>
              <CardAction />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Steady performance increase{" "}
                <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">Meets</div>
            </CardFooter>
          </Card>
        </Link>
      )}
    </div>
  );
}
