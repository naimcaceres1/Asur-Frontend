import { Usuario, SpringPage } from "@/interfaces/main-interfaces";
import { Session } from "next-auth";
import { redirect } from "next/dist/client/components/navigation";
import { auth } from "@/auth";
import { api } from "@/helpers/api-server";
import { DataTableWrapper } from "@/components/data-table-wrapper";
import { AdminUserWrapper } from "@/components/admin-user-wrapper";

export default async function UserPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const session = (await auth()) as Session & {
    user?: { role?: string; image?: string };
  };

  if (!session || !session.user) {
    redirect("/dashboard/invite");
  }

  const userRole = session.user?.role;

  if (!userRole) {
    return <div>Error: El usuario no tiene un rol definido.</div>;
  }

  const isAdminOrAux =
    userRole === "Administrador" || userRole === "Auxiliar administrativo";

  const isSocioOrNoSocio = userRole === "Socio" || userRole === "No socio";

  let usuarios: Usuario[] = [];
  let usuariosPage: SpringPage<Usuario> | null = null;

  if (isAdminOrAux) {
    try {
      const page = resolvedSearchParams?.page ?? "0";
      const size = resolvedSearchParams?.size ?? "10";

      const params = new URLSearchParams();
      params.append("page", Array.isArray(page) ? page[0] : page);
      params.append("size", Array.isArray(size) ? size[0] : size);

      // llamado a la API-SERVER
      usuariosPage = await api(`/users/listado-filtros?${params.toString()}`);

      if (usuariosPage) {
        usuarios = usuariosPage.content;
      }
    } catch (error) {
      console.log("Error obteniendo usuarios:", error);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {isAdminOrAux && (
            <>
              <div className="px-4 lg:px-6">
                <AdminUserWrapper />
              </div>

              <div className="px-4 lg:px-6"></div>

              <DataTableWrapper data={usuarios} paginationData={usuariosPage} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Usuarios | ASUR",
  description: "Panel de usuarios de ASUR",
};
