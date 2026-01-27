import { LogIn, UserPlus, Calendar, Dumbbell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface GuideStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
  };
}

export interface Guide {
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
  steps: GuideStep[];
}

export const guides: Guide[] = [
  {
    title: "Inicio de sesión",
    description: "Aprende cómo iniciar sesión en la plataforma",
    icon: LogIn,
    url: "/auth/login",
    steps: [
      {
        element: "h1",
        popover: {
          title: "Pantalla de Inicio de Sesión",
          description:
            "Esta es la página donde puedes acceder a tu cuenta de ASUR. Vamos a explorar cada elemento.",
          side: "bottom",
        },
      },
      {
        element: 'input[id="email"]',
        popover: {
          title: "Campo de Email",
          description:
            "Ingresa aquí tu correo electrónico registrado. Por ejemplo: m@example.com",
          side: "bottom",
        },
      },
      {
        element: 'input[id="password"]',
        popover: {
          title: "Campo de Contraseña",
          description:
            "Ingresa tu contraseña de forma segura. Puedes usar el ícono del ojo para mostrarla u ocultarla.",
          side: "bottom",
        },
      },
      {
        element: 'a[href="/auth/reset-pass-request"]',
        popover: {
          title: "¿Olvidaste tu contraseña?",
          description:
            "Si no recuerdas tu contraseña, haz clic aquí para recuperarla.",
          side: "left",
        },
      },
      {
        element: 'button[type="submit"]',
        popover: {
          title: "Botón de Inicio de Sesión",
          description:
            "Una vez que hayas ingresado tu email y contraseña, haz clic aquí para acceder a tu cuenta.",
          side: "top",
        },
      },
      {
        element: ".grid.grid-cols-2.gap-4",
        popover: {
          title: "Inicio Rápido con Redes Sociales",
          description:
            "También puedes iniciar sesión rápidamente usando tu cuenta de Google o Facebook.",
          side: "top",
        },
      },
      {
        element: 'a[href="/auth/new-account"]',
        popover: {
          title: "¿No tienes cuenta?",
          description:
            "Si aún no tienes una cuenta, haz clic aquí para registrarte.",
          side: "top",
        },
      },
    ],
  },
  {
    title: "Registrarse",
    description: "Guía paso a paso para crear tu cuenta",
    icon: UserPlus,
    url: "/auth/new-account",
    steps: [
      {
        element: "h2",
        popover: {
          title: "Formulario de Registro",
          description:
            "Completa este formulario para crear tu cuenta en ASUR. Te guiaremos paso a paso por cada sección.",
          side: "bottom",
        },
      },
      {
        element: 'input[name="nombre"]',
        popover: {
          title: "Tu Nombre",
          description:
            "Ingresa tu nombre (solo letras, entre 3 y 50 caracteres).",
          side: "bottom",
        },
      },
      {
        element: 'input[name="apellido"]',
        popover: {
          title: "Tu Apellido",
          description:
            "Ingresa tu apellido (solo letras, entre 3 y 50 caracteres).",
          side: "bottom",
        },
      },
      {
        element: 'input[name="email"]',
        popover: {
          title: "Correo Electrónico",
          description:
            "Usa un correo válido y único. Este será tu usuario para iniciar sesión.",
          side: "bottom",
        },
      },
      {
        element: 'input[name="password"]',
        popover: {
          title: "Contraseña Segura",
          description:
            "Debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales (!@#$).",
          side: "bottom",
        },
      },
      {
        element: 'input[name="documento"]',
        popover: {
          title: "Número de Documento",
          description: "Ingresa tu número de cédula válido o pasaporte.",
          side: "bottom",
        },
      },
      {
        element: 'button[role="combobox"]',
        popover: {
          title: "Tipo de Documento",
          description: "Selecciona si es Cédula de Identidad o Pasaporte.",
          side: "bottom",
        },
      },
      {
        element: 'input[name="calle"]',
        popover: {
          title: "Dirección - Calle",
          description: "Ingresa el nombre de tu calle.",
          side: "bottom",
        },
      },
      {
        element: 'input[name="nroPuerta"]',
        popover: {
          title: "Número de Puerta",
          description: "Ingresa el número de tu domicilio.",
          side: "bottom",
        },
      },
      {
        element: 'input[name="nroApto"]',
        popover: {
          title: "Apartamento (Opcional)",
          description:
            "Si vives en un apartamento, ingresa el número aquí. Si no, puedes dejarlo vacío.",
          side: "bottom",
        },
      },
      {
        element: 'button[class*="justify-start"]',
        popover: {
          title: "Fecha de Nacimiento",
          description:
            "Haz clic aquí para seleccionar tu fecha de nacimiento en el calendario.",
          side: "bottom",
        },
      },
      {
        element: 'input[name="telefonos.0.value"]',
        popover: {
          title: "Teléfono Celular",
          description:
            "Ingresa tu número de celular (formato: +5989XXXXXXX). Este campo es obligatorio.",
          side: "bottom",
        },
      },
      {
        element: 'button[class*="bg-gray-700"]',
        popover: {
          title: "Agregar Más Teléfonos",
          description:
            "Si quieres agregar otro número de teléfono (opcional), haz clic en 'Añadir'.",
          side: "left",
        },
      },
      {
        element: 'div[role="radiogroup"]',
        popover: {
          title: "Selecciona tu Perfil",
          description:
            "Elige si serás 'No Socio' (gratis) o 'Socio' (acceso completo a instalaciones).",
          side: "bottom",
        },
      },
      {
        element: 'input[type="checkbox"]',
        popover: {
          title: "Términos y Condiciones",
          description:
            "Lee y acepta los términos y condiciones para poder crear tu cuenta.",
          side: "left",
        },
      },
      {
        element: 'button[type="submit"]',
        popover: {
          title: "Crear tu Cuenta",
          description:
            "Una vez completado todo el formulario, haz clic aquí para registrarte. ¡Serás redirigido al login para iniciar sesión!",
          side: "top",
        },
      },
    ],
  },
  {
    title: "Reservar un espacio",
    description: "Descubre cómo reservar espacios disponibles",
    icon: Calendar,
    url: "/dashboard/reservationSpace",
    steps: [
      {
        element: "section.space-y-4.rounded-lg.border.p-4:first-of-type",
        popover: {
          title: "Formulario de Reserva",
          description:
            "En esta sección puedes buscar y reservar espacios disponibles para tus eventos. Completa los datos requeridos para encontrar espacios que se ajusten a tus necesidades.",
          side: "bottom",
        },
      },
      {
        element: 'input[type="date"]',
        popover: {
          title: "Fecha del evento",
          description:
            "Selecciona la fecha en la que necesitas el espacio. No puedes seleccionar fechas pasadas.",
          side: "bottom",
        },
      },
      {
        element: 'input[type="time"]:nth-of-type(1)',
        popover: {
          title: "Hora de inicio",
          description:
            "Indica a qué hora comenzará tu evento. El formato es de 24 horas.",
          side: "bottom",
        },
      },
      {
        element: 'input[type="time"]:nth-of-type(2)',
        popover: {
          title: "Hora de fin",
          description:
            "Indica a qué hora finalizará tu evento. Debe ser posterior a la hora de inicio.",
          side: "bottom",
        },
      },
      {
        element: 'input[type="number"]',
        popover: {
          title: "Cantidad de personas",
          description:
            "Ingresa el número total de personas que asistirán al evento. Esto ayuda a encontrar espacios con la capacidad adecuada.",
          side: "bottom",
        },
      },
      {
        element: 'input[id="limpieza"]',
        popover: {
          title: "Servicio de limpieza",
          description:
            "Marca esta opción si requieres servicio de limpieza después de tu evento. Esto puede tener un costo adicional.",
          side: "right",
        },
      },

      {
        // Botón reservar en la tabla
        element: "table button",
        popover: {
          title: "Reservar espacio",
          description:
            "Cuando aparezcan espacios disponibles, haz clic en este botón para confirmar tu reserva.",
          side: "top",
        },
      },
    ],
  }
];
