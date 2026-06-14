"use client";

import Link from "next/link";
import { Check, Flag } from "lucide-react";
import { FoodImage } from "@/components/food-image";
import { formatFoodPrice, getFoodAreaSummary, isEatenCanonical } from "@/lib/food-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { getStoreDisplayFoods } from "@/lib/store-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import { useNextWantFoods } from "@/lib/use-next-want-foods";
import type { FoodWithRelations } from "@/types/domain";

export function StoreFoodList({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const displayFoods = getStoreDisplayFoods(foods);
  const { logs } = useFoodLogs();
  const { isWanted } = useNextWantFoods(displayFoods);

  if (displayFoods.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm font-bold text-slate-500">
        {t("store.availableFoodsEmpty")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 xl:grid-cols-4">
      {displayFoods.map((food) => {
        const eaten = isEatenCanonical(foods, logs, food);
        const wanted = isWanted(food);
        return (
          <Link key={food.id} href={`/foods/${food.id}`} className="group min-w-0 transition active:scale-[0.99]">
            <div className="relative aspect-square overflow-hidden rounded-[1.2rem] bg-slate-100">
              <FoodImage food={food} alt={food.name} className="h-full w-full transition duration-300 group-hover:scale-105" />
              <div className="absolute left-2 top-2 flex gap-1.5">
                {eaten ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-park text-white shadow-sm" aria-label={t("common.eaten")}>
                    <Check size={14} aria-hidden />
                  </span>
                ) : null}
                {wanted ? (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/92 text-park shadow-sm" aria-label="次回食べたい">
                    <Flag size={14} aria-hidden />
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-2 min-w-0">
              <p className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-ink">{food.name}</p>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] font-black">
                <span className="text-park">{formatFoodPrice(food)}</span>
                <span className="line-clamp-1 text-slate-500">{getFoodAreaSummary(food)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
