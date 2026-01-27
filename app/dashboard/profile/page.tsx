// app/dashboard/profile/page.tsx

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PhoneIcon, MailCheck, Star, MapPin, User, KeyRound } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

export const metadata = {
  title: "Perfil | ASUR",
  description: "Perfil de usuario en la plataforma ASUR",
};

export default async function Profilepage() {
  // 1) Verificamos sesión
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  const accessToken =
    (session as any).accessToken ??
    (session as any).userData?.accessToken ??
    null;

  if (!accessToken) {
    redirect("/auth/login");
  }

  // 2) Traemos SIEMPRE los datos frescos desde /users/me
  let apiUser: any;
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store", // importante para no cachear entre requests
    });

    if (res.status === 401 || res.status === 403) {
      redirect("/auth/login");
    }

    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }

    apiUser = await res.json();
  } catch (error) {
    console.error("Error al obtener /users/me:", error);
    return <p>Error: no se pudieron obtener los datos del usuario.</p>;
  }

  // 3) Normalizamos un poco la estructura para la vista
  const u = apiUser.user ?? apiUser.usuario ?? apiUser;

  const loggedInUserId = u.idUsuario ?? u.id ?? (session as any).user?.id;
  const nombre = u.nombre ?? "";
  const apellido = u.apellido ?? "";
  const correo = u.correo ?? u.email ?? "";
  const role =
    u.perfil?.nombre ??
    u.nombrePerfil ??
    (session as any).user?.role ??
    "Usuario";

  const telefono = Array.isArray(u.telefonos)
    ? u.telefonos.join(", ")
    : u.telefonos ?? "-";

  const direccion = u.calle
    ? `${u.calle} ${u.nroPuerta ?? ""}${
        u.nroApto ? `, ${u.nroApto}` : ""
      }`
    : "-";

  // 4) Render con los datos frescos
  return (
    <div className="flex items-center h-screen w-full justify-center p-4">
      <Card className="w-full max-w-sm md:max-w-md shadow-2xl overflow-hidden">
        <CardHeader className="p-6 text-center bg-muted/50 border-b border-border">
          <div className="photo-wrapper p-2">
            <Image
              className="rounded-full mx-auto border-4 border-primary/50"
              width={128}
              height={128}
              src={(session.user as any)?.image || "/PDigitales.png"}
              alt={nombre || "Foto de perfil"}
            />
          </div>
          <CardTitle className="mt-4">
            <h3 className="text-3xl font-heading tracking-tight text-foreground">
              {nombre} {apellido}
            </h3>
          </CardTitle>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mt-1">
            <Star className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">{role}</p>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-foreground">
            <div className="flex items-center gap-2 font-medium text-muted-foreground">
              <MailCheck className="w-4 h-4" /> Email:
            </div>
            <div className="font-semibold break-all text-right">
              {correo}
            </div>

            <div className="flex items-center gap-2 font-medium text-muted-foreground">
              <PhoneIcon className="w-4 h-4" /> Teléfono:
            </div>
            <div className="font-semibold text-right">{telefono}</div>

            <div className="flex items-start gap-2 font-medium text-muted-foreground">
              <MapPin className="w-4 h-4 mt-[2px]" /> Dirección:
            </div>
            <div className="font-semibold text-right">{direccion}</div>
          </div>

          {/* Botones de acciones */}
          <div className="mt-6 flex flex-col gap-3 items-center">
            {loggedInUserId && (
              <Button asChild className="w-full md:w-auto">
                <Link href={`/dashboard/update-user?id=${loggedInUserId}`}>
                  <User className="w-4 h-4 mr-2" />
                  Editar perfil
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              className="w-full md:w-auto"
            >
              <Link href="/auth/change-password">
                <KeyRound className="w-4 h-4 mr-2" />
                Cambiar contraseña
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}