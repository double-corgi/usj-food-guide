"use client";

import Link from "next/link";
import { CheckCircle2, Globe2, House, Search, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import { localeLabels, supportedLocales, type Locale } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/use-locale";

const navItems = [
  { href: "/", labelKey: "nav.home", icon: House },
  { href: "/foods", labelKey: "nav.search", icon: Search },
  { href: "/eaten", labelKey: "nav.eaten", icon: CheckCircle2 },
  { href: "/areas", labelKey: "nav.areas", icon: Globe2 },
  { href: "/stores", labelKey: "nav.stores", icon: Store }
] as const;

const localeShortLabels: Record<Locale, string> = {
  ja: "JP",
  en: "EN",
  ko: "KO",
  "zh-TW": "TW"
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const { t, locale, setLocale } = useLocale();
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 hidden border-b border-slate-200/60 bg-white/78 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:block">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-end gap-3 px-6 py-2.5 lg:px-8">
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-mint hover:text-park"
              >
                <item.icon size={17} aria-hidden />
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="relative">
            <select
              value={locale}
              onChange={(event) => {
                const next = event.target.value as Locale;
                if (supportedLocales.includes(next)) {
                  setLocale(next);
                }
              }}
              className="cursor-pointer appearance-none rounded-full border border-slate-200 bg-white px-3 py-1.5 pr-7 text-xs font-black text-slate-600 transition hover:border-park hover:text-park focus:outline-none focus:ring-2 focus:ring-park/30"
              aria-label="Language"
            >
              {supportedLocales.map((loc) => (
                <option key={loc} value={loc}>
                  {localeShortLabels[loc]} — {localeLabels[loc]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" aria-hidden>
              ▼
            </span>
          </div>
        </div>
      </header>
      <nav
        aria-label={t("nav.label")}
        className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 grid grid-cols-5 rounded-[1.55rem] border border-slate-200/60 bg-white p-1 shadow-[0_-1px_0_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)] md:hidden"
      >
        {navItems.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[1.15rem] text-[10.5px] font-black transition active:scale-95 ${
                active ? "bg-mint text-park" : "text-slate-500 hover:bg-white/70 active:bg-mint"
              }`}
            >
              <item.icon size={19} aria-hidden />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
