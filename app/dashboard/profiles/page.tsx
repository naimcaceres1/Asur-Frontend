import { auth } from "@/auth";
import { ProfilesTable } from "@/components/profile-table";
import { api } from "@/helpers/api-server"; 
import { Perfil } from "@/interfaces/profile-interfaces";
import { Session } from "next-auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Perfiles | ASUR",
  description: "Gestión de perfiles y roles de usuario",
};

export default async function ProfilesPage() {
  const session = (await auth()) as Session & {
    user?: { role?: string };
  };

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userRole = session.user?.role;
  const isAdminOrAux =
    userRole === "Administrador" || userRole === "Auxiliar administrativo";

  if (!isAdminOrAux) {
    redirect("/dashboard/main");
  }

  let perfiles: Perfil[] = [];

  try {
    perfiles = await api("/perfiles/getall"); 
    //console.log(perfiles);
    
  } catch (error) {
    console.error("Error al obtener perfiles:", error);
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perfiles</h1>
          <p className="text-muted-foreground">
            Administra los roles disponibles en la plataforma.
          </p>
        </div>
      </div>
      <ProfilesTable initialData={perfiles} />
    </div>
  );
}