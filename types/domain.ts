export type ShopType = "restaurant" | "cart" | "wagon" | "unknown";
export type FoodStatus = "active" | "scheduled" | "ended" | "inactive" | "unknown";
export type SaleStatus = "active" | "paused" | "ended" | "upcoming" | "unknown";
export type SaleType = "permanent" | "limited" | "event" | "unknown";
export type FoodCategory =
  | "churro"
  | "popcorn"
  | "drink"
  | "dessert"
  | "burger"
  | "pizza"
  | "chicken"
  | "rice"
  | "noodle"
  | "snack"
  | "kids"
  | "seasonal"
  | "set"
  | "unknown";
export type FoodImageSource = "official" | "own" | "user" | "ai" | "placeholder";
export type PriceSource = "official" | "official_app" | "menu_photo" | "trusted_report" | "social_report" | "unknown";
export type UserFoodStatus = "eaten";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type DisplayQuality = "high" | "medium" | "low";
export type DiningType = "takeout" | "eat_in" | "both" | "food_cart" | "unknown";

export type Area = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Shop = {
  id: string;
  areaId: string;
  name: string;
  type: ShopType;
  officialUrl?: string;
  isActive: boolean;
};

export type Food = {
  id: string;
  shopId: string;
  areaId: string;
  name: string;
  normalizedName: string;
  category: FoodCategory;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  priceNote?: string;
  priceSource?: PriceSource;
  priceSourceUrl?: string;
  priceLastCheckedAt?: string;
  priceConfidenceScore?: number;
  diningType?: DiningType;
  diningTypeConfidenceScore?: number;
  diningTypeReason?: string;
  description?: string;
  officialUrl?: string;
  sourceUrl: string;
  imageUrl?: string;
  saleStatus?: SaleStatus;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  remainingDays?: number | null;
  saleType?: SaleType;
  salePeriodLabel?: string;
  isCompletable?: boolean;
  startDate?: string;
  endDate?: string;
  status: FoodStatus;
  isLimited: boolean;
  confidenceScore: number;
  nameQualityScore: number;
  displayQuality: DisplayQuality;
  extractionSourceCount: number;
  reviewStatus: ReviewStatus;
  hidden: boolean;
  duplicateGroupId?: string;
  manualOverride: boolean;
  compositeMenu: boolean;
  canonicalFood?: boolean;
  canonicalGroupId?: string;
  flavor?: string;
  eventName?: string;
  collaborationName?: string;
  releasePeriod?: string;
  seasonalVersion?: string;
  rarity?: "standard" | "limited" | "event" | "rare";
  zukanNumber?: number;
  trustedPlaceholder?: boolean;
  createdAt?: string;
  lastCheckedAt: string;
  sourceNames?: string[];
  rejectionReasons?: string[];
};

export type FoodImage = {
  id: string;
  foodId: string;
  imageUrl: string;
  sourceType: FoodImageSource;
  sourceUrl?: string;
  priority?: number;
  altText?: string;
  alt?: string;
  width?: number;
  height?: number;
  imageConfidenceScore?: number;
  imageMatchScore?: number;
  categoryImageMatchScore?: number;
  imageSourceContext?: string;
  imageMatchReason?: string;
  imageMismatchReason?: string;
  imageVerified?: boolean;
  isSharedTooMuch?: boolean;
  hasWatermark?: boolean;
  watermarkReason?: string;
  imageCandidateScore?: number;
  imageSourceName?: string;
  officialConfirmed?: boolean;
  imageApproved?: boolean;
  manuallyAdded?: boolean;
  imageLastCheckedAt?: string;
  enabled: boolean;
};

export type ImageCandidate = {
  id: string;
  foodId: string;
  foodName: string;
  category: FoodCategory;
  candidateUrl: string;
  thumbnailUrl?: string;
  sourcePage?: string;
  sourceDomain?: string;
  sourceName?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageMatchScore: number;
  hasWatermark: boolean;
  watermarkReason?: string;
  isProductPhoto: boolean;
  isStorefront: boolean;
  isMenuBoard?: boolean;
  isCollage: boolean;
  isCharacterOnly?: boolean;
  isCloseupFood?: boolean;
  productMatchScore?: number;
  isApproved: boolean;
  isRejected: boolean;
  officialConfirmed: boolean;
  reasons: string[];
  query?: string;
  createdAt: string;
  updatedAt: string;
};

export type FoodLocation = {
  id: string;
  foodId: string;
  shopId?: string;
  shopName: string;
  areaId?: string;
  areaName: string;
  shopType: ShopType;
  sourceUrl?: string;
  price?: number;
  status: FoodStatus;
  startDate?: string;
  endDate?: string;
  lastCheckedAt: string;
};

export type UserFoodLog = {
  foodId: string;
  status: UserFoodStatus;
  rating?: number;
  memo?: string;
  eatenAt?: string;
  eatenCount?: number;
  spentAmount?: number;
  userPhotoUrl?: string;
  repeatWant?: boolean;
  recommended?: boolean;
  sharedAt?: string;
};

export type FoodWithRelations = Food & {
  area: Area;
  shop: Shop;
  images: FoodImage[];
  locations?: FoodLocation[];
};

export type CrawlLog = {
  id: string;
  sourceName: string;
  sourceUrl: string;
  status: "success" | "failed";
  message?: string;
  addedCount: number;
  updatedCount: number;
  inactiveCount: number;
  pagesCrawled: number;
  foodsFound: number;
  createdAt: string;
};
