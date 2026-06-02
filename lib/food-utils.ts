import { categoryLabels } from "@/lib/constants";
import { getCategoryPlaceholder, getFoodImage } from "@/lib/utils/image";
import type { FoodCategory, FoodImage, FoodStatus, FoodWithRelations, PriceSource, SaleStatus, SaleType, UserFoodLog } from "@/types/domain";

const categoryPrefixes: Record<FoodCategory, string> = {
  churro: "CHR",
  popcorn: "POP",
  drink: "DRK",
  dessert: "SWT",
  burger: "BRG",
  pizza: "PIZ",
  chicken: "MT",
  rice: "RIC",
  noodle: "NDL",
  snack: "SNK",
  kids: "KID",
  seasonal: "SEA",
  set: "SET",
  unknown: "OTH"
};

export function normalizeFoodName(name: string) {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[・･]/g, "");
}

export function getPrimaryImage(images: FoodImage[], category: FoodCategory) {
  return getFoodImage({ images, category });
}

export function formatPrice(price?: number) {
  if (!price) return "価格未確認";
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(price);
}

export function formatFoodPrice(food: { price?: number; priceMin?: number; priceMax?: number }) {
  const min = food.priceMin ?? food.price;
  const max = food.priceMax ?? food.price;
  if (!min) return "価格未確認";
  if (max && max !== min) return `${formatPrice(min)}〜${formatPrice(max)}`;
  return formatPrice(min);
}

export function getPriceSource(food: { price?: number; priceMin?: number; priceSource?: PriceSource; priceSourceUrl?: string }): PriceSource {
  if (!food.price && !food.priceMin) return "unknown";
  if (food.priceSource) return food.priceSource;
  const sourceUrl = food.priceSourceUrl ?? "";
  if (/usj\.co\.jp/i.test(sourceUrl)) return "official";
  if (/x\.com|twitter\.com|instagram\.com|threads\.net/i.test(sourceUrl)) return "social_report";
  if (/castel\.jp|usjhack|happyell|ameblo|travel|guide/i.test(sourceUrl)) return "trusted_report";
  return "trusted_report";
}

export function getPriceSourceLabel(source: PriceSource) {
  const labels: Record<PriceSource, string> = {
    official: "USJ公式確認済",
    official_app: "公式アプリ確認済",
    menu_photo: "現地メニュー写真",
    trusted_report: "高信頼レポート",
    social_report: "現地SNS報告",
    unknown: "価格未確認"
  };
  return labels[source] ?? labels.unknown;
}

export function statusFromDates(startDate?: string, endDate?: string, today = new Date()): FoodStatus {
  const todayKey = today.toISOString().slice(0, 10);
  if (startDate && startDate > todayKey) return "scheduled";
  if (endDate && todayKey > endDate) return "ended";
  if (startDate || endDate) return "active";
  return "unknown";
}

export function getSaleStatus(food: Pick<FoodWithRelations, "saleStatus" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate">, today = new Date()): SaleStatus {
  if (food.saleStatus) return food.saleStatus;
  const startDate = food.saleStartDate ?? food.startDate;
  const endDate = food.saleEndDate ?? food.endDate;
  const derivedStatus = statusFromDates(startDate ?? undefined, endDate ?? undefined, today);
  if (derivedStatus === "scheduled") return "upcoming";
  if (derivedStatus === "ended" || food.status === "ended" || food.status === "inactive") return "ended";
  if (derivedStatus === "active" || food.status === "active") return "active";
  return "unknown";
}

export function isCompletableFood(food: Pick<FoodWithRelations, "saleStatus" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate" | "isCompletable">) {
  return getSaleStatus(food) === "active";
}

export function getSaleStartDate(food: Pick<FoodWithRelations, "saleStartDate" | "startDate">) {
  return food.saleStartDate ?? food.startDate ?? null;
}

export function getSaleEndDate(food: Pick<FoodWithRelations, "saleEndDate" | "endDate">) {
  return food.saleEndDate ?? food.endDate ?? null;
}

export function getRemainingDays(food: Pick<FoodWithRelations, "saleEndDate" | "endDate" | "remainingDays" | "saleStatus" | "status" | "saleStartDate" | "startDate">, today = new Date()) {
  if (typeof food.remainingDays === "number") return food.remainingDays;
  if (getSaleStatus(food, today) === "ended") return 0;
  const end = getSaleEndDate(food);
  if (!end) return null;
  const endTime = dateKeyToUtc(end);
  const todayTime = dateKeyToUtc(todayKey(today));
  if (endTime === null || todayTime === null) return null;
  return Math.max(0, Math.ceil((endTime - todayTime) / 86_400_000));
}

export function isEndingSoon(food: Pick<FoodWithRelations, "saleEndDate" | "endDate" | "remainingDays" | "saleStatus" | "status" | "saleStartDate" | "startDate">, withinDays = 30) {
  if (getSaleStatus(food) !== "active") return false;
  const remainingDays = getRemainingDays(food);
  return typeof remainingDays === "number" && remainingDays >= 0 && remainingDays <= withinDays;
}

export function getSaleType(food: Pick<FoodWithRelations, "saleType" | "saleEndDate" | "endDate" | "isLimited" | "rarity" | "eventName">): SaleType {
  if (food.saleType) return food.saleType;
  if (food.rarity === "event" || Boolean(food.eventName)) return "event";
  if (food.isLimited || Boolean(getSaleEndDate(food))) return "limited";
  return "permanent";
}

export function getSaleTypeLabel(food: Pick<FoodWithRelations, "saleType" | "saleEndDate" | "endDate" | "isLimited" | "rarity" | "eventName">) {
  const labels: Record<SaleType, string> = {
    permanent: "常設",
    limited: "期間限定",
    event: "イベント限定",
    unknown: "販売種別確認中"
  };
  return labels[getSaleType(food)];
}

export function getSaleUrgencyLabel(food: Pick<FoodWithRelations, "saleEndDate" | "endDate" | "remainingDays" | "saleStatus" | "status" | "saleStartDate" | "startDate">) {
  const remainingDays = getRemainingDays(food);
  if (typeof remainingDays !== "number") return null;
  if (getSaleStatus(food) === "ended") return "販売終了";
  if (remainingDays <= 14) return `残り${remainingDays}日`;
  if (remainingDays <= 30) return "終了間近";
  return `あと${remainingDays}日`;
}

export function formatSaleDateShort(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}/${get("month")}/${get("day")}`;
}

export function getSalePeriodLabel(food: Pick<FoodWithRelations, "saleStatus" | "salePeriodLabel" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate">) {
  if (food.salePeriodLabel) return food.salePeriodLabel;
  const saleStatus = getSaleStatus(food);
  const start = getSaleStartDate(food);
  const end = getSaleEndDate(food);
  if (saleStatus === "active") {
    if (start && end) return `${formatDateJa(start)}〜${formatDateJa(end)}`;
    if (start) return `${formatDateJa(start)}〜販売終了日未定`;
    return "販売中";
  }
  if (saleStatus === "ended") {
    if (start && end) return `${formatDateJa(start)}〜${formatDateJa(end)}`;
    return "販売終了";
  }
  if (saleStatus === "upcoming") {
    return start ? `${formatDateJa(start)}開始予定` : "近日販売";
  }
  return "販売期間確認中";
}

export function getSaleStatusLabel(food: Pick<FoodWithRelations, "saleStatus" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate">) {
  const labels: Record<SaleStatus, string> = {
    active: "販売中",
    ended: "販売終了",
    upcoming: "近日販売",
    unknown: "販売期間確認中"
  };
  return labels[getSaleStatus(food)];
}

export function getSaleStatusTone(food: Pick<FoodWithRelations, "saleStatus" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate">) {
  const tones: Record<SaleStatus, string> = {
    active: "bg-emerald-50 text-emerald-700",
    ended: "bg-slate-100 text-slate-600",
    upcoming: "bg-sky-50 text-sky-700",
    unknown: "bg-amber-50 text-amber-700"
  };
  return tones[getSaleStatus(food)];
}

export function isEaten(logs: UserFoodLog[], foodId: string) {
  return logs.some((log) => log.foodId === foodId && log.status === "eaten");
}

export function isWanted(logs: UserFoodLog[], foodId: string) {
  return logs.some((log) => log.foodId === foodId && log.status === "want");
}

export function activeFoods(foods: FoodWithRelations[]) {
  return foods.filter(isCompletableFood);
}

export function calculateCompletion(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const eligible = foods.filter(isCompletableFood);
  const eatenCount = eligible.filter((food) => isEaten(logs, food.id)).length;
  return {
    total: eligible.length,
    eaten: eatenCount,
    rate: eligible.length === 0 ? 0 : Math.round((eatenCount / eligible.length) * 100)
  };
}

export function calculateArchiveRecordRate(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const eatenCount = foods.filter((food) => isEaten(logs, food.id)).length;
  return {
    total: foods.length,
    eaten: eatenCount,
    rate: foods.length === 0 ? 0 : Math.round((eatenCount / foods.length) * 100)
  };
}

export function countEatenEndedFoods(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  return foods.filter((food) => !isCompletableFood(food) && isEaten(logs, food.id)).length;
}

export function getZukanCode(food: FoodWithRelations, foods?: FoodWithRelations[]) {
  const prefix = categoryPrefixes[food.category] ?? "FD";
  const number = food.zukanNumber ?? getCategorySequenceNumber(food, foods);
  return `${prefix}-${String(number).padStart(3, "0")}`;
}

export function getCategorySequenceNumber(food: FoodWithRelations, foods?: FoodWithRelations[]) {
  if (!foods || foods.length === 0) return stableNumberFromId(food.id);
  const sameCategory = foods
    .filter((candidate) => candidate.category === food.category)
    .sort((a, b) => (a.zukanNumber ?? stableNumberFromId(a.id)) - (b.zukanNumber ?? stableNumberFromId(b.id)) || a.name.localeCompare(b.name, "ja"));
  const index = sameCategory.findIndex((candidate) => candidate.id === food.id);
  return index >= 0 ? index + 1 : stableNumberFromId(food.id);
}

export function completionByArea(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  return Array.from(new Map(foods.map((food) => [food.area.id, food.area])).values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((area) => {
      const areaFoods = foods.filter((food) => food.areaId === area.id || food.locations?.some((location) => location.areaId === area.id || location.areaName === area.name));
      return {
        id: area.id,
        label: area.name,
        foods: areaFoods,
        ...calculateCompletion(areaFoods, logs)
      };
    });
}

export function remainingCount(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const completion = calculateCompletion(foods, logs);
  return Math.max(completion.total - completion.eaten, 0);
}

export function completionByCollection(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const collections = [
    { id: "all", label: "全フード", foods },
    { id: "pizza", label: "ピザ", foods: foods.filter((food) => food.category === "pizza") },
    { id: "burger", label: "バーガー", foods: foods.filter((food) => food.category === "burger") },
    { id: "noodle", label: "麺・パスタ", foods: foods.filter((food) => food.category === "noodle") },
    { id: "kids", label: "キッズ", foods: foods.filter((food) => food.category === "kids") },
    { id: "dessert", label: "スイーツ", foods: foods.filter((food) => food.category === "dessert") },
    { id: "set", label: "セットメニュー", foods: foods.filter((food) => food.category === "set") },
    { id: "churro", label: "チュリトス", foods: foods.filter((food) => food.category === "churro") },
    { id: "popcorn", label: "ポップコーン", foods: foods.filter((food) => food.category === "popcorn") },
    { id: "drink", label: "ドリンク", foods: foods.filter((food) => food.category === "drink") },
    {
      id: "walkfood",
      label: "食べ歩き",
      foods: foods.filter((food) =>
        food.diningType === "takeout" ||
        food.diningType === "food_cart" ||
        food.category === "churro" ||
        food.category === "popcorn" ||
        food.category === "snack" ||
        food.category === "drink"
      )
    },
    {
      id: "foodcart",
      label: "フードカート",
      foods: foods.filter((food) => food.diningType === "food_cart" || food.locations?.some((location) => location.shopType === "cart" || location.shopType === "wagon"))
    },
    { id: "seasonal", label: "期間限定", foods: foods.filter((food) => food.isLimited || food.rarity === "limited" || food.rarity === "event") }
  ];

  return collections
    .map((collection) => ({
      id: collection.id,
      label: collection.label,
      foods: collection.foods,
      ...calculateCompletion(collection.foods, logs)
    }))
    .filter((collection) => collection.total > 0);
}

export function completionByCategory(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  return Object.entries(categoryLabels).map(([category, label]) => {
    const categoryFoods = foods.filter((food) => food.category === category);
    return {
      id: category,
      label,
      foods: categoryFoods,
      ...calculateCompletion(categoryFoods, logs)
    };
  });
}

function stableNumberFromId(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 999;
  return hash + 1;
}

function todayKey(today: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(today);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function dateKeyToUtc(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatDateJa(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).format(date);
}
