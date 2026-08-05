import type { UserFoodLog } from "@/types/domain";
import { filterDeletedFoodIds, isDeletedFoodId } from "@/lib/deleted-foods";

export const localFoodLogStorageKey = "uniba-food-logs-v1";
export const localFoodReviewStorageKey = "uniba-food-reviews-v1";
export const localRecentFoodsStorageKey = "uniba-recent-foods-v1";
export const localRecentSearchesStorageKey = "uniba-recent-searches-v1";
export const localReviewLastSubmitKey = "uniba-food-review-last-submit-v1";
export const localNextWantFoodsStorageKey = "uniba-next-want-foods-v1";

const reviewRatingKeys = ["taste", "satisfaction", "value", "photo", "access"] as const;
type ReviewRatingKey = (typeof reviewRatingKeys)[number];
type ReviewRatings = Record<ReviewRatingKey, number>;

export type LocalFoodReview = {
  id: string;
  foodId: string;
  ratings: ReviewRatings;
  comment: string;
  createdAt: string;
  reports: number;
  hidden: boolean;
};

export type LocalUserDataBackup = {
  app: "uniba-food-guide";
  version: 1;
  exportedAt: string;
  logs: UserFoodLog[];
  reviews: LocalFoodReview[];
  recentFoodIds?: string[];
  recentSearches?: string[];
  nextWantFoodIds?: string[];
};

export function isLocalFoodLog(value: unknown): value is UserFoodLog {
  if (!value || typeof value !== "object") return false;
  const log = value as UserFoodLog;
  return (
    typeof log.foodId === "string" &&
    log.status === "eaten" &&
    optionalNumber(log.rating) &&
    optionalString(log.memo) &&
    optionalString(log.eatenAt) &&
    optionalNumber(log.eatenCount) &&
    optionalNumber(log.spentAmount) &&
    optionalString(log.userPhotoUrl) &&
    optionalStringArray(log.photoIds) &&
    optionalString(log.shopId) &&
    optionalString(log.updatedAt) &&
    optionalBoolean(log.repeatWant) &&
    optionalBoolean(log.recommended) &&
    optionalString(log.sharedAt)
  );
}

export function isLocalFoodReview(value: unknown): value is LocalFoodReview {
  if (!value || typeof value !== "object") return false;
  const review = value as LocalFoodReview;
  return (
    typeof review.id === "string" &&
    typeof review.foodId === "string" &&
    typeof review.comment === "string" &&
    typeof review.createdAt === "string" &&
    typeof review.reports === "number" &&
    typeof review.hidden === "boolean" &&
    isReviewRatings(review.ratings)
  );
}

export function readLocalFoodLogs(): UserFoodLog[] {
  const rawLogs = readArray(localFoodLogStorageKey);
  const validLogs = rawLogs.filter(isLocalFoodLog);
  const logs = validLogs.filter((log) => !isDeletedFoodId(log.foodId));
  if (typeof window !== "undefined" && rawLogs.length !== logs.length) {
    writeJson(localFoodLogStorageKey, logs);
  }
  return logs;
}

export function writeLocalFoodLogs(logs: UserFoodLog[]) {
  writeJson(localFoodLogStorageKey, logs.filter(isLocalFoodLog).filter((log) => !isDeletedFoodId(log.foodId)));
}

export function readLocalFoodReviews(): LocalFoodReview[] {
  const rawReviews = readArray(localFoodReviewStorageKey);
  const validReviews = rawReviews.filter(isLocalFoodReview);
  const reviews = validReviews.filter((review) => !isDeletedFoodId(review.foodId));
  if (typeof window !== "undefined" && rawReviews.length !== reviews.length) {
    writeJson(localFoodReviewStorageKey, reviews);
  }
  return reviews;
}

export function writeLocalFoodReviews(reviews: LocalFoodReview[]) {
  writeJson(localFoodReviewStorageKey, reviews.filter(isLocalFoodReview).filter((review) => !isDeletedFoodId(review.foodId)));
}

export function exportLocalUserData(): LocalUserDataBackup {
  return {
    app: "uniba-food-guide",
    version: 1,
    exportedAt: new Date().toISOString(),
    logs: readLocalFoodLogs(),
    reviews: readLocalFoodReviews(),
    recentFoodIds: readLocalRecentFoodIds(),
    recentSearches: readArray(localRecentSearchesStorageKey).filter((item): item is string => typeof item === "string"),
    nextWantFoodIds: readLocalNextWantFoodIds()
  };
}

export function parseLocalUserDataBackup(value: unknown): LocalUserDataBackup | null {
  if (!value || typeof value !== "object") return null;
  const backup = value as Partial<LocalUserDataBackup>;
  if (backup.app !== "uniba-food-guide" || backup.version !== 1) return null;
  if (!Array.isArray(backup.logs) || !Array.isArray(backup.reviews)) return null;
  return {
    app: "uniba-food-guide",
    version: 1,
    exportedAt: typeof backup.exportedAt === "string" ? backup.exportedAt : new Date().toISOString(),
    logs: backup.logs.filter(isLocalFoodLog).filter((log) => !isDeletedFoodId(log.foodId)),
    reviews: backup.reviews.filter(isLocalFoodReview).filter((review) => !isDeletedFoodId(review.foodId)),
    recentFoodIds: Array.isArray(backup.recentFoodIds) ? filterDeletedFoodIds(backup.recentFoodIds.filter((item): item is string => typeof item === "string")) : [],
    recentSearches: Array.isArray(backup.recentSearches) ? backup.recentSearches.filter((item): item is string => typeof item === "string") : [],
    nextWantFoodIds: Array.isArray(backup.nextWantFoodIds) ? filterDeletedFoodIds(backup.nextWantFoodIds.filter((item): item is string => typeof item === "string")) : []
  };
}

export function restoreLocalUserData(backup: LocalUserDataBackup) {
  writeLocalFoodLogs(backup.logs);
  writeLocalFoodReviews(backup.reviews);
  writeLocalRecentFoodIds(backup.recentFoodIds ?? []);
  writeJson(localRecentSearchesStorageKey, backup.recentSearches ?? []);
  writeLocalNextWantFoodIds(backup.nextWantFoodIds ?? []);
}

export function clearLocalUserData() {
  if (typeof window === "undefined") return;
  for (const key of [localFoodLogStorageKey, localFoodReviewStorageKey, localRecentFoodsStorageKey, localRecentSearchesStorageKey, localReviewLastSubmitKey, localNextWantFoodsStorageKey]) {
    window.localStorage.removeItem(key);
  }
}

export function readLocalNextWantFoodIds(): string[] {
  const rawIds = readArray(localNextWantFoodsStorageKey);
  const ids = filterDeletedFoodIds(rawIds.filter((item): item is string => typeof item === "string"));
  if (typeof window !== "undefined" && rawIds.length !== ids.length) {
    writeJson(localNextWantFoodsStorageKey, ids);
  }
  return ids;
}

export function writeLocalNextWantFoodIds(foodIds: string[]) {
  writeJson(localNextWantFoodsStorageKey, Array.from(new Set(filterDeletedFoodIds(foodIds.filter((item) => typeof item === "string")))));
}

export function readLocalRecentFoodIds(): string[] {
  const rawIds = readArray(localRecentFoodsStorageKey);
  const ids = filterDeletedFoodIds(rawIds.filter((item): item is string => typeof item === "string"));
  if (typeof window !== "undefined" && rawIds.length !== ids.length) {
    writeJson(localRecentFoodsStorageKey, ids);
  }
  return ids;
}

export function writeLocalRecentFoodIds(foodIds: string[]) {
  writeJson(localRecentFoodsStorageKey, Array.from(new Set(filterDeletedFoodIds(foodIds.filter((item) => typeof item === "string")))));
}

function readArray(key: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isReviewRatings(value: unknown): value is ReviewRatings {
  if (!value || typeof value !== "object") return false;
  const ratings = value as Partial<ReviewRatings>;
  return reviewRatingKeys.every((key) => isValidRating(ratings[key]));
}

function isValidRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

function optionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function optionalNumber(value: unknown) {
  return value === undefined || typeof value === "number";
}

function optionalStringArray(value: unknown) {
  return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function optionalBoolean(value: unknown) {
  return value === undefined || typeof value === "boolean";
}
