// app/dashboard/activities-inscriptions/loading.tsx

export default function ActivitiesInscriptionsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
      <div className="w-full max-w-3xl space-y-4">
        {/* Título skeleton */}
        <div className="h-6 w-64 rounded-md bg-muted animate-pulse" />
        {/* Subtítulo skeleton */}
        <div className="h-4 w-96 rounded-md bg-muted animate-pulse" />

        {/* Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-lg border bg-card animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
