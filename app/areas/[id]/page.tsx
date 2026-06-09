import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MapPin, Sparkles, Store, Utensils } from "lucide-react";
import { FoodGrid } from "@/components/food-grid";
import { FoodImage } from "@/components/food-image";
import { AreaCollectionSummary } from "@/components/area-collection-summary";
import { AreaEatenFoods } from "@/components/area-eaten-foods";
import { AreaFoodStatusLists } from "@/components/area-food-status-lists";
import { dedupeFoodsByCanonical, foodMatchesArea, formatFoodPrice, getRemainingDays, getSaleUrgencyLabel, isEndingSoon } from "@/lib/food-utils";
import { rankFoodsByStrategy } from "@/lib/food-value-score";
import { listFoods } from "@/lib/repositories/foods";
import { listAreas } from "@/lib/repositories/areas";

export const revalidate = 3600;

export async function generateStaticParams() {
  const areas = await listAreas();
  return areas.map((area) => ({ id: area.id }));
}

export default async function AreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [areas, foods] = await Promise.all([listAreas(), listFoods()]);
  const area = areas.find((candidate) => candidate.id === id);
  if (!area) notFound();

  const areaFoods = foods.filter((food) => foodMatchesArea(food, area.id, area.name));
  const canonicalAreaFoods = dedupeFoodsByCanonical(areaFoods);
  const limited = canonicalAreaFoods.filter((food) => food.isLimited).length;
  const foodCart = canonicalAreaFoods.filter((food) => food.diningType === "food_cart" || food.locations?.some((location) => location.shopType === "cart" || location.shopType === "wagon")).length;
  const shops = Array.from(new Set(areaFoods.flatMap((food) => food.locations?.map((location) => location.shopName) ?? [food.shop.name]))).filter(Boolean);
  const firstBites = rankFoodsByStrategy(canonicalAreaFoods, "first-visit", [], 3);
  const endingSoonFoods = [...canonicalAreaFoods]
    .filter((food) => isEndingSoon(food, 30))
    .sort((a, b) => (getRemainingDays(a) ?? Number.MAX_SAFE_INTEGER) - (getRemainingDays(b) ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 3);
  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-soft">
        <ChevronLeft size={17} aria-hidden />
        エリア一覧へ戻る
      </Link>

      <section className="rounded-lg bg-ink p-5 text-white shadow-soft md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black text-mint">エリア別フード</p>
            <h1 className="mt-1 text-3xl font-black md:text-4xl">{area.name}</h1>
            <p className="mt-2 text-sm font-bold text-slate-200">エリアのフード、限定メニュー、販売場所をまとめて確認できます。</p>
          </div>
        </div>
        <div className="mt-5">
          <AreaCollectionSummary foods={areaFoods} allFoods={foods} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <AreaStat icon={Utensils} label="フード" value={canonicalAreaFoods.length} />
          <AreaStat icon={Store} label="販売場所" value={shops.length} />
          <AreaStat icon={Sparkles} label="期間限定" value={limited} />
          <AreaStat icon={MapPin} label="カート販売" value={foodCart} />
        </div>
      </section>

      {shops.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black text-ink">販売場所</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {shops.slice(0, 24).map((shop) => (
              <span key={shop} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {shop}
              </span>
            ))}
            {shops.length > 24 ? <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-ink">ほか{shops.length - 24}か所</span> : null}
          </div>
        </section>
      ) : null}

      <AreaEatenFoods foods={areaFoods} />

      <AreaFoodStatusLists foods={areaFoods} />

      {firstBites.length > 0 ? (
        <section className="rounded-[1.5rem] border border-amber-100 bg-[linear-gradient(135deg,#fff8e1_0%,#ffffff_72%)] p-5 shadow-soft">
          <p className="text-xs font-black text-amber-700">エリアの注目フード</p>
          <h2 className="mt-1 text-xl font-black text-ink">注目フード3品</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {firstBites.map((food, index) => (
              <Link key={food.id} href={`/foods/${food.id}`} className="grid grid-cols-[84px_1fr] gap-3 rounded-2xl bg-white p-2 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5">
                <div className="relative h-[84px] overflow-hidden rounded-xl bg-slate-100">
                  <FoodImage food={food} className="h-full w-full" />
                  <span className="absolute left-2 top-2 rounded-full bg-white/92 px-2 py-0.5 text-[10px] font-black text-park">#{index + 1}</span>
                </div>
                <div className="min-w-0 py-1">
                  <p className="line-clamp-2 text-sm font-black leading-5 text-ink">{food.name}</p>
                  <p className="mt-1 text-sm font-black text-park">{formatFoodPrice(food)}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{food.isLimited ? "限定" : "エリア代表候補"}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {endingSoonFoods.length > 0 ? (
        <section className="rounded-[1.5rem] border border-rose-100 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_72%)] p-5 shadow-soft">
          <p className="text-xs font-black text-berry">終了間近</p>
          <h2 className="mt-1 text-xl font-black text-ink">終了間近のフード</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">このエリアで逃しやすい商品を販売終了日が近い順に表示します。</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {endingSoonFoods.map((food) => (
              <Link key={food.id} href={`/foods/${food.id}`} className="grid grid-cols-[84px_1fr] gap-3 rounded-2xl bg-white p-2 shadow-sm transition active:scale-[0.99] hover:-translate-y-0.5">
                <div className="relative h-[84px] overflow-hidden rounded-xl bg-slate-100">
                  <FoodImage food={food} className="h-full w-full" />
                  <span className="absolute left-2 top-2 rounded-full bg-berry px-2 py-0.5 text-[10px] font-black text-white">{getSaleUrgencyLabel(food) ?? "終了間近"}</span>
                </div>
                <div className="min-w-0 py-1">
                  <p className="line-clamp-2 text-sm font-black leading-5 text-ink">{food.name}</p>
                  <p className="mt-1 text-sm font-black text-park">{formatFoodPrice(food)}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">残り{getRemainingDays(food) ?? "未確認"}日</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <FoodGrid foods={areaFoods} title={`${area.name}の未食・フード一覧`} initialAreaId={area.id} />
    </div>
  );
}

function AreaStat({ icon: Icon, label, value }: { icon: typeof Utensils; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <Icon size={18} aria-hidden />
      <p className="mt-2 text-[11px] font-bold text-slate-300">{label}</p>
      <p className="text-xl font-black">{value}</p>
    </div>
  );
}
