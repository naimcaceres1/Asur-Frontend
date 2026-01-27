// app/dashboard/spaces/loading.tsx

export default function SpacesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      {/* Título */}
      <div className="space-y-2">
        <div className="h-7 w-60 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-[420px] rounded-md bg-muted animate-pulse" />
      </div>

      {/* Barra de acciones / filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Listado de espacios (estilo cards) */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-40 rounded-lg border bg-card p-4 space-y-3 animate-pulse"
          >
            <div className="h-5 w-40 rounded-md bg-muted" />
            <div className="h-4 w-28 rounded-md bg-muted" />
            <div className="h-4 w-32 rounded-md bg-muted" />
            <div className="h-4 w-24 rounded-md bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
