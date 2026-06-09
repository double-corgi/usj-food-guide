import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { appBrand, unofficialNotice } from "@/lib/constants";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-10 pb-24 sm:px-6 md:pb-10 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-8 text-sm text-slate-500 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-3 text-ink">
            <BrandMark className="h-11 w-11" />
            <span>
              <span className="block text-base font-black">{appBrand.shortName}</span>
              <span className="block text-xs font-bold text-slate-500">{appBrand.tagline}</span>
            </span>
          </Link>
          <p className="max-w-2xl leading-6">{unofficialNotice}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/foods" className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white active:scale-95">
              フードを探す
            </Link>
            <Link href="/request" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-ink active:scale-95">
              発見報告
            </Link>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-3 font-bold sm:grid-cols-3" aria-label="フッター">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl px-2 py-1.5 text-slate-600 transition hover:bg-mint hover:text-park">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

const footerLinks = [
  { href: "/about", label: "アプリについて" },
  { href: "/foods", label: "フード一覧" },
  { href: "/areas", label: "エリア" },
  { href: "/stores", label: "店舗" },
  { href: "/eaten", label: "食べた記録" },
  { href: "/request", label: "発見報告" },
  { href: "/settings", label: "通知設定" },
  { href: "/privacy", label: "プライバシー" },
  { href: "/terms", label: "利用規約" },
  { href: "/contact", label: "お問い合わせ" },
  { href: "/disclaimer", label: "免責事項" },
  { href: "/security", label: "セキュリティ" },
  { href: "/commercial-disclosure", label: "表示方針" }
];
