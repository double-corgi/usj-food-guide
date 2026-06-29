import assert from "node:assert/strict";
import { getAdminRecencyTime, pickRecentAdminFoodsForHome } from "@/lib/home-recent-foods";
import type { FoodWithRelations, ReviewStatus } from "@/types/domain";

function food(overrides: Partial<FoodWithRelations> & { id: string; name: string }): FoodWithRelations {
  return {
    id: overrides.id,
    shopId: "shop-test",
    areaId: "area-test",
    name: overrides.name,
    normalizedName: overrides.normalizedName ?? overrides.name,
    category: overrides.category ?? "dessert",
    price: overrides.price ?? 800,
    priceSource: overrides.priceSource ?? "official",
    sourceUrl: overrides.sourceUrl ?? "manual-admin",
    saleStatus: overrides.saleStatus ?? "active",
    status: overrides.status ?? "active",
    isLimited: overrides.isLimited ?? false,
    confidenceScore: overrides.confidenceScore ?? 100,
    nameQualityScore: overrides.nameQualityScore ?? 100,
    displayQuality: overrides.displayQuality ?? "high",
    extractionSourceCount: overrides.extractionSourceCount ?? 1,
    reviewStatus: overrides.reviewStatus ?? "approved",
    hidden: overrides.hidden ?? false,
    manualOverride: overrides.manualOverride ?? false,
    compositeMenu: overrides.compositeMenu ?? false,
    canonicalFood: overrides.canonicalFood ?? true,
    createdAt: overrides.createdAt,
    updatedAt: overrides.updatedAt,
    deletedAt: overrides.deletedAt,
    lastCheckedAt: overrides.lastCheckedAt ?? "2026-06-01T00:00:00.000Z",
    sourceNames: overrides.sourceNames,
    area: overrides.area ?? {
      id: "area-test",
      name: "ハリウッド・エリア",
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
  };
}

function manualFood(id: string, name: string, overrides: Partial<FoodWithRelations> = {}) {
  return food({
    id,
    name,
    manualOverride: true,
    sourceNames: ["manual_foods"],
    ...overrides
  });
}

function overriddenGeneratedFood(id: string, name: string, updatedAt: string, overrides: Partial<FoodWithRelations> = {}) {
  return food({
    id,
    name,
    manualOverride: false,
    sourceNames: ["crawler", "food_overrides"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt,
    ...overrides
  });
}

const manualA = manualFood("food-manual-a", "手動A", {
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-20T00:00:00.000Z"
});
const manualB = manualFood("food-manual-b", "手動B", {
  createdAt: "2026-06-10T00:00:00.000Z",
  updatedAt: "2026-06-10T00:00:00.000Z"
});
const overrideC = overriddenGeneratedFood("food-generated-c", "修正C", "2026-06-21T00:00:00.000Z");
const eatenManual = manualFood("food-manual-eaten", "食べた済みでも表示", {
  createdAt: "2026-06-19T00:00:00.000Z",
  updatedAt: "2026-06-19T00:00:00.000Z"
});
const unmodifiedGenerated = food({
  id: "food-generated-unmodified",
  name: "未修正自動取得",
  manualOverride: false,
  sourceNames: ["crawler"],
  updatedAt: "2026-12-01T00:00:00.000Z"
});
const hiddenManual = manualFood("food-manual-hidden", "非表示", {
  hidden: true,
  createdAt: "2026-06-22T00:00:00.000Z",
  updatedAt: "2026-06-22T00:00:00.000Z"
});
const deletedManual = manualFood("food-manual-deleted", "削除済み", {
  createdAt: "2026-06-23T00:00:00.000Z",
  updatedAt: "2026-06-23T00:00:00.000Z",
  deletedAt: "2026-06-24T00:00:00.000Z"
});
const unpublishedManual = manualFood("food-manual-pending", "未公開", {
  reviewStatus: "pending" as ReviewStatus,
  createdAt: "2026-06-25T00:00:00.000Z",
  updatedAt: "2026-06-25T00:00:00.000Z"
});
const invalidManual = manualFood("food-manual-invalid", "不正日付", {
  createdAt: "not-a-date",
  updatedAt: undefined
});
const stableBeta = manualFood("food-manual-stable-beta", "同時刻B", {
  createdAt: "2026-06-18T00:00:00.000Z",
  updatedAt: "2026-06-18T00:00:00.000Z"
});
const stableAlpha = manualFood("food-manual-stable-alpha", "同時刻A", {
  createdAt: "2026-06-18T00:00:00.000Z",
  updatedAt: "2026-06-18T00:00:00.000Z"
});

const result = pickRecentAdminFoodsForHome([
  unmodifiedGenerated,
  manualB,
  hiddenManual,
  stableBeta,
  invalidManual,
  overrideC,
  deletedManual,
  eatenManual,
  stableAlpha,
  unpublishedManual,
  manualA
]);

assert.deepEqual(
  result.map((item) => item.id),
  [
    "food-generated-c",
    "food-manual-a",
    "food-manual-eaten",
    "food-manual-stable-alpha",
    "food-manual-stable-beta",
    "food-manual-b"
  ],
  "recent admin foods should be globally sorted by recency and exclude hidden, deleted, unpublished, unmodified, and invalid-date foods"
);

assert.equal(getAdminRecencyTime(manualA), Date.parse("2026-06-20T00:00:00.000Z"), "manual foods use max(createdAt, updatedAt)");
assert.equal(getAdminRecencyTime(overrideC), Date.parse("2026-06-21T00:00:00.000Z"), "generated overrides use override updatedAt");
assert.equal(getAdminRecencyTime(invalidManual), 0, "invalid dates are treated as missing recency");

console.log("recent home food ordering regression checks passed");
