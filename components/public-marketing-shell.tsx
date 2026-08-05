"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { appBrand } from "@/lib/constants";

const supportLinks = [
  { href: "/privacy", label: "プライバシー" },
  { href: "/terms", label: "利用規約" },
  { href: "/security", label: "セキュリティ" },
  { href: "/request", label: "情報提供・お問い合わせ" }
] as const;

function isOperatorPath(pathname: string) {
  return pathname.startsWith("/staff") || pathname.startsWith("/admin");
}

export function SiteHeader({ marketingMode }: { marketingMode: boolean }) {
  const pathname = usePathname();
  if (!marketingMode || isOperatorPath(pathname)) return <AppHeader />;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#fffaf5]/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex min-w-0 items-center gap-3 text-ink">
          <BrandMark className="h-10 w-10 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-park sm:text-base">{appBrand.shortName}</span>
            <span className="hidden text-xs font-bold text-slate-500 sm:block">非公式USJフード記録アプリ</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-2 text-xs font-black text-slate-600 sm:flex" aria-label="サポートリンク">
          {supportLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-2 transition hover:bg-white hover:text-park">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/request" className="shrink-0 rounded-full bg-park px-4 py-2 text-xs font-black text-white shadow-sm active:scale-95">
          お問い合わせ
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter({ marketingMode }: { marketingMode: boolean }) {
  const pathname = usePathname();
  if (isOperatorPath(pathname)) return null;
  if (!marketingMode) return <AppFooter />;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 text-sm text-slate-500 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-3 text-ink">
            <BrandMark className="h-12 w-12" />
            <span>
              <span className="block text-base font-black">{appBrand.shortName}</span>
              <span className="block text-xs font-bold text-slate-500">{appBrand.tagline}</span>
            </span>
          </Link>
          <p className="max-w-2xl text-xs font-semibold leading-5 text-slate-500">
            ユニコレは、USJフードを探して、食べた記録を写真つきで残せる非公式ファンアプリです。最新情報は公式サイト・公式アプリ・現地表示をご確認ください。
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-xs font-bold sm:grid-cols-2" aria-label="フッターリンク">
          {supportLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-2 py-2 text-slate-600 transition hover:bg-mint hover:text-park">
              {link.label}
            </Link>
          ))}
          <Link href="/about" className="rounded-lg px-2 py-2 text-slate-600 transition hover:bg-mint hover:text-park">
            このアプリについて
          </Link>
          <Link href="/commercial-disclosure" className="rounded-lg px-2 py-2 text-slate-600 transition hover:bg-mint hover:text-park">
            商業的表示
          </Link>
        </nav>
      </div>
    </footer>
  );
}
