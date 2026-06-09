import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SettingsDataPanel } from "@/components/settings-data-panel";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-black text-slate-700">
        <ChevronLeft size={17} aria-hidden />
        ホームへ戻る
      </Link>
      <section className="space-y-2 py-2">
        <p className="text-xs font-black tracking-[0.16em] text-park/70">設定</p>
        <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">端末内データ管理</h1>
        <p className="max-w-2xl text-sm font-bold leading-6 text-slate-500">
          ログイン不要で使えます。食べた記録、レビュー、星評価はこの端末のlocalStorageに保存されます。
        </p>
      </section>
      <SettingsDataPanel />
    </div>
  );
}
