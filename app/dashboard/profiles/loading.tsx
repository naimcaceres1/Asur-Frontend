// app/dashboard/profiles/loading.tsx

export default function ProfilesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Título + descripción */}
      <div className="space-y-2">
        <div className="h-7 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Tabla de perfiles en skeleton */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* Header de la tabla */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Filas */}
        <div className="space-y-2 mt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-md border p-3"
            >
              <div className="h-4 w-40 rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
