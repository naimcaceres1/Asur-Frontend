# 🚀 ASUR Frontend - Plataforma de Gestión de Usuarios y Servicios

¡Bienvenidos al repositorio del frontend de ASUR! Esta aplicación es la interfaz de usuario de nuestra plataforma de gestión, construida con las tecnologías más modernas para ofrecer una experiencia rápida, reactiva y robusta.

## ✨ Visión General del Proyecto

ASUR Frontend es el pilar visual de nuestra plataforma, permitiendo a diferentes perfiles de usuario (Administrador, Auxiliar, Coordinador, Consultor, Cliente) interactuar con los datos y funcionalidades del sistema. Desde el inicio de sesión hasta la gestión de usuarios, pasando por la visualización de métricas, esta aplicación está diseñada para ser intuitiva y eficiente.

👥 Equipo de Desarrollo – Grupo Puentes Digitales

Naim Cáceres – naim.caceres@estudiantes.utec.edu.uy | naim.caceres1@gmail.com

Eduardo Coyto – eduardo.coyto@estudiantes.utec.edu.uy

Evelyn Morales – evelyn.morales@estudiantes.utec.edu.uy

Eric Rodríguez – eric.rodriguez.g@estudiantes.utec.edu.uy

María Lucía Rodríguez – maria.rodriguez.s.sa@estudiantes.utec.edu.uy

### Puntos Destacados

* **Arquitectura Híbrida de Next.js (Server & Client Components):** Aprovechamos al máximo Next.js para una experiencia de usuario optimizada, cargando rápidamente la información inicial con Server Components y ofreciendo interactividad rica con Client Components.
* **Paginación del Lado del Servidor:** Implementación avanzada de paginación que delega la carga de datos por página al backend, mejorando el rendimiento y la escalabilidad, especialmente con grandes volúmenes de datos.
* **Gestión de Autenticación Segura:** Integración robusta con `next-auth` (v5 beta) para manejar la autenticación y autorización de usuarios de forma segura y flexible, incluyendo proveedores OAuth.
* **Interfaz de Usuario Moderna y Adaptable:** Desarrollada con Tailwind CSS y componentes de `shadcn/ui` (basados en Radix UI) para una estética limpia, coherente y completamente responsiva.
* **Roles y Permisos:** Gestión detallada de roles de usuario que determina las funcionalidades y la información accesible, visible desde la tabla de usuarios.
* **Visualización de Datos:** Inclusión de gráficos interactivos (Recharts) para ofrecer insights rápidos sobre las métricas clave de la plataforma.

## 🛠️ Tecnologías Utilizadas

* **Framework:** [Next.js 15](https://nextjs.org/) (con Turbopack para desarrollo rápido)
* **UI Library:** [React 19](https://react.dev/)
* **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
* **Autenticación:** [next-auth v5 beta](https://next-auth.js.org/)
* **Componentes UI:** [Radix UI](https://www.radix-ui.com/) y componentes `shadcn/ui` (Button, Input, Table, DropdownMenu, etc.)
* **Estado Global:** [Zustand](https://zustand-bear.github.io/blog/) para la gestión de estado ligero y eficiente.
* **Validación de Formularios:** [React Hook Form](https://react-hook-form.com/) con [Zod](https://zod.dev/) para un tipado seguro.
* **Tablas de Datos:** [TanStack Table](https://tanstack.com/table/latest) para una gestión de tablas potente y flexible.
* **Notificaciones:** [Sonner](https://sonner.emilkowalski.no/) para toasts elegantes.
* **Gráficos:** [Recharts](https://recharts.org/en-US/) para visualización de datos.
* **Drag and Drop (D&D):** [@dnd-kit](https://dndkit.com/) para funcionalidades de arrastrar y soltar (si aplica).
* **Tipado:** [TypeScript 5](https://www.typescriptlang.org/) para un desarrollo robusto y sin errores.

## 📦 Estructura del Proyecto

```text
asur-front/
├── app/                         # Rutas Next.js (páginas, layouts, API routes)
│   ├── api/                     # Endpoints (p.ej., auth/[...nextauth]/route.ts)
│   ├── auth/                    # Páginas de autenticación (login, registro, reset)
│   └── dashboard/
│       └── main/
│           └── page.tsx         # Página principal (tabla de usuarios)
├── components/                  # Componentes reutilizables
│   ├── ui/                      # Atómicos (shadcn/ui: button, table, form, etc.)
│   └── data-table.tsx           # Tabla con paginación (SSR-friendly)
├── helpers/                     # Helpers para API
│   ├── api.ts                   # Endpoints protegidos (Server Components)
│   └── api-public.ts            # Endpoints públicos
├── hooks/                       # Hooks personalizados
├── interfaces/                  # Tipos e interfaces de dominio
│   └── main-interfaces.ts       # Usuarios, paginación (SpringPage), etc.
├── lib/
│   └── utils.ts                 # Utilidades (clsx/cn, etc.)
├── public/                      # Estáticos (imágenes, logos)
├── store/
│   └── auth-store.ts            # Zustand: auth/roles/utilidades
├── types/
│   ├── http-type.ts             # Tipos para parámetros HTTP
│   └── next-auth.d.ts           # Augmentations de NextAuth
├── .env.local                   # Variables de entorno (no commitear)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## ⚙️ Configuración y Ejecución Local

### Requisitos

* [Node.js](https://nodejs.org/en/) (versión 18 o superior, recomendado LTS)
* [pnpm](https://pnpm.io/) (recomendado), npm o yarn
* [Git](https://git-scm.com/) (opcional, para clonar el repositorio)

### Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/naimcaceres1/Asur-Frontend.git
    ```
2.  **Instala las dependencias:**
    ```bash
    pnpm install
    # o con npm: npm install
    # o con yarn: yarn install
    ```

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y configura las siguientes variables:

```env
# .env.local
# Genera un secret largo y seguro, ej: [https://generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)
NEXTAUTH_SECRET=tu_clave_secreta_aqui_generada

# URL de tu API Backend
NEXT_PUBLIC_API_BASE=http://localhost:18081

# IDs de perfiles (ajustar según tu backend)
NEXT_PUBLIC_PERFIL_AUX_ADMIN_ID=1
NEXT_PUBLIC_PERFIL_NO_SOCIO_ID=2
NEXT_PUBLIC_PERFIL_SOCIO_ID=3
NEXT_PUBLIC_PERFIL_ADMIN_ID=4

# Opcional: Credenciales para proveedores OAuth (si las usas)
# GITHUB_ID=...
# GITHUB_SECRET=...
# GOOGLE_ID=...
# GOOGLE_SECRET=...
# FACEBOOK_CLIENT_ID=...
# FACEBOOK_CLIENT_SECRET=...
```

Asegúrate de cambiar NEXTAUTH_SECRET por uno generado por ti para producción.

Scripts Disponibles
pnpm dev: Inicia la aplicación en modo desarrollo con Next.js y Turbopack. Abre http://localhost:3000 en tu navegador.

pnpm build: Compila la aplicación para producción.

pnpm start: Inicia la aplicación en modo producción (después de pnpm build).

Ejemplo para levantar en desarrollo:

```bash
pnpm dev
```

## Detalles Técnicos y Consideraciones

### Tipado Centralizado
Las definiciones de tipos críticos (SearchParams, Session, User, JWT) están en interfaces/ y types/ para mantener la consistencia y la seguridad de tipos en todo el proyecto.

### Helpers de API
api.ts está diseñado para ser usado en Server Components y maneja la autenticación automáticamente mediante el contexto de next-auth. api-public.ts es para endpoints que no requieren autenticación.

### Optimización de UI
Se han eliminado imports no utilizados y esquemas Zod redundantes en data-table.tsx para mantener el código limpio y el bundle size bajo.

### VS Code
Se incluyen configuraciones en .vscode/settings.json para mejorar la experiencia de desarrollo (ej. realce de TODOs).

## 📊 Paginación Server-Side en Detalle
La paginación de la tabla de usuarios es un ejemplo clave de cómo aprovechamos Next.js:

app/dashboard/main/page.tsx (Server Component):

Lee los parámetros de paginación (page, size) de la URL (searchParams).

Realiza una llamada a la API de backend con api() (nuestro helper de servidor) usando esos parámetros.

Pasa los datos (data y paginationData) a DataTable como props.

components/data-table.tsx (Client Component):

Recibe los datos iniciales y de paginación como props.

Utiliza useState y useEffect para sincronizar su estado interno con las props que llegan del servidor, asegurando que la tabla siempre refleje la página actual.

Los botones de paginación (prev, next, ir a primera/última página) y el selector de tamaño de página modifican la URL usando router.push() de next/navigation.

Este cambio en la URL provoca un re-render del Server Component (main/page.tsx), que a su vez busca los nuevos datos y los pasa de vuelta a DataTable, completando el ciclo de paginación del lado del servidor.

Este enfoque garantiza que cada carga de página (o cambio de paginación) sea eficiente, ya que solo se solicitan y renderizan los datos necesarios.


