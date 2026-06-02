import { AlertTriangle, Database, Image, ListChecks, Store } from "lucide-react";
import Link from "next/link";
import { categoryLabels } from "@/lib/constants";
import { getAdminOverview } from "@/lib/repositories/admin";
import type { FoodCategory } from "@/types/domain";

export default async function AdminPage() {
  const overview = await getAdminOverview();
  const items = [
    { label: "メニュー", count: overview.counts.foods, icon: ListChecks },
    { label: "Approved", count: overview.counts.approved, icon: ListChecks },
    { label: "Canonical", count: overview.counts.canonicalFoods, icon: ListChecks },
    { label: "Pending", count: overview.counts.pending, icon: AlertTriangle },
    { label: "Rejected", count: overview.counts.rejected, icon: AlertTriangle },
    { label: "High Quality", count: overview.counts.highQuality, icon: ListChecks },
    { label: "壊れた名前候補", count: overview.counts.brokenNames, icon: AlertTriangle },
    { label: "Composite候補", count: overview.counts.composite, icon: AlertTriangle },
    { label: "画像なし", count: overview.counts.imageMissing, icon: Image },
    { label: "公式画像あり", count: overview.counts.officialImages, icon: Image },
    { label: "検証済み画像", count: overview.counts.verifiedImages, icon: Image },
    { label: "画像不一致除外", count: overview.counts.imageMismatchExcluded, icon: AlertTriangle },
    { label: "ウォーターマーク除外", count: overview.counts.watermarkImages, icon: AlertTriangle },
    { label: "低品質画像", count: overview.counts.lowQualityImages, icon: AlertTriangle },
    { label: "外観画像", count: overview.counts.storefrontImages, icon: AlertTriangle },
    { label: "棚・陳列画像", count: overview.counts.shelfImages, icon: AlertTriangle },
    { label: "差し替え必要", count: overview.counts.replacementNeeded, icon: AlertTriangle },
    { label: "共有画像候補", count: overview.counts.sharedImages, icon: Image },
    { label: "重複候補", count: overview.counts.duplicates, icon: ListChecks },
    { label: "店舗", count: overview.counts.shops, icon: Store },
    { label: "エリア", count: overview.counts.areas, icon: Database },
    { label: "画像URL", count: overview.counts.images, icon: Image }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black text-ink">管理画面</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">crawler候補の品質確認、公開判定、画像有無、重複候補を確認します。</p>
      </div>
      <div className="rounded-lg border border-park/20 bg-mint p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">画像候補レビュー</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">placeholder商品の候補画像を確認し、承認済みの安全な画像だけ通常画面へ反映します。</p>
          </div>
          <Link href="/admin/images" className="inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
            画像候補を確認
          </Link>
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">データ監査センター</h2>
            <p className="mt-1 text-sm font-bold text-amber-950">価格、店舗、エリア、source_url、重複候補、カテゴリを優先度順に確認します。推測価格は登録しません。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/dashboard" className="inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
              管理ダッシュボード
            </Link>
            <Link href="/admin/prices" className="inline-flex h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-soft">
              価格確認センター
            </Link>
            <Link href="/admin/data-quality" className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-amber-900 ring-1 ring-amber-200">
              品質監査を開く
            </Link>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-ink">商品追加リクエスト</h2>
            <p className="mt-1 text-sm font-bold text-slate-600">ユーザー投稿を確認し、採用・不採用の状態管理とfood候補コピーを行います。</p>
          </div>
          <Link href="/admin/submissions" className="inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
            リクエストを確認
          </Link>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
            <item.icon className="text-park" size={22} aria-hidden />
            <p className="mt-3 text-sm font-bold text-slate-500">{item.label}</p>
            <p className="text-3xl font-black text-ink">{item.count}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="shrink-0 text-amber-700" size={22} aria-hidden />
          <p className="text-sm leading-6 text-amber-950">
            自動取得データは `source_url` と `last_checked_at` を必ず保存し、消えたメニューは削除せず inactive にします。手動修正保護のため `manual_override` もSQLに含めています。
          </p>
        </div>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">画像確認キュー</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {[
            { title: "placeholder / 画像未取得", rows: overview.imageQueues.missing },
            { title: "検証済み画像", rows: overview.imageQueues.verified },
            { title: "不一致・除外画像", rows: overview.imageQueues.mismatch },
            { title: "ウォーターマーク疑い", rows: overview.imageQueues.watermark },
            { title: "低品質画像", rows: overview.imageQueues.lowQuality },
            { title: "店舗外観・遠景", rows: overview.imageQueues.storefront },
            { title: "棚・陳列・看板", rows: overview.imageQueues.shelf },
            { title: "差し替え必要", rows: overview.imageQueues.replacementNeeded },
            { title: "重複代表画像", rows: overview.imageQueues.duplicate }
          ].map((group) => (
            <div key={group.title} className="rounded-lg border border-slate-200">
              <div className="border-b border-slate-100 p-3">
                <h3 className="font-black text-ink">{group.title}</h3>
                <p className="text-xs font-bold text-slate-500">{group.rows.length}件を表示</p>
              </div>
              <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
                {group.rows.map((row) => (
                  <div key={`${group.title}-${row.id}`} className="grid grid-cols-[80px_1fr] gap-3 p-3">
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.imageUrl} alt="" className="h-14 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-14 w-20 rounded-md bg-slate-100" />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-black text-ink">{row.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.reason}</p>
                      <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-black text-park underline underline-offset-2">
                        source
                      </a>
                    </div>
                  </div>
                ))}
                {group.rows.length === 0 ? <p className="p-4 text-sm text-slate-500">対象はありません。</p> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">クロールログ</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2">日時</th>
                <th>Source</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Found</th>
                <th>Added</th>
                <th>Updated</th>
                <th>Inactive</th>
              </tr>
            </thead>
            <tbody>
              {overview.crawlLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="py-2 font-bold">{new Date(log.createdAt).toLocaleString("ja-JP")}</td>
                  <td>{log.sourceName}</td>
                  <td>{log.status}</td>
                  <td>{log.pagesCrawled}</td>
                  <td>{log.foodsFound}</td>
                  <td>{log.addedCount}</td>
                  <td>{log.updatedCount}</td>
                  <td>{log.inactiveCount}</td>
                </tr>
              ))}
              {overview.crawlLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">ログはまだありません。</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">候補レビュー</h2>
            <p className="text-sm font-bold text-slate-500">通常画面には canonical / approved / hidden=false / 商品名スコア75以上 / duplicate代表のみ表示され、公式画像は image_verified=true のものだけ使われます。</p>
          </div>
          <p className="text-sm font-black text-berry">上位 {overview.candidates.length} 件</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="py-2">画像</th>
                <th>商品</th>
                <th>Score</th>
                <th>Name</th>
                <th>Match</th>
                <th>Cat</th>
                <th>Verified</th>
                <th>Quality</th>
                <th>Review</th>
                <th>Hidden</th>
                <th>Issues</th>
                <th>Match reason</th>
                <th>Mismatch</th>
                <th>Watermark</th>
                <th>DOM context</th>
                <th>カテゴリ</th>
                <th>エリア / 店舗</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {overview.candidates.map((candidate) => (
                <tr key={candidate.id} className="border-t border-slate-100 align-top">
                  <td className="py-2">
                    {candidate.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={candidate.imageUrl} alt="" className="h-14 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="h-14 w-20 rounded-md bg-slate-100" />
                    )}
                  </td>
                  <td className="max-w-[260px] py-2 font-black text-ink">{candidate.name}</td>
                  <td className="font-black">{candidate.confidenceScore}</td>
                  <td className="font-black">{candidate.nameQualityScore}</td>
                  <td className="font-black">{candidate.imageMatchScore}</td>
                  <td className="font-black">{candidate.categoryImageMatchScore}</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${candidate.imageVerified ? "bg-mint text-park" : "bg-slate-100 text-slate-600"}`}>
                      {candidate.imageVerified ? "yes" : "no"}
                    </span>
                  </td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{candidate.displayQuality}</span>
                  </td>
                  <td>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black">{candidate.reviewStatus}</span>
                  </td>
                  <td>{candidate.hidden ? "yes" : "no"}</td>
                  <td className="max-w-[220px] text-xs text-slate-500">
                    {candidate.compositeMenu ? "composite " : ""}
                    {candidate.isSharedImage ? "shared-image " : ""}
                    {candidate.rejectionReasons.slice(0, 3).join(", ")}
                  </td>
                  <td className="max-w-[220px] text-xs text-slate-500">{candidate.imageMatchReason ?? `confidence:${candidate.imageConfidenceScore}`}</td>
                  <td className="max-w-[220px] text-xs text-berry">{candidate.imageMismatchReason ?? ""}</td>
                  <td className="max-w-[200px] text-xs text-amber-700">{candidate.hasWatermark ? candidate.watermarkReason ?? "watermark-risk" : ""}</td>
                  <td className="max-w-[260px] text-xs text-slate-500">{candidate.imageSourceContext ?? ""}</td>
                  <td>{categoryLabels[candidate.category as FoodCategory] ?? candidate.category}</td>
                  <td className="max-w-[220px] text-slate-600">{candidate.area} / {candidate.shop}</td>
                  <td className="max-w-[260px] truncate text-xs text-slate-500">
                    <a href={candidate.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-park underline underline-offset-2">
                      source
                    </a>
                    <span className="ml-2">{candidate.sourceUrl}</span>
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
