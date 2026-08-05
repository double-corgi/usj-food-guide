import Link from "next/link";
import { ChevronLeft, ExternalLink, FilePenLine } from "lucide-react";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";

const requestTypes = [
  "未掲載商品の情報",
  "商品名の修正",
  "価格の修正",
  "販売場所の修正",
  "販売期間の修正",
  "画像の修正",
  "店舗情報の修正",
  "エリア情報の修正",
  "不具合報告",
  "一般的な問い合わせ",
  "削除依頼",
  "その他"
];

export default function ProductRequestPage() {
  return (
    <div className="safe-page mx-auto max-w-3xl space-y-7">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/78 px-3 text-sm font-black text-slate-700">
        <ChevronLeft size={17} aria-hidden />
        ホームへ戻る
      </Link>
      <section className="space-y-4 py-2">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white">
          <FilePenLine size={25} aria-hidden />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">情報提供・お問い合わせ</h1>
        <p className="max-w-2xl text-sm font-semibold leading-7 text-slate-500">
          掲載されていない商品、価格や販売場所の修正、不具合、削除依頼、一般的な問い合わせをこのページに統合しました。
          送信先は既存のGoogleフォームです。
        </p>
      </section>
      <section className="rounded-[1.5rem] border border-white/80 bg-white p-5 shadow-soft">
        <p className="text-lg font-black text-ink">Googleフォームでまとめて受け付けています</p>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
          投稿内容は即公開されません。管理者が確認し、必要に応じて商品・店舗・エリア情報へ反映します。
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {requestTypes.map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
              {item}
            </div>
          ))}
        </div>
        <a
          href={REQUEST_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-park px-5 py-4 text-sm font-black text-white transition active:scale-[0.98] sm:w-auto"
        >
          Googleフォームを開く
          <ExternalLink size={17} aria-hidden />
        </a>
      </section>
    </div>
  );
}
