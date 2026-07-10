import type { FoodCollection, FoodWithRelations, ReviewStatus } from "@/types/domain";

export const SUMMER_2026_COLLECTION_ID = "summer-2026";
export const LEGACY_ANNIVERSARY_COLLECTION_ID = "anniversary-2026";

export const initialFoodCollections: FoodCollection[] = [
  {
    id: SUMMER_2026_COLLECTION_ID,
    name: "2026 サマーコレクション",
    seasonType: "summer",
    startsOn: null,
    endsOn: null,
    accentColor: "#38b6c9",
    isFeatured: true,
    sortOrder: 100,
    createdAt: "2026-07-06T00:00:00.000Z"
  }
];

export const legacyAnniversaryCollectionTemplate: Omit<FoodCollection, "createdAt"> = {
  id: LEGACY_ANNIVERSARY_COLLECTION_ID,
  name: "25thアニバーサリー",
  seasonType: "anniversary",
  startsOn: null,
  endsOn: null,
  accentColor: "#f7b267",
  isFeatured: false,
  sortOrder: 200
};

export function isFoodInCollection(food: Pick<FoodWithRelations, "collectionId" | "collectionIds">, collectionId: string) {
  return food.collectionId === collectionId || Boolean(food.collectionIds?.includes(collectionId));
}

export function isPublicReviewStatus(reviewStatus: ReviewStatus) {
  return reviewStatus === "approved";
}

export function isPublicFoodByReviewAndHidden(food: Pick<FoodWithRelations, "reviewStatus" | "hidden">) {
  return isPublicReviewStatus(food.reviewStatus) && food.hidden === false;
}

export function resolvePublishedAtForReviewStatusChange(options: {
  previousReviewStatus?: ReviewStatus | null;
  nextReviewStatus: ReviewStatus;
  currentPublishedAt?: string | null;
  now?: string;
}) {
  if (options.currentPublishedAt) return options.currentPublishedAt;
  if (options.nextReviewStatus !== "approved") return null;
  if (options.previousReviewStatus === "approved") return null;
  return options.now ?? new Date().toISOString();
}
