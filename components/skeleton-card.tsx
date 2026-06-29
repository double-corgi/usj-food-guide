export function SkeletonCard() {
  return (
    <div className="mobile-card-surface overflow-hidden rounded-[1.15rem] pb-12">
      <div className="aspect-[4/3] animate-pulse bg-slate-100" />
      <div className="min-h-[132px] space-y-3 px-3 py-3">
        <div className="h-4 w-20 animate-pulse rounded-full bg-slate-100" />
        <div className="h-5 w-11/12 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-9 animate-pulse rounded-full bg-slate-100" />
          <div className="h-9 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
