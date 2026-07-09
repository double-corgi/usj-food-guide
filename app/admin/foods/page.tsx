import Link from "next/link";
import { AlertTriangle, ExternalLink, PencilLine, Plus, Search } from "lucide-react";
import { resetGeneratedFoodOverride, setGeneratedFoodVisibility, setManualFoodDeleted, setManualFoodVisibility } from "@/app/admin/foods/actions";
import { AdminFoodImagePreview } from "@/components/admin/admin-food-image-preview";
import { ManualFoodDeleteButton } from "@/components/admin/manual-food-delete-button";
import { ManualFoodVisibilityButton } from "@/components/admin/manual-food-visibility-button";
import { ResetGeneratedFoodButton } from "@/components/admin/reset-generated-food-button";
import { requireAdmin } from "@/lib/admin-auth";
import {
  adminFoodCategoryOptions,
  adminSaleStatusOptions,
  formatAdminCategory,
  formatAdminCollection,
  formatAdminDateTime,
  formatAdminPrice,
  formatAdminPublicState,
  formatAdminReviewStatus,
  formatAdminSaleStatus,
  getAdminFoodInfoIssues,
  getAdminPublicState,
  getAdminSaleState
} from "@/lib/admin-food-ui";
import { listFoodCollections } from "@/lib/repositories/collections";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import { SUMMER_2026_COLLECTION_ID } from "@/lib/seasonal-collections";
import type { ReactNode } from "react";
import type { FoodCollection, FoodWithRelations } from "@/types/domain";
import type { ReviewDecision, ReviewDecisionFile } from "@/app/admin/summer-2026-review/review-types";
import summerReviewDecisionsData from "@/data/imports/unicolle-summer-2026-review-decisions.json";

export const dynamic = "force-dynamic";

type AdminFoodsSearchParams = {
  view?: string;
  q?: string;
  category?: string;
  saleStatus?: string;
  publicState?: string;
  hidden?: string;
  deleted?: string;
  reviewStatus?: string;
  collection?: string;
  issue?: string;
  source?: string;
  saved?: string;
};

const summerReviewDecisions = summerReviewDecisionsData as ReviewDecisionFile;

export default async function AdminFoodsPage({ searchParams }: { searchParams?: Promise<AdminFoodsSearchParams> }) {
  const params = (await searchParams) ?? {};
  const filters = normalizeFilters(params);
  const [admin, foods, collections] = await Promise.all([
    requireAdmin("viewer"),
    listAllFoodCandidates({ includeDeletedManualFoods: true }),
    listFoodCollections()
  ]);
  const filteredFoods = foods.filter((food) => matchesFilters(food, filters));
  const visibleFoods = foods.filter((food) => getPublicState(food) === "published" && !isDeletedFood(food));
  const canManage = admin.role !== "viewer";
  const listTabs = buildListTabs(foods, filters);
  const currentTab = listTabs.find((tab) => tab.value === filters.view) ?? listTabs[0];
  const summerFoods = foods.filter((food) => food.collectionId === SUMMER_2026_COLLECTION_ID && !isDeletedFood(food));
  const summerPendingQueue = summerFoods.filter((food) => food.reviewStatus !== "approved" || getAdminFoodInfoIssues(food).length > 0);
  const summerHoldQueue = summerReviewDecisions.decisions.filter((decision) => decision.decision === "hold");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">商品管理</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品一覧</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            自分で追加した商品は編集・画像変更・非表示にできます。自動取得の商品は元データを残したまま修正できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center rounded-full bg-mint px-4 text-xs font-black text-park">
            {admin.mode === "supabase" ? `${formatAdminRole(admin.role)} / ${admin.email}` : "管理者確認済み"}
          </span>
          {canManage ? (
            <Link href="/admin/foods/new" className="inline-flex h-12 items-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5">
              <Plus size={18} aria-hidden />
              商品を追加
            </Link>
          ) : null}
          <Link href="/admin" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            管理トップ
          </Link>
          <Link href="/foods" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-park hover:border-park">
            公開ページを見る
          </Link>
        </div>
      </div>

      {canManage ? (
        <Link href="/admin/foods/new" className="fixed bottom-4 right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-park px-5 text-sm font-black text-white shadow-soft lg:hidden">
          <Plus size={19} aria-hidden />
          商品を追加
        </Link>
      ) : null}

      {params.saved ? <SaveMessage value={params.saved} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="全候補" value={foods.length} />
        <Metric label="表示対象" value={visibleFoods.length} />
        <Metric label="非表示" value={foods.filter((food) => food.hidden && !isDeletedFood(food)).length} />
        <Metric label="削除済み" value={foods.filter(isDeletedFood).length} />
        <Metric label="絞り込み" value={filteredFoods.length} />
      </div>

      <Summer2026AdminQueue
        pendingFoods={summerPendingQueue}
        holdDecisions={summerHoldQueue}
        collections={collections}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {listTabs.map((tab) => (
            <Link
              key={tab.value}
              href={buildAdminFoodsHref(filters, tab.value)}
              className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                filters.view === tab.value
                  ? "border-park bg-mint text-park shadow-soft"
                  : "border-slate-200 bg-white text-slate-600 hover:border-park"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-black">{tab.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${filters.view === tab.value ? "bg-white text-park" : "bg-slate-100 text-slate-600"}`}>
                  {tab.count.toLocaleString("ja-JP")}件
                </span>
              </span>
              <span className="mt-2 block text-xs font-bold leading-5">{tab.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft" method="get">
        <input type="hidden" name="view" value={filters.view} />
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">検索・フィルタ</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {currentTab.label}: {currentTab.description} 商品名、店舗、状態で絞り込めます。
            </p>
          </div>
          <p className="text-sm font-black text-park">{filteredFoods.length.toLocaleString("ja-JP")}件</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.7fr)_repeat(3,minmax(130px,1fr))_auto] lg:items-end">
          <label className="block">
            <span className="text-xs font-black text-slate-500">検索</span>
            <span className="mt-1 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3">
              <Search size={16} className="text-slate-400" aria-hidden />
              <input name="q" defaultValue={filters.q} placeholder="商品名 / ID / 店舗 / エリア" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none" />
            </span>
          </label>
          <Select label="カテゴリ" name="category" defaultValue={filters.category}>
            <option value="all">すべて</option>
            {adminFoodCategoryOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select label="販売状態" name="saleStatus" defaultValue={filters.saleStatus}>
            <option value="all">すべて</option>
            {adminSaleStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select label="公開状態" name="publicState" defaultValue={filters.publicState}>
            <option value="all">すべて</option>
            <option value="published">公開</option>
            <option value="draft">下書き</option>
          </Select>
          <Select label="レビュー状態" name="reviewStatus" defaultValue={filters.reviewStatus}>
            <option value="all">すべて</option>
            <option value="draft">下書き</option>
            <option value="pending">確認中</option>
            <option value="approved">承認済み</option>
            <option value="rejected">差し戻し</option>
          </Select>
          <Select label="コレクション" name="collection" defaultValue={filters.collection}>
            <option value="all">すべて</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </Select>
          <Select label="情報不足" name="issue" defaultValue={filters.issue}>
            <option value="all">すべて</option>
            <option value="image">画像未確認</option>
            <option value="price">価格未確認</option>
            <option value="shop">店舗未確認</option>
            <option value="area">エリア未確認</option>
            <option value="duplicate">重複候補</option>
            <option value="source-url">公式URL未登録</option>
            <option value="stale">30日以上未確認</option>
          </Select>
          <Select label="登録方式" name="source" defaultValue={filters.source}>
            <option value="all">すべて</option>
            <option value="new">新規商品</option>
            <option value="existing">既存商品へ追記</option>
          </Select>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white">
            絞り込み
          </button>
        </div>
      </form>

      <section className="space-y-3 lg:hidden">
        {filteredFoods.slice(0, 300).map((food) => (
          <FoodCard key={food.id} food={food} canManage={canManage} collections={collections} />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:block">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-xl font-black text-ink">商品カタログ</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">最大300件を表示します。自分で追加した商品もここで確認できます。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">価格</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3">エリア / 店舗</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">季節 / 公開</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFoods.slice(0, 300).map((food) => (
                <tr key={food.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="shrink-0 space-y-1">
                        <AdminFoodImagePreview
                          src={getPrimaryImageUrl(food)}
                          alt={`${food.name}の商品画像`}
                          variant="candidate"
                          placeholderState="no-image"
                        />
                        <p className="text-center text-[11px] font-black text-slate-500">{getPrimaryImageUrl(food) ? "画像あり" : "画像なし"}</p>
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/foods/${food.id}`} className="line-clamp-2 font-black text-ink hover:text-park">
                          {food.name}
                        </Link>
                        <p className="mt-1 text-xs font-bold text-slate-400">{food.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{formatAdminPrice(food)}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{formatAdminCategory(food.category)}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-700">{food.area.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{food.shop.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadges food={food} collections={collections} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1 text-xs font-bold text-slate-600">
                      <p>コレクション: {formatAdminCollection(food, collections)}</p>
                      <p>価格行: {(food.variants ?? []).length}件</p>
                      <p>公開日時: {formatAdminDateTime(food.publishedAt)}</p>
                      <p>最終確認: {formatAdminDateTime(food.lastCheckedAt)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/foods/${food.id}`} className="inline-flex h-9 items-center justify-center rounded-full border border-park/30 bg-white px-3 text-xs font-black text-park hover:border-park">
                        {isManualFood(food) ? "詳細" : "管理画面で確認"}
                      </Link>
                      {canManage && isManualFood(food) && !isDeletedFood(food) ? (
                        <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-mint px-3 text-xs font-black text-park">
                          <PencilLine size={13} aria-hidden />
                          編集
                        </Link>
                      ) : null}
                      {canManage && !isManualFood(food) ? (
                        <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-full bg-slate-100 px-3 text-xs font-black text-slate-600 hover:bg-slate-200">
                          修正する
                        </Link>
                      ) : null}
                      {!canManage && !isManualFood(food) ? <span className="inline-flex h-9 items-center justify-center rounded-full bg-slate-100 px-3 text-xs font-black text-slate-500">自動取得の商品・確認のみ</span> : null}
                      {canManage && isManualFood(food) && !isDeletedFood(food) ? (
                        <ManualFoodVisibilityButton foodId={food.id} hidden={food.hidden} action={setManualFoodVisibility} />
                      ) : null}
                      {canManage && isManualFood(food) ? (
                        <ManualFoodDeleteButton foodId={food.id} deleted={isDeletedFood(food)} action={setManualFoodDeleted} />
                      ) : null}
                      {canManage && !isManualFood(food) ? (
                        <ManualFoodVisibilityButton foodId={food.id} hidden={food.hidden} action={setGeneratedFoodVisibility} />
                      ) : null}
                      {canManage && !isManualFood(food) && hasFoodOverride(food) ? (
                        <ResetGeneratedFoodButton foodId={food.id} action={resetGeneratedFoodOverride} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

type NormalizedFilters = {
  view: "normal" | "hidden" | "deleted" | "all";
  q: string;
  category: string;
  saleStatus: string;
  publicState: string;
  reviewStatus: string;
  collection: string;
  issue: string;
  source: string;
};

function normalizeFilters(params: AdminFoodsSearchParams): NormalizedFilters {
  const legacyView = params.deleted === "deleted" ? "deleted" : params.hidden === "hidden" ? "hidden" : undefined;
  const view = params.view === "hidden" || params.view === "deleted" || params.view === "all" || params.view === "normal"
    ? params.view
    : legacyView ?? "normal";

  return {
    view,
    q: (params.q ?? "").trim(),
    category: params.category ?? "all",
    saleStatus: params.saleStatus ?? "all",
    publicState: params.publicState ?? "all",
    reviewStatus: params.reviewStatus ?? "all",
    collection: params.collection ?? "all",
    issue: params.issue ?? "all",
    source: params.source ?? "all"
  };
}

function matchesFilters(food: FoodWithRelations, filters: NormalizedFilters) {
  const q = filters.q.toLowerCase();
  if (q) {
    const haystack = [food.id, food.name, food.area.name, food.shop.name, food.sourceUrl].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (filters.category !== "all" && food.category !== filters.category) return false;
  if (filters.saleStatus !== "all" && getSaleState(food) !== filters.saleStatus) return false;
  if (filters.publicState !== "all" && getPublicState(food) !== filters.publicState) return false;
  if (filters.reviewStatus !== "all" && food.reviewStatus !== filters.reviewStatus) return false;
  if (filters.collection !== "all" && food.collectionId !== filters.collection) return false;
  if (filters.issue !== "all" && !getAdminFoodInfoIssues(food).some((issue) => issue.id === filters.issue)) return false;
  if (filters.source === "new" && !isManualFood(food)) return false;
  if (filters.source === "existing" && isManualFood(food)) return false;
  if (filters.view === "normal" && (food.hidden || isDeletedFood(food))) return false;
  if (filters.view === "hidden" && (!food.hidden || isDeletedFood(food))) return false;
  if (filters.view === "deleted" && !isDeletedFood(food)) return false;
  return true;
}

function FoodCard({ food, canManage, collections }: { food: FoodWithRelations; canManage: boolean; collections: FoodCollection[] }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
      <div className="flex gap-3">
        <div className="shrink-0 space-y-1">
          <AdminFoodImagePreview
            src={getPrimaryImageUrl(food)}
            alt={`${food.name}の商品画像`}
            variant="candidate"
            placeholderState="no-image"
          />
          <p className="text-center text-[11px] font-black text-slate-500">{getPrimaryImageUrl(food) ? "画像あり" : "画像なし"}</p>
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/admin/foods/${food.id}`} className="line-clamp-2 text-base font-black leading-6 text-ink">
            {food.name}
          </Link>
          <p className="mt-1 text-xs font-bold text-slate-400">{food.id}</p>
          <p className="mt-2 text-sm font-black text-park">{formatAdminPrice(food)}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-sm font-bold text-slate-600">
          {food.area.name} / {food.shop.name}
        </p>
        <p className="text-sm font-bold text-slate-600">{formatAdminCategory(food.category)}</p>
        <StatusBadges food={food} collections={collections} />
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold leading-5 text-slate-600">
          <p>レビュー: {formatAdminReviewStatus(food.reviewStatus)} / コレクション: {formatAdminCollection(food, collections)}</p>
          <p>価格行: {(food.variants ?? []).length}件 / 公開日時: {formatAdminDateTime(food.publishedAt)}</p>
        </div>
        <div className={canManage ? "grid grid-cols-2 gap-2 pt-1" : "grid grid-cols-1 gap-2 pt-1"}>
          <Link href={`/admin/foods/${food.id}`} className="inline-flex h-11 items-center justify-center rounded-full border border-park/30 bg-white px-3 text-center text-sm font-black text-park">
            {isManualFood(food) ? "詳細" : "管理画面で確認"}
          </Link>
          {canManage && !isDeletedFood(food) ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-11 items-center justify-center rounded-full bg-mint text-sm font-black text-park">
              {isManualFood(food) ? "編集" : "修正する"}
            </Link>
          ) : null}
        </div>
        {!isManualFood(food) ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">自動取得の商品です。元データを変えずに基本情報と画像だけ修正できます。</p> : null}
        {canManage && isManualFood(food) && !isDeletedFood(food) ? (
          <div className="pt-1">
            <ManualFoodVisibilityButton foodId={food.id} hidden={food.hidden} action={setManualFoodVisibility} />
          </div>
        ) : null}
        {canManage && isManualFood(food) ? (
          <div className="pt-1">
            <ManualFoodDeleteButton foodId={food.id} deleted={isDeletedFood(food)} action={setManualFoodDeleted} />
          </div>
        ) : null}
        {canManage && !isManualFood(food) ? (
          <div className="pt-1">
            <ManualFoodVisibilityButton foodId={food.id} hidden={food.hidden} action={setGeneratedFoodVisibility} />
          </div>
        ) : null}
        {canManage && !isManualFood(food) && hasFoodOverride(food) ? (
          <div className="pt-1">
            <ResetGeneratedFoodButton foodId={food.id} action={resetGeneratedFoodOverride} />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function Summer2026AdminQueue({
  pendingFoods,
  holdDecisions,
  collections
}: {
  pendingFoods: FoodWithRelations[];
  holdDecisions: ReviewDecision[];
  collections: FoodCollection[];
}) {
  if (pendingFoods.length === 0 && holdDecisions.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200 bg-[#fffaf5] p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.16em] text-[#8a5b16]">
            <AlertTriangle size={15} aria-hidden />
            summer-2026 review queue
          </p>
          <h2 className="mt-1 text-2xl font-black text-ink">2026夏 要確認キュー</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-600">
            pending商品と未登録保留商品だけを集約しています。公開前チェック、画像未登録、価格未確認、重複統合の残り作業をここから確認できます。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickFilterLink href="/admin/foods?collection=summer-2026" label="夏商品すべて" />
          <QuickFilterLink href="/admin/foods?collection=summer-2026&reviewStatus=pending" label="pending" />
          <QuickFilterLink href="/admin/foods?collection=summer-2026&issue=image" label="画像未登録" />
          <QuickFilterLink href="/admin/foods?collection=summer-2026&issue=price" label="価格未確認" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {pendingFoods.map((food) => {
          const issues = getSummerQueueIssues(food);
          return (
            <article key={food.id} className="rounded-xl border border-white bg-white p-3 shadow-sm">
              <div className="flex gap-3">
                <AdminFoodImagePreview src={getPrimaryImageUrl(food)} alt={`${food.name}の商品画像`} variant="candidate" placeholderState="no-image" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/admin/foods/${food.id}`} className="line-clamp-2 font-black leading-6 text-ink hover:text-park">
                        {food.name}
                      </Link>
                      <p className="mt-1 break-all text-xs font-bold text-slate-400">{food.id}</p>
                    </div>
                    <Badge label={formatAdminReviewStatus(food.reviewStatus)} tone={food.reviewStatus === "approved" ? "ok" : "muted"} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {issues.map((issue) => (
                      <Badge key={issue} label={issue} tone="muted" />
                    ))}
                  </div>
                  <div className="mt-2 grid gap-1 text-xs font-bold leading-5 text-slate-600">
                    <p>価格: {formatAdminPrice(food)} / {food.area.name} / {food.shop.name}</p>
                    <p>コレクション: {formatAdminCollection(food, collections)} / 登録方式: {isManualFood(food) ? "新規商品" : "既存商品へ追記"}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-9 items-center justify-center rounded-full bg-park px-3 text-xs font-black text-white">
                      編集画面を開く
                    </Link>
                    <Link href="/admin/summer-2026-review" className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-ink">
                      夏レビュー画面
                    </Link>
                    {food.sourceUrl ? (
                      <a href={food.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-park">
                        出典
                        <ExternalLink size={13} aria-hidden />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {holdDecisions.map((decision) => (
          <article key={decision.proposedId} className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm">
            <div className="flex gap-3">
              <AdminFoodImagePreview src={decision.editedData.imageUrl} alt={`${decision.editedData.name}の商品画像候補`} variant="candidate" placeholderState="no-image" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-black leading-6 text-ink">{decision.editedData.name}</p>
                    <p className="mt-1 break-all text-xs font-bold text-slate-400">{decision.proposedId}</p>
                  </div>
                  <Badge label="未登録保留" tone="muted" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge label="重複統合未確定" tone="muted" />
                  {decision.editedData.price == null ? <Badge label="価格未確認" tone="muted" /> : null}
                  {decision.existingFoodId ? <Badge label={`候補 ${decision.existingFoodId}`} tone="muted" /> : null}
                </div>
                <div className="mt-2 grid gap-1 text-xs font-bold leading-5 text-slate-600">
                  <p>価格: {decision.editedData.price == null ? "未確認" : `¥${decision.editedData.price.toLocaleString("ja-JP")}`} / {decision.editedData.areaName} / {decision.editedData.shopName}</p>
                  <p>統合方針: {decision.editedData.duplicateHandling || "未確定"}</p>
                  <p className="line-clamp-2">メモ: {decision.reviewerNote}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/admin/summer-2026-review" className="inline-flex h-9 items-center justify-center rounded-full bg-ink px-3 text-xs font-black text-white">
                    夏レビュー画面で確認
                  </Link>
                  {decision.editedData.sourceUrl ? (
                    <a href={decision.editedData.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-park">
                      公式情報
                      <ExternalLink size={13} aria-hidden />
                    </a>
                  ) : null}
                  {decision.editedData.imageSourceUrl ? (
                    <a href={decision.editedData.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-park">
                      画像出典
                      <ExternalLink size={13} aria-hidden />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuickFilterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-10 items-center rounded-full border border-amber-200 bg-white px-4 text-xs font-black text-[#8a5b16] hover:border-[#8a5b16]">
      {label}
    </Link>
  );
}

function getSummerQueueIssues(food: FoodWithRelations) {
  const labels = new Set<string>();
  if (food.reviewStatus !== "approved") labels.add("公開前");
  for (const issue of getAdminFoodInfoIssues(food)) labels.add(issue.label);
  if (!getPrimaryImageUrl(food)) labels.add("画像未登録");
  if (!food.collectionId) labels.add("summer-2026未設定");
  if (!food.sourceUrl || food.sourceUrl === "manual-admin") labels.add("情報出典不足");
  return Array.from(labels);
}

function getPrimaryImageUrl(food: FoodWithRelations) {
  return (food.images.find((image) => image.enabled) ?? food.images[0])?.imageUrl ?? food.imageUrl ?? "";
}

function StatusBadges({ food, collections }: { food: FoodWithRelations; collections: FoodCollection[] }) {
  const issues = getAdminFoodInfoIssues(food);
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge label={isManualFood(food) ? "自分で追加した商品" : "自動取得の商品"} tone={isManualFood(food) ? "ok" : "default"} />
      {hasFoodOverride(food) ? <Badge label="修正あり" tone="ok" /> : null}
      {hasOverrideImage(food) ? <Badge label="画像修正あり" tone="ok" /> : null}
      {isDeletedFood(food) ? <Badge label="削除済み" tone="muted" /> : null}
      {!isDeletedFood(food) && food.hidden ? <Badge label="非表示中" tone="muted" /> : null}
      {!isDeletedFood(food) && !food.hidden && getPublicState(food) === "published" ? <Badge label="公開中" tone="ok" /> : null}
      {!isDeletedFood(food) && !food.hidden && getPublicState(food) !== "published" ? <Badge label={formatAdminPublicState(getPublicState(food))} tone="muted" /> : null}
      <Badge label={formatAdminReviewStatus(food.reviewStatus)} tone={food.reviewStatus === "approved" ? "ok" : "muted"} />
      {food.collectionId ? <Badge label={formatAdminCollection(food, collections)} tone="ok" /> : null}
      {(food.variants ?? []).length > 0 ? <Badge label={`価格${(food.variants ?? []).length}件`} tone="ok" /> : null}
      {issues.slice(0, 3).map((issue) => (
        <Badge key={issue.id} label={issue.label} tone="muted" />
      ))}
      <Badge label={formatAdminSaleStatus(getSaleState(food))} />
      <Badge label={formatAdminCategory(food.category)} />
    </div>
  );
}

function buildListTabs(foods: FoodWithRelations[], filters: NormalizedFilters) {
  return [
    {
      value: "normal" as const,
      label: "通常一覧",
      description: "今管理している商品です。",
      count: foods.filter((food) => !food.hidden && !isDeletedFood(food) && matchesFilters(food, { ...filters, view: "all" })).length
    },
    {
      value: "hidden" as const,
      label: "非表示中",
      description: "公開ページには出ていません。あとで再表示できます。",
      count: foods.filter((food) => food.hidden && !isDeletedFood(food) && matchesFilters(food, { ...filters, view: "all" })).length
    },
    {
      value: "deleted" as const,
      label: "削除済み",
      description: "通常一覧から片付けた商品です。あとで復元できます。",
      count: foods.filter((food) => isDeletedFood(food) && matchesFilters(food, { ...filters, view: "all" })).length
    },
    {
      value: "all" as const,
      label: "すべて",
      description: "通常・非表示・削除済みをまとめて確認できます。",
      count: foods.filter((food) => matchesFilters(food, { ...filters, view: "all" })).length
    }
  ];
}

function buildAdminFoodsHref(filters: NormalizedFilters, view: NormalizedFilters["view"]) {
  const params = new URLSearchParams();
  params.set("view", view);
  if (filters.q) params.set("q", filters.q);
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.saleStatus !== "all") params.set("saleStatus", filters.saleStatus);
  if (filters.publicState !== "all") params.set("publicState", filters.publicState);
  if (filters.reviewStatus !== "all") params.set("reviewStatus", filters.reviewStatus);
  if (filters.collection !== "all") params.set("collection", filters.collection);
  if (filters.issue !== "all") params.set("issue", filters.issue);
  if (filters.source !== "all") params.set("source", filters.source);
  return `/admin/foods?${params.toString()}`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
    </div>
  );
}

function Select({ label, name, defaultValue, children }: { label: string; name: string; defaultValue: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-500">{label}</span>
      <select name={name} defaultValue={defaultValue} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-ink">
        {children}
      </select>
    </label>
  );
}

function SaveMessage({ value }: { value: string }) {
  const message =
    value === "created"
      ? "商品を追加しました。"
      : value === "updated"
        ? "商品を保存しました。"
        : value === "hidden"
          ? "商品を公開ページから非表示にしました。管理画面には残っています。"
        : value === "shown"
          ? "商品を公開ページに再表示しました。"
          : value === "deleted"
            ? "商品を削除済みにしました。公開ページと通常の管理一覧から消えました。あとで復元できます。"
            : value === "restored"
              ? "商品を復元しました。"
              : value === "reset"
                ? "元データに戻しました。"
                : null;
  if (!message) return null;
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 shadow-soft">
      <p>{message}</p>
      {(value === "hidden" || value === "shown" || value === "deleted" || value === "restored") ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/admin/foods?hidden=hidden" className="inline-flex h-9 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 text-xs font-black text-emerald-800">
            非表示中の商品を見る
          </Link>
          <Link href="/admin/foods?view=deleted" className="inline-flex h-9 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 text-xs font-black text-emerald-800">
            削除済みの商品を見る
          </Link>
          <Link href="/foods" className="inline-flex h-9 items-center justify-center rounded-full bg-park px-4 text-xs font-black text-white">
            公開ページで確認
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "ok" | "muted" }) {
  const className =
    tone === "ok"
      ? "bg-mint text-park"
      : tone === "muted"
        ? "bg-slate-100 text-slate-500"
        : "bg-blue-50 text-blue-800";
  return <span className={`rounded-full px-2 py-1 text-xs font-black ${className}`}>{label}</span>;
}

function getSaleState(food: FoodWithRelations) {
  return getAdminSaleState(food);
}

function getPublicState(food: FoodWithRelations) {
  return getAdminPublicState(food);
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

function hasOverrideImage(food: FoodWithRelations) {
  return food.images.some((image) => image.id === `${food.id}-override-image-main` && image.enabled);
}

function formatAdminRole(role: string) {
  if (role === "owner") return "管理者";
  if (role === "editor") return "編集できる人";
  if (role === "viewer") return "見るだけ";
  return role;
}
