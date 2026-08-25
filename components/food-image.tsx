"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryPlaceholder, getFoodImage, normalizeImageUrl } from "@/lib/utils/image";
import type { FoodWithRelations } from "@/types/domain";

export type FoodImageVariant = "cover" | "contain" | "card";

export function FoodImage({
  food,
  className,
  alt,
  eager = false,
  variant = "card"
}: {
  food: FoodWithRelations;
  className?: string;
  alt?: string;
  eager?: boolean;
  variant?: FoodImageVariant;
}) {
  const fallback = getCategoryPlaceholder(food.category);
  const resolvedSrc = useMemo(() => normalizeImageUrl(getFoodImage(food)) ?? fallback, [fallback, food]);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const src = failedSrc === resolvedSrc ? fallback : resolvedSrc;
  const real = src !== fallback;
  const imageClass = getImageClass(variant, !real);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || src === fallback) return;
    if (image.complete && image.naturalWidth === 0) setFailedSrc(src);
  }, [fallback, src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src}
      alt={alt ?? food.name}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== fallback) setFailedSrc(src);
      }}
      width={640}
      height={480}
      className={`${className ?? ""} ${imageClass}`}
    />
  );
}

function getImageClass(variant: FoodImageVariant, placeholder: boolean) {
  if (variant === "cover") return "bg-slate-100 object-cover object-center";
  if (variant === "contain") return placeholder ? "bg-white object-contain p-4" : "bg-white object-contain";
  return placeholder ? "bg-slate-100 object-contain p-6" : "bg-slate-100 object-cover";
}
