// app/dashboard/functionalities/profile/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

import { ProfileFunctionalitiesPageClient } from "@/components/profile-functionalities-page-client";

export default async function FunctionalitiesProfilePage() {
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
        No tenés permisos para administrar funcionalidades por perfil.
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <h1 className="text-2xl font-semibold">Funcionalidades por perfil</h1>
      <ProfileFunctionalitiesPageClient />
    </div>
  );
}
