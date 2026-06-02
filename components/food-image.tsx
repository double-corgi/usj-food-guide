import { getCategoryPlaceholder, getFoodImage, normalizeImageUrl } from "@/lib/utils/image";
import type { FoodWithRelations } from "@/types/domain";

export function FoodImage({
  food,
  className,
  alt,
  eager = false
}: {
  food: FoodWithRelations;
  className?: string;
  alt?: string;
  eager?: boolean;
}) {
  const fallback = getCategoryPlaceholder(food.category);
  const src = normalizeImageUrl(getFoodImage(food)) ?? fallback;
  const real = src !== fallback;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? food.name}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      referrerPolicy="no-referrer"
      width={640}
      height={480}
      className={`${className ?? ""} bg-slate-100 ${real ? "object-cover" : "object-contain p-6"}`}
    />
  );
}
