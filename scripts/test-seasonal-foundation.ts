import assert from "node:assert/strict";
import { dedupeFoodsByCanonical } from "@/lib/food-utils";
import {
  getDefaultFoodVariant,
  getEffectiveFoodPrice,
  normalizeFoodFoundation,
  syncFoodPriceWithDefaultVariant
} from "@/lib/food-variants";
import { applySeasonalFoodFoundation } from "@/lib/repositories/seasonal-food-foundation";
import {
  initialFoodCollections,
  isFoodInCollection,
  isPublicFoodByReviewAndHidden,
  resolvePublishedAtForReviewStatusChange,
  SUMMER_2026_COLLECTION_ID
} from "@/lib/seasonal-collections";
import type { FoodWithRelations, UserFoodLog } from "@/types/domain";

function food(overrides: Partial<FoodWithRelations> & { id: string; name: string }): FoodWithRelations {
  return normalizeFoodFoundation({
    id: overrides.id,
    shopId: overrides.shopId ?? "shop-test",
    areaId: overrides.areaId ?? "area-test",
    name: overrides.name,
    normalizedName: overrides.normalizedName ?? overrides.name,
    category: overrides.category ?? "dessert",
    price: overrides.price,
    sourceUrl: overrides.sourceUrl ?? "https://example.com/source",
    saleStatus: overrides.saleStatus ?? "active",
    status: overrides.status ?? "active",
    isLimited: overrides.isLimited ?? false,
    confidenceScore: overrides.confidenceScore ?? 100,
    nameQualityScore: overrides.nameQualityScore ?? 100,
    displayQuality: overrides.displayQuality ?? "high",
    extractionSourceCount: overrides.extractionSourceCount ?? 1,
    reviewStatus: overrides.reviewStatus ?? "approved",
    hidden: overrides.hidden ?? false,
    collectionId: overrides.collectionId,
    publishedAt: overrides.publishedAt,
    variants: overrides.variants,
    duplicateGroupId: overrides.duplicateGroupId,
    manualOverride: overrides.manualOverride ?? false,
    compositeMenu: overrides.compositeMenu ?? false,
    canonicalFood: overrides.canonicalFood ?? true,
    canonicalGroupId: overrides.canonicalGroupId,
    lastCheckedAt: overrides.lastCheckedAt ?? "2026-07-06T00:00:00.000Z",
    area: overrides.area ?? {
      id: "area-test",
      name: "テストエリア",
      sortOrder: 1
    },
    shop: overrides.shop ?? {
      id: "shop-test",
      areaId: "area-test",
      name: "テスト店舗",
      type: "restaurant",
      isActive: true
    },
    images: overrides.images ?? [],
    locations: overrides.locations ?? []
  });
}

const legacyFood = food({ id: "food-legacy", name: "既存フード", price: 900 });
assert.equal(legacyFood.collectionId, null, "existing foods without collection should normalize to null collectionId");
assert.equal(legacyFood.publishedAt, null, "existing foods without publishedAt should normalize to null publishedAt");
assert.deepEqual(legacyFood.variants, [], "existing foods without variants should normalize to an empty variants array");
assert.equal(getEffectiveFoodPrice(legacyFood), 900, "foods without variants should keep using foods.price");

const summerFood = food({
  id: "food-summer",
  name: "夏フード",
  price: 700,
  collectionId: SUMMER_2026_COLLECTION_ID
});
assert.equal(initialFoodCollections[0]?.id, SUMMER_2026_COLLECTION_ID, "summer-2026 collection should be defined");
assert.equal(isFoodInCollection(summerFood, SUMMER_2026_COLLECTION_ID), true, "summer collection foods should be identifiable by collectionId");

const [membershipFood] = applySeasonalFoodFoundation([legacyFood], {
  memberships: [{ food_id: "food-legacy", collection_id: SUMMER_2026_COLLECTION_ID, created_at: "2026-07-06T00:00:00.000Z" }],
  publicationMetadata: [{ food_id: "food-legacy", review_status: "approved", published_at: "2026-07-06T10:00:00.000Z", created_at: "2026-07-06T00:00:00.000Z", updated_at: "2026-07-06T10:00:00.000Z" }],
  variants: []
});
assert.equal(membershipFood?.collectionId, SUMMER_2026_COLLECTION_ID, "collection membership should apply to generated or manual foods by foodId");
assert.equal(membershipFood?.publishedAt, "2026-07-06T10:00:00.000Z", "publication metadata should apply by foodId");

const variantFood = food({
  id: "food-variant",
  name: "価格バリエーション",
  price: 1000,
  variants: [
    {
      id: "var-single",
      foodId: "food-variant",
      label: "単品",
      price: 600,
      isDefault: true,
      sortOrder: 1,
      sourceUrl: "https://example.com/variant",
      lastCheckedAt: "2026-07-06T00:00:00.000Z"
    },
    {
      id: "var-cup",
      foodId: "food-variant",
      label: "カップ付き",
      price: 1400,
      isDefault: false,
      sortOrder: 2,
      sourceUrl: "https://example.com/variant",
      lastCheckedAt: "2026-07-06T00:00:00.000Z"
    }
  ]
});
assert.equal(getDefaultFoodVariant(variantFood)?.id, "var-single", "default variant should be selected");
assert.equal(variantFood.price, 600, "normalized foods.price should match default variant price");
assert.equal(getEffectiveFoodPrice(variantFood), 600, "effective price should use the default variant");
assert.equal(syncFoodPriceWithDefaultVariant({ price: 1000, variants: variantFood.variants }).price, 600, "price sync helper should use default variant price");

const [foundationVariantFood] = applySeasonalFoodFoundation([food({ id: "food-foundation-variant", name: "DB価格バリエーション", price: 1000 })], {
  memberships: [],
  publicationMetadata: [],
  variants: [
    {
      id: "var-foundation-default",
      food_id: "food-foundation-variant",
      label: "単品",
      price: 650,
      is_default: true,
      sort_order: 1,
      source_url: "https://example.com/variant",
      last_checked_at: "2026-07-06T00:00:00.000Z",
      created_at: "2026-07-06T00:00:00.000Z",
      updated_at: "2026-07-06T00:00:00.000Z"
    }
  ]
});
assert.equal(foundationVariantFood?.price, 650, "DB default variant should sync the display food price without a DB foods table");

const draftFood = food({ id: "food-draft", name: "下書き", reviewStatus: "draft" });
const approvedFood = food({ id: "food-approved", name: "公開中", reviewStatus: "approved", hidden: false });
assert.equal(isPublicFoodByReviewAndHidden(draftFood), false, "draft foods should not be treated as public");
assert.equal(isPublicFoodByReviewAndHidden(approvedFood), true, "approved visible foods should remain public");

assert.equal(
  resolvePublishedAtForReviewStatusChange({
    previousReviewStatus: "pending",
    nextReviewStatus: "approved",
    currentPublishedAt: null,
    now: "2026-07-06T10:00:00.000Z"
  }),
  "2026-07-06T10:00:00.000Z",
  "first approval should set publishedAt"
);
assert.equal(
  resolvePublishedAtForReviewStatusChange({
    previousReviewStatus: "approved",
    nextReviewStatus: "approved",
    currentPublishedAt: null,
    now: "2026-07-06T10:00:00.000Z"
  }),
  null,
  "existing approved foods should not receive inferred publishedAt"
);

const userLog: UserFoodLog = {
  foodId: "food-legacy",
  status: "eaten"
};
assert.equal(userLog.foodId, "food-legacy", "UserFoodLog should keep the same foodId shape");

const duplicateA = food({ id: "food-canonical-a", name: "重複A", canonicalGroupId: "canonical-test", price: 500 });
const duplicateB = food({ id: "food-canonical-b", name: "重複B", canonicalGroupId: "canonical-test", price: 600 });
assert.equal(dedupeFoodsByCanonical([duplicateA, duplicateB]).length, 1, "canonical dedupe should keep grouping behavior");

console.log("seasonal collection data foundation checks passed");
