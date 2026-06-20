import * as fs from "node:fs";
import * as path from "node:path";

type UnknownRecord = Record<string, unknown>;

type FoodImageLike = {
  imageUrl?: unknown;
  image_url?: unknown;
  enabled?: unknown;
  priority?: unknown;
};

type FoodLocationLike = {
  shopId?: unknown;
  shop_id?: unknown;
  shopName?: unknown;
  shop_name?: unknown;
  areaId?: unknown;
  area_id?: unknown;
  areaName?: unknown;
  area_name?: unknown;
  shop?: unknown;
  area?: unknown;
};

type FoodLike = {
  id?: unknown;
  name?: unknown;
  normalizedName?: unknown;
  normalized_name?: unknown;
  status?: unknown;
  saleStatus?: unknown;
  sale_status?: unknown;
  isLimited?: unknown;
  is_limited?: unknown;
  displayQuality?: unknown;
  display_quality?: unknown;
  price?: unknown;
  priceMin?: unknown;
  price_min?: unknown;
  imageUrl?: unknown;
  image_url?: unknown;
  representativeImageUrl?: unknown;
  representative_image_url?: unknown;
  images?: unknown;
  locations?: unknown;
  shop?: unknown;
  shopId?: unknown;
  shop_id?: unknown;
  area?: unknown;
  areaId?: unknown;
  area_id?: unknown;
  reviewStatus?: unknown;
  review_status?: unknown;
  canonicalFood?: unknown;
  canonical_food?: unknown;
  canonicalGroupId?: unknown;
  canonical_group_id?: unknown;
  duplicateGroupId?: unknown;
  duplicate_group_id?: unknown;
  hidden?: unknown;
  compositeMenu?: unknown;
  composite_menu?: unknown;
  sourceUrl?: unknown;
  source_url?: unknown;
  nameQualityScore?: unknown;
  name_quality_score?: unknown;
  confidenceScore?: unknown;
  confidence_score?: unknown;
  category?: unknown;
};

type DuplicateGroup = {
  key: string;
  foods: FoodLike[];
};

type SuspiciousCandidate = {
  score: number;
  reasons: string[];
  left: FoodLike;
  right: FoodLike;
};

const foods = readFoods("scripts/output/foods.generated.json");

main();

function main() {
  const duplicateIds = duplicateGroups(foods, (food) => getString(food.id));
  const duplicateNames = duplicateGroups(foods, (food) => normalizeFoodName(getFoodName(food)));
  const duplicateImages = duplicateGroups(foods, getPrimaryImageUrl);
  const duplicateNamePrice = duplicateGroups(foods, (food) => joinKey([normalizeFoodName(getFoodName(food)), getPriceKey(food)]));
  const duplicateNamePriceArea = duplicateGroups(foods, (food) => joinKey([normalizeFoodName(getFoodName(food)), getPriceKey(food), getAreaKey(food)]));
  const suspicious = findSuspiciousDuplicates(foods);
  const likelyIntentional = findLikelyIntentionalVariations(foods);
  const publicFoods = foods.filter(isVisibleFood);
  const publicArchiveTotal = countCanonicalGroups(publicFoods);
  const publicActiveTotal = countCanonicalGroups(publicFoods.filter(isActiveFood));

  printHeader("Food Duplicate Audit");
  printSummary({
    total: foods.length,
    unique_ids: new Set(foods.map((food) => getString(food.id)).filter(Boolean)).size,
    duplicate_id_groups: duplicateIds.length,
    active: foods.filter(isActiveFood).length,
    ended: foods.filter(isEndedFood).length,
    limited: foods.filter(isLimitedFood).length,
    permanent: foods.filter((food) => !isLimitedFood(food)).length,
    with_image: foods.filter((food) => Boolean(getPrimaryImageUrl(food))).length,
    without_image: foods.filter((food) => !getPrimaryImageUrl(food)).length,
    public_archive_total: publicArchiveTotal,
    public_active_total: publicActiveTotal
  });

  printCountMap("Display Quality Counts", countBy(foods, getDisplayQuality));
  printCountMap("Sale Status Counts", countBy(foods, getSaleStatus));
  printGroups("Duplicate IDs", duplicateIds, 50);
  printGroups("Duplicate Names", duplicateNames, 60);
  printGroups("Duplicate Images", duplicateImages, 60);
  printGroups("Duplicate Name + Price", duplicateNamePrice, 60);
  printGroups("Duplicate Name + Price + Area", duplicateNamePriceArea, 60);
  printCandidates("Suspicious Duplicate Candidates", suspicious, 60);
  printCandidates("Likely Intentional Variations", likelyIntentional, 60);
}

function readFoods(filePath: string): FoodLike[] {
  const raw = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf-8")) as unknown;
  const items = isRecord(raw) && Array.isArray(raw.foods) ? raw.foods : raw;
  if (!Array.isArray(items)) {
    throw new Error(`${filePath} does not contain a food array or { foods: [...] }`);
  }
  return items.filter(isRecord) as FoodLike[];
}

function duplicateGroups(items: FoodLike[], keySelector: (food: FoodLike) => string): DuplicateGroup[] {
  const groups = new Map<string, FoodLike[]>();
  for (const item of items) {
    const key = keySelector(item);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, foods: group }))
    .sort((a, b) => b.foods.length - a.foods.length || a.key.localeCompare(b.key));
}

function findSuspiciousDuplicates(items: FoodLike[]): SuspiciousCandidate[] {
  const candidates = new Map<string, SuspiciousCandidate>();
  for (const group of duplicateGroups(items, getPrimaryImageUrl)) {
    addPairCandidates(candidates, group.foods, true);
  }
  for (const group of duplicateGroups(items, (food) => joinKey([normalizeFoodName(getFoodName(food)), getPriceKey(food), getAreaKey(food)]))) {
    addPairCandidates(candidates, group.foods, false);
  }
  return Array.from(candidates.values())
    .filter((candidate) => candidate.score >= 7)
    .sort((a, b) => b.score - a.score || describeFood(a.left).localeCompare(describeFood(b.left)));
}

function findLikelyIntentionalVariations(items: FoodLike[]): SuspiciousCandidate[] {
  const candidates: SuspiciousCandidate[] = [];
  for (const group of duplicateGroups(items, getPrimaryImageUrl)) {
    forEachPair(group.foods, (left, right) => {
      if (getString(left.id) === getString(right.id)) return;
      const sameName = normalizeFoodName(getFoodName(left)) === normalizeFoodName(getFoodName(right));
      const samePrice = getPriceKey(left) === getPriceKey(right);
      const sameShop = getShopKey(left) === getShopKey(right);
      const bothCanonical = getBoolean(left.canonicalFood ?? left.canonical_food) !== false && getBoolean(right.canonicalFood ?? right.canonical_food) !== false;
      if (!sameName && (!samePrice || !sameShop) && bothCanonical) {
        candidates.push({
          score: 5,
          reasons: ["same_image", "different_name_or_price", "both_canonical"],
          left,
          right
        });
      }
    });
  }
  for (const group of duplicateGroups(items, (food) => normalizeFoodName(getFoodName(food)))) {
    forEachPair(group.foods, (left, right) => {
      if (getString(left.id) === getString(right.id)) return;
      const differentPrice = getPriceKey(left) !== getPriceKey(right);
      const differentShop = getShopKey(left) !== getShopKey(right);
      const differentStatus = getSaleStatus(left) !== getSaleStatus(right);
      if (differentPrice || differentShop || differentStatus) {
        candidates.push({
          score: 4,
          reasons: [
            "same_name",
            ...(differentPrice ? ["different_price"] : []),
            ...(differentShop ? ["different_shop"] : []),
            ...(differentStatus ? ["different_sale_status"] : [])
          ],
          left,
          right
        });
      }
    });
  }
  return dedupeCandidates(candidates).slice(0, 80);
}

function addPairCandidates(target: Map<string, SuspiciousCandidate>, group: FoodLike[], sameImageGroup: boolean) {
  forEachPair(group, (left, right) => {
    if (getString(left.id) === getString(right.id)) return;
    const reasons: string[] = [];
    let score = 0;
    if (sameImageGroup) {
      score += 3;
      reasons.push("same_image");
    }
    const leftName = normalizeFoodName(getFoodName(left));
    const rightName = normalizeFoodName(getFoodName(right));
    if (leftName && leftName === rightName) {
      score += 3;
      reasons.push("same_name");
    } else if (areSimilarNames(leftName, rightName)) {
      score += 2;
      reasons.push("similar_name");
    }
    if (getPriceKey(left) && getPriceKey(left) === getPriceKey(right)) {
      score += 2;
      reasons.push("same_price");
    }
    if (getShopKey(left) && getShopKey(left) === getShopKey(right)) {
      score += 2;
      reasons.push("same_shop");
    }
    if (getAreaKey(left) && getAreaKey(left) === getAreaKey(right)) {
      score += 1;
      reasons.push("same_area");
    }
    if (getBoolean(left.hidden) || getBoolean(right.hidden)) {
      score += 1;
      reasons.push("has_hidden_candidate");
    }
    if (getBoolean(left.canonicalFood ?? left.canonical_food) === false || getBoolean(right.canonicalFood ?? right.canonical_food) === false) {
      score += 1;
      reasons.push("has_non_canonical_candidate");
    }
    const key = [getString(left.id), getString(right.id)].sort().join("::");
    const existing = target.get(key);
    if (!existing || existing.score < score) {
      target.set(key, { score, reasons, left, right });
    }
  });
}

function dedupeCandidates(candidates: SuspiciousCandidate[]) {
  const seen = new Set<string>();
  const result: SuspiciousCandidate[] = [];
  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const key = [getString(candidate.left.id), getString(candidate.right.id)].sort().join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

function forEachPair(items: FoodLike[], callback: (left: FoodLike, right: FoodLike) => void) {
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      if (left && right) callback(left, right);
    }
  }
}

function normalizeFoodName(value: string) {
  return value
    .trim()
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, " ")
    .replace(/[~〜ー－–—・･!！?？（）()「」『』【】\[\],，、。.:：;；/／&＆'"“”‘’]+/g, "")
    .replace(/\s+/g, "");
}

function areSimilarNames(left: string, right: string) {
  if (!left || !right) return false;
  if (left.includes(right) || right.includes(left)) return Math.min(left.length, right.length) >= 8;
  const commonLength = longestCommonSubstringLength(left, right);
  return commonLength >= 8 && commonLength / Math.max(left.length, right.length) >= 0.55;
}

function longestCommonSubstringLength(left: string, right: string) {
  const previous = Array(right.length + 1).fill(0) as number[];
  let max = 0;
  for (let i = 1; i <= left.length; i += 1) {
    let northwest = 0;
    for (let j = 1; j <= right.length; j += 1) {
      const nextNorthwest = previous[j] ?? 0;
      if (left[i - 1] === right[j - 1]) {
        previous[j] = northwest + 1;
        max = Math.max(max, previous[j] ?? 0);
      } else {
        previous[j] = 0;
      }
      northwest = nextNorthwest;
    }
  }
  return max;
}

function getFoodName(food: FoodLike) {
  return getString(food.name);
}

function getSaleStatus(food: FoodLike) {
  return getString(food.saleStatus ?? food.sale_status ?? food.status) || "unknown";
}

function isActiveFood(food: FoodLike) {
  return getSaleStatus(food) === "active";
}

function isEndedFood(food: FoodLike) {
  const status = getSaleStatus(food);
  return status === "ended" || status === "inactive";
}

function isLimitedFood(food: FoodLike) {
  return getBoolean(food.isLimited ?? food.is_limited) === true;
}

function getDisplayQuality(food: FoodLike) {
  return getString(food.displayQuality ?? food.display_quality) || "unknown";
}

function getPriceKey(food: FoodLike) {
  const price = getNumber(food.price ?? food.priceMin ?? food.price_min);
  return typeof price === "number" ? String(price) : "unknown";
}

function getPrimaryImageUrl(food: FoodLike) {
  const imageUrls = getImageUrls(food);
  return imageUrls[0] ?? "";
}

function getImageUrls(food: FoodLike) {
  const urls: string[] = [];
  for (const key of ["imageUrl", "image_url", "representativeImageUrl", "representative_image_url"] as const) {
    const value = getString(food[key]);
    if (value) urls.push(value);
  }
  const images = Array.isArray(food.images) ? (food.images as FoodImageLike[]) : [];
  const sortedImages = [...images].sort((left, right) => (getNumber(left.priority) ?? 999) - (getNumber(right.priority) ?? 999));
  for (const image of sortedImages) {
    if (getBoolean(image.enabled) === false) continue;
    const value = getString(image.imageUrl ?? image.image_url);
    if (value) urls.push(value);
  }
  return Array.from(new Set(urls));
}

function getAreaKey(food: FoodLike) {
  const areaNames = new Set<string>();
  const area = isRecord(food.area) ? food.area : null;
  for (const value of [area?.name, food.areaId, food.area_id]) {
    const text = getString(value);
    if (text) areaNames.add(text);
  }
  for (const location of getLocations(food)) {
    const locArea = isRecord(location.area) ? location.area : null;
    for (const value of [location.areaName, location.area_name, location.areaId, location.area_id, locArea?.name]) {
      const text = getString(value);
      if (text) areaNames.add(text);
    }
  }
  return Array.from(areaNames).sort().join("|") || "unknown";
}

function getShopKey(food: FoodLike) {
  const shopNames = new Set<string>();
  const shop = isRecord(food.shop) ? food.shop : null;
  for (const value of [shop?.name, food.shopId, food.shop_id]) {
    const text = getString(value);
    if (text) shopNames.add(text);
  }
  for (const location of getLocations(food)) {
    const locShop = isRecord(location.shop) ? location.shop : null;
    for (const value of [location.shopName, location.shop_name, location.shopId, location.shop_id, locShop?.name]) {
      const text = getString(value);
      if (text) shopNames.add(text);
    }
  }
  return Array.from(shopNames).sort().join("|") || "unknown";
}

function getLocations(food: FoodLike) {
  return Array.isArray(food.locations) ? (food.locations.filter(isRecord) as FoodLocationLike[]) : [];
}

function getCanonicalKey(food: FoodLike) {
  return getString(food.canonicalGroupId ?? food.canonical_group_id ?? food.duplicateGroupId ?? food.duplicate_group_id ?? food.id);
}

function countCanonicalGroups(items: FoodLike[]) {
  return new Set(items.map(getCanonicalKey).filter(Boolean)).size;
}

function isVisibleFood(food: FoodLike) {
  const shop = isRecord(food.shop) ? food.shop : null;
  const shopName = getString(shop?.name);
  const hasKnownLocation = getLocations(food).some((location) => getString(location.shopName ?? location.shop_name) !== "店舗未確認");
  const hasVerifiedOfficialImage = (Array.isArray(food.images) ? food.images : []).filter(isRecord).some((image) => {
    const sourceType = getString(image.sourceType ?? image.source_type);
    return getBoolean(image.enabled) !== false && sourceType === "official" && getBoolean(image.imageVerified ?? image.image_verified) === true && getBoolean(image.isSharedTooMuch ?? image.is_shared_too_much) !== true;
  });
  return (
    getString(food.reviewStatus ?? food.review_status) === "approved" &&
    getBoolean(food.canonicalFood ?? food.canonical_food) !== false &&
    getBoolean(food.hidden) !== true &&
    getDisplayQuality(food) !== "low" &&
    getString(food.status) !== "inactive" &&
    (getNumber(food.nameQualityScore ?? food.name_quality_score) ?? 0) >= 60 &&
    (getNumber(food.confidenceScore ?? food.confidence_score) ?? 0) >= 45 &&
    getBoolean(food.compositeMenu ?? food.composite_menu) !== true &&
    Boolean(getString(food.sourceUrl ?? food.source_url)) &&
    (shopName !== "店舗未確認" || hasKnownLocation || hasVerifiedOfficialImage || /castel\.jp/i.test(getString(food.sourceUrl ?? food.source_url)))
  );
}

function countBy(items: FoodLike[], keySelector: (food: FoodLike) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keySelector(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function printHeader(title: string) {
  console.log(`\n=== ${title} ===`);
}

function printSummary(summary: Record<string, number>) {
  for (const [key, value] of Object.entries(summary)) {
    console.log(`${key}: ${value}`);
  }
}

function printCountMap(title: string, counts: Map<string, number>) {
  printHeader(title);
  for (const [key, value] of Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`${key}: ${value}`);
  }
}

function printGroups(title: string, groups: DuplicateGroup[], limit: number) {
  printHeader(`${title} (${groups.length} groups)`);
  if (groups.length === 0) {
    console.log("none");
    return;
  }
  groups.slice(0, limit).forEach((group, index) => {
    console.log(`\n${index + 1}. ${group.key} (${group.foods.length})`);
    group.foods.forEach((food) => console.log(`  - ${describeFood(food)}`));
  });
  if (groups.length > limit) console.log(`... ${groups.length - limit} more groups`);
}

function printCandidates(title: string, candidates: SuspiciousCandidate[], limit: number) {
  printHeader(`${title} (${candidates.length} candidates)`);
  if (candidates.length === 0) {
    console.log("none");
    return;
  }
  candidates.slice(0, limit).forEach((candidate, index) => {
    console.log(`\n${index + 1}. score=${candidate.score} reasons=${candidate.reasons.join(",")}`);
    console.log(`  - ${describeFood(candidate.left)}`);
    console.log(`  - ${describeFood(candidate.right)}`);
  });
  if (candidates.length > limit) console.log(`... ${candidates.length - limit} more candidates`);
}

function describeFood(food: FoodLike) {
  return [
    getString(food.id) || "unknown-id",
    getFoodName(food) || "unknown-name",
    `price=${getPriceKey(food)}`,
    `status=${getSaleStatus(food)}`,
    `area=${getAreaKey(food)}`,
    `shop=${getShopKey(food)}`,
    `canonical=${String(getBoolean(food.canonicalFood ?? food.canonical_food))}`,
    `hidden=${String(getBoolean(food.hidden))}`,
    getPrimaryImageUrl(food) ? `image=${shorten(getPrimaryImageUrl(food), 90)}` : "image=none"
  ].join(" | ");
}

function joinKey(parts: string[]) {
  return parts.every(Boolean) ? parts.join(" | ") : "";
}

function shorten(value: string, length: number) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}
