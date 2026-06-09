import { ExternalLink } from "lucide-react";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";
import type { FoodWithRelations } from "@/types/domain";

export function FoodCorrectionReportForm({ food }: { food: FoodWithRelations }) {
  return (
    <section className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-soft">
      <p className="text-sm font-black text-ink">この商品の情報を修正する</p>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
        価格、販売場所、販売期間、商品名、画像などに間違いがあればGoogleフォームから送信してください。管理者が確認後に反映します。
      </p>
      <p className="mt-2 line-clamp-2 text-xs font-bold text-slate-500">対象商品: {food.name}</p>
      <a
        href={REQUEST_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-white transition active:scale-[0.98] sm:w-auto"
      >
        Googleフォームで情報提供する
        <ExternalLink size={16} aria-hidden />
      </a>
    </section>
  );
}
