"use client";

import { useMemo, useState } from "react";
import { Flag, MessageSquare, Star } from "lucide-react";
import { isEatenCanonical } from "@/lib/food-utils";
import { type FoodReviewRatings, type ReviewRatingKey, useFoodReviews } from "@/lib/use-food-reviews";
import { useFoodLogs } from "@/lib/use-food-logs";
import type { FoodWithRelations } from "@/types/domain";

const ratingFields: Array<{ key: ReviewRatingKey; label: string }> = [
  { key: "taste", label: "味" },
  { key: "satisfaction", label: "満足度" },
  { key: "value", label: "コスパ" },
  { key: "photo", label: "写真映え" },
  { key: "access", label: "買いやすさ" }
];

export function FoodReviews({ food, allFoods }: { food: FoodWithRelations; allFoods?: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  const eaten = isEatenCanonical(allFoods ?? [food], logs, food);
  const { currentFoodReviews, summary, defaultRatings, addReview, reportReview, error } = useFoodReviews(food.id);
  const [ratings, setRatings] = useState<FoodReviewRatings>(defaultRatings);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const sortedReviews = useMemo(
    () => [...currentFoodReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    [currentFoodReviews]
  );

  return (
    <section className="space-y-4 border-y border-slate-200 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-black text-park">
            <MessageSquare size={16} aria-hidden />
            ユーザー評価
          </p>
          <h2 className="mt-1 text-2xl font-black text-ink">
            総合評価 {summary.count ? `${summary.average.toFixed(1)}` : "未評価"}
          </h2>
          <p className="mt-1 text-sm font-black text-amber-400">{summary.count ? starText(Math.round(summary.average)) : "☆☆☆☆☆"}</p>
        </div>
        <p className="text-xs font-black text-slate-500">レビュー数 {summary.count}件</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-5">
        {ratingFields.map((field) => (
          <div key={field.key} className="border-t border-slate-100 pt-2">
            <p className="text-[11px] font-black text-slate-500">{field.label}</p>
            <p className="mt-1 text-lg font-black text-ink">{summary.count ? summary.ratings[field.key].toFixed(1) : "-"}</p>
            <p className="text-xs font-black text-amber-400">{summary.count ? starText(Math.round(summary.ratings[field.key])) : "☆☆☆☆☆"}</p>
          </div>
        ))}
      </div>

      <details className="border-t border-slate-100 pt-3">
        <summary className="cursor-pointer text-sm font-black text-ink">レビューを書く</summary>
        {!eaten ? (
          <p className="mt-2 text-sm font-bold text-slate-500">レビューを書くには食べた登録が必要です。</p>
        ) : (
          <form
            className="mt-3 space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await addReview(food.id, ratings, comment);
              if (result.ok) {
                setComment("");
                setRatings(defaultRatings);
                setMessage("レビューを保存しました。");
              } else {
                setMessage(result.error ?? "レビューを保存できませんでした。");
              }
            }}
          >
            <div className="grid gap-2 sm:grid-cols-5">
              {ratingFields.map((field) => (
                <RatingInput
                  key={field.key}
                  label={field.label}
                  value={ratings[field.key]}
                  onChange={(value) => setRatings((current) => ({ ...current, [field.key]: value }))}
                />
              ))}
            </div>
            <label className="block">
              <span className="text-xs font-black text-slate-500">コメント</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={240}
                minLength={3}
                required
                rows={3}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-ink outline-none focus:border-park"
                placeholder="味や買いやすさのメモ"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {message || error ? <p className="text-xs font-black text-park">{message ?? error}</p> : <p className="text-xs font-bold text-slate-500">URLや不適切な表現は投稿できません。</p>}
              <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white active:scale-95">
                投稿する
              </button>
            </div>
          </form>
        )}
      </details>

      <div className="space-y-2">
        <h3 className="text-sm font-black text-ink">口コミ</h3>
        {sortedReviews.map((review) => (
          <article key={review.id} className="border-b border-slate-100 pb-3 last:border-b-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-black text-amber-400">{starText(Math.round((review.ratings.taste + review.ratings.satisfaction + review.ratings.value + review.ratings.photo + review.ratings.access) / 5))}</p>
              <button
                type="button"
                onClick={() => reportReview(review.id)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500"
              >
                <Flag size={12} aria-hidden />
                通報
              </button>
            </div>
            {review.comment ? <p className="mt-2 text-sm font-bold leading-6 text-slate-700">{review.comment}</p> : <p className="mt-2 text-sm font-bold text-slate-500">コメントなし</p>}
            <p className="mt-2 text-[11px] font-bold text-slate-400">{formatDate(review.createdAt)}</p>
          </article>
        ))}
        {sortedReviews.length === 0 ? <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">まだレビューはありません。</p> : null}
      </div>
    </section>
  );
}

function RatingInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-2xl bg-white/65 p-2 ring-1 ring-slate-200/55">
      <p className="text-[11px] font-black text-slate-500">{label}</p>
      <div className="mt-1 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((item) => (
          <button key={item} type="button" onClick={() => onChange(item)} className="text-amber-400 active:scale-95" aria-label={`${label} ${item}`}>
            <Star size={18} fill={item <= value ? "currentColor" : "none"} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}

function starText(value: number) {
  const normalized = Math.max(0, Math.min(5, value));
  return "★".repeat(normalized) + "☆".repeat(5 - normalized);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }).format(date);
}
