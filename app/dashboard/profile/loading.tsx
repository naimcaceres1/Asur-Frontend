// app/dashboard/profile/loading.tsx

export default function ProfileLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="w-full max-w-sm md:max-w-md space-y-6">
        {/* Avatar skeleton */}
        <div className="flex flex-col items-center gap-4">
          <div className="h-32 w-32 rounded-full bg-muted animate-pulse" />
          <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Card skeleton */}
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          {/* Fila email */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
          </div>

          {/* Fila teléfono */}
          <div className="grid grid-cols-2 gap-3 items-center">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
          </div>

          {/* Fila dirección */}
          <div className="grid grid-cols-2 gap-3 items-start">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </div>

          {/* Botón editar */}
          <div className="mt-4 flex justify-center">
            <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
