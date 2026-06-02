import Link from "next/link";
import { Bell, ChevronLeft } from "lucide-react";

const notificationSettings = [
  {
    title: "限定終了通知",
    description: "販売終了予定日が近い限定フードを通知するための準備項目です。"
  },
  {
    title: "新商品通知",
    description: "新しく追加されたフードを通知するための準備項目です。"
  },
  {
    title: "価格更新通知",
    description: "価格確認済み・価格更新を通知するための準備項目です。"
  }
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-soft">
        <ChevronLeft size={17} aria-hidden />
        ホームへ戻る
      </Link>
      <section className="rounded-[1.75rem] bg-ink p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
        <p className="text-sm font-black text-mint">通知設定準備</p>
        <h1 className="mt-1 text-3xl font-black">限定を逃さない準備</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-200">
          Push通知はまだ送信しません。将来のネイティブアプリ化・PWA通知に備えて、設定項目だけを整理しています。
        </p>
      </section>
      <section className="grid gap-3">
        {notificationSettings.map((item) => (
          <div key={item.title} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex min-w-0 gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-park">
                <Bell size={19} aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-black text-ink">{item.title}</h2>
                <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{item.description}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">準備中</span>
          </div>
        ))}
      </section>
    </div>
  );
}
