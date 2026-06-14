"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SettingsDataPanel } from "@/components/settings-data-panel";
import { useLocale } from "@/lib/i18n/use-locale";

export default function SettingsPage() {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-24">
      <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-black text-slate-700">
        <ChevronLeft size={17} aria-hidden />
        {t("settings.backHome")}
      </Link>
      <section className="space-y-2 py-2">
        <p className="text-xs font-black tracking-[0.16em] text-park/70">{t("settings.kicker")}</p>
        <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">{t("settings.title")}</h1>
        <p className="max-w-2xl text-sm font-bold leading-6 text-slate-500">{t("settings.description")}</p>
      </section>
      <LanguageSwitcher />
      <section className="space-y-3">
        <h2 className="text-xl font-black tracking-tight text-ink">{t("settings.dataSection")}</h2>
        <SettingsDataPanel />
      </section>
    </div>
  );
}
