"use client";

import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { appBrand } from "@/lib/constants";
import { useLocale } from "@/lib/i18n/use-locale";

export function AppFooter() {
  const { t } = useLocale();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-8 pb-24 sm:px-6 md:pb-8 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-7 text-sm text-slate-500 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-3.5">
          <Link href="/" className="inline-flex items-center gap-3 text-ink">
            <BrandMark className="h-12 w-12" />
            <span>
              <span className="block text-base font-black">{appBrand.shortName}</span>
              <span className="block text-xs font-bold text-slate-500">{t("footer.tagline")}</span>
            </span>
          </Link>
          <p className="max-w-2xl text-xs font-semibold leading-5 text-slate-500">{t("footer.brandDescription")}</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/foods" className="rounded-full bg-park px-4 py-2 text-xs font-black text-white active:scale-95">
              {t("footer.findFoods")}
            </Link>
            <Link href="/request" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-ink active:scale-95">
              {t("footer.report")}
            </Link>
          </div>
        </div>
        <nav className="space-y-4" aria-label={t("footer.ariaLabel")}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-bold sm:grid-cols-3">
            {footerPrimaryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-mint hover:text-park">
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-400">
            {footerSupportLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-park">
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  );
}

const footerPrimaryLinks = [
  { href: "/foods", labelKey: "footer.foods" },
  { href: "/areas", labelKey: "nav.areas" },
  { href: "/stores", labelKey: "nav.stores" },
  { href: "/eaten", labelKey: "footer.eatenRecord" },
  { href: "/request", labelKey: "footer.report" },
  { href: "/about", labelKey: "footer.about" },
  { href: "/privacy", labelKey: "footer.privacy" },
  { href: "/contact", labelKey: "footer.contact" },
  { href: "/disclaimer", labelKey: "footer.disclaimer" }
] as const;

const footerSupportLinks = [
  { href: "/settings", labelKey: "footer.settings" },
  { href: "/terms", labelKey: "footer.terms" },
  { href: "/security", labelKey: "footer.security" },
  { href: "/commercial-disclosure", labelKey: "footer.commercialDisclosure" }
] as const;
