"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, ImageOff, Search, X, ZoomIn } from "lucide-react";
import { AdminFoodImagePreview } from "@/components/admin/admin-food-image-preview";
import type { ImageReviewValue, ReviewImageCandidate } from "@/app/admin/summer-2026-review/review-types";

type ImagePickerChange = Partial<{
  imageUrl: string;
  imageSourceUrl: string;
  imageCandidates: ReviewImageCandidate[];
  imageReviewStatus: ImageReviewValue;
  imageReviewNote: string;
  imageCheckedAt: string | null;
}>;

type ZoomImage = {
  url: string;
  sourceUrl: string;
  title: string;
};

const statusLabels: Record<ImageReviewValue, string> = {
  confirmed: "画像確認済み",
  incorrect: "画像が違う",
  unresolved: "画像未確認",
  "no-image": "画像なし",
  "candidate-only": "候補あり・未採用"
};

const sourceTypeLabels: Record<string, string> = {
  "official-usj": "USJ公式",
  "official-press": "公式ニュース",
  "official-restaurant": "公式レストラン",
  "official-event": "公式イベント",
  secondary: "補助情報",
  unknown: "出典種別未確認"
};

export function AdminFoodImagePicker({
  productName,
  imageUrl,
  imageSourceUrl,
  imageCandidates,
  imageReviewStatus,
  imageReviewNote,
  imageCheckedAt,
  onChange
}: {
  productName: string;
  imageUrl: string;
  imageSourceUrl: string;
  imageCandidates: ReviewImageCandidate[];
  imageReviewStatus: ImageReviewValue;
  imageReviewNote: string;
  imageCheckedAt: string | null;
  onChange: (changes: ImagePickerChange) => void;
}) {
  const candidates = useMemo(() => dedupeCandidates(imageCandidates), [imageCandidates]);
  const [manualUrl, setManualUrl] = useState("");
  const [manualSourceUrl, setManualSourceUrl] = useState("");
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);
  const [zoomFit, setZoomFit] = useState<"cover" | "contain">("contain");

  useEffect(() => {
    if (!zoomImage) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setZoomImage(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomImage]);

  const now = () => new Date().toISOString();

  function adoptImage(url: string, sourceUrl: string) {
    onChange({
      imageUrl: url,
      imageSourceUrl: sourceUrl,
      imageReviewStatus: "confirmed",
      imageCheckedAt: now()
    });
  }

  function addManualCandidate(adopt: boolean) {
    const url = manualUrl.trim();
    const sourceUrl = manualSourceUrl.trim();
    if (!isHttpUrl(url) || (sourceUrl && !isHttpUrl(sourceUrl))) return;

    const nextCandidate: ReviewImageCandidate = {
      url,
      sourceUrl: sourceUrl || null,
      sourceType: inferSourceType(sourceUrl || url),
      title: `${productName} 手動追加候補`,
      note: imageReviewNote || "管理レビュー画面で手動追加",
      discoveredAt: now(),
      status: adopt ? "adopted" : "candidate"
    };
    const nextCandidates = dedupeCandidates([...candidates, nextCandidate]);
    onChange({
      imageCandidates: nextCandidates,
      imageReviewStatus: adopt ? "confirmed" : "candidate-only",
      ...(adopt
        ? {
            imageUrl: url,
            imageSourceUrl: sourceUrl,
            imageCheckedAt: now()
          }
        : {})
    });
  }

  return (
    <section className="rounded-2xl border border-park/20 bg-mint p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-black text-ink">画像レビュー</h3>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-600">
            候補クリックは拡大確認のみです。正式採用は「この画像を採用」で行います。
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass(imageReviewStatus)}`}>
          {statusLabels[imageReviewStatus]} / 候補{candidates.length}件
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[180px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-black text-slate-600">現在採用中の画像</p>
          <div className="mt-3">
            <AdminFoodImagePreview
              src={imageUrl}
              alt={productName}
              variant="current"
              placeholderState={imageReviewStatus === "no-image" ? "no-image" : "unconfirmed"}
            />
          </div>
          <div className="mt-3 space-y-2 text-xs font-bold leading-5 text-slate-700">
            <p className="[overflow-wrap:anywhere]">画像URL: {imageUrl || "未登録"}</p>
            <p className="[overflow-wrap:anywhere]">出典: {imageSourceUrl || "未登録"}</p>
            <p>確認日時: {imageCheckedAt ? formatDateTime(imageCheckedAt) : "未確認"}</p>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black text-slate-600">候補画像</p>
            {candidates.length === 0 ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">候補なし</span> : null}
          </div>
          {candidates.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-3">
              {candidates.map((candidate) => {
                const url = candidate.url?.trim() ?? "";
                const sourceUrl = candidate.sourceUrl?.trim() ?? "";
                const title = candidate.title?.trim() || productName;
                return (
                  <article key={normalizeUrlKey(url)} className="w-[160px] rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setZoomFit("contain");
                        setZoomImage({ url, sourceUrl, title });
                      }}
                      className="block rounded-xl outline-none focus:ring-2 focus:ring-park/40"
                      aria-label={`${title}の候補画像を拡大表示`}
                    >
                      <AdminFoodImagePreview src={url} alt={title} variant="candidate" placeholderState="unconfirmed" />
                    </button>
                    <p className="mt-2 text-[11px] font-black leading-4 text-ink [overflow-wrap:anywhere]">{title}</p>
                    <p className="mt-1 text-[11px] font-bold leading-4 text-slate-600">{sourceTypeLabels[candidate.sourceType ?? "unknown"] ?? candidate.sourceType ?? "出典種別未確認"}</p>
                    {candidate.note ? <p className="mt-1 text-[11px] font-bold leading-4 text-slate-500 [overflow-wrap:anywhere]">{candidate.note}</p> : null}
                    <div className="mt-2 grid gap-2">
                      {sourceUrl ? (
                        <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2 text-[11px] font-black text-park">
                          <ExternalLink size={12} aria-hidden />
                          出典
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => adoptImage(url, sourceUrl)}
                        className="inline-flex min-h-8 items-center justify-center gap-1 rounded-full bg-park px-2 text-[11px] font-black text-white"
                      >
                        <CheckCircle2 size={12} aria-hidden />
                        この画像を採用
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-bold text-slate-600">
              <ImageOff className="mx-auto" size={24} aria-hidden />
              <p className="mt-2">候補画像はまだありません。</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <button type="button" onClick={() => onChange({ imageReviewStatus: "incorrect", imageCheckedAt: now() })} className="min-h-10 rounded-full border border-berry bg-white px-3 text-xs font-black text-berry">
          画像が違う
        </button>
        <button type="button" onClick={() => onChange({ imageReviewStatus: "candidate-only" })} className="min-h-10 rounded-full border border-amber-300 bg-white px-3 text-xs font-black text-amber-900">
          候補として保留
        </button>
        <button type="button" onClick={() => onChange({ imageReviewStatus: "no-image", imageCheckedAt: now() })} className="min-h-10 rounded-full border border-slate-300 bg-white px-3 text-xs font-black text-slate-700">
          画像なしにする
        </button>
        <button type="button" onClick={() => onChange({ imageReviewStatus: "unresolved" })} className="min-h-10 rounded-full border border-slate-300 bg-white px-3 text-xs font-black text-slate-700">
          未解決に戻す
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-black text-slate-600">URLを手動入力</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black text-slate-600">画像URL</span>
            <input value={manualUrl} onChange={(event) => setManualUrl(event.currentTarget.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-2 focus:ring-park/10" />
          </label>
          <label className="block">
            <span className="text-xs font-black text-slate-600">出典URL</span>
            <input value={manualSourceUrl} onChange={(event) => setManualSourceUrl(event.currentTarget.value)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink outline-none focus:border-park focus:ring-2 focus:ring-park/10" />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-black text-slate-600">確認メモ</span>
          <textarea
            value={imageReviewNote}
            onChange={(event) => onChange({ imageReviewNote: event.currentTarget.value })}
            rows={3}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold leading-6 text-ink outline-none focus:border-park focus:ring-2 focus:ring-park/10"
          />
        </label>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => addManualCandidate(false)}
            disabled={!isHttpUrl(manualUrl.trim())}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink disabled:cursor-not-allowed disabled:text-slate-400"
          >
            <Search size={14} aria-hidden />
            候補に追加
          </button>
          <button
            type="button"
            onClick={() => addManualCandidate(true)}
            disabled={!isHttpUrl(manualUrl.trim())}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CheckCircle2 size={14} aria-hidden />
            手動URLを採用
          </button>
        </div>
      </div>

      {zoomImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="候補画像の拡大表示"
          className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setZoomImage(null);
          }}
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-ink [overflow-wrap:anywhere]">{zoomImage.title}</p>
                {zoomImage.sourceUrl ? (
                  <a href={zoomImage.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-park underline underline-offset-4">
                    <ExternalLink size={13} aria-hidden />
                    出典ページを開く
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setZoomFit((value) => (value === "cover" ? "contain" : "cover"))} className="min-h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">
                  {zoomFit === "cover" ? "containで確認" : "coverで確認"}
                </button>
                <button type="button" onClick={() => adoptImage(zoomImage.url, zoomImage.sourceUrl)} className="min-h-10 rounded-full bg-park px-4 text-xs font-black text-white">
                  この画像を採用
                </button>
                <button type="button" onClick={() => setZoomImage(null)} className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink" aria-label="拡大表示を閉じる">
                  <X size={16} aria-hidden />
                </button>
              </div>
            </div>
            <div className="mt-4 grid place-items-center rounded-2xl bg-slate-100 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomImage.url}
                alt={zoomImage.title}
                className={`max-h-[min(70vh,540px)] max-w-full rounded-xl ${zoomFit === "cover" ? "h-[min(70vh,540px)] w-full object-cover" : "object-contain"}`}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function dedupeCandidates(candidates: ReviewImageCandidate[]) {
  const seen = new Set<string>();
  const result: ReviewImageCandidate[] = [];
  for (const candidate of candidates) {
    const url = candidate.url?.trim();
    if (!url || !isHttpUrl(url)) continue;
    const key = normalizeUrlKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...candidate, url });
  }
  return result;
}

function normalizeUrlKey(url: string) {
  try {
    const parsed = new URL(url);
    parsed.search = "";
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.split("?")[0].toLowerCase();
  }
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function inferSourceType(url: string) {
  if (/usj\.co\.jp\/contentdata\/usj\/ja\/jp\/restaurants\//.test(url)) return "official-restaurant";
  if (/usj\.co\.jp\/web\/ja\/jp\/restaurants\/seasonal-food|usj\.co\.jp\/web\/ja\/jp\/events\//.test(url)) return "official-event";
  if (/usj\.co\.jp/.test(url)) return "official-usj";
  return "unknown";
}

function statusClass(status: ImageReviewValue) {
  if (status === "confirmed") return "bg-mint text-park";
  if (status === "incorrect") return "bg-berry text-white";
  if (status === "no-image") return "bg-slate-700 text-white";
  if (status === "candidate-only") return "bg-sun/25 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
