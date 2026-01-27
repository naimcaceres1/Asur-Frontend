import Link from "next/link";
import {
  IconUsersGroup,
  IconCalendarStats,
  IconActivity,
} from "@tabler/icons-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          Desde aquí vas a poder acceder a los distintos reportes del sistema.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Inscripciones */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsersGroup className="h-5 w-5" />
              <span>Inscripciones a actividades</span>
            </CardTitle>
            <CardDescription>
              Reportes de inscripciones con filtros y exportación.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button asChild>
              <Link href="/dashboard/reports/inscriptions">
                Ir a inscripciones
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Reservas de espacios */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCalendarStats className="h-5 w-5" />
              <span>Reservas de espacios</span>
            </CardTitle>
            <CardDescription>
              Reportes de reservas por fecha, espacio y estado.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button asChild>
              <Link href="/dashboard/reports/spaces">Ir a reservas</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Auditoría */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconActivity className="h-5 w-5" />
              <span>Auditoría</span>
            </CardTitle>
            <CardDescription>
              Reportes de auditoría para seguimiento de cambios.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button asChild>
              {/* ajustá esta ruta al nombre real de la carpeta cuando la crees */}
              <Link href="/dashboard/reports/audit">Ir a auditoría</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
