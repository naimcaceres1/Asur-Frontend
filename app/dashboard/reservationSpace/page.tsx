// app/dashboard/reservationSpace/page.tsx

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { api } from "@/helpers/api-server";
import type {
  SpringPage,
  ReservaEspacioListado,
} from "@/interfaces/main-interfaces";
import { SpaceReservationsPageClient } from "@/components/space-reservations-page-client";

type SearchParams = {
  page?: string;
  size?: string;
};

export default async function ReservationSpacePage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = (await auth()) as Session & {
    user?: { role?: string };
  };

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userRole = session.user.role ?? "";
  const normalizedRole = userRole.toUpperCase();

  // Para que funcione tanto "Administrador" como "ADMINISTRADOR"
  const isAdminOrAux =
    normalizedRole === "ADMINISTRADOR" ||
    normalizedRole === "AUXILIAR ADMINISTRATIVO";

  const params = await searchParams;
  const page = Number(params?.page ?? "0") || 0;
  const size = Number(params?.size ?? "10") || 10;

  let initialPage: SpringPage<ReservaEspacioListado> | null = null;

  try {
    const res = await api(`/reservas/mis?page=${page}&size=${size}`);
    initialPage = res as SpringPage<ReservaEspacioListado>;
  } catch (error) {
    console.error("Error cargando reservas iniciales:", error);
    initialPage = null;
  }

  return (
    <SpaceReservationsPageClient
      initialPage={initialPage}
      initialPageIndex={page}
      initialPageSize={size}
      isAdminOrAux={isAdminOrAux}
    />
  );
}
