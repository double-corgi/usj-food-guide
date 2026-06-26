import { monetizationConfig } from "@/lib/monetization";

export type AdPlacement =
  | "home-after-recent"
  | "foods-after-filters"
  | "foods-inline"
  | "food-detail-middle"
  | "eaten-summary";

const placementLabels: Record<AdPlacement, string> = {
  "home-after-recent": "ホーム上部",
  "foods-after-filters": "フード検索上部",
  "foods-inline": "フード一覧内",
  "food-detail-middle": "フード詳細",
  "eaten-summary": "食べた記録"
};

type AdSlotProps = {
  className?: string;
  placement: AdPlacement;
};

export function AdSlot({ className = "", placement }: AdSlotProps) {
  if (!monetizationConfig.adsEnabled) return null;

  return (
    <aside
      aria-label={`${monetizationConfig.labels.ad}: ${placementLabels[placement]}`}
      data-ad-placement={placement}
      className={`w-full overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      <p className="text-[10px] font-black tracking-[0.22em] text-slate-400">{monetizationConfig.labels.ad}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
        広告枠
      </p>
    </aside>
  );
}
