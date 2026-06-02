export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
      <div className="aspect-[4/3] animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
