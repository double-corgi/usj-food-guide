"use client";

import { useState } from "react";
import { AdminFoodImagePlaceholder, type AdminFoodImagePlaceholderState } from "@/components/admin/admin-food-image-placeholder";

export type AdminFoodImagePreviewVariant = "card" | "current" | "candidate" | "form" | "thumb" | "zoom";
export type AdminFoodImageFit = "cover" | "contain";

const variantFrameClass: Record<AdminFoodImagePreviewVariant, string> = {
  card: "w-full aspect-[4/3] max-h-[300px] sm:h-[132px] sm:w-[176px] sm:max-h-[132px] sm:aspect-auto",
  current: "h-[105px] w-[140px]",
  candidate: "h-[72px] w-[96px]",
  form: "w-full max-w-[420px] aspect-[4/3] max-h-[315px]",
  thumb: "h-[60px] w-[80px]",
  zoom: "max-h-[min(70vh,540px)] max-w-[min(90vw,720px)]"
};

export function AdminFoodImagePreview({
  src,
  alt,
  variant = "card",
  fit = "cover",
  className,
  imageClassName,
  placeholderState = "unconfirmed",
  eager = false
}: {
  src?: string | null;
  alt: string;
  variant?: AdminFoodImagePreviewVariant;
  fit?: AdminFoodImageFit;
  className?: string;
  imageClassName?: string;
  placeholderState?: AdminFoodImagePlaceholderState;
  eager?: boolean;
}) {
  const normalizedSrc = src?.trim() || "";

  return (
    <div
      className={joinClass(
        "relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100",
        variantFrameClass[variant],
        className
      )}
      data-admin-food-image-preview={variant}
    >
      <AdminFoodImageContent
        key={normalizedSrc || "empty"}
        src={normalizedSrc}
        alt={alt}
        variant={variant}
        fit={fit}
        imageClassName={imageClassName}
        placeholderState={placeholderState}
        eager={eager}
      />
    </div>
  );
}

function AdminFoodImageContent({
  src,
  alt,
  variant,
  fit,
  imageClassName,
  placeholderState,
  eager
}: {
  src: string;
  alt: string;
  variant: AdminFoodImagePreviewVariant;
  fit: AdminFoodImageFit;
  imageClassName?: string;
  placeholderState: AdminFoodImagePlaceholderState;
  eager: boolean;
}) {
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "error">(src ? "loading" : "idle");

  if (!src) return <AdminFoodImagePlaceholder state={placeholderState} className="absolute inset-0" />;

  return (
    <>
      {loadState === "loading" ? <AdminFoodImagePlaceholder state="loading" className="absolute inset-0" /> : null}
      {loadState === "error" ? <AdminFoodImagePlaceholder state="error" className="absolute inset-0" /> : null}

      {/* Admin review uses external source URLs from import research. The fixed wrapper owns sizing; no fallback image is injected. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        referrerPolicy="no-referrer"
        width={variant === "card" ? 176 : undefined}
        height={variant === "card" ? 132 : undefined}
        onLoad={() => setLoadState("loaded")}
        onError={() => setLoadState("error")}
        className={joinClass(
          "absolute inset-0 size-full object-center transition-opacity",
          fit === "contain" ? "object-contain" : "object-cover",
          loadState === "loaded" ? "opacity-100" : "opacity-0",
          imageClassName
        )}
      />
    </>
  );
}

function joinClass(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
