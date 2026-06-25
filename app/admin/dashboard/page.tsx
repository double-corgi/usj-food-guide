import Link from "next/link";
import { Database, Image, Link2, MapPin, Store, Tag, WalletCards } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { getFoodAreaSummary, needsAreaReview } from "@/lib/food-utils";
import { readGeneratedFoods } from "@/lib/repositories/generated-data";
import { getFoodImage } from "@/lib/utils/image";

export default function AdminDashboardPage() {
  const foods = readGeneratedFoods({ includeHidden: true }).filter((food) => food.reviewStatus === "approved" && food.canonicalFood !== false && !food.hidden);
  const metrics = buildMetrics(foods);
  const categoryRows = Array.from(metrics.categoryMap.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-park">Data Quality Dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-ink">管理ダッシュボード</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">価格、店舗、エリア、source、画像の品質を1画面で確認します。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/prices" className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white">価格確認</Link>
          <Link href="/admin/data-quality" className="rounded-full bg-white px-4 py-2 text-sm font-black text-park ring-1 ring-park/20">品質監査</Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Database} label="商品数" value={metrics.total} note="公開対象" />
        <MetricCard icon={Image} label="画像率" value={`${metrics.imageRate}%`} note={`${metrics.imageCount}/${metrics.total}`} />
        <MetricCard icon={WalletCards} label="価格取得率" value={`${metrics.priceRate}%`} note={`未確認 ${metrics.priceMissing}件`} />
        <MetricCard icon={Link2} label="出典URL設定率" value={`${metrics.sourceRate}%`} note={`URL未確認 ${metrics.sourceMissing}件`} />
        <MetricCard icon={Store} label="店舗設定率" value={`${metrics.shopRate}%`} note={`未確認 ${metrics.shopMissing}件`} />
        <MetricCard icon={MapPin} label="エリア設定率" value={`${metrics.areaRate}%`} note={`未確認 ${metrics.areaMissing}件`} />
        <MetricCard icon={Tag} label="カテゴリ設定率" value={`${metrics.categoryRate}%`} note={`確認待ち ${metrics.categoryPending}件`} />
        <MetricCard icon={Database} label="画像未設定" value={metrics.placeholderCount} note="0維持対象" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">カテゴリ別の価格確認率</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs font-black text-slate-400">
              <tr>
                <th className="py-2">カテゴリ</th>
                <th>商品数</th>
                <th>価格確認済</th>
                <th>未確認</th>
                <th>確認率</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.map((row) => (
                <tr key={row.category} className="border-t border-slate-100">
                  <td className="py-3 font-black text-ink">{categoryLabels[row.category] ?? row.category}</td>
                  <td>{row.total}</td>
                  <td>{row.priceKnown}</td>
                  <td>{row.total - row.priceKnown}</td>
                  <td className="font-black text-park">{rate(row.priceKnown, row.total)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-black text-ink">高優先度の未対応</h2>
        <p className="mt-1 text-sm font-bold text-amber-950">出典URLあり、画像あり、価格未確認の商品を優先して確認します。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {metrics.priorityItems.slice(0, 12).map((food) => (
            <Link key={food.id} href={`/admin/prices?status=missing&category=${food.category}`} className="grid grid-cols-[72px_1fr] gap-3 rounded-2xl bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getFoodImage(food)} alt="" className="h-[72px] w-[72px] rounded-xl object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-black text-ink">{food.name}</p>
                <p className="mt-1 truncate text-xs font-bold text-slate-500">{food.shop.name} / {getFoodAreaSummary(food)}</p>
                <p className="mt-1 text-[11px] font-black text-berry">価格未確認</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildMetrics(foods: ReturnType<typeof readGeneratedFoods>) {
  const total = foods.length;
  const imageCount = foods.filter((food) => getFoodImage(food)).length;
  const placeholderCount = foods.filter((food) => getFoodImage(food).includes("/placeholders/")).length;
  const priceKnown = foods.filter(hasPrice).length;
  const sourceCount = foods.filter((food) => Boolean(food.sourceUrl)).length;
  const shopCount = foods.filter((food) => !/未確認|不明|unknown/i.test(food.shop?.name ?? "")).length;
  const areaCount = foods.filter((food) => !needsAreaReview(food)).length;
  const categoryKnown = foods.filter((food) => food.category !== "unknown").length;
  const categoryMap = new Map<string, { category: keyof typeof categoryLabels; total: number; priceKnown: number }>();
  for (const food of foods) {
    const row = categoryMap.get(food.category) ?? { category: food.category, total: 0, priceKnown: 0 };
    row.total += 1;
    if (hasPrice(food)) row.priceKnown += 1;
    categoryMap.set(food.category, row);
  }
  return {
    total,
    imageCount,
    placeholderCount,
    priceKnown,
    priceMissing: total - priceKnown,
    priceRate: rate(priceKnown, total),
    imageRate: rate(imageCount, total),
    sourceRate: rate(sourceCount, total),
    sourceMissing: total - sourceCount,
    shopRate: rate(shopCount, total),
    shopMissing: total - shopCount,
    areaRate: rate(areaCount, total),
    areaMissing: total - areaCount,
    categoryRate: rate(categoryKnown, total),
    categoryPending: total - categoryKnown,
    categoryMap,
    priorityItems: foods.filter((food) => !hasPrice(food) && food.sourceUrl && getFoodImage(food)).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "ja"))
  };
}

function MetricCard({ icon: Icon, label, value, note }: { icon: typeof Database; label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <Icon className="text-park" size={21} aria-hidden />
      <p className="mt-3 text-xs font-black text-slate-500">{label}</p>
      <p className="text-3xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{note}</p>
    </div>
  );
}

function hasPrice(food: ReturnType<typeof readGeneratedFoods>[number]) {
  return Boolean(food.priceMin ?? food.price ?? food.locations?.find((location) => location.price)?.price);
}

function rate(count: number, total: number) {
  return total ? Math.round((count / total) * 1000) / 10 : 0;
}
