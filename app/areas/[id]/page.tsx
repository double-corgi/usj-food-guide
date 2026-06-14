import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { FoodImage } from "@/components/food-image";
import { AreaCollectionSummary } from "@/components/area-collection-summary";
import { AreaEatenFoods } from "@/components/area-eaten-foods";
import { AreaFoodStatusLists } from "@/components/area-food-status-lists";
import { I18nText } from "@/components/i18n-text";
import { getAreaImageByName } from "@/lib/area-images";
import { shopTypeLabels } from "@/lib/constants";
import { dedupeFoodsByCanonical, foodMatchesArea, formatFoodPrice, getRemainingDays, getSaleUrgencyLabel, isEndingSoon } from "@/lib/food-utils";
import { rankFoodsByStrategy } from "@/lib/food-value-score";
import { listFoods } from "@/lib/repositories/foods";
import { listAreas } from "@/lib/repositories/areas";
import type { FoodLocation, FoodWithRelations, ShopType } from "@/types/domain";

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
  const areaImage = getAreaImageByName(area.name);
  const shops = buildAreaShopRows(areaFoods);
  const firstBites = rankFoodsByStrategy(canonicalAreaFoods, "first-visit", [], 3);
  const endingSoonFoods = [...canonicalAreaFoods]
    .filter((food) => isEndingSoon(food, 30))
    .sort((a, b) => (getRemainingDays(a) ?? Number.MAX_SAFE_INTEGER) - (getRemainingDays(b) ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name, "ja"))
    .slice(0, 3);
  return (
    <div className="area-detail-page -mx-4 bg-[#fffaf5] px-4 pb-28 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
      <div className="mx-auto max-w-[1080px] space-y-10">
        <Link href="/areas" className="inline-flex items-center gap-2 text-sm font-black text-[#071b3a]">
          <ChevronLeft size={17} aria-hidden />
          <I18nText k="area.backToList" />
        </Link>

        <section className="space-y-5">
          {areaImage ? (
            <div className="relative -mx-4 h-[240px] overflow-hidden bg-[#efe1cd] sm:-mx-6 lg:mx-0 lg:h-[320px] lg:rounded-[2rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={areaImage.image} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.02)_0%,rgba(2,8,23,0.24)_42%,rgba(2,8,23,0.86)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:p-6">
                <h1 className="max-w-[820px] text-3xl font-black leading-tight md:text-4xl">{area.name}</h1>
              </div>
            </div>
          ) : (
            <div className="border-y border-[#eadcc8] py-12">
              <h1 className="text-3xl font-black leading-tight text-[#071b3a] md:text-4xl">{area.name}</h1>
            </div>
          )}

          <AreaCollectionSummary foods={areaFoods} allFoods={foods} />
        </section>

        {firstBites.length > 0 ? (
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-ink">
                <I18nText k="area.firstPicks" />
              </h2>
              <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
                <I18nText k="area.firstPicksDescription" />
              </p>
            </div>
            <div className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {firstBites.map((food) => (
                <Link key={food.id} href={`/foods/${food.id}`} className="w-[74vw] max-w-[300px] shrink-0 snap-start transition active:scale-[0.99] lg:w-auto lg:max-w-none">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.15rem] bg-[#f1e4d2]">
                    <FoodImage food={food} className="h-full w-full" />
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-11 text-sm font-black leading-[1.55] text-ink">{food.name}</p>
                  <p className="mt-1 text-sm font-black text-park">{formatFoodPrice(food)}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {endingSoonFoods.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-ink">
              <I18nText k="area.endingSoon" />
            </h2>
            <p className="mt-1 text-sm font-bold text-slate-500">
              <I18nText k="area.endingSoonDescription" />
            </p>
            <div className="flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
              {endingSoonFoods.map((food) => (
                <Link key={food.id} href={`/foods/${food.id}`} className="w-[74vw] max-w-[300px] shrink-0 snap-start transition active:scale-[0.99] lg:w-auto lg:max-w-none">
                  <div className="aspect-[4/3] overflow-hidden rounded-[1.15rem] bg-[#f1e4d2]">
                    <FoodImage food={food} className="h-full w-full" />
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-11 text-sm font-black leading-[1.55] text-ink">{food.name}</p>
                  <p className="mt-1 text-sm font-black text-park">{formatFoodPrice(food)}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-500">{getSaleUrgencyLabel(food) ?? `残り${getRemainingDays(food) ?? "未確認"}日`}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <AreaEatenFoods foods={areaFoods} />

        <AreaFoodStatusLists foods={areaFoods} areaId={area.id} />

        {shops.length > 0 ? <AreaShopList shops={shops} /> : null}
      </div>
    </div>
  );
}

type AreaShopRow = {
  key: string;
  name: string;
  type: ShopType;
  href?: string;
};

function AreaShopList({ shops }: { shops: AreaShopRow[] }) {
  const visible = shops.slice(0, 6);
  const hidden = shops.slice(6);
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-[#eadcc8] pb-3">
        <h2 className="text-xl font-black text-ink">
          <I18nText k="area.salesLocations" />
        </h2>
        <p className="text-xs font-black text-slate-500">{shops.length}か所</p>
      </div>
      <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-8">
        {visible.map((shop) => (
          <ShopRow key={shop.key} shop={shop} />
        ))}
      </div>
      {hidden.length > 0 ? (
        <details className="border-t border-[#eadcc8] pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-park">
            すべての販売場所を見る（あと{hidden.length}か所）
            <ChevronDown size={15} aria-hidden />
          </summary>
          <div className="mt-3 grid gap-0 lg:grid-cols-2 lg:gap-x-8">
            {hidden.map((shop) => (
              <ShopRow key={shop.key} shop={shop} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function ShopRow({ shop }: { shop: AreaShopRow }) {
  const content = (
    <>
      <span className="min-w-0 truncate text-sm font-black text-[#071b3a]">{shop.name}</span>
      <span className="shrink-0 text-xs font-bold text-slate-500">{shopTypeLabels[shop.type] ?? "フード施設"}</span>
    </>
  );
  const className = "flex min-h-12 items-center justify-between gap-4 border-b border-[#eadcc8]/80 py-3";
  if (shop.href) {
    return (
      <Link href={shop.href} className={`${className} transition hover:text-park`}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

function buildAreaShopRows(foods: FoodWithRelations[]) {
  const rows = new Map<string, AreaShopRow>();
  for (const food of foods) {
    const locations = food.locations?.length ? food.locations : [foodToLocation(food)];
    for (const location of locations) {
      if (!isDisplayableShopName(location.shopName)) continue;
      const key = normalizeShopName(location.shopName);
      const current = rows.get(key);
      const next = {
        key,
        name: location.shopName.trim(),
        type: location.shopType,
        href: location.shopId ? `/stores/${location.shopId}` : undefined
      };
      rows.set(key, pickRepresentativeShopRow(current, next));
    }
  }
  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

function normalizeShopName(name: string) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function pickRepresentativeShopRow(current: AreaShopRow | undefined, next: AreaShopRow) {
  if (!current) return next;
  if (!current.href && next.href) return next;
  if (current.href && !next.href) return current;
  if (!isKnownShopType(current.type) && isKnownShopType(next.type)) return next;
  return current;
}

function isKnownShopType(type: ShopType) {
  return type !== "unknown";
}

function foodToLocation(food: FoodWithRelations): Pick<FoodLocation, "shopId" | "shopName" | "shopType"> {
  return {
    shopId: food.shop.id,
    shopName: food.shop.name,
    shopType: food.shop.type
  };
}

function isDisplayableShopName(name?: string | null) {
  if (!name) return false;
  return !/^(店舗未確認|エリア確認中|未確認|不明|unknown)$/i.test(name.trim());
}
