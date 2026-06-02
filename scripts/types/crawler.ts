import type { FoodCategory, FoodStatus, ShopType } from "../../types/domain";

export type CrawledImage = {
  imageUrl: string;
  sourceUrl?: string;
  altText?: string;
  title?: string;
  caption?: string;
  imageSourceContext?: string;
  imageMatchReason?: string;
  imageMismatchReason?: string;
  domPath?: string;
  width?: number;
  height?: number;
  priority?: number;
  sourceType?: "official" | "placeholder";
  imageConfidenceScore?: number;
  imageMatchScore?: number;
  categoryImageMatchScore?: number;
  imageVerified?: boolean;
  isSharedTooMuch?: boolean;
};

export type CrawledFood = {
  name: string;
  normalizedName: string;
  shopName: string;
  areaName: string;
  shopType: ShopType;
  category: FoodCategory;
  price?: number;
  description?: string;
  officialUrl?: string;
  sourceUrl: string;
  startDate?: string;
  endDate?: string;
  status: FoodStatus;
  isLimited: boolean;
  images: CrawledImage[];
  confidence: number;
};

export type CrawlSourceResult = {
  sourceName: string;
  sourceUrl: string;
  pagesCrawled: number;
  foods: CrawledFood[];
  errors: string[];
  fetchedUrls?: string[];
};

export type CrawlRunResult = {
  startedAt: string;
  finishedAt: string;
  pagesCrawled: number;
  foodsFound: number;
  uniqueFoods: number;
  addedCount: number;
  updatedCount: number;
  inactiveCount: number;
  errors: string[];
  sources: CrawlSourceResult[];
  requiredSourceCoverage?: Array<{
    url: string;
    fetched: boolean;
    sourceNames: string[];
    extractedFoods: number;
  }>;
};
