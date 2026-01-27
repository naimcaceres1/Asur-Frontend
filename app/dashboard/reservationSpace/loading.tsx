// app/dashboard/reservationSpace/loading.tsx

export default function ReservationSpaceLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {/* Título */}
      <div className="space-y-2">
        <div className="h-6 w-72 rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-[420px] rounded-md bg-muted animate-pulse" />
      </div>

      {/* Filtros / botones superiores */}
      <div className="flex flex-wrap gap-3">
        <div className="h-9 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
      </div>

      {/* Tabla / tarjetas de reservas */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {/* encabezado tabla */}
        <div className="grid grid-cols-4 gap-4 pb-2 border-b">
          <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-20 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
        </div>

        {/* filas tabla */}
        <div className="space-y-2 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-4 rounded-md bg-muted/40 px-2 py-3 animate-pulse"
            >
              <div className="h-4 w-32 rounded-md bg-muted" />
              <div className="h-4 w-32 rounded-md bg-muted" />
              <div className="h-4 w-20 rounded-md bg-muted" />
              <div className="h-4 w-16 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
