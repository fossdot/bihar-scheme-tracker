export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-4 w-28 rounded bg-line" />
      <div className="space-y-3">
        <div className="h-8 w-2/3 rounded bg-line" />
        <div className="h-4 w-full rounded bg-line" />
        <div className="h-4 w-5/6 rounded bg-line" />
      </div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-surface" />
        ))}
      </div>
      <div className="h-44 rounded-md border border-line bg-surface" />
    </div>
  );
}
