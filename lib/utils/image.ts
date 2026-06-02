import type { FoodCategory, FoodImage, FoodWithRelations } from "@/types/domain";

const sourceRank = { user: 1, own: 2, official: 3, ai: 4, placeholder: 5 } as const;

const categoryPlaceholderMap: Record<FoodCategory, string> = {
  churro: "churros",
  popcorn: "popcorn",
  drink: "drink",
  dessert: "sweets",
  burger: "burger",
  pizza: "pizza",
  chicken: "chicken",
  rice: "rice",
  noodle: "noodle",
  snack: "snack",
  kids: "kids",
  seasonal: "seasonal",
  set: "set",
  unknown: "unknown"
};

export function getCategoryPlaceholder(category: FoodCategory) {
  return `/placeholders/${categoryPlaceholderMap[category]}.svg`;
}

export function normalizeImageUrl(url?: string | null) {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("https://www.usj.co.jp/web/ja/jp/files/")) {
    return trimmed.replace("https://www.usj.co.jp/web/ja/jp/files/", "https://www.usj.co.jp/tridiondata/usj/ja/jp/files/");
  }
  if (trimmed.startsWith("/usj/ja/jp/files/")) {
    return `https://www.usj.co.jp${trimmed.replace(/^\/usj\/ja\/jp\/files\//, "/tridiondata/usj/ja/jp/files/")}`;
  }
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export function isValidImageUrl(url?: string | null) {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return false;
  if (normalized.startsWith("/placeholders/")) return true;
  if (normalized.startsWith("/")) return /\.(png|jpe?g|webp|gif)($|\?)/i.test(normalized);
  if (!/^https?:\/\//.test(normalized)) return false;
  if (/\.(svg)($|\?)/i.test(normalized)) return false;
  const lower = normalized.toLowerCase();
  if (/(logo|icon|sprite|sns|facebook|twitter|instagram|youtube|loading|placeholder|app-banner|watermark|photo[_-]?by|avatar|author)/i.test(lower)) return false;
  if (/(^|[/_-])map([/_.-]|$)/i.test(lower)) return false;
  return true;
}

export function getFoodImage(food: Pick<FoodWithRelations, "images" | "category"> & { imageUrl?: string | null; image_url?: string | null }) {
  const fromImages = food.images
    .filter((image) => image.enabled)
    .map((image) => ({ ...image, imageUrl: normalizeImageUrl(image.imageUrl) }))
    .filter(
      (image): image is FoodImage =>
        Boolean(image.imageUrl) &&
        isValidImageUrl(image.imageUrl) &&
        !image.isSharedTooMuch &&
        !image.hasWatermark &&
        !image.imageMismatchReason &&
        (image.sourceType !== "official" || image.imageVerified === true) &&
        (image.imageMatchScore ?? 0) >= 70
    )
    .sort((a, b) => {
      const sourceDiff = sourceRank[a.sourceType] - sourceRank[b.sourceType];
      if (sourceDiff !== 0) return sourceDiff;
      return (a.priority ?? 100) - (b.priority ?? 100);
    })[0]?.imageUrl;

  if (fromImages) return fromImages;
  return getCategoryPlaceholder(food.category);
}

export function getFoodGalleryImages(food: Pick<FoodWithRelations, "images" | "category" | "name"> & { imageUrl?: string | null; image_url?: string | null }) {
  const normalizedImages = food.images
    .filter((image) => image.enabled)
    .map((image) => ({ ...image, imageUrl: normalizeImageUrl(image.imageUrl) }))
    .filter(
      (image): image is FoodImage =>
        Boolean(image.imageUrl) &&
        isValidImageUrl(image.imageUrl) &&
        !image.isSharedTooMuch &&
        !image.hasWatermark &&
        !image.imageMismatchReason &&
        (image.sourceType !== "official" || image.imageVerified === true) &&
        (image.imageMatchScore ?? 0) >= 70
    )
    .sort((a, b) => {
      const sourceDiff = sourceRank[a.sourceType] - sourceRank[b.sourceType];
      if (sourceDiff !== 0) return sourceDiff;
      return (a.priority ?? 100) - (b.priority ?? 100);
    });

  if (normalizedImages.length > 0) return normalizedImages;

  const placeholder = getFoodImage(food);
  return [
    {
      id: "placeholder",
      foodId: "",
      imageUrl: placeholder,
      sourceType: "placeholder" as const,
      altText: food.name,
      priority: 999,
      enabled: true
    }
  ];
}
