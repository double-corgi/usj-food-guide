import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, PencilLine } from "lucide-react";
import { FoodImage } from "@/components/food-image";
import { categoryLabels } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminFoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [admin, foods] = await Promise.all([requireAdmin("viewer"), listAllFoodCandidates()]);
  const food = foods.find((candidate) => candidate.id === id);
  if (!food) notFound();

  const canManage = admin.role !== "viewer";
  const activeImage = food.images.find((image) => image.enabled) ?? food.images[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Read-only detail</p>
          <h1 className="mt-1 text-3xl font-black text-ink">{food.name}</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">{food.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-10 items-center gap-2 rounded-full bg-park px-4 text-xs font-black text-white shadow-soft">
              <PencilLine size={15} aria-hidden />
              編集UIを開く
            </Link>
          ) : null}
          <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            一覧へ戻る
          </Link>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="aspect-[4/3] bg-slate-100">
            <FoodImage food={food} className="h-full w-full" variant="cover" eager />
          </div>
          <div className="space-y-2 p-4 text-sm font-bold text-slate-500">
            <p>画像ID: {activeImage?.id ?? "なし"}</p>
            <p>画像source: {activeImage?.sourceType ?? "なし"}</p>
            {activeImage?.sourceUrl ? (
              <a href={activeImage.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-black text-park underline underline-offset-4">
                画像出典
                <ExternalLink size={14} aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-black text-ink">基本情報</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="商品名" value={food.name} />
              <Field label="価格" value={formatPrice(food)} />
              <Field label="カテゴリ" value={categoryLabels[food.category] ?? food.category} />
              <Field label="エリア" value={food.area.name} />
              <Field label="店舗" value={food.shop.name} />
              <Field label="販売状態" value={getSaleState(food)} />
              <Field label="公開状態" value={getPublicState(food)} />
              <Field label="hidden" value={food.hidden ? "true" : "false"} />
              <Field label="reviewStatus" value={food.reviewStatus} />
              <Field label="displayQuality" value={food.displayQuality} />
              <Field label="canonicalFood" value={food.canonicalFood === false ? "false" : "true"} />
              <Field label="duplicateGroupId" value={food.duplicateGroupId ?? "なし"} />
              <Field label="販売期間 start" value={food.saleStartDate ?? food.startDate ?? "未設定"} />
              <Field label="販売期間 end" value={food.saleEndDate ?? food.endDate ?? "未設定"} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-black text-ink">出典</h2>
            <div className="mt-3 space-y-3 text-sm font-bold text-slate-600">
              <SourceLink label="商品情報sourceUrl" url={food.sourceUrl} />
              <SourceLink label="officialUrl" url={food.officialUrl} />
              <SourceLink label="priceSourceUrl" url={food.priceSourceUrl} />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-black text-ink">画像一覧</h2>
            <div className="mt-3 space-y-2">
              {food.images.length > 0 ? (
                food.images.map((image) => (
                  <div key={image.id} className="rounded-lg border border-slate-100 p-3 text-sm font-bold text-slate-600">
                    <p className="text-ink">{image.id}</p>
                    <p>enabled: {image.enabled ? "true" : "false"} / source: {image.sourceType}</p>
                    <p className="break-all text-xs text-slate-500">{image.imageUrl}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm font-bold text-slate-500">画像候補はありません。</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-ink">{value}</p>
    </div>
  );
}

function SourceLink({ label, url }: { label: string; url?: string }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-500">{label}</p>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 break-all font-black text-park underline underline-offset-4">
          {url}
          <ExternalLink size={14} aria-hidden />
        </a>
      ) : (
        <p className="mt-1 text-slate-500">なし</p>
      )}
    </div>
  );
}

function formatPrice(food: FoodWithRelations) {
  if (typeof food.price === "number") return `¥${food.price.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number" && typeof food.priceMax === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜¥${food.priceMax.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜`;
  return "未確認";
}

function getSaleState(food: FoodWithRelations) {
  return food.saleStatus ?? (food.status === "ended" ? "ended" : food.status === "active" ? "active" : "unknown");
}

function getPublicState(food: FoodWithRelations): "published" | "draft" {
  return food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden ? "published" : "draft";
}
