"use client";

import { dedupeFoodsByCanonical, getCanonicalFoodKey, getEatenCanonicalKeys, isCompletableFood } from "@/lib/food-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";

export function AreaCollectionSummary({ foods, allFoods = foods }: { foods: FoodWithRelations[]; allFoods?: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenCanonicalKeys = getEatenCanonicalKeys(allFoods, logs);
  const activeFoods = canonicalFoods.filter(isCompletableFood);
  const activeEaten = activeFoods.filter((food) => eatenCanonicalKeys.has(getCanonicalFoodKey(food))).length;
  const completion = {
    total: activeFoods.length,
    eaten: activeEaten,
    rate: activeFoods.length === 0 ? 0 : Math.round((activeEaten / activeFoods.length) * 100)
  };
  const uneaten = Math.max(completion.total - completion.eaten, 0);

  if (completion.total === 0) {
    return (
      <div className="border-b border-[#eadcc8] pb-5">
        <p className="text-lg font-black leading-8 text-[#071b3a]">{t("area.checkingNow")}</p>
        <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{t("area.endedFoodsNote")}</p>
      </div>
    );
  }

  if (uneaten === 0) {
    return (
      <div className="border-b border-[#eadcc8] pb-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black leading-8 text-[#071b3a]">{t("area.complete")}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">食べた {completion.eaten} / 販売中 {completion.total}品（登録分）</p>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#fdbb30] text-lg font-black leading-none text-[#071b3a] ring-1 ring-white/90 shadow-[inset_0_0_6px_rgba(255,255,255,0.42),0_1px_4px_rgba(7,27,58,0.18)]" aria-hidden>
            ✓
          </span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#e7dccb]">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0a74db_50%,#fdbb30_100%)]" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#eadcc8] pb-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black text-[#8a5b16]">このエリアであと</p>
          <p className="mt-1 text-[2rem] font-black leading-none tracking-[-0.04em] text-[#071b3a]">{uneaten}品</p>
        </div>
        {completion.eaten > 0 ? (
          <p className="shrink-0 text-right text-sm font-black text-[#071b3a]">
            {completion.eaten} / {completion.total}
            <span className="block text-[11px] text-slate-500">コンプ率 {completion.rate}%</span>
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">食べた {completion.eaten} / 販売中 {completion.total}品（登録分）</p>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#e7dccb]">
        <div className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8_0%,#0a74db_50%,#fdbb30_100%)]" style={{ width: `${Math.max(completion.rate, 1)}%` }} />
      </div>
    </div>
  );
}
