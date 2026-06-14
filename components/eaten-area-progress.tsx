"use client";

import Link from "next/link";
import { calculateAreaProgressList } from "@/lib/area-progress";
import { useLocale } from "@/lib/i18n/use-locale";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";

export function EatenAreaProgress({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  const areaProgress = calculateAreaProgressList(foods, logs).sort(
    (a, b) => b.active.rate - a.active.rate || b.active.total - a.active.total || a.area.name.localeCompare(b.area.name, "ja")
  );

  return (
    <section className="space-y-3 border-t border-slate-200 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-park">{t("eaten.areaProgress.kicker")}</p>
          <h2 className="mt-1 text-xl font-black text-ink">{t("eaten.areaProgress.title")}</h2>
        </div>
        <p className="text-xs font-black text-slate-400">{t("eaten.areaProgress.areaCount", { count: areaProgress.length })}</p>
      </div>

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        {areaProgress.map((progress) => (
          <article key={progress.area.id} className="rounded-2xl bg-white/45 px-3 py-2.5 ring-1 ring-slate-200/45">
            <div className="flex items-start justify-between gap-3">
              <h3 className="line-clamp-2 min-w-0 text-sm font-black leading-5 text-ink">{progress.area.name}</h3>
              <p className="shrink-0 text-xl font-black leading-none text-park">{progress.active.rate}%</p>
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] font-black text-slate-500">
              <span>{progress.active.eaten} / {progress.active.total}</span>
              <span>{t("eaten.areaProgress.remaining", { count: progress.active.uneaten })}</span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)] shadow-[0_0_10px_rgba(0,87,184,0.24)]"
                style={{ width: `${progress.active.rate}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
              <span>{t("eaten.areaProgress.archive", { eaten: progress.archive.eaten, total: progress.archive.total })}</span>
              <span>{progress.archive.rate}%</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2.5 text-[11px] font-black">
              <Link href={`/areas/${progress.area.id}?view=eaten#area-eaten-foods`} className="text-park underline-offset-4 hover:underline">
                {t("eaten.areaProgress.viewEaten")}
              </Link>
              <Link href={`/areas/${progress.area.id}?view=missing#area-missing-foods`} className="text-slate-500 underline-offset-4 hover:underline">
                {t("eaten.areaProgress.viewRemaining")}
              </Link>
              <Link href={`/areas/${progress.area.id}`} className="text-slate-500 underline-offset-4 hover:underline">
                {t("eaten.areaProgress.viewArea")}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
