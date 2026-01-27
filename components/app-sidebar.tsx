"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileWord,
  IconReport,
  IconUsers,
  IconCalendarEvent,
  IconBoxMultiple,
  IconUsersGroup,
  IconCreditCard,
  IconApps,
  IconHome2,
  IconLogin,
  IconUserPlus,
  IconShieldLock,
  IconBallVolleyball,
  IconMessage,
  IconMetronome,
  IconMeterCube,
  IconMathEqualGreater,
} from "@tabler/icons-react";
import type { LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavDocuments, type DocumentNavItem } from "@/components/nav-documents";
import { NavUser } from "@/components/nav-user";
import type { UserSummary } from "@/interfaces";

type NavItem = {
  title: string;
  name?: string;
  url: string;
  icon: LucideIcon | React.ElementType;
};

// -----------------------------------------------------------------------------
// Nav primario
// -----------------------------------------------------------------------------

function NavPrimary({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.url}
            tooltip={item.title}
          >
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

const data: { [key: string]: NavItem[]; documents: DocumentNavItem[] } = {
  SOCIO: [
    { title: "Inicio", url: "/dashboard/invite", icon: IconHome2 },
    { title: "Resumen", url: "/dashboard/main", icon: IconChartBar },
    {
      title: "Inscripción a actividades",
      url: "/dashboard/activities-inscriptions",
      icon: IconCalendarEvent,
    },
    {
      title: "Reservas de espacios",
      url: "/dashboard/reservationSpace",
      icon: IconCalendarEvent,
    },
  ],
  "NO SOCIO": [
    { title: "Inicio", url: "/dashboard/invite", icon: IconHome2 },
    { title: "Resumen", url: "/dashboard/main", icon: IconChartBar },
    {
      title: "Inscripción a actividades",
      url: "/dashboard/activities-inscriptions",
      icon: IconCalendarEvent,
    },
    {
      title: "Reservas de espacios",
      url: "/dashboard/reservationSpace",
      icon: IconCalendarEvent,
    },
  ],

  // -------------------- INVITADO --------------------
  INVITADO: [
    // Página de inicio con info estática para invitados
    { title: "Inicio", url: "/dashboard/invite", icon: IconHome2 },

    // Botón para ir al login
    {
      title: "Iniciar sesión",
      url: "/auth/login", // ajustá esto a la ruta real de tu login
      icon: IconLogin,
    },

    // Botón para ir al registro
    {
      title: "Registrarse",
      url: "/auth/new-account", // ajustá esto a la ruta real de tu registro
      icon: IconUserPlus,
    },
  ],

  ADMINISTRADOR: [
    { title: "Inicio", url: "/dashboard/invite", icon: IconDashboard },
    { title: "Resumen", url: "/dashboard/main", icon: IconChartBar },
    { title: "Usuarios", url: "/dashboard/user", icon: IconUsersGroup },
    { title: "Perfiles", url: "/dashboard/profiles", icon: IconUsers },
    {
      title: "Funcionalidades",
      url: "/dashboard/functionalities",
      icon: IconApps,
    },
    {
      title: "Actividades",
      url: "/dashboard/activities",
      icon: IconBallVolleyball,
    },
    {
      title: "Inscripción a actividades",
      url: "/dashboard/activities-inscriptions",
      icon: IconCalendarEvent,
    },
    { title: "Espacios", url: "/dashboard/spaces", icon: IconBoxMultiple },
    {
      title: "Reservas de espacios",
      url: "/dashboard/reservationSpace",
      icon: IconCalendarEvent,
    },
    {
      title: "KPIs y Métricas",
      url: "/dashboard/metrics",
      icon: IconMathEqualGreater,
    },
  ],

  "AUXILIAR ADMINISTRATIVO": [
    { title: "Inicio", url: "/dashboard/invite", icon: IconDashboard },
    { title: "Resumen", url: "/dashboard/main", icon: IconChartBar },
    { title: "Usuarios", url: "/dashboard/user", icon: IconUsersGroup },
    { title: "Perfiles", url: "/dashboard/profiles", icon: IconUsers },
    {
      title: "Actividades",
      url: "/dashboard/activities",
      icon: IconBallVolleyball,
    },
    {
      title: "Inscripción a actividades",
      url: "/dashboard/activities-inscriptions",
      icon: IconCalendarEvent,
    },
    { title: "Espacios", url: "/dashboard/spaces", icon: IconBoxMultiple },
    {
      title: "Reservas de espacios",
      url: "/dashboard/reservationSpace",
      icon: IconCalendarEvent,
    },
    {
      title: "KPIs y Métricas",
      url: "/dashboard/metrics",
      icon: IconMathEqualGreater,
    },
  ],

  documents: [
    {
      name: "Reportes",
      url: "/dashboard/reports",
      icon: IconReport,
      title: "Reportes",
    },
    {
      name: "Asistencia de Usuario",
      url: "/dashboard/support",
      icon: IconFileWord,
      title: "Asistencia de Usuario",
    },
    {
      name: "Contactos",
      url: "/dashboard/contacts",
      icon: IconMessage,
      title: "Cómo cuidar mis datos y evitar fraudes",
    },
    {
      name: "Cómo cuidar mis datos",
      url: "/docs/guia-asur.pdf",
      icon: IconShieldLock,
      title: "Cómo cuidar mis datos y evitar fraudes",
    },
  ],
  menu_minimize: [
    { title: "Perfil", url: "/dashboard/profile", icon: IconUsers },
  ],
};

const ROLE_MENU_MAP: { [key: string]: NavItem[] } = {
  SOCIO: data.SOCIO,
  "NO SOCIO": data["NO SOCIO"],
  ADMINISTRADOR: data.ADMINISTRADOR,
  "AUXILIAR ADMINISTRATIVO": data["AUXILIAR ADMINISTRATIVO"],
  INVITADO: data["INVITADO"],
};

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  user: UserSummary & { role: string };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const roleKey = user.role?.toUpperCase();
  const menuItems = ROLE_MENU_MAP[roleKey] || [];
  const canSeeReports =
    roleKey === "ADMINISTRADOR" || roleKey === "AUXILIAR ADMINISTRATIVO";

  const filteredDocuments = canSeeReports
    ? data.documents
    : data.documents.filter((doc) => doc.name !== "Reportes");

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 flex justify-center items-center h-14"
            >
              <Link
                href="/dashboard/main"
                className="flex justify-center w-full"
              >
                <img
                  src="/Logo_ASUR.png"
                  alt="ASUR Logo"
                  className="h-9 w-auto object-contain"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="mt-6">
        {menuItems.length > 0 ? (
          <NavPrimary items={menuItems} />
        ) : (
          <div className="p-4 text-center text-sm text-destructive">
            Rol de usuario desconocido: {user.role}
          </div>
        )}

        <NavDocuments items={filteredDocuments} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          items={data.menu_minimize}
          user={{ ...user, avatar: user.avatar ?? "./PDigitales.png" }}
          role={user.role}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
