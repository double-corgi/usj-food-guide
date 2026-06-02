import Link from "next/link";
import { unofficialNotice } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-8 pb-28 sm:px-6 md:pb-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-sm text-slate-500 md:flex-row md:items-start md:justify-between">
        <p className="max-w-2xl leading-6">{unofficialNotice}</p>
        <div className="flex flex-wrap gap-4 font-bold">
          <Link href="/about" className="hover:text-park">
            アプリについて
          </Link>
          <Link href="/foods" className="hover:text-park">
            フード一覧
          </Link>
          <Link href="/request" className="hover:text-park">
            発見報告
          </Link>
          <Link href="/want" className="hover:text-park">
            次回食べたい
          </Link>
          <Link href="/settings" className="hover:text-park">
            通知設定
          </Link>
          <Link href="/privacy" className="hover:text-park">
            プライバシー
          </Link>
          <Link href="/terms" className="hover:text-park">
            利用規約
          </Link>
          <Link href="/contact" className="hover:text-park">
            お問い合わせ
          </Link>
          <Link href="/disclaimer" className="hover:text-park">
            免責事項
          </Link>
          <Link href="/security" className="hover:text-park">
            セキュリティ
          </Link>
          <Link href="/commercial-disclosure" className="hover:text-park">
            表示方針
          </Link>
        </div>
      </div>
    </footer>
  );
}
