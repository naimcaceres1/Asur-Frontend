/*
NOTE:

El flujo de Asistencia de usuarios.

El estado de React se pierde al cambiar de página, por lo tanto si seestá en "Soporte" y quieres una guía sobre "Login", al navegar a la página de login, 
la guía se cerraría.

Con el componente GuideInitializer utilizado en cada una de las páginas que se quiera realziar una guía de usuario, se realiza una persistencia en SessionStorage.

El Disparador es SupportPage en donde el usuario hace click en una tarjeta. 

En ese momento no se inicia la guía, lo que hace es guardar la configuración de esa guía específica en sessionStorage como una "nota mental" para el navegador.

Luego se redirige al usuario a la página objetivo (/dashboard/auth/login).

La Ejecución (GuideInitializer):

Este componente debe estar en cada página que se quiere renderizar el driver y cuando carga la nueva página "/dashboard/auth/login", el useEffect lee la "nota mental" del sessionStorage.

Si la URL coincide, arranca el driver automáticamente

*/

import { SupportGuides } from "@/components/support-user";
import { auth } from "@/auth";
import type { Session } from "next-auth";

export default async function SupportPage() {
  let userRole = "";

  try {
    const session = (await auth()) as Session & {
      user?: { role?: string };
    };

    // Solo obtener el rol si hay sesión, pero no hacer redirect
    if (session?.user?.role) {
      userRole = session.user.role;
    }
  } catch (error) {
    // Si hay error de autenticación, continuar sin rol (usuario no logueado)
    console.log("Usuario no autenticado accediendo al centro de soporte");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centro de Asistencia</h1>
        <p className="text-muted-foreground">
          Selecciona una guía para aprender a usar las diferentes funciones de
          la plataforma
        </p>
        {/* Mostrar información del estado de autenticación */}
        {!userRole && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700 text-sm">
              <strong>Nota:</strong> Estás viendo las guías básicas. Inicia
              sesión para acceder a todas las guías disponibles.
            </p>
          </div>
        )}
      </div>

      <SupportGuides userRole={userRole} />
    </div>
  );
}

export const metadata = {
  title: "Centro de Asistencia | ASUR",
  description: "Guías interactivas para aprender a usar la plataforma",
};
