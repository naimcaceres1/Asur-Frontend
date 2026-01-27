// app/dashboard/functionalities/profile/loading.tsx

export default function FunctionalitiesProfileLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      {/* Título + subtítulo */}
      <div className="space-y-2">
        <div className="h-7 w-80 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-96 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Contenido principal (filtros + tabla/listado) */}
      <div className="rounded-lg border bg-card p-4 space-y-4">
        {/* Filtros / buscador */}
        <div className="flex flex-wrap gap-3">
          <div className="h-9 w-56 rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Tabla / listado de funcionalidades por perfil */}
        <div className="space-y-2">
          <div className="h-5 w-full rounded-md bg-muted animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 w-full rounded-md bg-muted/80 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
