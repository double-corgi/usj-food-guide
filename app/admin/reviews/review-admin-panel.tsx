"use client";

import { useMemo } from "react";
import { EyeOff, ShieldAlert } from "lucide-react";
import { useFoodReviews } from "@/lib/use-food-reviews";

type FoodSummary = {
  id: string;
  name: string;
};

export function ReviewAdminPanel({ foods }: { foods: FoodSummary[] }) {
  const { reviews, toggleHidden } = useFoodReviews();
  const foodNameById = useMemo(() => new Map(foods.map((food) => [food.id, food.name])), [foods]);
  const sortedReviews = [...reviews].sort((a, b) => b.reports - a.reports || b.createdAt.localeCompare(a.createdAt));
  const reportedCount = reviews.filter((review) => review.reports > 0).length;
  const hiddenCount = reviews.filter((review) => review.hidden).length;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black text-park">レビュー監査</p>
        <h1 className="mt-1 text-3xl font-black text-ink">レビュー管理</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">
          この端末内のlocalStorageに保存されたレビューの通報数と非表示状態を確認します。ログインやクラウド同期は使いません。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminReviewStat label="レビュー数" value={`${reviews.length}件`} />
        <AdminReviewStat label="通報あり" value={`${reportedCount}件`} />
        <AdminReviewStat label="非表示" value={`${hiddenCount}件`} />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <ShieldAlert size={18} className="text-amber-700" aria-hidden />
          <h2 className="text-lg font-black text-ink">レビュー一覧</h2>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2">商品名</th>
                <th>投稿日時</th>
                <th>評価</th>
                <th>通報数</th>
                <th>ステータス</th>
                <th>コメント</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedReviews.map((review) => {
                const average = Math.round((review.ratings.taste + review.ratings.satisfaction + review.ratings.value + review.ratings.photo + review.ratings.access) / 5);
                return (
                  <tr key={review.id} className="border-t border-slate-100 align-top">
                    <td className="max-w-[240px] py-3 font-black text-ink">{foodNameById.get(review.foodId) ?? review.foodId}</td>
                    <td className="py-3 text-slate-600">{formatDate(review.createdAt)}</td>
                    <td className="py-3 font-black text-amber-500">{"★".repeat(average)}{"☆".repeat(5 - average)}</td>
                    <td className="py-3 font-black text-berry">{review.reports}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${review.hidden ? "bg-slate-800 text-white" : "bg-mint text-park"}`}>
                        {review.hidden ? "非表示" : "表示中"}
                      </span>
                    </td>
                    <td className="max-w-[260px] py-3 text-slate-600">{review.comment || "コメントなし"}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => toggleHidden(review.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3 text-xs font-black text-white"
                      >
                        <EyeOff size={14} aria-hidden />
                        {review.hidden ? "再表示" : "非表示"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {sortedReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    レビューはまだありません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo"
  }).format(date);
}
