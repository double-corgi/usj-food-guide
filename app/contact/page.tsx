import Link from "next/link";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <article className="rounded-[1.6rem] border border-white/80 bg-white p-6 shadow-soft">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-park">Contact</p>
        <h1 className="mt-2 text-3xl font-black text-ink">お問い合わせ</h1>
        <div className="mt-5 space-y-3 text-sm font-bold leading-7 text-slate-600">
          <p>商品追加、価格修正、販売終了報告、情報修正は発見報告センターから送信できます。</p>
          <p>このページは、アプリ運営、削除依頼、プライバシー、セキュリティ、不具合などの問い合わせ用です。</p>
          <p>メール送信機能は未連携のため、送信内容は管理者確認用の保存領域に記録します。</p>
        </div>
        <Link href="/request" className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-park px-5 text-sm font-black text-white shadow-soft">
          発見報告センターへ
        </Link>
      </article>
      <ContactForm />
    </div>
  );
}
