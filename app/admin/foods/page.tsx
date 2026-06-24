import Link from "next/link";
import { PencilLine, Plus, Search } from "lucide-react";
import { FoodImage } from "@/components/food-image";
import { requireAdmin } from "@/lib/admin-auth";
import {
  adminFoodCategoryOptions,
  adminSaleStatusOptions,
  formatAdminCanonicalState,
  formatAdminCategory,
  formatAdminPrice,
  formatAdminPublicState,
  formatAdminReviewStatus,
  formatAdminSaleStatus,
  formatAdminVisibility,
  getAdminPublicState,
  getAdminSaleState
} from "@/lib/admin-food-ui";
import { listAllFoodCandidates } from "@/lib/repositories/foods";
import type { ReactNode } from "react";
import type { FoodWithRelations } from "@/types/domain";

export const dynamic = "force-dynamic";

type AdminFoodsSearchParams = {
  q?: string;
  category?: string;
  saleStatus?: string;
  publicState?: string;
  hidden?: string;
  saved?: string;
};

export default async function AdminFoodsPage({ searchParams }: { searchParams?: Promise<AdminFoodsSearchParams> }) {
  const params = (await searchParams) ?? {};
  const [admin, foods] = await Promise.all([requireAdmin("viewer"), listAllFoodCandidates()]);
  const filters = normalizeFilters(params);
  const filteredFoods = foods.filter((food) => matchesFilters(food, filters));
  const visibleFoods = foods.filter((food) => getPublicState(food) === "published");
  const canManage = admin.role !== "viewer";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Generated + manual foods</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品一覧</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            generated JSONを正本として維持し、新規追加分だけSupabaseのmanual_foodsから結合表示します。Phase 3Aでは既存generated商品の編集保存はまだ行いません。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center rounded-full bg-mint px-4 text-xs font-black text-park">
            {admin.mode === "supabase" ? `${admin.role} / ${admin.email}` : "ADMIN_ACCESS_TOKEN fallback"}
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

      <div className="grid gap-4 sm:grid-cols-4">
        <Metric label="全候補" value={foods.length} />
        <Metric label="表示対象" value={visibleFoods.length} />
        <Metric label="hidden" value={foods.filter((food) => food.hidden).length} />
        <Metric label="絞り込み" value={filteredFoods.length} />
      </div>

      <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft" method="get">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">検索・フィルタ</h2>
            <p className="mt-1 text-xs font-bold text-slate-500">商品名、店舗、状態で絞り込めます。</p>
          </div>
          <p className="text-sm font-black text-park">{filteredFoods.length.toLocaleString("ja-JP")}件</p>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.7fr)_repeat(4,minmax(130px,1fr))_auto] lg:items-end">
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
          <Select label="表示" name="hidden" defaultValue={filters.hidden}>
            <option value="all">すべて</option>
            <option value="visible">表示中</option>
            <option value="hidden">非表示</option>
          </Select>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white">
            絞り込み
          </button>
        </div>
      </form>

      <section className="space-y-3 lg:hidden">
        {filteredFoods.slice(0, 300).map((food) => (
          <FoodCard key={food.id} food={food} canManage={canManage} />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:block">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-xl font-black text-ink">読み取り専用カタログ</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">最大300件を表示します。新規追加商品はmanual_foodsから結合されます。</p>
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
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFoods.slice(0, 300).map((food) => (
                <tr key={food.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        <FoodImage food={food} className="h-full w-full" />
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
                    <StatusBadges food={food} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/foods/${food.id}`} className="inline-flex h-9 items-center justify-center rounded-full border border-park/30 bg-white px-3 text-xs font-black text-park hover:border-park">
                      詳細
                      </Link>
                      {canManage ? (
                        <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-9 items-center justify-center gap-1 rounded-full bg-mint px-3 text-xs font-black text-park">
                          <PencilLine size={13} aria-hidden />
                          編集
                        </Link>
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
  q: string;
  category: string;
  saleStatus: string;
  publicState: string;
  hidden: string;
};

function normalizeFilters(params: AdminFoodsSearchParams): NormalizedFilters {
  return {
    q: (params.q ?? "").trim(),
    category: params.category ?? "all",
    saleStatus: params.saleStatus ?? "all",
    publicState: params.publicState ?? "all",
    hidden: params.hidden ?? "all"
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
  if (filters.hidden === "visible" && food.hidden) return false;
  if (filters.hidden === "hidden" && !food.hidden) return false;
  return true;
}

function FoodCard({ food, canManage }: { food: FoodWithRelations; canManage: boolean }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-soft">
      <div className="flex gap-3">
        <div className="h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <FoodImage food={food} className="h-full w-full" />
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
        <StatusBadges food={food} />
        <div className={canManage ? "grid grid-cols-2 gap-2 pt-1" : "grid grid-cols-1 gap-2 pt-1"}>
          <Link href={`/admin/foods/${food.id}`} className="inline-flex h-11 items-center justify-center rounded-full border border-park/30 bg-white text-sm font-black text-park">
            詳細
          </Link>
          {canManage ? (
            <Link href={`/admin/foods/${food.id}/edit`} className="inline-flex h-11 items-center justify-center rounded-full bg-mint text-sm font-black text-park">
              編集
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatusBadges({ food }: { food: FoodWithRelations }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge label={formatAdminPublicState(getPublicState(food))} tone={getPublicState(food) === "published" ? "ok" : "muted"} />
      <Badge label={formatAdminVisibility(food.hidden)} tone={food.hidden ? "muted" : "ok"} />
      <Badge label={formatAdminCanonicalState(food.canonicalFood)} tone={food.canonicalFood === false ? "muted" : "ok"} />
      <Badge label={formatAdminSaleStatus(getSaleState(food))} />
      <Badge label={formatAdminReviewStatus(food.reviewStatus)} tone={food.reviewStatus === "approved" ? "ok" : "muted"} />
      <Badge label={formatAdminCategory(food.category)} />
    </div>
  );
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
  const message = value === "created" ? "商品を追加しました。" : value === "updated" ? "商品を保存しました。" : null;
  if (!message) return null;
  return <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 shadow-soft">{message}</div>;
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
