import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import { ProductRequestForm } from "./request-form";

export default function ProductRequestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-soft">
        <ChevronLeft size={17} aria-hidden />
        ホームへ戻る
      </Link>
      <section className="rounded-[1.85rem] bg-[radial-gradient(circle_at_top_left,#22c55e_0%,#0f172a_42%,#111827_100%)] p-5 text-white shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/14 ring-1 ring-white/14">
          <Plus size={26} aria-hidden />
        </div>
        <p className="mt-4 text-sm font-black text-mint">FOOD INFO</p>
        <h1 className="mt-2 text-3xl font-black">情報提供センター</h1>
        <p className="mt-3 text-sm font-bold leading-7 text-slate-200">
          新商品、情報修正、販売終了報告、お問い合わせをここから送れます。画像URLだけでも情報提供できます。
        </p>
      </section>
      <ProductRequestForm />
    </div>
  );
}
