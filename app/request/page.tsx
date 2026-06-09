import Link from "next/link";
import { ChevronLeft, ExternalLink, Plus } from "lucide-react";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";

export default function ProductRequestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/78 px-3 text-sm font-black text-slate-700">
        <ChevronLeft size={17} aria-hidden />
        ホームへ戻る
      </Link>
      <section className="space-y-4 py-2">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white">
          <Plus size={26} aria-hidden />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">情報提供センター</h1>
        <p className="max-w-2xl text-sm font-semibold leading-7 text-slate-500">
          掲載されていない商品や掲載情報の誤りを見つけた場合は、こちらからお知らせください。管理者が確認後に反映します。
        </p>
      </section>
      <section className="border-t border-slate-200 pt-6">
        <p className="text-lg font-black text-ink">Googleフォームで受け付けています</p>
        <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
          商品追加、価格修正、販売場所、販売期間、画像などの情報提供をまとめて送信できます。投稿内容は即公開されず、確認後に必要に応じて反映します。
        </p>
        <a
          href={REQUEST_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-park px-5 py-4 text-sm font-black text-white transition active:scale-[0.98] sm:w-auto"
        >
          Googleフォームで情報提供する
          <ExternalLink size={17} aria-hidden />
        </a>
      </section>
    </div>
  );
}
