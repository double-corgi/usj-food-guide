"use client";

import Link from "next/link";
import { CalendarDays, History, Trophy, Utensils, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { calculateArchiveRecordRate, calculateCompletion, formatFoodPrice, isEaten } from "@/lib/food-utils";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";
import { FoodGrid } from "@/components/food-grid";
import { FoodImage } from "@/components/food-image";

export function EatenExperience({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const completion = calculateCompletion(foods, logs);
  const archiveRecord = calculateArchiveRecordRate(foods, logs);
  const eatenFoodIds = new Set(logs.filter((log) => log.status === "eaten").map((log) => log.foodId));
  const eatenFoods = foods.filter((food) => eatenFoodIds.has(food.id));
  const recentLogs = logs
    .filter((log) => log.status === "eaten")
    .map((log) => ({ log, food: foods.find((food) => food.id === log.foodId) }))
    .filter((item): item is { log: NonNullable<typeof item.log>; food: FoodWithRelations } => Boolean(item.food))
    .sort((a, b) => (b.log.eatenAt ?? "").localeCompare(a.log.eatenAt ?? ""))
    .slice(0, 5);
  const totalSpend = eatenFoods.reduce((sum, food) => sum + (food.priceMin ?? food.price ?? 0), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-ink p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)] md:p-6">
        <p className="text-sm font-black text-mint">食べた記録</p>
        <h1 className="mt-1 text-3xl font-black md:text-4xl">食べたものを残す</h1>
        <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-200">
          現在販売中の達成状況と、過去商品を含む図鑑記録を分けて確認できます。
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MemoryStat icon={Trophy} label="現在販売中コンプ率" value={`${completion.rate}%`} note={`${completion.eaten}/${completion.total}品`} />
          <MemoryStat icon={History} label="図鑑コンプ率" value={`${archiveRecord.rate}%`} note={`${archiveRecord.eaten}/${archiveRecord.total}品`} />
          <MemoryStat icon={Utensils} label="食べた数" value={`${eatenFoods.length}品`} note="過去商品を含む記録" />
          <MemoryStat icon={WalletCards} label="総消費金額" value={totalSpend ? `¥${totalSpend.toLocaleString("ja-JP")}` : "未記録"} note="価格確認済のみ" />
        </div>
      </section>

      <section className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_42px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black text-berry">最近の記録</p>
            <h2 className="mt-1 text-2xl font-black text-ink">最近食べたもの</h2>
          </div>
          <Link href="/foods" className="rounded-full bg-ink px-3 py-1.5 text-xs font-black text-white hover:bg-park">
            さらに探す
          </Link>
        </div>
        <div className="mt-4 grid gap-3">
          {recentLogs.map(({ food, log }) => (
            <Link key={`${food.id}-${log.eatenAt ?? "unknown"}`} href={`/foods/${food.id}`} className="grid grid-cols-[86px_1fr] gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 transition active:scale-[0.99] md:hover:border-park md:hover:bg-mint/40">
              <div className="aspect-square overflow-hidden rounded-2xl bg-white">
                {log.userPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={log.userPhotoUrl} alt={`${food.name}の食べた写真`} className="h-full w-full object-cover" />
                ) : (
                  <FoodImage food={food} alt={food.name} className="h-full w-full" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2 text-[11px] font-black">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-slate-500">
                    <CalendarDays size={12} aria-hidden />
                    {formatDate(log.eatenAt)}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-park">{log.eatenCount ?? 1}回</span>
                </div>
                <p className="mt-2 line-clamp-2 text-base font-black text-ink">{food.name}</p>
                <p className="mt-1 text-xs font-black text-park">{formatFoodPrice(food)}</p>
                {log.memo ? <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-slate-500">{log.memo}</p> : null}
              </div>
            </Link>
          ))}
          {recentLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-black text-slate-500">まだ食べた記録がありません。</p>
              <Link href="/foods" className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white">
                最初の一品を探す
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <p className="text-sm font-black text-park">集計の考え方</p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
          現在販売中コンプ率は販売中の商品だけを母数にします。販売終了商品は図鑑全体の記録として残り、食べた履歴からは消えません。
        </p>
      </section>

      <FoodGrid foods={foods} mode="eaten" title="食べたもの一覧" />
    </div>
  );
}

function MemoryStat({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <Icon size={18} aria-hidden className="text-mint" />
      <p className="mt-2 text-[11px] font-bold text-slate-300">{label}</p>
      <p className="text-xl font-black">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold text-slate-400">{note}</p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "日付未記録";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" }).format(date);
}
