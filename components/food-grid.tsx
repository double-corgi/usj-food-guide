"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { diningTypeLabels, shopTypeLabels, statusLabels } from "@/lib/constants";
import { dedupeFoodsByCanonical, foodMatchesArea, getFoodAreaNames, getFoodAreaSummary, getSaleStatus, getSaleType, isEndingSoon, getCanonicalFoodKey, getEatenCanonicalKeys, isEatenCanonical, normalizeDisplayAreaName, normalizeFoodName } from "@/lib/food-utils";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";
import { isFoodInCollection, SUMMER_2026_COLLECTION_ID } from "@/lib/seasonal-collections";
import { tAreaName } from "@/lib/i18n/area-name";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { getFoodNameI18n } from "@/lib/i18n/name-translations";
import { useLocale } from "@/lib/i18n/use-locale";
import { getCategoryPlaceholder, getFoodImage } from "@/lib/utils/image";
import { useFoodLogs } from "@/lib/use-food-logs";
import { useNextWantFoods } from "@/lib/use-next-want-foods";
import type { DiningType, FoodCategory, FoodStatus, FoodWithRelations, ShopType } from "@/types/domain";
import { FoodCard } from "@/components/food-card";
import { FoodImage } from "@/components/food-image";
import { AdSlot } from "@/components/ads/ad-slot";
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
  { value: "noodle", label: "麺・パスタ", icon: "🍜" },
  { value: "set", label: "セットメニュー", icon: "🍱" },
  { value: "rice", label: "ライス・カレー", icon: "🍛" },
  { value: "kids", label: "キッズ", icon: "👦" },
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
  initialCollectionId,
  title,
  showRequestCta = true,
  adminCanEdit = false
}: {
  foods: FoodWithRelations[];
  mode?: ListMode;
  initialCategory?: FoodCategory;
  initialAreaId?: string;
  initialShopId?: string;
  initialDiningType?: DiningType;
  initialSaleFilter?: SaleFilter;
  initialSort?: SortMode;
  initialCollectionId?: string;
  title?: string;
  generatedAt?: string;
  showRequestCta?: boolean;
  adminCanEdit?: boolean;
}) {
  const { locale, t } = useLocale();
  const { logs, ready, error, toggleEaten } = useFoodLogs();
  const { isWanted, toggleWanted } = useNextWantFoods(foods);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">(initialCategory ?? "all");
  const [areaId, setAreaId] = useState(initialAreaId ?? "all");
  const [shopId, setShopId] = useState(initialShopId ?? "all");
  const [shopType, setShopType] = useState<ShopType | "all">("all");
  const [diningType, setDiningType] = useState<DiningType | "all">(initialDiningType ?? "all");
  const [status, setStatus] = useState<FoodStatus | "all">("all");
  const [saleFilter, setSaleFilter] = useState<SaleFilter>(initialSaleFilter ?? (mode === "all" ? "active" : "all"));
  const [collectionId, setCollectionId] = useState<string>(initialCollectionId ?? "all");
  const [sort, setSort] = useState<SortMode>(initialSort ?? "recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [imageOnly, setImageOnly] = useState(false);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [visibleCount, setVisibleCount] = useState(60);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches());
  const [pendingEatenState, setPendingEatenState] = useState<{ scopeKey: string; keys: Set<string> }>(() => ({ scopeKey: "", keys: new Set() }));
  const canonicalFoods = useMemo(() => dedupeFoodsByCanonical(foods), [foods]);
  const eatenCanonicalKeys = useMemo(() => getEatenCanonicalKeys(foods, logs), [foods, logs]);
  const filterScopeKey = `${areaId}|${category}|${collectionId}|${diningType}|${imageOnly}|${mode}|${priceFilter}|${query}|${saleFilter}|${shopId}|${shopType}|${sort}|${status}`;
  const pendingEatenKeys = pendingEatenState.scopeKey === filterScopeKey ? pendingEatenState.keys : null;

  const areas = useMemo(() => Array.from(new Map(foods.flatMap((food) => [
    ...(normalizeDisplayAreaName(food.area.name) ? [[food.area.id, food.area] as const] : []),
    ...(food.locations ?? [])
      .map((location) => ({ ...location, displayAreaName: normalizeDisplayAreaName(location.areaName) }))
      .filter((location) => location.areaId && location.displayAreaName)
      .map((location) => [location.areaId!, { id: location.areaId!, name: location.displayAreaName!, sortOrder: food.area.sortOrder }] as const)
  ])).values()).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "ja")), [foods]);
  const shops = useMemo(() => Array.from(new Map(canonicalFoods.map((food) => [food.shop.id, food.shop])).values()), [canonicalFoods]);
  const filteredFoods = useMemo(() => {
    const baseFoods = collectionId === SUMMER_2026_COLLECTION_ID ? foods : canonicalFoods;
    const result = baseFoods.filter((food) => {
      if (query && !matchesFoodQuery(food, query, t)) return false;
      if (category !== "all" && food.category !== category) return false;
      const selectedArea = areas.find((area) => area.id === areaId);
      if (areaId !== "all" && !foodMatchesArea(food, areaId, selectedArea?.name)) return false;
      if (shopId !== "all" && food.shopId !== shopId) return false;
      if (shopType !== "all" && food.shop.type !== shopType) return false;
      if (diningType !== "all" && food.diningType !== diningType) return false;
      if (status !== "all" && food.status !== status) return false;
      if (collectionId !== "all" && !isFoodInCollection(food, collectionId)) return false;
      if (!matchesSaleFilter(food, saleFilter)) return false;
      if (imageOnly && getFoodImage(food) === getCategoryPlaceholder(food.category)) return false;
      if (priceFilter === "known" && !hasPrice(food)) return false;
      if (priceFilter === "unknown" && hasPrice(food)) return false;
      const canonicalKey = getCanonicalFoodKey(food);
      if (mode === "eaten" && !eatenCanonicalKeys.has(canonicalKey)) return false;
      return true;
    });
    return result.sort((a, b) => sortFood(a, b, sort, foods, logs, pendingEatenKeys));
  }, [areaId, areas, canonicalFoods, category, collectionId, diningType, eatenCanonicalKeys, foods, imageOnly, logs, mode, pendingEatenKeys, priceFilter, query, saleFilter, shopId, shopType, sort, status, t]);

  const displayedFoods = filteredFoods.slice(0, visibleCount);
  const handleToggleEaten = useCallback((foodId: string, spentAmount?: number) => {
    const targetFood = foods.find((food) => food.id === foodId);
    if (targetFood) {
      const canonicalKey = getCanonicalFoodKey(targetFood);
      setPendingEatenState((current) => {
        const next = new Set(current.scopeKey === filterScopeKey ? current.keys : []);
        isEatenCanonical(foods, logs, targetFood) ? next.delete(canonicalKey) : next.add(canonicalKey);
        return { scopeKey: filterScopeKey, keys: next };
      });
    }
    toggleEaten(foodId, spentAmount);
  }, [filterScopeKey, foods, logs, toggleEaten]);
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
    <section className="min-w-0 space-y-5 overflow-x-hidden">
      <div className="min-w-0">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-park/70">{t("foods.kicker")}</p>
          <h1 className="mt-2 text-[1.85rem] font-black tracking-tight text-ink md:text-4xl">{title ?? t("foods.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            {t("foods.subtitle")}
          </p>
        </div>
      </div>

      <div className="mobile-page-section space-y-3 px-3 py-3 sm:px-4">
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1.5">
            {categoryChips.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCategory(item.value);
                  setVisibleCount(60);
                }}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                  category === item.value
                    ? "border-park bg-mint text-park shadow-sm"
                    : "border-slate-200 bg-white/78 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-xs leading-none" aria-hidden>{item.icon}</span>
                {item.value === "all" ? t("foods.categoryAll") : t(`category.${item.value}` as TranslationKey)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden />
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
            className="h-11 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm font-bold outline-none focus:border-park focus:ring-4 focus:ring-mint"
            placeholder={t("foods.searchPlaceholder")}
          />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((current) => !current)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3.5 text-xs font-black text-slate-700"
          >
            <SlidersHorizontal size={16} aria-hidden />
            {t("foods.filterToggle")}
            <ChevronDown size={15} aria-hidden className={filtersOpen ? "rotate-180" : ""} />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-400">
          <span>{t("foods.resultCount", { count: filteredFoods.length })}</span>
          <span>{t("foods.catalogCount", { count: canonicalFoods.length })}</span>
          {collectionId === SUMMER_2026_COLLECTION_ID ? <span className="font-black text-[#0f5f78]">2026年夏限定で絞り込み中</span> : null}
        </div>

        {query.trim() ? (
          <div className="grid gap-2">
            {filteredFoods.slice(0, 5).map((food) => {
              const displayName = getFoodNameI18n(food.id, locale, food.name);
              return (
                <Link key={`suggest-${food.id}`} href={`/foods/${food.id}`} className="flex items-center gap-2 border-b border-slate-100 py-2 active:scale-[0.99]">
                  <SafeThumb food={food} className="h-10 w-10 rounded-md" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-ink">{displayName}</span>
                    <span className="block line-clamp-2 text-[11px] font-bold leading-4 text-slate-400">{getFoodAreaSummary(food)} / {food.shop.name}</span>
                  </span>
                </Link>
              );
            })}
            {filteredFoods.length === 0 ? <p className="px-2 py-1 text-xs font-black text-slate-500">{t("foods.noResultsInline")}</p> : null}
          </div>
        ) : null}

        <div className={`${filtersOpen ? "grid" : "hidden"} gap-2 md:grid-cols-4 lg:grid-cols-6`}>
        <select value={collectionId} onChange={(event) => { setCollectionId(event.target.value); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">コレクション: すべて</option>
          <option value={SUMMER_2026_COLLECTION_ID}>2026年夏限定</option>
        </select>
        <select value={saleFilter} onChange={(event) => { setSaleFilter(event.target.value as SaleFilter); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="active">{t("common.saleActive")}</option>
          <option value="endingSoon">{t("foods.saleFilterEndingSoon")}</option>
          <option value="ended">{t("common.ended")}</option>
          <option value="permanent">{t("foods.saleFilterPermanent")}</option>
          <option value="limited">{t("common.limited")}</option>
          <option value="upcoming">{t("foods.saleFilterUpcoming")}</option>
          <option value="unknown">{t("foods.saleFilterUnknown")}</option>
          <option value="all">{t("foods.saleFilterAll")}</option>
        </select>
        <select value={category} onChange={(event) => { setCategory(event.target.value as FoodCategory | "all"); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.categoryFilterAll")}</option>
          {categoryChips.filter((item): item is { value: FoodCategory; label: string; icon: string } => item.value !== "all").map(({ value }) => (
            <option key={value} value={value}>
              {t(`category.${value}` as TranslationKey)}
            </option>
          ))}
        </select>
        <select value={areaId} onChange={(event) => { setAreaId(event.target.value); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.areaFilterAll")}</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {tAreaName(area.name, t)}
            </option>
          ))}
        </select>
        <select value={shopId} onChange={(event) => { setShopId(event.target.value); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.shopFilterAll")}</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
        <select value={shopType} onChange={(event) => { setShopType(event.target.value as ShopType | "all"); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.shopTypeFilterAll")}</option>
          {(Object.keys(shopTypeLabels) as ShopType[]).map((value) => (
            <option key={value} value={value}>
              {t(`shopType.${value}` as TranslationKey)}
            </option>
          ))}
        </select>
        <select value={diningType} onChange={(event) => { setDiningType(event.target.value as DiningType | "all"); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.diningTypeFilterAll")}</option>
          {(Object.keys(diningTypeLabels) as DiningType[]).map((value) => (
            <option key={value} value={value}>
              {t(`diningType.${value}` as TranslationKey)}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => { setStatus(event.target.value as FoodStatus | "all"); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.statusFilterAll")}</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={priceFilter} onChange={(event) => { setPriceFilter(event.target.value as PriceFilter); setVisibleCount(60); }} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="all">{t("foods.priceFilterAll")}</option>
          <option value="known">{t("foods.priceFilterKnown")}</option>
          <option value="unknown">{t("foods.priceFilterUnknown")}</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold">
          <option value="recommended">{t("foods.sortRecommended")}</option>
          <option value="new">{t("foods.sortNew")}</option>
          <option value="image">{t("foods.sortImage")}</option>
          <option value="status">{t("foods.sortStatus")}</option>
          <option value="uneaten">{t("foods.sortUneaten")}</option>
          <option value="category">{t("foods.sortCategory")}</option>
          <option value="shop">{t("foods.sortShop")}</option>
          <option value="priceAsc">{t("foods.sortPriceAsc")}</option>
          <option value="priceDesc">{t("foods.sortPriceDesc")}</option>
          <option value="walk">{t("foods.sortWalk")}</option>
        </select>
        </div>
        <div className={`${filtersOpen ? "flex" : "hidden"} flex-wrap gap-1.5`}>
          <TogglePill
            active={collectionId === SUMMER_2026_COLLECTION_ID}
            label="2026年夏限定"
            onClick={() => {
              setCollectionId((current) => current === SUMMER_2026_COLLECTION_ID ? "all" : SUMMER_2026_COLLECTION_ID);
              setVisibleCount(60);
            }}
          />
          <TogglePill active={imageOnly} label={t("foods.toggleImageOnly")} onClick={() => setImageOnly((current) => !current)} />
          <TogglePill active={priceFilter === "known"} label={t("foods.priceFilterKnown")} onClick={() => setPriceFilter((current) => current === "known" ? "all" : "known")} />
          <TogglePill active={priceFilter === "unknown"} label={t("foods.priceFilterUnknown")} onClick={() => setPriceFilter((current) => current === "unknown" ? "all" : "unknown")} />
          <TogglePill active={saleFilter === "active"} label={t("common.saleActive")} onClick={() => setSaleFilter((current) => current === "active" ? "all" : "active")} />
          <TogglePill active={saleFilter === "endingSoon"} label={t("foods.saleFilterEndingSoon")} onClick={() => setSaleFilter((current) => current === "endingSoon" ? "all" : "endingSoon")} />
          <TogglePill active={saleFilter === "permanent"} label={t("foods.saleFilterPermanent")} onClick={() => setSaleFilter((current) => current === "permanent" ? "all" : "permanent")} />
          <TogglePill active={saleFilter === "limited"} label={t("common.limited")} onClick={() => setSaleFilter((current) => current === "limited" ? "all" : "limited")} />
          <TogglePill active={saleFilter === "all"} label={t("foods.saleFilterAll")} onClick={() => setSaleFilter("all")} />
          <TogglePill active={diningType === "takeout"} label={t("foods.toggleTakeout")} onClick={() => setDiningType((current) => current === "takeout" ? "all" : "takeout")} />
          <TogglePill active={diningType === "eat_in"} label={t("foods.toggleEatIn")} onClick={() => setDiningType((current) => current === "eat_in" ? "all" : "eat_in")} />
          <TogglePill active={diningType === "food_cart"} label={t("foods.toggleFoodCart")} onClick={() => setDiningType((current) => current === "food_cart" ? "all" : "food_cart")} />
        </div>
      </div>

      <AdSlot placement="foods-after-filters" />

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          端末内の記録を読み込めませんでした。フード一覧はそのまま使えます。時間を置いて再度お試しください。
        </div>
      ) : null}

      {!ready ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : filteredFoods.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
            {displayedFoods.map((food, index) => (
              <FoodGridItem
                key={food.id}
                food={food}
                foods={foods}
                logs={logs}
                onToggleEaten={handleToggleEaten}
                isWanted={isWanted(food)}
                onToggleWanted={() => toggleWanted(food)}
                adminCanEdit={adminCanEdit}
                showInlineAd={(index + 1) % 12 === 0 && index < displayedFoods.length - 1}
              />
            ))}
          </div>
          {visibleCount < filteredFoods.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + 60)}
              className="mx-auto block min-h-12 rounded-full bg-park px-6 text-sm font-black text-white shadow-sm"
            >
              {t("foods.loadMore")}
            </button>
          ) : null}
        </>
      ) : (
        <div className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white p-6 text-center shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
          <p className="text-lg font-black text-ink">{t("foods.noMatchTitle")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm font-bold leading-6 text-slate-500">{t("foods.noMatchDescription")}</p>
          {showRequestCta ? (
            <a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white">
              {t("foods.requestCta")}
            </a>
          ) : null}
        </div>
      )}

      {showRequestCta ? (
        <section className="border-t border-slate-200 pt-5 text-center">
          <p className="text-sm font-black text-ink">{t("foods.requestSectionTitle")}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{t("foods.requestSectionDescription")}</p>
          <a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white">
            {t("foods.requestCta")}
          </a>
        </section>
      ) : null}
    </section>
  );
}

function FoodGridItem({
  food,
  foods,
  logs,
  onToggleEaten,
  isWanted,
  onToggleWanted,
  adminCanEdit,
  showInlineAd
}: {
  food: FoodWithRelations;
  foods: FoodWithRelations[];
  logs: ReturnType<typeof useFoodLogs>["logs"];
  onToggleEaten: (foodId: string, spentAmount?: number) => void;
  isWanted: boolean;
  onToggleWanted: () => void;
  adminCanEdit: boolean;
  showInlineAd: boolean;
}) {
  return (
    <>
      <FoodCard
        food={food}
        allFoods={foods}
        logs={logs}
        onToggleEaten={onToggleEaten}
        isWanted={isWanted}
        onToggleWanted={onToggleWanted}
        adminCanEdit={adminCanEdit}
      />
      {showInlineAd ? (
        <div className="col-span-2 md:col-span-3 xl:col-span-5">
          <AdSlot placement="foods-inline" />
        </div>
      ) : null}
    </>
  );
}

function sortFood(a: FoodWithRelations, b: FoodWithRelations, sort: SortMode, foods: FoodWithRelations[], logs: ReturnType<typeof useFoodLogs>["logs"], pendingEatenKeys: Set<string> | null) {
  if (sort === "image") return Number(getFoodImage(b) !== getCategoryPlaceholder(b.category)) - Number(getFoodImage(a) !== getCategoryPlaceholder(a.category));
  if (sort === "status") return statusRank(a.status) - statusRank(b.status);
  if (sort === "uneaten") {
    const eatenRank = (food: FoodWithRelations) => Number(isEatenCanonical(foods, logs, food) && !pendingEatenKeys?.has(getCanonicalFoodKey(food)));
    return eatenRank(a) - eatenRank(b);
  }
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

function matchesFoodQuery(food: FoodWithRelations, query: string, t: (key: TranslationKey) => string) {
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
      t(`category.${food.category}` as TranslationKey),
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
      className={`min-h-8 rounded-full border px-3 text-[11px] font-black ${active ? "border-park bg-mint text-park" : "border-slate-200 bg-white text-slate-500"}`}
    >
      {label}
    </button>
  );
}

function SafeThumb({ food, className }: { food: FoodWithRelations; className: string }) {
  return <FoodImage food={food} alt="" className={className} />;
}
