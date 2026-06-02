import { monetizationConfig } from "@/lib/monetization";

export function AdSlot({ label = "広告枠" }: { label?: string }) {
  if (!monetizationConfig.adsEnabled) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/60 text-xs font-bold text-slate-300">
        {label}
      </div>
    );
  }

  return (
    <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-400">
      {monetizationConfig.labels.ad} / {label}
    </div>
  );
}
