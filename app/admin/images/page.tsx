import Link from "next/link";
import { CheckCircle2, ExternalLink, ImageOff, Sparkles, XCircle } from "lucide-react";
import { categoryLabels } from "@/lib/constants";
import { getFoodAreaSummary } from "@/lib/food-utils";
import { getImageCandidateOverview } from "@/lib/repositories/image-candidates";
import { approveImageCandidate, rejectImageCandidate } from "./actions";
import { ManualImageForm } from "./manual-image-form";

export default async function AdminImagesPage() {
  const overview = getImageCandidateOverview();
  const sortedCandidates = overview.candidates
    .slice()
    .sort((a, b) => Number(Boolean(b.isApproved)) - Number(Boolean(a.isApproved)) || b.imageMatchScore - a.imageMatchScore || a.foodName.localeCompare(b.foodName, "ja"))
    .slice(0, 240);
  const noCandidateFoods = overview.placeholderFoods.filter((food) => !overview.candidates.some((candidate) => candidate.foodId === food.id));
  const imageCount = overview.visibleFoods.length - overview.placeholderFoods.length;
  const imageCompletionRate = overview.visibleFoods.length === 0 ? 0 : Math.round((imageCount / overview.visibleFoods.length) * 1000) / 10;
  const churroPlaceholders = overview.placeholderFoods.filter((food) => food.category === "churro").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Image candidate review</p>
          <h1 className="mt-1 text-3xl font-black text-ink">画像手動登録</h1>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-500">
            placeholder商品の画像URLを手動で登録します。URLは保存時に画像として開けるか確認し、保存後は通常画面へ即反映します。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink shadow-soft hover:border-park">
            管理トップへ
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-bold leading-6 text-slate-600 shadow-soft">
        Google画像検索APIは使わず、各商品の検索リンクから画像を確認してURLを手動登録します。透かし・看板・店舗外観・商品不一致の画像は登録しない運用です。
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "placeholder商品", value: overview.counts.placeholders, icon: ImageOff },
          { label: "画像あり", value: imageCount, icon: CheckCircle2 },
          { label: "画像完成率", value: `${imageCompletionRate}%`, icon: CheckCircle2 },
          { label: "チュリトスplaceholder", value: churroPlaceholders, icon: ImageOff },
          { label: "候補画像", value: overview.counts.candidates, icon: Sparkles },
          { label: "承認済み", value: overview.counts.approved, icon: CheckCircle2 },
          { label: "却下済み", value: overview.counts.rejected, icon: XCircle }
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <item.icon className="text-park" size={22} aria-hidden />
            <p className="mt-3 text-xs font-black text-slate-500">{item.label}</p>
            <p className="text-3xl font-black text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">placeholder商品一覧</h2>
            <p className="text-sm font-bold text-slate-500">商品ごとに画像URLを入力し、プレビュー確認後に保存します。</p>
          </div>
          <p className="text-sm font-black text-berry">{overview.placeholderFoods.length}件</p>
        </div>
        <div className="mt-4 grid gap-4">
          {overview.placeholderFoods.map((food) => (
            <ManualImageForm key={food.id} food={food} />
          ))}
          {overview.placeholderFoods.length === 0 ? <p className="rounded-lg bg-slate-50 p-5 text-sm font-bold text-slate-500">placeholder商品はありません。</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-ink">画像候補</h2>
            <p className="text-sm font-bold text-slate-500">既存候補がある場合は、score、透かし、商品写真判定を確認してから承認します。</p>
          </div>
          <p className="text-sm font-black text-berry">{sortedCandidates.length}件を表示</p>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {sortedCandidates.map((candidate) => {
            const canApprove = candidate.imageMatchScore >= 90 && !candidate.hasWatermark && candidate.isProductPhoto && !candidate.isStorefront && !candidate.isMenuBoard && !candidate.isCollage && !candidate.isCharacterOnly;
            return (
              <article key={candidate.id} className="grid gap-4 rounded-lg border border-slate-200 p-3 md:grid-cols-[180px_1fr]">
                <div className="overflow-hidden rounded-md bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={candidate.thumbnailUrl ?? candidate.candidateUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                </div>
                <div className="min-w-0 space-y-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-black ${canApprove ? "bg-mint text-park" : "bg-slate-100 text-slate-600"}`}>score {candidate.imageMatchScore}</span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{categoryLabels[candidate.category] ?? candidate.category}</span>
                      {candidate.hasWatermark ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">透かし疑い</span> : null}
                      {candidate.isStorefront ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">外観/棚/遠景疑い</span> : null}
                      {candidate.isMenuBoard ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">看板/POP疑い</span> : null}
                      {candidate.isCollage ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">集合画像疑い</span> : null}
                      {candidate.isCharacterOnly ? <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-700">キャラのみ疑い</span> : null}
                      {candidate.isCloseupFood ? <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-700">商品接写</span> : null}
                      {candidate.isProductPhoto ? <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">商品写真</span> : null}
                      {candidate.isApproved ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">承認済み</span> : null}
                      {candidate.isRejected ? <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-700">却下済み</span> : null}
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black text-ink">{candidate.foodName}</h3>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">{candidate.sourceDomain ?? "unknown"}</p>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    <p className="font-black text-slate-700">判定理由</p>
                    {typeof candidate.productMatchScore === "number" ? <p className="mt-1 font-black text-slate-700">商品一致score: {candidate.productMatchScore}</p> : null}
                    <p className="mt-1 line-clamp-3">{candidate.reasons.join(" / ") || "理由なし"}</p>
                    {candidate.watermarkReason ? <p className="mt-1 font-bold text-amber-800">透かし: {candidate.watermarkReason}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {candidate.sourcePage ? (
                      <a href={candidate.sourcePage} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-black text-park hover:border-park">
                        source <ExternalLink size={14} aria-hidden />
                      </a>
                    ) : null}
                    <a href={candidate.candidateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-xs font-black text-park hover:border-park">
                      image <ExternalLink size={14} aria-hidden />
                    </a>
                    <form action={approveImageCandidate}>
                      <input type="hidden" name="candidateId" value={candidate.id} />
                      <button
                        type="submit"
                        disabled={!canApprove}
                        className="inline-flex h-10 items-center rounded-full bg-park px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                      >
                        承認して代表画像にする
                      </button>
                    </form>
                    <form action={rejectImageCandidate}>
                      <input type="hidden" name="candidateId" value={candidate.id} />
                      <button type="submit" className="inline-flex h-10 items-center rounded-full bg-slate-100 px-4 text-xs font-black text-slate-700 hover:bg-slate-200">
                        却下
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
          {sortedCandidates.length === 0 ? <p className="rounded-lg bg-slate-50 p-5 text-sm font-bold text-slate-500">候補画像はまだありません。上のplaceholder商品一覧から画像URLを手動登録してください。</p> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">候補がないplaceholder商品</h2>
          <div className="mt-4 max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
            {noCandidateFoods.slice(0, 120).map((food) => (
              <div key={food.id} className="py-3">
                <p className="font-black text-ink">{food.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-500">{categoryLabels[food.category] ?? food.category} / {getFoodAreaSummary(food)} / {food.shop.name}</p>
                <p className="mt-1 text-xs font-bold text-slate-400">候補なし。上の手動登録欄から画像URLを登録できます。</p>
                <a href={food.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-black text-park underline underline-offset-2">source</a>
              </div>
            ))}
            {noCandidateFoods.length === 0 ? <p className="py-4 text-sm text-slate-500">候補なしの商品はありません。</p> : null}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
          <h2 className="text-xl font-black text-ink">source別候補数</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {Object.entries(overview.bySource)
              .sort((a, b) => b[1] - a[1])
              .map(([source, count]) => (
                <div key={source} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-bold text-slate-600">{source}</span>
                  <span className="font-black text-ink">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
