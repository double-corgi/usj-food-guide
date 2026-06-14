"use client";

import { Check } from "lucide-react";
import { localeLabels, supportedLocales } from "@/lib/i18n/locales";
import { useLocale } from "@/lib/i18n/use-locale";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <section id="language" className="rounded-[1.5rem] border border-[#eadcc8] bg-white/82 p-4 shadow-[0_18px_40px_rgba(7,27,58,0.06)]">
      <div className="space-y-1">
        <p className="text-xs font-black tracking-[0.16em] text-park/70">{t("settings.language")}</p>
        <h2 className="text-xl font-black tracking-tight text-ink">{t("settings.currentLanguage")}</h2>
        <p className="text-sm font-bold leading-6 text-slate-500">{t("settings.languageDescription")}</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {supportedLocales.map((item) => {
          const selected = item === locale;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setLocale(item)}
              className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 text-left text-sm font-black transition ${
                selected ? "border-[#d9a230] bg-[#fff7df] text-[#071b3a]" : "border-slate-200 bg-white text-slate-600 hover:border-[#d9a230]/70"
              }`}
              aria-pressed={selected}
            >
              <span>{localeLabels[item]}</span>
              {selected ? <Check size={17} aria-hidden className="text-[#b37a12]" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
