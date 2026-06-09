"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { categoryLabels, diningTypeLabels, shopTypeLabels, statusLabels } from "@/lib/constants";
import { dedupeFoodsByCanonical, foodMatchesArea, getFoodAreaNames, getFoodAreaSummary, getSaleStatus, getSaleType, isEndingSoon, getCanonicalFoodKey, getEatenCanonicalKeys, isEatenCanonical, normalizeDisplayAreaName, normalizeFoodName } from "@/lib/food-utils";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";
import { getCategoryPlaceholder, getFoodImage } from "@/lib/utils/image";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { DiningType, FoodCategory, FoodStatus, FoodWithRelations, ShopType } from "@/types/domain";
import { FoodCard } from "@/components/food-card";
import { FoodImage } from "@/components/food-image";
import { SkeletonCard } from "@/components/skeleton-card";

export type ListMode = "all" | "eaten";
export type SortMode = "recommended" | "new" | "image" | "status" | "uneaten" | "category" | "shop" | "priceAsc" | "priceDesc" | "walk";
type PriceFilter = "all" | "known" | "unknown";
export type SaleFilter = "active" | "endingSoon" | "ended" | "upcoming" | "unknown" | "permanent" | "limited" | "all";

const categoryChips: Array<{ value: FoodCategory | "all"; label: string; icon: string }> = [
  { value: "all", label: "すべて", icon: "✨" },
  { value: "churro", label: "チュリトス", icon: "🌯" },
  { value: "popcorn", label: "ポップコーン", icon: "🍿" },
  { value: "drink", label: "ドリンク", icon: "🥤" },
  { value: "pizza", label: "ピザ", icon: "🍕" },
  { value: "burger", label: "バーガー", icon: "🍔" },
  { value: "noodle", label: "パスタ", icon: "🍝" },
  { value: "set", label: "プレート", icon: "🍖" },
  { value: "rice", label: "ライス", icon: "🍛" },
  { value: "kids", label: "キッズ", icon: "🧒" },
  { value: "dessert", label: "スイーツ", icon: "🍰" }
];

export function FoodGrid({
  foods,
  mode = "all",
  initialCategory,
  initialAreaId,
  initialShopId,
  initialDiningType,
  initialSaleFilter,
  initialSort,
  title,
  showRequestCta = true
}: {
  foods: FoodWithRelations[];
  mode?: ListMode;
  initialCategory?: FoodCategory;
  initialAreaId?: string;
  initialShopId?: string;
  initialDiningType?: DiningType;
  initialSaleFilter?: SaleFilter;
  initialSort?: SortMode;
  title?: string;
  generatedAt?: string;
  showRequestCta?: boolean;
}) {
  const { logs, ready, error, toggleEaten } = useFoodLogs();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">(initialCategory ?? "all");
  const [areaId, setAreaId] = useState(initialAreaId ?? "all");
  const [shopId, setShopId] = useState(initialShopId ?? "all");
  const [shopType, setShopType] = useState<ShopType | "all">("all");
  const [diningType, setDiningType] = useState<DiningType | "all">(initialDiningType ?? "all");
  const [status, setStatus] = useState<FoodStatus | "all">("all");
  const [saleFilter, setSaleFilter] = useState<SaleFilter>(initialSaleFilter ?? (mode === "all" ? "active" : "all"));
  const [sort, setSort] = useState<SortMode>(initialSort ?? "recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imageOnly, setImageOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(60);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches());
  const canonicalFoods = useMemo(() => dedupeFoodsByCanonical(foods), [foods]);
  const eatenCanonicalKeys = useMemo(() => getEatenCanonicalKeys(foods, logs), [foods, logs]);

  const areas = useMemo(() => Array.from(new Map(foods.flatMap((food) => [
    ...(normalizeDisplayAreaName(food.area.name) ? [[food.area.id, food.area] as const] : []),
    ...(food.locations ?? [])
      .map((location) => ({ ...location, displayAreaName: normalizeDisplayAreaName(location.areaName) }))
      .filter((location) => location.areaId && location.displayAreaName)
      .map((location) => [location.areaId!, { id: location.areaId!, name: location.displayAreaName!, sortOrder: food.area.sortOrder }] as const)
  ])).values()).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja")), [foods]);
  const shops = useMemo(() => Array.from(new Map(canonicalFoods.map((food) => [food.shop.id, food.shop])).values()), [canonicalFoods]);
  const filteredFoods = useMemo(() => {
    const result = canonicalFoods.filter((food) => {
      if (query && !matchesFoodQuery(food, query)) return false;
      if (category !== "all" && food.category !== category) return false;
      const selectedArea = areas.find((area) => area.id === areaId);
      if (areaId !== "all" && !foodMatchesArea(food, areaId, selectedArea?.name)) return false;
      if (shopId !== "all" && food.shopId !== shopId) return false;
      if (shopType !== "all" && food.shop.type !== shopType) return false;
      if (diningType !== "all" && food.diningType !== diningType) return false;
      if (status !== "all" && food.status !== status) return false;
      if (!matchesSaleFilter(food, saleFilter)) return false;
      if (imageOnly && getFoodImage(food) === getCategoryPlaceholder(food.category)) return false;
      if (priceFilter === "known" && !hasPrice(food)) return false;
      if (priceFilter === "unknown" && hasPrice(food)) return false;
      const canonicalKey = getCanonicalFoodKey(food);
      if (mode === "eaten" && !eatenCanonicalKeys.has(canonicalKey)) return false;
      return true;
    });
    return result.sort((a, b) => sortFood(a, b, sort, foods, logs));
  }, [areaId, areas, canonicalFoods, category, diningType, eatenCanonicalKeys, foods, imageOnly, logs, mode, priceFilter, query, saleFilter, shopId, shopType, sort, status]);

  const displayedFoods = filteredFoods.slice(0, visibleCount);
  const commitSearch = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 2) return;
    const next = [trimmed, ...recentSearches.filter((item) => normalizeFoodName(item) !== normalizeFoodName(trimmed))].slice(0, 6);
    setRecentSearches(next);
    try {
      window.localStorage.setItem("uniba-recent-searches-v1", JSON.stringify(next));
    } catch {
      // localStorage may be unavailable in private contexts.
    }
  };

  return (
    <section className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="min-w-0">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-park/70">フード図鑑</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">{title ?? "フードを探す"}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            写真で選んで、未食を埋める。
          </p>
        </div>
      </div>

      <div className="space-y-4 border-y border-slate-200/70 py-4">
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {categoryChips.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCategory(item.value);
                  setVisibleCount(60);
                }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black transition ${
                  category === item.value
                    ? "border-park bg-mint text-park shadow-sm"
                    : "border-slate-200 bg-white/78 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-sm leading-none" aria-hidden>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(60);
            }}
            onBlur={(event) => commitSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitSearch(event.currentTarget.value);
            }}
            className="h-12 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-base font-bold outline-none focus:border-park focus:ring-4 focus:ring-mint"
            placeholder="メニュー・店舗・エリアで検索"
          />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/78 px-4 text-sm font-black text-slate-700"
          >
            <SlidersHorizontal size={18} aria-hidden />
            表示条件
            <ChevronDown size={17} aria-hidden className={filtersOpen ? "rotate-180" : ""} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-400">
          <span>{filteredFoods.length}品</span>
          <span>図鑑 {canonicalFoods.length}品</span>
        </div>

        {query.trim() ? (
          <div className="grid gap-2">
            {filteredFoods.slice(0, 5).map((food) => (
              <Link key={`suggest-${food.id}`} href={`/foods/${food.id}`} className="flex items-center gap-2 border-b border-slate-100 py-2 active:scale-[0.99]">
                <SafeThumb food={food} className="h-10 w-10 rounded-md" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-ink">{food.name}</span>
                  <span className="block line-clamp-2 text-[11px] font-bold leading-4 text-slate-400">{getFoodAreaSummary(food)} / {food.shop.name}</span>
                </span>
              </Link>
            ))}
            {filteredFoods.length === 0 ? <p className="px-2 py-1 text-xs font-black text-slate-500">該当なし</p> : null}
          </div>
        ) : null}

        <div className={`${filtersOpen ? "grid" : "hidden"} gap-3 md:grid-cols-4 lg:grid-cols-6`}>
        <select value={saleFilter} onChange={(event) => { setSaleFilter(event.target.value as SaleFilter); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="active">販売中</option>
          <option value="endingSoon">終了間近</option>
          <option value="ended">販売終了</option>
          <option value="permanent">常設</option>
          <option value="limited">期間限定</option>
          <option value="upcoming">近日販売</option>
          <option value="unknown">販売期間確認中</option>
          <option value="all">図鑑すべて</option>
        </select>
        <select value={category} onChange={(event) => { setCategory(event.target.value as FoodCategory | "all"); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">全ジャンル</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={areaId} onChange={(event) => { setAreaId(event.target.value); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">全エリア</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
        <select value={shopId} onChange={(event) => { setShopId(event.target.value); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">全店舗</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
        <select value={shopType} onChange={(event) => { setShopType(event.target.value as ShopType | "all"); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">全店舗種別</option>
          {Object.entries(shopTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={diningType} onChange={(event) => { setDiningType(event.target.value as DiningType | "all"); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">食べ方すべて</option>
          {Object.entries(diningTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value as FoodStatus | "all"); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">確認状況すべて</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={priceFilter} onChange={(event) => { setPriceFilter(event.target.value as PriceFilter); setVisibleCount(60); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="all">価格すべて</option>
          <option value="known">価格確認済</option>
          <option value="unknown">価格未確認</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-bold">
          <option value="recommended">おすすめ順</option>
          <option value="new">新しい順</option>
          <option value="image">画像あり優先</option>
          <option value="status">公開情報確認順</option>
          <option value="uneaten">未食優先</option>
          <option value="category">カテゴリ順</option>
          <option value="shop">店舗順</option>
          <option value="priceAsc">価格安い順</option>
          <option value="priceDesc">価格高い順</option>
          <option value="walk">食べ歩き優先</option>
        </select>
        </div>
        <div className={`${filtersOpen ? "flex" : "hidden"} flex-wrap gap-2`}>
          <TogglePill active={imageOnly} label="写真あり" onClick={() => setImageOnly((current) => !current)} />
          <TogglePill active={priceFilter === "known"} label="価格確認済" onClick={() => setPriceFilter((current) => current === "known" ? "all" : "known")} />
          <TogglePill active={priceFilter === "unknown"} label="価格未確認" onClick={() => setPriceFilter((current) => current === "unknown" ? "all" : "unknown")} />
          <TogglePill active={saleFilter === "active"} label="販売中" onClick={() => setSaleFilter((current) => current === "active" ? "all" : "active")} />
          <TogglePill active={saleFilter === "endingSoon"} label="終了間近" onClick={() => setSaleFilter((current) => current === "endingSoon" ? "all" : "endingSoon")} />
          <TogglePill active={saleFilter === "permanent"} label="常設" onClick={() => setSaleFilter((current) => current === "permanent" ? "all" : "permanent")} />
          <TogglePill active={saleFilter === "limited"} label="期間限定" onClick={() => setSaleFilter((current) => current === "limited" ? "all" : "limited")} />
          <TogglePill active={saleFilter === "all"} label="図鑑すべて" onClick={() => setSaleFilter("all")} />
          <TogglePill active={diningType === "takeout"} label="テイクアウト可" onClick={() => setDiningType((current) => current === "takeout" ? "all" : "takeout")} />
          <TogglePill active={diningType === "eat_in"} label="店内飲食" onClick={() => setDiningType((current) => current === "eat_in" ? "all" : "eat_in")} />
          <TogglePill active={diningType === "food_cart"} label="カート販売" onClick={() => setDiningType((current) => current === "food_cart" ? "all" : "food_cart")} />
        </div>
      </div>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}

      {!ready ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filteredFoods.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {displayedFoods.map((food) => (
              <FoodCard key={food.id} food={food} allFoods={foods} logs={logs} onToggleEaten={toggleEaten} />
            ))}
          </div>
          {visibleCount < filteredFoods.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 60)}
              className="mx-auto block min-h-12 rounded-lg bg-ink px-6 text-sm font-black text-white"
            >
              さらに60件表示
            </button>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-lg font-black text-ink">該当するメニューがありません</p>
          <p className="mt-2 text-sm text-slate-500">検索条件やチェック状態を変更してください。</p>
          <a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white">
            情報提供
          </a>
        </div>
      )}

      {showRequestCta ? (
        <section className="border-t border-slate-200 pt-5 text-center">
          <p className="text-sm font-black text-ink">掲載してほしい商品を送る</p>
          <p className="mt-1 text-xs font-bold text-slate-500">投稿内容は管理者確認後に必要に応じて反映します。</p>
          <a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white">
            情報提供
          </a>
        </section>
      ) : null}
    </section>
  );
}

function sortFood(a: FoodWithRelations, b: FoodWithRelations, sort: SortMode, foods: FoodWithRelations[], logs: ReturnType<typeof useFoodLogs>["logs"]) {
  if (sort === "image") return Number(getFoodImage(b) !== getCategoryPlaceholder(b.category)) - Number(getFoodImage(a) !== getCategoryPlaceholder(a.category));
  if (sort === "status") return statusRank(a.status) - statusRank(b.status);
  if (sort === "uneaten") return Number(isEatenCanonical(foods, logs, a)) - Number(isEatenCanonical(foods, logs, b));
  if (sort === "category") return a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "ja");
  if (sort === "shop") return a.shop.name.localeCompare(b.shop.name, "ja") || a.name.localeCompare(b.name, "ja");
  if (sort === "priceAsc") return priceSortValue(a, "asc") - priceSortValue(b, "asc") || a.name.localeCompare(b.name, "ja");
  if (sort === "priceDesc") return priceSortValue(b, "desc") - priceSortValue(a, "desc") || a.name.localeCompare(b.name, "ja");
  if (sort === "walk") return walkRank(b) - walkRank(a) || statusRank(a.status) - statusRank(b.status);
  if (sort === "new") return (b.lastCheckedAt || "").localeCompare(a.lastCheckedAt || "");
  return (b.confidenceScore - a.confidenceScore) || statusRank(a.status) - statusRank(b.status) || a.name.localeCompare(b.name, "ja");
}

function readRecentSearches() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("uniba-recent-searches-v1");
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function matchesFoodQuery(food: FoodWithRelations, query: string) {
  if (matchesNaturalIntent(food, query)) return true;
  const normalizedQuery = normalizeFoodName(expandSearchTerm(query));
  const haystack = normalizeFoodName(
    [
      food.name,
      food.shop.name,
      getFoodAreaNames(food).join(" "),
      food.description,
      food.eventName,
      food.flavor,
      categoryLabels[food.category],
      food.locations?.map((location) => `${location.shopName}${location.areaName}`).join("")
    ].filter(Boolean).join("")
  );
  if (haystack.includes(normalizedQuery)) return true;
  return searchAliases(query).some((alias) => haystack.includes(normalizeFoodName(alias)));
}

function matchesSaleFilter(food: FoodWithRelations, saleFilter: SaleFilter) {
  if (saleFilter === "all") return true;
  if (saleFilter === "endingSoon") return isEndingSoon(food, 30);
  if (saleFilter === "permanent") return getSaleStatus(food) === "active" && getSaleType(food) === "permanent";
  if (saleFilter === "limited") return getSaleStatus(food) === "active" && (getSaleType(food) === "limited" || getSaleType(food) === "event");
  return getSaleStatus(food) === saleFilter;
}

function matchesNaturalIntent(food: FoodWithRelations, query: string) {
  const normalized = normalizeFoodName(query);
  const price = food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price;
  const budgetMatch = query.match(/([0-9０-９,，]+)\s*円以内/);
  if (budgetMatch) {
    const budget = Number(budgetMatch[1].replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/[，,]/g, ""));
    if (!price || price > budget) return false;
  }
  if (/甘い|あまい|スイーツ|デザート|ケーキ|アイス|チョコ/.test(query) && !["dessert", "churro", "popcorn", "drink"].includes(food.category)) return false;
  if (/安い|コスパ|円以内/.test(query) && (!price || price > 1200)) return false;
  const areaText = getFoodAreaNames(food).join(" ");
  if (/子供|こども|キッズ/.test(query) && food.category !== "kids" && !areaText.includes("ワンダーランド")) return false;
  if (/ハリポタ|ハリー|ポッター|魔法/.test(query) && !areaText.includes("ハリー") && !food.name.includes("ホグワーツ") && !food.shop.name.includes("三本")) return false;
  if (/ミニオン/.test(query) && !areaText.includes("ミニオン") && !food.name.includes("ミニオン")) return false;
  if (/ニンテンドー|マリオ|ピーチ|キノピオ/.test(query) && !areaText.includes("ニンテンドー") && !/マリオ|ピーチ|キノピオ|ヨッシー|ドンキー/.test(food.name)) return false;
  if (/限定|期間限定/.test(query) && !(food.isLimited || food.endDate)) return false;
  if (/食べ歩き|歩きながら|片手/.test(query) && !walkRank(food)) return false;
  return /甘い|安い|コスパ|子供|こども|キッズ|ハリポタ|ハリー|ポッター|魔法|ミニオン|ニンテンドー|マリオ|限定|期間限定|円以内|食べ歩き|片手/.test(query) && normalized.length > 0;
}

function expandSearchTerm(query: string) {
  return query.replace(/ちゅろす|チュロス/gi, "チュリトス").replace(/ぽっぷこーん/gi, "ポップコーン");
}

function searchAliases(query: string) {
  const normalized = normalizeFoodName(query);
  const aliases: Record<string, string[]> = {
    churro: ["チュリトス", "チュロス"],
    チュロス: ["チュリトス", "churro"],
    チュリトス: ["チュロス", "churro"],
    popcorn: ["ポップコーン"],
    soda: ["ソーダ", "ドリンク"],
    drink: ["ドリンク", "ソーダ", "ラテ"],
    sweets: ["スイーツ", "デザート"],
    スイーツ: ["デザート", "dessert"],
    デザート: ["スイーツ", "dessert"],
    pasta: ["パスタ", "麺"],
    walking: ["食べ歩き", "フードカート", "チュリトス"],
    takeout: ["テイクアウト", "食べ歩き"]
  };
  return Object.entries(aliases).flatMap(([key, values]) => (normalized.includes(normalizeFoodName(key)) ? values : []));
}

function hasPrice(food: FoodWithRelations) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function priceSortValue(food: FoodWithRelations, direction: "asc" | "desc") {
  return food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price ?? (direction === "asc" ? 999999 : -1);
}

function walkRank(food: FoodWithRelations) {
  if (food.diningType === "food_cart") return 5;
  if (food.diningType === "takeout") return 4;
  if (food.shop.type === "cart" || food.shop.type === "wagon") return 3;
  if (food.category === "churro" || food.category === "popcorn" || food.category === "snack" || food.category === "drink") return 2;
  return 0;
}

function statusRank(status: FoodStatus) {
  return { active: 1, scheduled: 2, unknown: 3, ended: 4, inactive: 5 }[status] ?? 9;
}

function TogglePill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 text-xs font-black ${active ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-500"}`}
    >
      {label}
    </button>
  );
}

function SafeThumb({ food, className }: { food: FoodWithRelations; className: string }) {
  return <FoodImage food={food} alt="" className={className} />;
}
