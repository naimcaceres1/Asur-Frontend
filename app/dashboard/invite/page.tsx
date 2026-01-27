// app/dashboard/invite/page.tsx  (o guest-home, como prefieran)

import Link from "next/link";
import Image from "next/image";
import { IconUsersGroup, IconActivity } from "@tabler/icons-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AsurNewsGrid,
  type AsurNewsItem,
} from "@/components/asur-home";

// ---- Novedades estáticas (editables a mano) ----

const NEWS_ITEMS: AsurNewsItem[] = [
  {
    id: "aniversario-juvesur",
    title: "¡Feliz aniversario, Comisión de Juventud!",
    description:
      "Felicitaciones por sus 57 años de trabajo voluntario dedicado a la juventud sorda uruguaya.",
    imageSrc: "/aniversario-juvesur.jpeg",
    imageAlt:
      "Afiche de aniversario de la Comisión de Juventud de la Asociación de Sordos del Uruguay.",
    extraInfo:
      "La Comisión de Juventud de ASUR impulsa actividades para jóvenes sordos en todo el país, promoviendo el encuentro, la formación y la participación.",
  },
  {
    id: "lema-28-sept",
    title: "Lema del día – 28 de setiembre 2025",
    description:
      "“Sentar las bases para el futuro: ¡Juntos podemos innovar, inspirar e impactar!”.",
    imageSrc: "/lema-28-septiembre-2025.jpeg",
    imageAlt:
      "Afiche con el lema del día 28 de setiembre 2025 en la Semana Internacional de las Personas Sordas.",
    extraInfo:
      "En el marco de la Semana Internacional de las Personas Sordas 2025, este lema destaca el papel de las comunidades sordas en la innovación y el cambio tecnológico.",
  },
  {
    id: "lema-27-sept",
    title: "Lema del día – 27 de setiembre 2025",
    description:
      "“Servicios de acceso a la lengua de señas”. Derechos y participación inclusiva.",
    imageSrc: "/lema-27-septiembre-2025.jpeg",
    imageAlt:
      "Afiche con el lema del día 27 de setiembre 2025 sobre servicios de acceso a la lengua de señas.",
    extraInfo:
      "Reafirma el derecho de las personas sordas a contar con servicios de interpretación y acceso en lengua de señas en todos los ámbitos de la vida.",
  },
];

export const metadata = {
  title: "Invitado | ASUR",
  description: "Plataforma ASUR en modo invitado",
};

export default function InvitePage() {
  return (
    <div className="flex flex-1 flex-col gap-10 p-4">
      {/* HERO + QUIÉNES SOMOS / MISIÓN VISIÓN */}
            {/* HERO + QUIÉNES SOMOS / MISIÓN VISIÓN */}
      <section className="grid gap-6 md:grid-cols-[2fr,1.2fr] md:items-start">
        {/* Columna izquierda: bienvenida */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenidos a la plataforma de ASUR
            </h1>
            <Image
              src="/escudo-asur.png"
              alt="Logo de la Asociación de Sordos del Uruguay"
              width={105}
              height={105}
              className="h-24 w-auto mr-4 md:h-28 md:mr-6"
            />
          </div>

          <p className="max-w-xl text-muted-foreground">
            En este espacio podés conocer las actividades, novedades y servicios
            de la Asociación de Sordos del Uruguay. Si te registrás, vas a poder
            inscribirte a actividades, reservar espacios y acceder a más
            funcionalidades.
          </p>
        </div>


        {/* Columna derecha: quiénes somos / misión-visión */}
        <div className="space-y-4 rounded-2xl border bg-card/50 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <IconUsersGroup className="h-5 w-5" />
            Asociación de Sordos del Uruguay
          </h2>
          <p className="text-sm text-muted-foreground">
            ASUR es una organización de y para personas sordas que, desde 1968,
            trabaja por la defensa de sus derechos, la promoción de la Lengua de
            Señas Uruguaya y la plena participación en la sociedad.
          </p>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Misión</h3>
              <p className="text-muted-foreground">
                Promover la inclusión, la accesibilidad y el empoderamiento de
                la comunidad sorda, generando espacios de formación, encuentro y
                participación en todo el país.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Visión</h3>
              <p className="text-muted-foreground">
                Ser una referencia en derechos, educación y cultura sorda,
                construyendo una sociedad donde la Lengua de Señas Uruguaya sea
                reconocida y valorada en todos los ámbitos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PEQUEÑO BLOQUE HISTORIA */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Un poco de nuestra historia
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          ASUR nació en Montevideo en 1968 a partir de la iniciativa de personas
          sordas que buscaban un espacio propio de encuentro, organización y
          defensa de sus derechos. A lo largo de los años se consolidó como un
          referente nacional, con comisiones de trabajo, participación en
          espacios internacionales y actividades en distintas ciudades del país.
        </p>
      </section>

      {/* ¿QUÉ PODÉS HACER EN LA PLATAFORMA? */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <IconActivity className="h-5 w-5" />
          ¿Qué vas a poder hacer si te registrás?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Inscribirte a actividades</CardTitle>
              <CardDescription>
                Talleres, cursos, actividades recreativas y encuentros para la
                comunidad sorda y oyente.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Reservar espacios</CardTitle>
              <CardDescription>
                Gestioná la reserva de espacios de ASUR para actividades,
                reuniones o propuestas comunitarias.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Acceder a más servicios</CardTitle>
              <CardDescription>
                Próximamente, nuevos módulos y herramientas pensadas para socios
                y personas vinculadas a ASUR.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* NOVEDADES ASUR (estáticas) */}
      <section className="space-y-4" aria-labelledby="novedades-title">
        <div className="flex items-center justify-between gap-4">
          <h2
            id="novedades-title"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight"
          >
            Novedades ASUR
          </h2>
        </div>

        <AsurNewsGrid items={NEWS_ITEMS} />
      </section>
    </div>
  );
}
