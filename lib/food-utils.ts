import { categoryLabels } from "@/lib/constants";
import { getCategoryPlaceholder, getFoodImage } from "@/lib/utils/image";
import type { FoodCategory, FoodImage, FoodLocation, FoodStatus, FoodWithRelations, PriceSource, SaleStatus, SaleType, UserFoodLog } from "@/types/domain";

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
  if (saleStatus === "paused") return "一時停止";
  return "販売期間確認中";
}

export function getSaleStatusLabel(food: Pick<FoodWithRelations, "saleStatus" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate">) {
  const labels: Record<SaleStatus, string> = {
    active: "販売中",
    paused: "一時停止",
    ended: "販売終了",
    upcoming: "近日販売",
    unknown: "販売期間確認中"
  };
  return labels[getSaleStatus(food)];
}

export function getSaleStatusTone(food: Pick<FoodWithRelations, "saleStatus" | "status" | "saleStartDate" | "saleEndDate" | "startDate" | "endDate">) {
  const tones: Record<SaleStatus, string> = {
    active: "bg-mint text-park",
    paused: "bg-slate-100 text-slate-600",
    ended: "bg-slate-100 text-slate-600",
    upcoming: "bg-sun/25 text-ink",
    unknown: "bg-slate-100 text-slate-600"
  };
  return tones[getSaleStatus(food)];
}

export function isEaten(logs: UserFoodLog[], foodId: string) {
  return logs.some((log) => log.foodId === foodId && log.status === "eaten");
}

export function getCanonicalFoodKey(food: Pick<FoodWithRelations, "id" | "canonicalGroupId" | "duplicateGroupId">) {
  return food.canonicalGroupId ?? food.duplicateGroupId ?? food.id;
}

export function getCanonicalFoodId(foods: FoodWithRelations[], food: FoodWithRelations | string) {
  const target = typeof food === "string" ? foods.find((candidate) => candidate.id === food) : food;
  if (!target) return typeof food === "string" ? food : food.id;
  return chooseCanonicalRepresentative(foods.filter((candidate) => getCanonicalFoodKey(candidate) === getCanonicalFoodKey(target))).id;
}

export function dedupeFoodsByCanonical(foods: FoodWithRelations[]) {
  const groups = new Map<string, FoodWithRelations[]>();
  for (const food of foods) {
    const key = getCanonicalFoodKey(food);
    groups.set(key, [...(groups.get(key) ?? []), food]);
  }
  return Array.from(groups.values()).map(chooseCanonicalRepresentative);
}

export function getCanonicalFoodMap(foods: FoodWithRelations[]) {
  return new Map(foods.map((food) => [food.id, getCanonicalFoodKey(food)]));
}

export function getEatenCanonicalKeys(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const canonicalMap = getCanonicalFoodMap(foods);
  return new Set(
    logs
      .filter((log) => log.status === "eaten")
      .map((log) => canonicalMap.get(log.foodId) ?? log.foodId)
  );
}

export function isEatenCanonical(foods: FoodWithRelations[], logs: UserFoodLog[], food: FoodWithRelations) {
  return getEatenCanonicalKeys(foods, logs).has(getCanonicalFoodKey(food));
}

export function activeFoods(foods: FoodWithRelations[]) {
  return dedupeFoodsByCanonical(foods.filter(isCompletableFood));
}

export function calculateCompletion(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const eligible = dedupeFoodsByCanonical(foods.filter(isCompletableFood));
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const eatenCount = eligible.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
  return {
    total: eligible.length,
    eaten: eatenCount,
    rate: eligible.length === 0 ? 0 : Math.round((eatenCount / eligible.length) * 100)
  };
}

export function calculateArchiveRecordRate(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const canonicalFoods = dedupeFoodsByCanonical(foods);
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  const eatenCount = canonicalFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
  return {
    total: canonicalFoods.length,
    eaten: eatenCount,
    rate: canonicalFoods.length === 0 ? 0 : Math.round((eatenCount / canonicalFoods.length) * 100)
  };
}

function chooseCanonicalRepresentative(group: FoodWithRelations[]) {
  if (group.length === 0) throw new Error("Cannot choose canonical representative from an empty group.");
  return [...group].sort(compareRepresentativeQuality)[0];
}

function compareRepresentativeQuality(a: FoodWithRelations, b: FoodWithRelations) {
  const score = (food: FoodWithRelations) => {
    const publicImage = getFoodImage(food) !== getCategoryPlaceholder(food.category);
    const priceKnown = Boolean(food.price ?? food.priceMin ?? food.locations?.find((location) => location.price)?.price);
    return (
      Number(food.canonicalFood !== false) * 10_000 +
      Number(isCompletableFood(food)) * 1_000 +
      Number(publicImage) * 400 +
      Number(priceKnown) * 200 +
      (food.confidenceScore ?? 0) +
      (food.nameQualityScore ?? 0) / 10
    );
  };
  return score(b) - score(a) || (b.lastCheckedAt ?? "").localeCompare(a.lastCheckedAt ?? "") || a.name.localeCompare(b.name, "ja") || a.id.localeCompare(b.id);
}

type AreaDisplayFood = Pick<FoodWithRelations, "area" | "shop" | "locations" | "name"> &
  Partial<Pick<FoodWithRelations, "sourceUrl" | "officialUrl" | "sourceNames" | "eventName" | "collaborationName" | "description">> & {
    locationText?: string | null;
    sourceText?: string | null;
    salesLocations?: Array<{ areaName?: string | null; shopName?: string | null; name?: string | null; sourceUrl?: string | null; locationText?: string | null }>;
    shops?: Array<{ areaName?: string | null; shopName?: string | null; name?: string | null; sourceUrl?: string | null }>;
  };

export function getFoodAreaNames(food: AreaDisplayFood, limit?: number) {
  const names: string[] = [];
  const addArea = (value?: string | null) => {
    const displayName = normalizeDisplayAreaName(value);
    if (displayName && !names.includes(displayName)) names.push(displayName);
  };

  for (const location of food.locations ?? []) {
    addArea(normalizeDisplayAreaName(location.areaName) ?? inferAreaFromLocation(location, food));
  }
  for (const location of food.salesLocations ?? []) {
    addArea(normalizeDisplayAreaName(location.areaName) ?? inferAreaFromText([location.shopName, location.name, location.locationText, location.sourceUrl, buildFoodAreaContext(food)].filter(Boolean).join(" ")));
  }
  for (const shop of food.shops ?? []) {
    addArea(normalizeDisplayAreaName(shop.areaName) ?? inferAreaFromText([shop.shopName, shop.name, shop.sourceUrl, buildFoodAreaContext(food)].filter(Boolean).join(" ")));
  }
  addArea(normalizeDisplayAreaName(food.area?.name) ?? inferAreaFromFood(food));

  const result = names.length > 0 ? names : ["エリア確認中"];
  return typeof limit === "number" ? result.slice(0, limit) : result;
}

export function getFoodAreaDisplay(food: AreaDisplayFood, maxVisible = 2) {
  const areas = getFoodAreaNames(food);
  const visibleAreas = areas.slice(0, maxVisible);
  const hiddenCount = Math.max(areas.length - visibleAreas.length, 0);
  return {
    areas,
    visibleAreas,
    hiddenCount,
    summary: `${visibleAreas.join(" / ")}${hiddenCount > 0 ? ` ほか${hiddenCount}箇所` : ""}`
  };
}

export function getFoodAreaSummary(food: AreaDisplayFood, maxVisible = 2) {
  return getFoodAreaDisplay(food, maxVisible).summary;
}

export function foodMatchesArea(food: AreaDisplayFood & Partial<Pick<FoodWithRelations, "areaId">>, areaId: string, areaName?: string | null) {
  if (areaId === "all") return true;
  if (food.areaId === areaId) return true;
  if (food.locations?.some((location) => location.areaId === areaId)) return true;
  if (areaName && getFoodAreaNames(food).includes(areaName)) return true;
  return false;
}

export function getDisplayLocationAreaName(location: Pick<FoodLocation, "areaName" | "shopName" | "sourceUrl">, food: AreaDisplayFood | Pick<FoodWithRelations, "name">) {
  return normalizeDisplayAreaName(location.areaName) ?? inferAreaFromLocation(location, food) ?? "エリア確認中";
}

export function isAreaOtherLike(value?: string | null) {
  return !value || /^(その他|エリア未確認|未確認|不明|unknown)$/i.test(value.trim());
}

export function isExactOtherAreaName(value?: string | null) {
  return value?.trim() === "その他";
}

export function needsAreaReview(food: AreaDisplayFood) {
  return getFoodAreaNames(food)[0] === "エリア確認中";
}

export function normalizeDisplayAreaName(value?: string | null) {
  if (isAreaOtherLike(value)) return null;
  return value!.trim();
}

function inferAreaFromLocation(location: Pick<FoodLocation, "areaName" | "shopName" | "sourceUrl">, food: AreaDisplayFood | Pick<FoodWithRelations, "name">) {
  return inferAreaFromText([location.shopName, location.sourceUrl, buildFoodAreaContext(food)].filter(Boolean).join(" "));
}

function inferAreaFromFood(food: AreaDisplayFood) {
  return inferAreaFromText([food.shop?.name, buildFoodAreaContext(food)].filter(Boolean).join(" "));
}

function buildFoodAreaContext(food: AreaDisplayFood | Pick<FoodWithRelations, "name">) {
  const richFood = food as AreaDisplayFood;
  return [
    food.name,
    richFood.locationText,
    richFood.sourceText,
    richFood.sourceUrl,
    richFood.officialUrl,
    richFood.sourceNames?.join(" "),
    richFood.eventName,
    richFood.collaborationName,
    richFood.description
  ].filter(Boolean).join(" ");
}

export function inferAreaFromText(text?: string | null) {
  const normalized = text ?? "";
  if (/super-nintendo-world|kinopios-cafe|キノピオ|ヨッシー|マリオ|ピーチ|ドンキー|ジャングル・ビート|ピットストップ/.test(normalized)) return "スーパー・ニンテンドー・ワールド";
  if (/harry-potter|three-broomsticks|hog|三本の箒|ホッグズ|ホグワーツ|ハリー|ポッター/.test(normalized)) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (/minion|delicious-me|ミニオン|デリシャス・ミー|イーブル・イーツ|ティム/.test(normalized)) return "ミニオン・パーク";
  if (/wonderland|snoopy|hello-kitty|cupcake-dream|elmo|スヌーピー|エルモ|キティ|ワンダーランド|カップケーキ・ドリーム|イマジネーション・プレイランド/.test(normalized)) return "ユニバーサル・ワンダーランド";
  if (/hollywood|beverly|space-fantasy|universal-monsters|curious-george|california-confectionery|メルズ|スペース・ファンタジー|ハリウッド|ハリウッド・ドリーム|ビバリーヒルズ|ユニバーサル・モンスター|ユニモン|おさるのジョージ|プレイングウィズ|シネマ 4-D|シネマ4-D|カリフォルニアコンフェクショナリー/.test(normalized)) return "ハリウッド・エリア";
  if (/new-york|finnegans|louies|saido|park-side|battery-park|spider-man|フィネガンズ|ルイズ|SAIDO|パークサイド|アズーラ|スパイダーマン|バッテリーパーク/.test(normalized)) return "ニューヨーク・エリア";
  if (/san-francisco|lombards|dragons-pearl|wharf|happiness-cafe|ロンバーズ|ドラゴンズ・パール|ワーフカフェ|ハピネス・カフェ/.test(normalized)) return "サンフランシスコ・エリア";
  if (/jurassic|discovery|lost-world|ジュラシック|ディスカバリー|ロストワールド/.test(normalized)) return "ジュラシック・パーク";
  if (/amity|jaws|boardwalk|アミティ|ジョーズ|ハンギングジョーズ|ボードウォーク/.test(normalized)) return "アミティ・ビレッジ";
  if (/waterworld|ウォーターワールド/.test(normalized)) return "ウォーターワールド";
  return null;
}

export function countEatenEndedFoods(foods: FoodWithRelations[], logs: UserFoodLog[]) {
  const endedFoods = dedupeFoodsByCanonical(foods.filter((food) => !isCompletableFood(food)));
  const eatenKeys = getEatenCanonicalKeys(foods, logs);
  return endedFoods.filter((food) => eatenKeys.has(getCanonicalFoodKey(food))).length;
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
      const areaFoods = foods.filter((food) => food.areaId === area.id || getFoodAreaNames(food).includes(area.name));
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
