"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategoryPlaceholder, getFoodGalleryImages } from "@/lib/utils/image";
import type { FoodCategory, FoodImage } from "@/types/domain";

export function FoodImageGallery({ images, category, name, variant = "default" }: { images: FoodImage[]; category: FoodCategory; name: string; variant?: "default" | "hero" }) {
  const gallery = useMemo(() => {
    return getFoodGalleryImages({ images, category, name });
  }, [category, images, name]);
  const [index, setIndex] = useState(0);
  const image = gallery[index] ?? gallery[0];
  const fallbackImage = getCategoryPlaceholder(category);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});
  const imageUrl = failedImages[image.id] ? fallbackImage : image.imageUrl;
  const hasRealImage = imageUrl !== fallbackImage;

  const isHero = variant === "hero";

  return (
    <div className={isHero ? "h-full overflow-hidden bg-white" : "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft"}>
      <div className={isHero ? "relative h-full min-h-[360px] bg-slate-100 lg:min-h-[560px]" : "relative aspect-[4/3] bg-slate-100"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={image.altText || name}
          loading={isHero ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={isHero ? "high" : "auto"}
          onError={() => setFailedImages((current) => ({ ...current, [image.id]: true }))}
          className={`h-full w-full ${hasRealImage ? "object-cover" : "p-12 object-contain"}`}
        />
        {gallery.length > 1 ? (
          <>
            <button type="button" onClick={() => setIndex((current) => (current === 0 ? gallery.length - 1 : current - 1))} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-soft">
              <ChevronLeft size={22} aria-hidden />
            </button>
            <button type="button" onClick={() => setIndex((current) => (current + 1) % gallery.length)} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-soft">
              <ChevronRight size={22} aria-hidden />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {gallery.map((item, itemIndex) => (
                <span key={item.id} className={`h-2 w-2 rounded-full ${itemIndex === index ? "bg-white" : "bg-white/45"}`} />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
