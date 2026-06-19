export function CompletionMeter({
  label,
  eaten,
  total,
  rate
}: {
  label: string;
  eaten: number;
  total: number;
  rate: number;
}) {
  const remaining = Math.max(total - eaten, 0);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-ink">{rate}%</p>
          <p className="mt-1 text-xs font-black text-berry">{remaining === 0 && total > 0 ? "コンプ完了" : `あと${remaining}件`}</p>
        </div>
        <p className="text-sm font-bold text-slate-500">
          {eaten} / {total}
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)]" style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}
