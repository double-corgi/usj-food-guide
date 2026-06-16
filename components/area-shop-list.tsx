"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { I18nText } from "@/components/i18n-text";
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { useLocale } from "@/lib/i18n/use-locale";
import type { ShopType } from "@/types/domain";

export type AreaShopRow = {
  key: string;
  name: string;
  type: ShopType;
  href?: string;
};

export function AreaShopList({ shops }: { shops: AreaShopRow[] }) {
  const { t } = useLocale();
  const visible = shops.slice(0, 6);
  const hidden = shops.slice(6);
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-[#eadcc8] pb-3">
        <h2 className="text-xl font-black text-ink">
          <I18nText k="area.salesLocations" />
        </h2>
        <p className="text-xs font-black text-slate-500">{t("area.salesLocationCount", { count: shops.length })}</p>
      </div>
      <div className="grid gap-0 lg:grid-cols-2 lg:gap-x-8">
        {visible.map((shop) => (
          <ShopRow key={shop.key} shop={shop} />
        ))}
      </div>
      {hidden.length > 0 ? (
        <details className="border-t border-[#eadcc8] pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-park">
            <span>
              <I18nText k="area.viewAllSalesLocations" /> {t("area.remainingSalesLocations", { count: hidden.length })}
            </span>
            <ChevronDown size={15} aria-hidden />
          </summary>
          <div className="mt-3 grid gap-0 lg:grid-cols-2 lg:gap-x-8">
            {hidden.map((shop) => (
              <ShopRow key={shop.key} shop={shop} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function ShopRow({ shop }: { shop: AreaShopRow }) {
  const { t } = useLocale();
  const typeLabel = t(`shopType.${shop.type}` as TranslationKey);
  const content = (
    <>
      <span className="line-clamp-2 min-w-0 break-words text-sm font-black leading-5 text-[#071b3a] [overflow-wrap:anywhere]">{shop.name}</span>
      <span className="shrink-0 text-xs font-bold text-slate-500">{typeLabel}</span>
    </>
  );
  const className = "grid min-h-12 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[#eadcc8]/80 py-3";
  if (shop.href) {
    return (
      <Link href={shop.href} className={`${className} transition hover:text-park`}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
