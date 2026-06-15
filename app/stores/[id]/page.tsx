import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, ExternalLink, MapPin, Store, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { I18nText } from "@/components/i18n-text";
import { StoreFoodList } from "@/components/store-food-list";
import { StoreVisual } from "@/components/store-visual";
import { listFoods } from "@/lib/repositories/foods";
import { buildStoresFromFoods, findStoreById, getStoreDisplayFoods, getStoreSummary, getStoreTypeLabel, pickRepresentativeFood } from "@/lib/store-utils";

export async function generateStaticParams() {
  const foods = await listFoods();
  const ids = new Set<string>();
  for (const store of buildStoresFromFoods(foods)) {
    ids.add(store.id);
    for (const alias of store.aliases) ids.add(alias);
  }
  return Array.from(ids).map((id) => ({ id }));
}

export default async function StoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const foods = await listFoods();
  const stores = buildStoresFromFoods(foods);
  const store = findStoreById(stores, id);
  if (!store) notFound();
  const officialUrl = store.officialUrl;
  const representativeFood = pickRepresentativeFood(store);
  const storeSummary = getStoreSummary(store, representativeFood);
  const displayFoods = getStoreDisplayFoods(store.foods, store);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href="/stores" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-sm font-black text-slate-700">
        <ChevronLeft size={17} aria-hidden />
        <I18nText k="store.backToList" />
      </Link>

      <section className="space-y-5 border-b border-slate-200 pb-7">
        <div className="relative h-[210px] overflow-hidden rounded-[1.5rem] bg-slate-100 sm:h-[230px] md:h-[300px]">
          <StoreVisual store={store} eager iconSize={34} className="h-full w-full" />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black text-park">
            <I18nText k="store.detailKicker" />
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-ink md:text-4xl">{store.name}</h1>
          <p className="inline-flex items-center gap-2 text-sm font-black text-slate-500">
            <MapPin size={16} className="text-park" aria-hidden />
            {store.areaName}
          </p>
          <p className="max-w-2xl text-base font-bold leading-7 text-slate-600">{storeSummary}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-black text-park">
            <I18nText k="store.availableFoodsKicker" />
          </p>
          <h2 className="mt-1 text-2xl font-black text-ink">
            <I18nText k="store.availableFoods" />
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-500">
            <I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />
          </p>
        </div>
        <StoreFoodList foods={displayFoods} />
      </section>

      <section className="space-y-4 border-t border-slate-200 pt-7">
        <div>
          <p className="text-xs font-black text-park">
            <I18nText k="store.infoKicker" />
          </p>
          <h2 className="mt-1 text-xl font-black text-ink">
            <I18nText k="store.infoSectionTitle" />
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <StoreInfoItem icon={MapPin} title={<I18nText k="store.infoAreaLabel" />} body={store.areaName} />
          <StoreInfoItem icon={Store} title={<I18nText k="store.infoTypeLabel" />} body={getStoreTypeLabel(store)} />
        </div>
        <StoreInfoItem
          icon={Clock}
          title={<I18nText k="store.infoScheduleLabel" />}
          body={officialUrl ? <I18nText k="store.scheduleBodyWithUrl" /> : <I18nText k="store.scheduleBodyWithoutUrl" />}
          linkHref={officialUrl}
          linkLabel={<I18nText k="store.scheduleLinkLabel" />}
        />
        {officialUrl ? (
          <StoreInfoItem
            icon={ExternalLink}
            title={<I18nText k="store.infoOfficialLabel" />}
            body={<I18nText k="store.officialBody" />}
            linkHref={officialUrl}
            linkLabel={<I18nText k="store.officialLinkLabel" />}
          />
        ) : null}
      </section>
    </div>
  );
}

function StoreInfoItem({
  icon: Icon,
  title,
  body,
  linkHref,
  linkLabel
}: {
  icon: LucideIcon;
  title: ReactNode;
  body: ReactNode;
  linkHref?: string;
  linkLabel?: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint text-park">
        <Icon size={18} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black text-slate-400">{title}</p>
        <p className="mt-1 break-words text-sm font-black leading-6 text-ink [overflow-wrap:anywhere]">{body}</p>
        {linkHref && linkLabel ? (
          <a href={linkHref} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-black text-park">
            {linkLabel}
            <ExternalLink size={13} aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
