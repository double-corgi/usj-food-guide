import Link from "next/link";
import { categoryLabels } from "@/lib/constants";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllFoodCandidates } from "@/lib/repositories/foods";

export const dynamic = "force-dynamic";

export default async function AdminFoodsPage() {
  const [admin, foods] = await Promise.all([requireAdmin("viewer"), listAllFoodCandidates()]);
  const visibleFoods = foods.filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Read-only admin</p>
          <h1 className="mt-1 text-3xl font-black text-ink">商品一覧</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            Phase 1 は読み取り専用です。商品追加、編集、公開、非公開、画像アップロード、削除はできません。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex h-10 items-center rounded-full bg-mint px-4 text-xs font-black text-park">
            {admin.mode === "supabase" ? `${admin.role} / ${admin.email}` : "ADMIN_ACCESS_TOKEN fallback"}
          </span>
          <Link href="/admin" className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink hover:border-park">
            管理トップ
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="全候補" value={foods.length} />
        <Metric label="表示対象" value={visibleFoods.length} />
        <Metric label="hidden" value={foods.filter((food) => food.hidden).length} />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-xl font-black text-ink">読み取り専用カタログ</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">最大300件を表示します。変更操作は配置していません。</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black text-slate-500">
              <tr>
                <th className="px-4 py-3">商品</th>
                <th className="px-4 py-3">価格</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3">エリア / 店舗</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {foods.slice(0, 300).map((food) => (
                <tr key={food.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-black text-ink">{food.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{food.id}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{typeof food.price === "number" ? `¥${food.price.toLocaleString("ja-JP")}` : "未確認"}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{categoryLabels[food.category] ?? food.category}</td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-700">{food.area.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{food.shop.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge label={food.reviewStatus} />
                      <Badge label={food.hidden ? "hidden" : "visible"} tone={food.hidden ? "muted" : "ok"} />
                      <Badge label={food.canonicalFood === false ? "duplicate" : "canonical"} tone={food.canonicalFood === false ? "muted" : "ok"} />
                      <Badge label={food.saleStatus ?? food.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <a href={food.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-black text-park underline underline-offset-4">
                      source
                    </a>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value}</p>
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
