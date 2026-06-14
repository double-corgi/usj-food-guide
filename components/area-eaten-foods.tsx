"use client";

import Link from "next/link";
import { dedupeFoodsByCanonical, getCanonicalFoodKey, getEatenCanonicalKeys } from "@/lib/food-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodImage } from "@/components/food-image";

export function AreaEatenFoods({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const eatenFoods = canonicalFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food)));

  return (
    <section id="area-eaten-foods" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-ink">{t("area.eatenFoods")}</h2>
          {eatenFoods.length === 0 ? <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{t("area.eatenFoodsEmpty")}</p> : null}
        </div>
        {eatenFoods.length > 0 ? <p className="text-xs font-black text-[#8a5b16]">{eatenFoods.length}品</p> : null}
      </div>
      {eatenFoods.length > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
            {eatenFoods.slice(0, 8).map((food) => (
              <Link key={food.id} href={`/foods/${food.id}`} className="group min-w-0 transition active:scale-[0.99]">
                <div className="relative aspect-square overflow-hidden rounded-[13px] bg-[#f1e4d2] ring-2 ring-[#fdbb30]/85 ring-offset-1 ring-offset-[#fffaf5]">
                  <FoodImage food={food} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
                  <span className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-[#fdbb30] text-[13px] font-black leading-none text-[#071b3a] ring-1 ring-white/90 shadow-[inset_0_0_6px_rgba(255,255,255,0.42),0_1px_4px_rgba(7,27,58,0.18)]" aria-hidden>
                    ✓
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-black leading-[1.45] text-ink">{food.name}</p>
              </Link>
            ))}
          </div>
          {eatenFoods.length > 8 ? (
            <Link href="/eaten" className="inline-flex text-sm font-black text-park">
              {t("area.eatenFoodsViewAll")}
            </Link>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
