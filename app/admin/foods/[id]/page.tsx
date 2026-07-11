import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, PencilLine } from "lucide-react";
import { AdminFoodImagePreview } from "@/components/admin/admin-food-image-preview";
import { AdminFoodImageViewer } from "@/components/admin/admin-food-image-viewer";
import { ManualFoodDeleteButton } from "@/components/admin/manual-food-delete-button";
import { ManualFoodPermanentDeleteForm } from "@/components/admin/manual-food-permanent-delete-form";
import { ManualFoodVisibilityButton } from "@/components/admin/manual-food-visibility-button";
import { ResetGeneratedFoodButton } from "@/components/admin/reset-generated-food-button";
import { permanentlyDeleteManualFood, resetGeneratedFoodOverride, setGeneratedFoodVisibility, setManualFoodDeleted, setManualFoodVisibility } from "@/app/admin/foods/actions";
import { requireAdmin } from "@/lib/admin-auth";
import {
  formatAdminCanonicalState,
  formatAdminCategory,
  formatAdminCollection,
  formatAdminDateTime,
  formatAdminPrice,
  formatAdminPublicState,
  formatAdminReviewStatus,
  formatAdminSaleStatus,
  formatAdminVisibility,
  getAdminPublicState,
  getAdminSaleState
} from "@/lib/admin-food-ui";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AdminFoodDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; image?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = searchParams ? await searchParams : {};
  const [admin, foods, collections] = await Promise.all([requireAdmin("viewer"), listAllFoodCandidates({ includeDeletedManualFoods: true }), listFoodCollections()]);
  const food = foods.find((candidate) => candidate.id === id);
  if (!food) notFound();

  const canManage = admin.role !== "viewer";
  const canPermanentlyDelete = admin.role === "owner";
  const activeImage = food.images.find((image) => image.enabled) ?? food.images[0];
  const adminFields = await getManualAdminFields(food.id);
  const manualFood = adminFields.isManualFood || isManualFood(food);
  const hasOverrideImage = activeImage?.id === `${food.id}-override-image-main`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">商品詳細</p>
          <h1 className="mt-1 text-3xl font-black text-ink">{food.name}</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">{food.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && manualFood && !isDeletedFood(food) ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-12 items-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
              <PencilLine size={15} aria-hidden />
              編集する
            </Link>
          ) : null}
          {canManage && !manualFood ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-12 items-center gap-2 rounded-full bg-slate-100 px-5 text-sm font-black text-slate-700 shadow-soft hover:bg-slate-200">
              <PencilLine size={15} aria-hidden />
              修正する
            </Link>
          ) : null}
          {canManage && !isDeletedFood(food) ? (
            <ManualFoodVisibilityButton foodId={food.id} hidden={food.hidden} action={manualFood ? setManualFoodVisibility : setGeneratedFoodVisibility} />
          ) : null}
          {canManage && manualFood ? (
            <ManualFoodDeleteButton foodId={food.id} deleted={isDeletedFood(food)} action={setManualFoodDeleted} />
          ) : null}
          {canManage && !manualFood && hasFoodOverride(food) ? (
            <ResetGeneratedFoodButton foodId={food.id} action={resetGeneratedFoodOverride} />
          ) : null}
          <Link href="/admin/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            一覧へ戻る
          </Link>
        </div>
      </div>

      <SaveMessage saved={query.saved} image={query.image} error={query.error} foodId={food.id} manualFood={manualFood} />

      <section className={`rounded-lg border p-4 shadow-soft ${manualFood ? "border-park/20 bg-mint" : "border-slate-200 bg-slate-50"}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${manualFood ? "bg-white text-park" : "bg-white text-slate-600"}`}>
              {manualFood ? "自分で追加した商品" : "自動取得の商品"}
            </span>
            {hasFoodOverride(food) ? <span className="ml-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-park">修正あり</span> : null}
            {hasOverrideImage ? <span className="ml-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-park">画像修正あり</span> : null}
            {isDeletedFood(food) ? <span className="ml-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">削除済み</span> : null}
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
              {isDeletedFood(food)
                ? "この商品は削除済みです。復元すると通常の管理一覧と公開対象に戻せます。"
                : manualFood
                  ? "この商品は管理画面から編集・画像差し替え・非表示運用ができます。"
                  : "自動取得の商品です。元データを変えずに基本情報と画像だけ修正できます。"}
            </p>
          </div>
          {canManage && manualFood && !isDeletedFood(food) ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
              <PencilLine size={16} aria-hidden />
              編集する
            </Link>
          ) : null}
          {canManage && !manualFood ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-700 shadow-soft">
              <PencilLine size={16} aria-hidden />
              修正する
            </Link>
          ) : null}
          {canManage && !isDeletedFood(food) ? (
            <ManualFoodVisibilityButton foodId={food.id} hidden={food.hidden} action={manualFood ? setManualFoodVisibility : setGeneratedFoodVisibility} />
          ) : null}
          {canManage && manualFood ? (
            <ManualFoodDeleteButton foodId={food.id} deleted={isDeletedFood(food)} action={setManualFoodDeleted} />
          ) : null}
          {canManage && !manualFood && hasFoodOverride(food) ? (
            <ResetGeneratedFoodButton foodId={food.id} action={resetGeneratedFoodOverride} />
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <AdminFoodImageViewer
            src={activeImage?.imageUrl ?? food.imageUrl}
            alt={`${food.name}の商品画像`}
            sourceUrl={activeImage?.sourceUrl}
            label="現在の画像"
            variant="detail"
            placeholderState="no-image"
            zoomable
            eager
          />
          <div className="space-y-2 p-4 text-sm font-bold text-slate-500">
            <p>画像ID: {activeImage?.id ?? "なし"}</p>
            <p>画像source: {activeImage?.sourceType ?? "なし"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-black text-ink">基本情報</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="商品名" value={food.name} />
              <Field label="価格" value={formatAdminPrice(food)} />
              <Field label="カテゴリ" value={formatAdminCategory(food.category)} />
              <Field label="エリア" value={food.area.name} />
              <Field label="店舗" value={food.shop.name} />
              <Field label="販売状態" value={formatAdminSaleStatus(getSaleState(food))} />
              <Field label="公開状態" value={formatAdminPublicState(getPublicState(food))} />
              <Field label="表示状態" value={formatAdminVisibility(food.hidden)} />
              <Field label="削除状態" value={isDeletedFood(food) ? "削除済み" : "通常"} />
              <Field label="公開確認" value={formatAdminReviewStatus(food.reviewStatus)} />
              <Field label="特集タグ" value={formatAdminCollection(food, collections)} />
              <Field label="初回公開日時" value={formatAdminDateTime(food.publishedAt)} />
              <Field label="最終確認日" value={formatAdminDateTime(food.lastCheckedAt)} />
              <Field label="価格バリエーション" value={`${(food.variants ?? []).length}件`} />
              <Field label="表示品質" value={food.displayQuality} />
              <Field label="重複確認" value={formatAdminCanonicalState(food.canonicalFood)} />
              <Field label="詳細ID" value={food.duplicateGroupId ?? "なし"} />
              <Field label="販売期間 start" value={food.saleStartDate ?? food.startDate ?? "未設定"} />
              <Field label="販売期間 end" value={food.saleEndDate ?? food.endDate ?? "未設定"} />
            </div>
          </section>

          {(food.variants ?? []).length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <h2 className="text-lg font-black text-ink">価格バリエーション</h2>
              <div className="mt-3 space-y-2">
                {(food.variants ?? []).map((variant) => (
                  <div key={variant.id} className="rounded-lg border border-slate-100 p-3 text-sm font-bold text-slate-600">
                    <p className="font-black text-ink">
                      {variant.label} {variant.isDefault ? <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-xs text-park">既定</span> : null}
                    </p>
                    <p className="mt-1">価格: {typeof variant.price === "number" ? `¥${variant.price.toLocaleString("ja-JP")}` : "未確認"} / 並び順: {variant.sortOrder}</p>
                    <p className="mt-1">確認日: {formatAdminDateTime(variant.lastCheckedAt)}</p>
                    {variant.sourceUrl ? <p className="mt-1 break-all text-xs text-slate-500">{variant.sourceUrl}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {adminFields.adminNotes ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
              <h2 className="text-lg font-black text-ink">管理メモ（公開されません）</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-600">{adminFields.adminNotes}</p>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-black text-ink">出典</h2>
            <div className="mt-3 space-y-3 text-sm font-bold text-slate-600">
              <SourceLink label="商品情報sourceUrl" url={food.sourceUrl} />
              <SourceLink label="officialUrl" url={food.officialUrl} />
              <SourceLink label="priceSourceUrl" url={food.priceSourceUrl} />
            </div>
          </section>

          {canPermanentlyDelete && manualFood && isDeletedFood(food) ? (
            <section className="rounded-lg border border-rose-100 bg-white p-4 shadow-soft">
              <h2 className="text-lg font-black text-rose-800">完全削除</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-rose-700">削除済みの手動商品だけ完全削除できます。食べた記録がある可能性のある商品は、通常は非表示または削除済みのまま残してください。</p>
              <div className="mt-3 max-w-xl">
                <ManualFoodPermanentDeleteForm foodId={food.id} foodName={food.name} action={permanentlyDeleteManualFood} />
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <h2 className="text-lg font-black text-ink">画像一覧</h2>
            <div className="mt-3 space-y-2">
              {food.images.length > 0 ? (
                food.images.map((image) => (
                  <div key={image.id} className="flex gap-3 rounded-lg border border-slate-100 p-3 text-sm font-bold text-slate-600">
                    <AdminFoodImagePreview src={image.imageUrl} alt={`${food.name}の登録画像`} variant="thumb" placeholderState="no-image" />
                    <div className="min-w-0 flex-1">
                      <p className="text-ink">{image.id}</p>
                      <p>enabled: {image.enabled ? "true" : "false"} / source: {image.sourceType}</p>
                      <p className="break-all text-xs text-slate-500">{image.imageUrl}</p>
                      {image.sourceUrl ? (
                        <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-blue-800 underline underline-offset-4">
                          出典ページを開く
                          <ExternalLink size={13} aria-hidden />
                        </a>
                      ) : null}
                    </div>
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

function SaveMessage({ saved, image, error, foodId, manualFood }: { saved?: string; image?: string; error?: string; foodId: string; manualFood: boolean }) {
  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">
        操作に失敗しました。もう一度確認してください。（{error}）
      </div>
    );
  }

  const message =
    saved === "created"
      ? "商品を追加しました。"
      : saved === "updated"
        ? "商品を更新しました。"
        : saved === "override"
          ? "自動取得商品の修正内容を保存しました。"
        : saved === "hidden"
          ? "公開ページから非表示にしました。管理画面には残っています。"
        : saved === "shown"
          ? "公開ページに再表示しました。"
          : saved === "deleted"
            ? "削除済みにしました。公開ページと通常の管理一覧から消えました。あとで復元できます。"
            : saved === "restored"
              ? "復元しました。"
              : saved === "reset"
                ? "元データに戻しました。"
                : null;

  if (!message && image !== "updated") return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">
      <p>
        {message}
        {image === "updated" ? <span className="ml-1">画像も更新しました。</span> : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/foods/${foodId}`} className="inline-flex h-10 items-center justify-center rounded-full bg-park px-4 text-xs font-black text-white">
          公開ページで確認
        </Link>
        {saved === "created" ? (
          <Link href="/admin/foods/new" className="inline-flex h-10 items-center justify-center rounded-full border border-park/30 bg-white px-4 text-xs font-black text-park">
            続けて商品を追加
          </Link>
        ) : null}
        <Link href="/admin/foods" className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">
          商品一覧へ戻る
        </Link>
        {manualFood && saved !== "created" ? (
          <Link href={`/admin/foods/${foodId}/edit`} className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">
            もう一度編集
          </Link>
        ) : null}
        {!manualFood && saved === "override" ? (
          <Link href={`/admin/foods/${foodId}/edit`} className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">
            もう一度修正
          </Link>
        ) : null}
        {manualFood && saved === "created" ? (
          <Link href={`/admin/foods/${foodId}/edit`} className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink">
            この商品を編集
          </Link>
        ) : null}
      </div>
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

function getSaleState(food: FoodWithRelations) {
  return getAdminSaleState(food);
}

function getPublicState(food: FoodWithRelations) {
  return getAdminPublicState(food);
}

async function getManualAdminFields(foodId: string) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) return { adminNotes: null as string | null, isManualFood: false };
  const { data, error } = await supabase.from("manual_foods").select("id, admin_notes").eq("id", foodId).maybeSingle();
  if (error) {
    console.error("Failed to load manual food admin notes", {
      foodId,
      message: error.message
    });
  }
  return { adminNotes: data?.admin_notes ?? null, isManualFood: Boolean(data?.id) };
}

function isManualFood(food: FoodWithRelations) {
  return food.manualOverride === true || food.sourceNames?.includes("manual_foods") === true || food.id.startsWith("food-manual-");
}

function isDeletedFood(food: FoodWithRelations) {
  return Boolean(food.deletedAt);
}

function hasFoodOverride(food: FoodWithRelations) {
  return food.sourceNames?.includes("food_overrides") === true;
}
