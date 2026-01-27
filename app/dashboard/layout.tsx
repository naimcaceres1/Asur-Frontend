/*
NOTE: Layout del dashboard con sidebar y header
Responsabilidades:
- Proveer la estructura del dashboard con sidebar y header.
- Gestionar la sesión de usuario (NextAuth) en el servidor.
- Redirigir a login si no hay sesión activa.
- Pasar un resumen mínimo del usuario al sidebar.

*/

import { AppSidebar } from "@/components/app-sidebar";

import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/auth";
import { UserSummary } from "@/interfaces";
import * as React from 'react'; // Asegurarse de importar React
import { Session } from "next-auth";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1) Obtener sesión del usuario
  const session = (await auth()) as Session & { user?: { role?: string, image?: string } };

  //Detección del rol:
  let userRole: string;

  if (!session?.user) {
    // Si NO hay sesión de usuario, es INVITADO (GUEST).
    userRole = "INVITADO";
  } else {
    userRole = session.user.role?.toUpperCase() ?? "NO SOCIO";
  }

  // 2) User
  const user: UserSummary = {
    name: session?.user?.name ?? "Usuario Invitado", 
    email: session?.user?.email ?? "",
    avatar: (session as any)?.user?.image ?? "./PDigitales.png",
    role: userRole,
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <main className="p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
