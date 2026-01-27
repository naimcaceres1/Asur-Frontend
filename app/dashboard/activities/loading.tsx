// app/dashboard/activities/loading.tsx

export default function ActivitiesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {/* Título + descripción */}
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-[420px] rounded-md bg-muted animate-pulse" />
      </div>

      {/* Filtros / barra de acciones */}
      <div className="flex flex-wrap gap-3">
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-52 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Contenido principal: listado + panel lateral (aprox al ActivitiesAdminClient) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Columna izquierda: tabla de actividades */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          {/* Cabecera tabla */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
          </div>

          {/* Filas tabla */}
          <div className="space-y-2 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 animate-pulse"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 rounded-md bg-muted" />
                  <div className="h-3 w-32 rounded-md bg-muted" />
                </div>
                <div className="h-8 w-24 rounded-md bg-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: formulario / card de crear/editar */}
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="h-5 w-48 rounded-md bg-muted animate-pulse" />
          <div className="space-y-3 mt-2">
            <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
