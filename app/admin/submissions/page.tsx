import { ExternalLink } from "lucide-react";
import { readContactSubmissions } from "@/lib/contact-submissions";
import { readSubmissions, type ProductSubmission, type ProductSubmissionStatus } from "@/lib/product-submissions";
import { updateSubmissionStatus } from "./actions";
import { CopyFoodCandidateButton } from "./copy-food-candidate-button";

const statusLabels: Record<ProductSubmissionStatus, string> = {
  unreviewed: "未確認",
  checking: "確認中",
  accepted: "採用",
  rejected: "不採用"
};

const typeLabels: Record<string, string> = {
  add: "商品追加",
  contact: "お問い合わせ",
  info_fix: "情報修正",
  price_fix: "価格修正",
  ended_report: "販売終了報告",
  image_replace: "画像差し替え",
  other: "その他",
  bug_report: "不具合報告"
};

export default function AdminSubmissionsPage() {
  const submissions = readSubmissions();
  const contacts = readContactSubmissions();
  const counts = {
    unreviewed: submissions.filter((item) => item.status === "unreviewed").length,
    checking: submissions.filter((item) => item.status === "checking").length,
    accepted: submissions.filter((item) => item.status === "accepted").length,
    rejected: submissions.filter((item) => item.status === "rejected").length
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-black text-berry">管理者専用</p>
        <h1 className="mt-1 text-3xl font-black text-ink">商品追加リクエスト</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">一般投稿はここで確認し、採用判断後に手動でデータへ反映します。投稿内容は通常画面へ即公開しません。</p>
      </div>
      <section className="grid gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="rounded-2xl border border-white/80 bg-white p-4 shadow-soft">
            <p className="text-xs font-black text-slate-500">{statusLabels[status as ProductSubmissionStatus]}</p>
            <p className="mt-1 text-3xl font-black text-ink">{count}</p>
          </div>
        ))}
      </section>
      <section className="grid gap-4">
        {submissions.map((submission) => (
          <SubmissionCard key={submission.id} submission={submission} />
        ))}
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
            まだ商品追加リクエストはありません。
          </div>
        ) : null}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black text-ink">お問い合わせ</h2>
        <p className="mt-1 text-sm font-bold text-slate-500">発見報告とは別の問い合わせ保存先です。返信が必要なものは連絡先を確認してください。</p>
        <div className="mt-4 grid gap-3">
          {contacts.map((contact) => (
            <article key={contact.id} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">{contact.status}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{formatDate(contact.createdAt)}</span>
              </div>
              <h3 className="mt-2 text-lg font-black text-ink">{contact.subject}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6 text-slate-600">{contact.message}</p>
              <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
                <Info label="送信者" value={contact.senderName || "任意未入力"} />
                <Info label="連絡先" value={contact.contact || "任意未入力"} />
              </dl>
            </article>
          ))}
          {contacts.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-500">お問い合わせはまだありません。</p> : null}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: ProductSubmission }) {
  const candidate = JSON.stringify(
    {
      name: submission.foodName,
      category: submission.category || "unknown",
      price: submission.price || undefined,
      shopName: submission.shopName || undefined,
      areaName: submission.areaName || undefined,
      imageUrl: submission.imageUrl || undefined,
      sourceUrl: submission.officialUrl || undefined,
      note: submission.memo || undefined
    },
    null,
    2
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-mint px-3 py-1 text-xs font-black text-park">{statusLabels[submission.status]}</span>
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-black text-white">{typeLabels[submission.requestType ?? "add"]}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{formatDate(submission.createdAt)}</span>
            {submission.category ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">{submission.category}</span> : null}
          </div>
          <h2 className="mt-3 break-words text-xl font-black text-ink [overflow-wrap:anywhere]">{submission.foodName}</h2>
          <dl className="mt-3 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-2">
            <Info label="価格" value={submission.price || "未入力"} />
            <Info label="販売場所" value={submission.shopName || "未入力"} />
            <Info label="エリア" value={submission.areaName || "未入力"} />
            <Info label="送信者" value={submission.senderName || "任意未入力"} />
            <Info label="連絡先" value={submission.contact || "任意未入力"} />
          </dl>
          {submission.memo ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-600">{submission.memo}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {submission.officialUrl ? <SourceLink href={submission.officialUrl} label="公式URLを開く" /> : null}
            {submission.imageUrl ? <SourceLink href={submission.imageUrl} label="画像URLを開く" /> : null}
            <CopyFoodCandidateButton value={candidate} />
          </div>
        </div>
        <div className="space-y-3">
          {submission.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={submission.imageUrl} alt="" className="aspect-[4/3] w-full rounded-xl bg-slate-100 object-cover" />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-400">画像URLなし</div>
          )}
          <form action={updateSubmissionStatus} className="grid grid-cols-[1fr_auto] gap-2">
            <input type="hidden" name="id" value={submission.id} />
            <select name="status" defaultValue={submission.status} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-ink">
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>{label}</option>
              ))}
            </select>
            <button type="submit" className="h-11 rounded-xl bg-ink px-4 text-sm font-black text-white">更新</button>
          </form>
          <details className="rounded-xl bg-slate-50 p-3">
            <summary className="cursor-pointer text-xs font-black text-slate-600">詳細確認</summary>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-600">{candidate}</pre>
          </details>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-black text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-black text-white">
      {label}
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
