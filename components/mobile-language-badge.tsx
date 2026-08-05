"use client";

import { Globe2 } from "lucide-react";
import { supportedLocales, type Locale } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/use-locale";

const localeShortLabels: Record<Locale, string> = {
  ja: "JP",
  en: "EN",
  ko: "KO",
  "zh-TW": "TW"
};

export function MobileLanguageBadge() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="fixed z-40 md:hidden"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
        right: "calc(env(safe-area-inset-right, 0px) + 0.75rem)"
      }}
    >
      <div className="relative inline-flex">
        <select
          value={locale}
          onChange={(event) => {
            const next = event.target.value as Locale;
            if (supportedLocales.includes(next)) {
              setLocale(next);
            }
          }}
          className="min-h-11 min-w-11 cursor-pointer appearance-none rounded-full border border-slate-200 bg-white/95 py-2 pl-8 pr-7 text-xs font-black text-slate-500 shadow-[0_10px_24px_rgba(7,27,58,0.12)] backdrop-blur transition hover:border-park hover:text-park focus:outline-none focus:ring-2 focus:ring-park/30"
          aria-label="Language"
        >
          {supportedLocales.map((loc) => (
            <option key={loc} value={loc}>
              {localeShortLabels[loc]}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
          <Globe2 size={13} />
        </span>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400" aria-hidden>
          ▼
        </span>
      </div>
    </div>
  );
}
