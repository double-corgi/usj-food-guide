import { categoryLabels, shopTypeLabels } from "@/lib/constants";
import { getDisplayLocationAreaName, getFoodAreaNames, getSaleStatus, getSaleType } from "@/lib/food-utils";
import { getFoodImage } from "@/lib/utils/image";
import type { FoodCategory, FoodWithRelations, Shop, ShopType } from "@/types/domain";

const officialAreaImageBase = "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images";

const storeAreaVisuals = [
  { name: "スーパー・ニンテンドー・ワールド", imageUrl: `${officialAreaImageBase}/usj-gds-super-nintendo-world-5th-cf6-a.jpg` },
  { name: "ウィザーディング・ワールド・オブ・ハリー・ポッター", imageUrl: `${officialAreaImageBase}/usj-gds-the-wizarding-world-of-harry-potter-cf6-a.jpg` },
  { name: "ミニオン・パーク", imageUrl: `${officialAreaImageBase}/usj-gds-minion-park-cf6-a.jpg` },
  { name: "ユニバーサル・ワンダーランド", imageUrl: `${officialAreaImageBase}/usj-gds-universal-wonderland-cf6-a.jpg` },
  { name: "ハリウッド・エリア", imageUrl: `${officialAreaImageBase}/usj-gds-hollywood-cf6-a.jpg` },
  { name: "ニューヨーク・エリア", imageUrl: `${officialAreaImageBase}/usj-gds-new-york-cf6-a.jpg` },
  { name: "サンフランシスコ・エリア", imageUrl: `${officialAreaImageBase}/usj-gds-san-francisco-cf6-a.jpg` },
  { name: "ジュラシック・パーク", imageUrl: `${officialAreaImageBase}/usj-gds-jurassic-park-the-ride-cf6-a.jpg` },
  { name: "アミティ・ビレッジ", imageUrl: `${officialAreaImageBase}/usj-gds-amity-village-cf6-a.jpg` },
  { name: "ウォーターワールド", imageUrl: `${officialAreaImageBase}/usj-gds-waterworld-cf6-a.jpg` }
] as const;

export type StoreWithFoods = {
  id: string;
  aliases: string[];
  name: string;
  areaName: string;
  type: ShopType;
  kindLabel: string;
  officialUrl?: string;
  imageUrl?: string;
  imageAlt: string;
  imageKind: "area" | "placeholder";
  visualTone: "green" | "blue" | "gold" | "cyan" | "navy" | "slate";
  visualIcon: "restaurant" | "cart" | "cafe" | "popcorn" | "snack" | "store";
  visualPosition: string;
  foods: FoodWithRelations[];
  description: string;
  serviceTypeLabel: string;
  menuLabels: string[];
  paymentLabel: string;
};

export function buildStoresFromFoods(foods: FoodWithRelations[]): StoreWithFoods[] {
  const storeMap = new Map<string, StoreWithFoods>();

  for (const food of foods) {
    const candidates = getFoodShopCandidates(food);
    for (const candidate of candidates) {
      const officialUrl = getSafeStoreOfficialUrl(candidate.officialUrl);
      const storeKey = buildStoreIdentityKey(candidate.name, candidate.areaName);
      const current = storeMap.get(storeKey);
      const nextFoods = appendUniqueStoreFood(current?.foods ?? [], food);
      const cleanName = cleanShopName(candidate.name);
      const currentAliases = current ? [current.id, ...current.aliases] : [];
      const aliases = Array.from(new Set([...currentAliases, candidate.id])).sort();
      const selectedOfficialUrl = chooseStoreOfficialUrl(current?.officialUrl, officialUrl);
      const selectedId = current && !current.officialUrl && officialUrl ? candidate.id : current?.id ?? candidate.id;
      const visual = current?.imageUrl
        ? {
            imageUrl: current.imageUrl,
            imageAlt: current.imageAlt,
            imageKind: current.imageKind,
            visualTone: current.visualTone,
            visualIcon: current.visualIcon,
            visualPosition: current.visualPosition
          }
        : getStoreVisual(candidate.name, candidate.areaName, candidate.type);

      storeMap.set(storeKey, {
        id: selectedId,
        aliases,
        name: cleanName,
        areaName: candidate.areaName,
        type: getPreferredStoreType(current?.type, candidate.type),
        kindLabel: getStoreKindLabel(candidate.name, candidate.type),
        officialUrl: selectedOfficialUrl,
        imageUrl: visual.imageUrl,
        imageAlt: visual.imageAlt,
        imageKind: visual.imageKind,
        visualTone: visual.visualTone,
        visualIcon: visual.visualIcon,
        visualPosition: visual.visualPosition,
        foods: nextFoods,
        description: buildStoreDescription(candidate.name, candidate.areaName, candidate.type, nextFoods),
        serviceTypeLabel: getServiceTypeLabel(candidate.type),
        menuLabels: getMenuLabels(nextFoods),
        paymentLabel: "支払い方法は公式サイトまたは現地表示をご確認ください"
      });
    }
  }

  return resolveStoreDisplayIds(
    Array.from(storeMap.values()).sort((a, b) => {
      return compareStoresByAreaAndName(a, b);
    })
  );
}

export function findStoreById(stores: StoreWithFoods[], id: string) {
  const ids = new Set([id, safeDecodeStoreId(id)]);
  return stores.find((store) => ids.has(store.id) || store.aliases.some((alias) => ids.has(alias)));
}

export function getStoreTypeLabel(store: Pick<StoreWithFoods, "type"> | Pick<Shop, "type">) {
  if ("kindLabel" in store && typeof store.kindLabel === "string") return store.kindLabel;
  if (store.type === "cart" || store.type === "wagon") return "フードカート";
  if (store.type === "unknown") return "フード施設";
  return shopTypeLabels[store.type] ?? "フード施設";
}

export function getStoreAccentClass(store: Pick<StoreWithFoods, "areaName">) {
  if (/ニンテンドー|Nintendo/i.test(store.areaName)) return "from-emerald-500 to-sky-500";
  if (/ハリー|ポッター|ウィザーディング/i.test(store.areaName)) return "from-amber-500 to-stone-700";
  if (/ミニオン/i.test(store.areaName)) return "from-yellow-400 to-sky-500";
  if (/ジュラシック/i.test(store.areaName)) return "from-emerald-700 to-lime-500";
  if (/アミティ/i.test(store.areaName)) return "from-sky-500 to-cyan-300";
  if (/ニューヨーク/i.test(store.areaName)) return "from-blue-600 to-slate-500";
  if (/サンフランシスコ/i.test(store.areaName)) return "from-orange-500 to-sky-500";
  return "from-park to-cyan-400";
}

export function pickRepresentativeFood(store: StoreWithFoods) {
  return getStoreDisplayFoods(store.foods, store)[0];
}

export function getStoreDisplayFoods(foods: FoodWithRelations[], store?: StoreWithFoods) {
  const foodMap = new Map<string, FoodWithRelations>();

  for (const food of foods) {
    const key = getStoreFoodDedupeKey(food);
    const current = foodMap.get(key);
    if (!current || compareStoreFoodQuality(food, current, store) > 0) {
      foodMap.set(key, food);
    }
  }

  return Array.from(foodMap.values()).sort((a, b) => compareStoreFoodDisplay(b, a, store) || a.name.localeCompare(b.name, "ja"));
}

export function getStoreSummary(store: StoreWithFoods, representativeFood?: FoodWithRelations) {
  const name = store.name;

  if (/アイス|アイスクリーム/i.test(name)) return "アイスクリーム専門店";
  if (/メルズ|ドライブイン/i.test(name)) return "ハンバーガーレストラン";
  if (/ホグズ|ヘッド|パブ/i.test(name)) return "バタービール";
  if (/ポップコーン/i.test(name)) return "ポップコーンカート";
  if (/チュリトス|チュロス|ジョーズ前/i.test(name)) return "チュリトスカート";
  if (/カフェ|Cafe/i.test(name)) return "カフェ";
  if (/ブランジェリー/i.test(name)) return "カフェ＆スイーツ";
  if (/ピザ/i.test(name)) return "ピザレストラン";
  if (/すし|寿司|彩道|和食/i.test(name)) return "和食レストラン";

  const category = representativeFood?.category;
  if (category === "popcorn") return "ポップコーンカート";
  if (category === "churro") return "チュリトスカート";
  if (category === "burger") return "ハンバーガーレストラン";
  if (category === "pizza") return "ピザレストラン";
  if (category === "dessert") return "スイーツ";
  if (category === "drink") return "ドリンクスタンド";
  if (category === "rice" || category === "noodle" || category === "set" || category === "kids") return "レストラン";
  if (store.type === "cart" || store.type === "wagon") return "カート販売";
  if (store.type === "restaurant") return "レストラン";
  return "フード施設";
}

export function getStoreBadge(store: StoreWithFoods) {
  if (store.visualIcon === "popcorn") return { icon: "🍿", label: "ポップコーン" };
  if (store.visualIcon === "cafe") return { icon: "☕", label: "カフェ" };
  if (store.visualIcon === "snack") return { icon: "🍰", label: "スイーツ / スナック" };
  if (store.visualIcon === "cart" || store.type === "cart" || store.type === "wagon") return { icon: "🛒", label: "フードカート" };
  if (store.visualIcon === "restaurant" || store.type === "restaurant") return { icon: "🍴", label: "レストラン" };
  return { icon: "🏪", label: "フード施設" };
}

function compareStoreFoodQuality(a: FoodWithRelations, b: FoodWithRelations, store?: StoreWithFoods) {
  return storeFoodDisplayScore(a, store) - storeFoodDisplayScore(b, store);
}

function compareStoreFoodDisplay(a: FoodWithRelations, b: FoodWithRelations, store?: StoreWithFoods) {
  return storeFoodDisplayScore(a, store) - storeFoodDisplayScore(b, store);
}

function storeFoodDisplayScore(food: FoodWithRelations, store?: StoreWithFoods) {
  const src = getFoodImage(food);
  const hasProductImage = src && !src.startsWith("/placeholders/");
  const saleStatus = getSaleStatus(food);
  const saleType = getSaleType(food);
  return (
    (saleStatus === "active" ? 1000 : saleStatus === "upcoming" ? 320 : saleStatus === "unknown" ? 180 : 0) +
    (saleType !== "permanent" || food.isLimited ? 170 : 0) +
    (store ? storeFoodMatchScore(food, store) : 0) +
    (hasProductImage ? 70 : 0) +
    (food.price || food.priceMin || food.priceMax ? 24 : 0) +
    Math.min(food.extractionSourceCount ?? 0, 5) * 7 +
    Math.round((food.confidenceScore ?? 0) / 5) +
    categoryPriority(food.category)
  );
}

function storeFoodMatchScore(food: FoodWithRelations, store: StoreWithFoods) {
  const storeName = store.name;
  const foodName = food.name;
  let score = 0;

  if (/アイス|アイスクリーム/i.test(storeName) && /アイス|フロート|サンデー/i.test(foodName)) score += 180;
  if (/メルズ|ドライブイン/i.test(storeName) && (food.category === "burger" || /バーガー/i.test(foodName))) score += 180;
  if (/ホグズ|ヘッド|パブ/i.test(storeName) && /バタービール|ビール/i.test(foodName)) score += 180;
  if (/ポップコーン/i.test(storeName) && (food.category === "popcorn" || /ポップコーン/i.test(foodName))) score += 180;
  if (/チュリトス|チュロス|ジョーズ前|カート/i.test(storeName) && (food.category === "churro" || /チュリトス|チュロス/i.test(foodName))) score += 160;
  if (/カフェ|Cafe|ブランジェリー|スタジオ・スターズ/i.test(storeName) && ["dessert", "drink", "set", "burger"].includes(food.category)) score += 80;
  if (/キノピオ|スーパー・スター|ルイズ|フィネガンズ|三本の箒/i.test(storeName) && ["set", "rice", "burger", "kids"].includes(food.category)) score += 72;

  if (store.name.includes(food.name)) score += 30;
  return score;
}

function categoryPriority(category: FoodCategory) {
  const scores: Partial<Record<FoodCategory, number>> = {
    set: 22,
    burger: 21,
    rice: 20,
    pizza: 19,
    dessert: 18,
    drink: 16,
    popcorn: 15,
    churro: 14,
    snack: 12
  };
  return scores[category] ?? 8;
}

export function getSafeStoreOfficialUrl(input?: string | null) {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500 || /[<>{}\n\r]/.test(trimmed)) return undefined;

  let url: URL;
  try {
    url = new URL(trimmed, "https://www.usj.co.jp");
  } catch {
    return undefined;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
  if (url.hostname !== "www.usj.co.jp" && url.hostname !== "usj.co.jp") return undefined;
  url.protocol = "https:";
  url.hostname = "www.usj.co.jp";
  url.search = "";
  url.hash = "";

  const path = url.pathname.replace(/\/+$/, "");
  if (/^\/web\/ja\/jp\/restaurants\/(?:food-cart|[^/]*-food)$/i.test(path)) return undefined;
  const tridionRestaurant = path.match(/^\/tridiondata\/usj\/ja\/jp\/restaurants\/(.+)\/index\.html$/);
  if (tridionRestaurant) {
    if (/^(food-cart|.*-food)$/i.test(tridionRestaurant[1])) return undefined;
    return `https://www.usj.co.jp/web/ja/jp/restaurants/${tridionRestaurant[1]}`;
  }
  const tridionEvent = path.match(/^\/tridiondata\/usj\/ja\/jp\/events\/(.+)\/index\.html$/);
  if (tridionEvent) {
    return `https://www.usj.co.jp/web/ja/jp/events/${tridionEvent[1]}`;
  }
  if (/^\/web\/ja\/jp\/restaurants\/[^/]+/.test(path) || /^\/web\/ja\/jp\/events\/[^/]+/.test(path)) {
    return `https://www.usj.co.jp${path}`;
  }

  return undefined;
}

function getFoodShopCandidates(food: FoodWithRelations) {
  const candidates = new Map<string, { id: string; name: string; areaName: string; type: ShopType; officialUrl?: string }>();

  if (food.shop.name && food.shop.name !== "店舗未確認") {
    candidates.set(food.shop.id, {
      id: food.shop.id,
      name: food.shop.name,
      areaName: getPrimaryAreaName(food),
      type: food.shop.type,
      officialUrl: getFirstSafeStoreOfficialUrl(food.shop.officialUrl, food.officialUrl, food.sourceUrl)
    });
  }

  for (const location of food.locations ?? []) {
    if (!location.shopName || location.shopName === "店舗未確認") continue;
    const id = location.shopId ?? `${food.areaId}-${normalizeShopName(location.shopName)}`;
    candidates.set(id, {
      id,
      name: location.shopName,
      areaName: getDisplayLocationAreaName(location, food),
      type: location.shopType,
      officialUrl: getFirstSafeStoreOfficialUrl(food.shop.officialUrl, food.officialUrl, location.sourceUrl, food.sourceUrl)
    });
  }

  return Array.from(candidates.values());
}

function buildStoreIdentityKey(name: string, areaName: string) {
  return [
    normalizeShopName(name),
    normalizeAreaName(areaName) || normalizeShopName(areaName)
  ].join("|");
}

function chooseStoreOfficialUrl(current?: string, next?: string) {
  if (!current) return next;
  if (!next) return current;
  return current;
}

function getPreferredStoreType(current: ShopType | undefined, next: ShopType) {
  if (!current || current === "unknown") return next;
  return current;
}

function getFirstSafeStoreOfficialUrl(...urls: Array<string | null | undefined>) {
  for (const url of urls) {
    const safeUrl = getSafeStoreOfficialUrl(url);
    if (safeUrl) return safeUrl;
  }
  return undefined;
}

function getPrimaryAreaName(food: FoodWithRelations) {
  return getFoodAreaNames(food)[0] ?? food.area.name ?? "エリア確認中";
}

function resolveStoreDisplayIds(stores: StoreWithFoods[]) {
  const idCounts = new Map<string, number>();
  for (const store of stores) {
    idCounts.set(store.id, (idCounts.get(store.id) ?? 0) + 1);
  }

  const aliasCounts = new Map<string, number>();
  for (const store of stores) {
    for (const alias of store.aliases) {
      aliasCounts.set(alias, (aliasCounts.get(alias) ?? 0) + 1);
    }
  }

  const reservedIds = new Set<string>();
  for (const store of stores) {
    reservedIds.add(store.id);
    for (const alias of store.aliases) reservedIds.add(alias);
  }

  const seenIds = new Map<string, number>();
  const nextStores = stores.map((store) => {
    const seen = seenIds.get(store.id) ?? 0;
    seenIds.set(store.id, seen + 1);

    if ((idCounts.get(store.id) ?? 0) <= 1 || seen === 0) {
      return store;
    }

    const id = createUniqueStoreDisplayId(store, reservedIds);
    reservedIds.add(id);
    return { ...store, id };
  });

  const finalIds = new Set(nextStores.map((store) => store.id));
  return nextStores.map((store) => ({
    ...store,
    aliases: store.aliases.filter((alias) => alias !== store.id && !finalIds.has(alias) && (aliasCounts.get(alias) ?? 0) === 1)
  }));
}

function createUniqueStoreDisplayId(store: Pick<StoreWithFoods, "name" | "areaName">, reservedIds: Set<string>) {
  const areaSlug = normalizeAreaName(store.areaName) || normalizeShopName(store.areaName);
  const base = `shop-${normalizeShopName(store.name)}-${areaSlug || "area"}`;
  let id = base;
  let suffix = 2;
  while (reservedIds.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function compareStoresByAreaAndName(a: Pick<StoreWithFoods, "areaName" | "name">, b: Pick<StoreWithFoods, "areaName" | "name">) {
  return a.areaName.localeCompare(b.areaName, "ja") || a.name.localeCompare(b.name, "ja");
}

function safeDecodeStoreId(id: string) {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

function normalizeShopName(name: string) {
  return cleanShopName(name).normalize("NFKC").replace(/\s+/g, "-").replace(/[^\p{Letter}\p{Number}-]+/gu, "").toLowerCase();
}

function normalizeAreaName(name?: string | null) {
  const normalized = (name ?? "")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!normalized) return "";
  if (normalized.includes("ニンテンドー")) return "スーパー・ニンテンドー・ワールド";
  if (normalized.includes("ハリー") || normalized.includes("ウィザーディング")) return "ウィザーディング・ワールド・オブ・ハリー・ポッター";
  if (normalized.includes("ミニオン")) return "ミニオン・パーク";
  if (normalized.includes("ワンダーランド")) return "ユニバーサル・ワンダーランド";
  if (normalized.includes("ハリウッド")) return "ハリウッド・エリア";
  if (normalized.includes("ニューヨーク")) return "ニューヨーク・エリア";
  if (normalized.includes("サンフランシスコ")) return "サンフランシスコ・エリア";
  if (normalized.includes("ジュラシック")) return "ジュラシック・パーク";
  if (normalized.includes("アミティ")) return "アミティ・ビレッジ";
  if (normalized.includes("ウォーターワールド")) return "ウォーターワールド";
  return "";
}

function getStoreVisual(name: string, areaName: string, type: ShopType): Pick<StoreWithFoods, "imageUrl" | "imageAlt" | "imageKind" | "visualTone" | "visualIcon" | "visualPosition"> {
  const normalizedArea = normalizeAreaName(areaName);
  const areaVisual = storeAreaVisuals.find((visual) => visual.name === normalizedArea);

  if (areaVisual) {
    return {
      imageUrl: areaVisual.imageUrl,
      imageAlt: `${areaVisual.name}のエリア写真`,
      imageKind: "area",
      visualTone: getStoreVisualTone(areaName),
      visualIcon: getStoreVisualIcon(name, type),
      visualPosition: getStoreVisualPosition(name)
    };
  }

  // Store cards intentionally avoid food photos. If no store/area image exists,
  // render a type-aware visual placeholder instead of a product image.
  return {
    imageAlt: `${cleanShopName(name)}の店舗イメージ`,
    imageKind: "placeholder",
    visualTone: getStoreVisualTone(areaName),
    visualIcon: getStoreVisualIcon(name, type),
    visualPosition: "center"
  };
}

function getStoreVisualTone(areaName: string): StoreWithFoods["visualTone"] {
  if (/アミティ|サンフランシスコ/i.test(areaName)) return "cyan";
  if (/ニンテンドー|ジュラシック|ワンダーランド/i.test(areaName)) return "green";
  if (/ハリー|ポッター|ウィザーディング|ミニオン/i.test(areaName)) return "gold";
  if (/ニューヨーク|ハリウッド/i.test(areaName)) return "blue";
  if (/ウォーターワールド/i.test(areaName)) return "navy";
  return "slate";
}

function getStoreVisualIcon(name: string, type: ShopType): StoreWithFoods["visualIcon"] {
  if (/ポップコーン/i.test(name)) return "popcorn";
  if (/カフェ|Cafe|ブランジェリー/i.test(name)) return "cafe";
  if (/アイス|クッキー|スナック|スウィーツ|スイーツ/i.test(name)) return "snack";
  if (type === "cart" || type === "wagon") return "cart";
  if (type === "restaurant") return "restaurant";
  return "store";
}

function getStoreVisualPosition(name: string) {
  const positions = ["center", "left center", "right center", "center top", "center bottom", "35% center", "65% center"];
  const index = Array.from(cleanShopName(name)).reduce((sum, char) => sum + char.charCodeAt(0), 0) % positions.length;
  return positions[index];
}

function appendUniqueStoreFood(currentFoods: FoodWithRelations[], food: FoodWithRelations) {
  const nextKey = getStoreFoodDedupeKey(food);
  const nextSignature = getStoreFoodSignature(food);
  if (currentFoods.some((current) => getStoreFoodDedupeKey(current) === nextKey || getStoreFoodSignature(current) === nextSignature)) {
    return currentFoods;
  }
  return [...currentFoods, food];
}

function getStoreFoodDedupeKey(food: FoodWithRelations) {
  if (food.canonicalGroupId || food.duplicateGroupId) return food.canonicalGroupId ?? food.duplicateGroupId ?? food.id;
  const price = food.price ?? food.priceMin ?? food.priceMax ?? "price-unset";
  return [normalizeShopName(food.name), price, getFoodImage(food)].join("|");
}

function getStoreFoodSignature(food: FoodWithRelations) {
  const price = food.price ?? food.priceMin ?? food.priceMax ?? "price-unset";
  return [normalizeStoreFoodName(food.name), price].join("|");
}

function normalizeStoreFoodName(name: string) {
  return cleanShopName(name)
    .normalize("NFKC")
    .replace(/付き/g, "")
    .replace(/[\s・〜～ー\-!?？!（）()「」『』【】、。,.]/g, "")
    .toLowerCase();
}

function cleanShopName(name: string) {
  return name.replace(/^・+/, "").trim();
}

function buildStoreDescription(name: string, areaName: string, type: ShopType, foods: FoodWithRelations[]) {
  const cleanName = cleanShopName(name);
  const menus = getMenuLabels(foods).slice(0, 3);
  const menuText = menus.length > 0 ? `${menus.join("、")}などを確認できます。` : "この店舗で買えるフードを確認できます。";
  if (type === "cart" || type === "wagon") {
    return `${areaName}のフードカート。${menuText}`;
  }
  if (/カフェ|Cafe|ブランジェリー/i.test(cleanName)) {
    return `${areaName}のカフェ。${menuText}`;
  }
  if (/ポップコーン/i.test(cleanName)) {
    return `${areaName}のポップコーン販売スポット。${menuText}`;
  }
  if (type === "restaurant") {
    return `${areaName}のレストラン。${menuText}`;
  }
  return `${areaName}のフード施設。${menuText}`;
}

function getServiceTypeLabel(type: ShopType) {
  if (type === "restaurant") return "レストラン";
  if (type === "cart" || type === "wagon") return "テイクアウト中心";
  return "公式サイトで確認";
}

function getStoreKindLabel(name: string, type: ShopType) {
  if (/ポップコーン/i.test(name)) return "ポップコーン";
  if (/カフェ|Cafe|ブランジェリー/i.test(name)) return "カフェ";
  if (/スナック|アイス|クッキー/i.test(name)) return "スナック";
  if (type === "cart" || type === "wagon") return "フードカート";
  if (type === "restaurant") return "レストラン";
  return "フード施設";
}

function getMenuLabels(foods: FoodWithRelations[]) {
  const categories = new Set<FoodCategory>();
  for (const food of foods) categories.add(food.category);
  return Array.from(categories)
    .map((category) => categoryLabels[category])
    .filter((label) => label && label !== "カテゴリ確認中")
    .slice(0, 5);
}
