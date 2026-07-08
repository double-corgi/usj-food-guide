"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Maximize2, X } from "lucide-react";
import {
  AdminFoodImagePreview,
  type AdminFoodImageFit,
  type AdminFoodImagePreviewVariant
} from "@/components/admin/admin-food-image-preview";
import type { AdminFoodImagePlaceholderState } from "@/components/admin/admin-food-image-placeholder";

type AdminFoodImageViewerProps = {
  src?: string | null;
  alt: string;
  sourceUrl?: string | null;
  label?: string;
  variant?: AdminFoodImagePreviewVariant;
  fit?: AdminFoodImageFit;
  className?: string;
  previewClassName?: string;
  placeholderState?: AdminFoodImagePlaceholderState;
  showSourceLink?: boolean;
  zoomable?: boolean;
  eager?: boolean;
};

export function AdminFoodImageViewer({
  src,
  alt,
  sourceUrl,
  label = "商品画像",
  variant = "form",
  fit = "cover",
  className,
  previewClassName,
  placeholderState = "no-image",
  showSourceLink = true,
  zoomable = false,
  eager = false
}: AdminFoodImageViewerProps) {
  const normalizedSrc = src?.trim() ?? "";
  const normalizedSourceUrl = sourceUrl?.trim() ?? "";
  const validSourceUrl = isHttpUrl(normalizedSourceUrl) ? normalizedSourceUrl : "";
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomFit, setZoomFit] = useState<AdminFoodImageFit>("contain");

  useEffect(() => {
    if (!zoomOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomOpen]);

  const preview = (
    <AdminFoodImagePreview
      src={normalizedSrc}
      alt={alt}
      variant={variant}
      fit={fit}
      placeholderState={placeholderState}
      eager={eager}
      className={previewClassName}
    />
  );

  return (
    <div className={joinClass("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-slate-500">{label}</span>
        <span className={joinClass("inline-flex rounded-full px-2.5 py-1 text-[11px] font-black", normalizedSrc ? "bg-blue-50 text-blue-800" : "bg-slate-100 text-slate-600")}>
          {normalizedSrc ? "画像あり" : "画像なし"}
        </span>
        {zoomable && normalizedSrc ? (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 text-[11px] font-black text-ink hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <Maximize2 size={13} aria-hidden />
            拡大
          </button>
        ) : null}
      </div>

      {zoomable && normalizedSrc ? (
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="block max-w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-200"
          aria-label={`${alt}を拡大表示`}
        >
          {preview}
        </button>
      ) : (
        preview
      )}

      {showSourceLink ? (
        <div className="space-y-1 text-xs font-bold leading-5 text-slate-500">
          <p className="[overflow-wrap:anywhere]">出典URL: {normalizedSourceUrl || "未登録"}</p>
          {validSourceUrl ? (
            <a
              href={validSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 font-black text-blue-800 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              出典ページを開く
              <ExternalLink size={13} aria-hidden />
            </a>
          ) : normalizedSourceUrl ? (
            <p className="font-black text-rose-700">httpまたはhttpsの出典URLではありません。</p>
          ) : null}
        </div>
      ) : null}

      {zoomOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt}の拡大表示`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setZoomOpen(false);
          }}
        >
          <div className="w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-black text-ink">{alt}</p>
                <p className="mt-1 break-all text-xs font-bold text-slate-500">{validSourceUrl || "出典URL未登録"}</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="inline-flex min-h-10 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-ink hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <X size={15} aria-hidden />
                閉じる
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomFit("cover")}
                className={joinClass(
                  "min-h-9 rounded-full px-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-blue-200",
                  zoomFit === "cover" ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink"
                )}
              >
                cover表示
              </button>
              <button
                type="button"
                onClick={() => setZoomFit("contain")}
                className={joinClass(
                  "min-h-9 rounded-full px-3 text-xs font-black focus:outline-none focus:ring-2 focus:ring-blue-200",
                  zoomFit === "contain" ? "bg-ink text-white" : "border border-slate-200 bg-white text-ink"
                )}
              >
                contain表示
              </button>
              {validSourceUrl ? (
                <a href={validSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-blue-800">
                  出典ページ
                  <ExternalLink size={13} aria-hidden />
                </a>
              ) : null}
            </div>
            <div className="mt-4 flex justify-center">
              <AdminFoodImagePreview
                src={normalizedSrc}
                alt={alt}
                variant="detail"
                fit={zoomFit}
                placeholderState={placeholderState}
                eager
                className="max-h-[min(70vh,540px)] max-w-[min(90vw,720px)]"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isHttpUrl(value: string) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function joinClass(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
