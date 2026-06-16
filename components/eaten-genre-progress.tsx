"use client";

import Link from "next/link";
import { categoryLabels } from "@/lib/constants";
import { dedupeFoodsByCanonical, getCanonicalFoodKey, getEatenCanonicalKeys, isCompletableFood } from "@/lib/food-utils";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/use-locale";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodCategory, FoodWithRelations } from "@/types/domain";

type GenreProgress = {
  id: FoodCategory;
  label: string;
  active: {
    total: number;
    eaten: number;
    rate: number;
    uneaten: number;
  };
  archive: {
    total: number;
    eaten: number;
    rate: number;
  };
};

export function EatenGenreProgress({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const progress = calculateGenreProgress(foods, eatenKeys, t);

  return (
    <section className="space-y-3 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-park">{t("eaten.genreProgress.kicker")}</p>
          <h2 className="mt-1 text-xl font-black text-ink">{t("eaten.genreProgress.title")}</h2>
        </div>
        <p className="text-xs font-black text-slate-400">{t("eaten.genreProgress.genreCount", { count: progress.length })}</p>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {progress.map((item) => (
          <article key={item.id} className="rounded-2xl bg-white/45 px-3 py-2.5 ring-1 ring-slate-200/45">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 min-w-0 text-sm font-black leading-5 text-ink">{item.label}</h3>
              <p className="shrink-0 text-xl font-black leading-none text-park">{item.active.rate}%</p>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] font-black text-slate-500">
              <span>{item.active.eaten} / {item.active.total}</span>
              <span>{t("eaten.genreProgress.remaining", { count: item.active.uneaten })}</span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)] shadow-[0_0_10px_rgba(0,87,184,0.2)]"
                style={{ width: `${item.active.rate}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
              <span>{t("eaten.genreProgress.archive", { eaten: item.archive.eaten, total: item.archive.total })}</span>
              <span>{item.archive.rate}%</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2.5 text-[11px] font-black">
              <Link href={`/foods?category=${item.id}&mode=eaten`} className="text-park underline-offset-4 hover:underline">
                {t("eaten.genreProgress.viewEaten")}
              </Link>
              <Link href={`/foods?category=${item.id}&sort=uneaten`} className="text-slate-500 underline-offset-4 hover:underline">
                {t("eaten.genreProgress.viewRemaining")}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function calculateGenreProgress(foods: FoodWithRelations[], eatenKeys: Set<string>, t: (key: TranslationKey) => string): GenreProgress[] {
  return (Object.keys(categoryLabels) as FoodCategory[])
    .map((category) => {
      const categoryFoods = foods.filter((food) => food.category === category);
      const activeFoods = dedupeFoodsByCanonical(categoryFoods.filter(isCompletableFood));
      const archiveFoods = dedupeFoodsByCanonical(categoryFoods);
      const activeEaten = activeFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
      const archiveEaten = archiveFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
      return {
        id: category,
        label: t(`category.${category}` as TranslationKey),
        active: {
          total: activeFoods.length,
          eaten: activeEaten,
          rate: activeFoods.length === 0 ? 0 : Math.round((activeEaten / activeFoods.length) * 100),
          uneaten: Math.max(activeFoods.length - activeEaten, 0)
        },
        archive: {
          total: archiveFoods.length,
          eaten: archiveEaten,
          rate: archiveFoods.length === 0 ? 0 : Math.round((archiveEaten / archiveFoods.length) * 100)
        }
      };
    })
    .filter((item) => item.archive.total > 0)
    .sort((a, b) => b.active.rate - a.active.rate || b.active.total - a.active.total || a.label.localeCompare(b.label, "ja"));
}
