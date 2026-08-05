import Link from "next/link";
import { AreaOverview } from "@/components/area-overview";
import { AdSlot } from "@/components/ads/ad-slot";
import { HomeActiveFoodCollection, HomeCollectionHero, HomeLimitedCollection, HomeRecentRecords, HomeSummerCollection } from "@/components/home-progress-client";
import { I18nText } from "@/components/i18n-text";
import { dedupeFoodsByCanonical } from "@/lib/food-utils";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";
import { isFoodInCollection, SUMMER_2026_COLLECTION_ID } from "@/lib/seasonal-collections";
import type { Area, FoodCollection, FoodWithRelations } from "@/types/domain";

type HomeDashboardProps = {
  foods: FoodWithRelations[];
  activeCollectionFoods?: FoodWithRelations[];
  collections?: FoodCollection[];
  areas?: Area[];
  generatedAt?: string | null;
};

export function HomeDashboard({ foods, activeCollectionFoods = foods, collections = [], areas = [] }: HomeDashboardProps) {
  const summerFoods = foods.filter((food) => isFoodInCollection(food, SUMMER_2026_COLLECTION_ID));

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffdf9] pb-24 text-ink">
      <div className="mx-auto flex w-full min-w-0 max-w-[1080px] flex-col gap-8 px-4 pb-4 pt-0 sm:px-6 sm:py-6 lg:px-8">
        <HomeCollectionHero foods={foods} />

        <div className="space-y-10">
          <HomeSummerCollection foods={summerFoods} allFoods={foods} />
          <HomeFeaturedEvents collections={collections} foods={foods} />
          <HomeActiveFoodCollection foods={foods} collectionFoods={activeCollectionFoods} />
          <AdSlot placement="home-after-recent" />
          <HomeLimitedCollection foods={foods} />
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-ink"><I18nText k="home.areasTitle" /></h2>
              </div>
              <Link href="/areas" className="shrink-0 text-xs font-black text-park"><I18nText k="home.areasViewAll" /></Link>
            </div>
            <AreaOverview areas={areas} foods={foods} />
          </section>
          <HomeRecentRecords foods={foods} />
          <StoresEntryCard />
          <ExploreAllCard total={dedupeFoodsByCanonical(foods).length} />
          <FoodRequestPrompt />
        </div>
      </div>
    </div>
  );
}

function HomeFeaturedEvents({ collections, foods }: { collections: FoodCollection[]; foods: FoodWithRelations[] }) {
  const today = new Date();
  const visibleCollections = collections
    .filter((collection) => collection.id !== SUMMER_2026_COLLECTION_ID && collection.isFeatured)
    .filter((collection) => !collection.endsOn || new Date(collection.endsOn + "T23:59:59").getTime() >= today.getTime())
    .map((collection) => ({ collection, collectionFoods: foods.filter((food) => isFoodInCollection(food, collection.id)) }))
    .filter((item) => item.collectionFoods.length > 0)
    .sort((a, b) => a.collection.sortOrder - b.collection.sortOrder)
    .slice(0, 4);

  if (visibleCollections.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black text-park">期間限定イベント</p>
          <h2 className="text-xl font-black text-ink">いま見られるイベント</h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleCollections.map(({ collection, collectionFoods }) => {
          const firstFood = collectionFoods[0];
          const status = collection.startsOn && new Date(collection.startsOn + "T00:00:00").getTime() > today.getTime() ? "開催予定" : "開催中";
          const imageUrl = collection.imageUrl || firstFood?.imageUrl;
          return (
            <Link key={collection.id} href={`/collections/${collection.id}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft active:scale-[0.99]">
              {imageUrl ? <img src={imageUrl} alt="" className="h-36 w-full object-cover" /> : null}
              <div className="space-y-2 p-4">
                <span className="inline-flex rounded-full bg-mint px-3 py-1 text-xs font-black text-park">{status}</span>
                <h3 className="break-words text-base font-black text-ink">{collection.name}</h3>
                {collection.description ? <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-500">{collection.description}</p> : null}
                <p className="text-xs font-black text-slate-500">掲載商品 {collectionFoods.length.toLocaleString("ja-JP")}件</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function StoresEntryCard() {
  return (
    <section className="border-t border-slate-200/80 pt-7">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-ink"><I18nText k="home.storesTitle" /></h2>
          <p className="mt-1 text-sm font-bold text-slate-500"><I18nText k="home.storesDescription" /></p>
        </div>
        <Link href="/stores" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink active:scale-[0.98]">
          <I18nText k="common.store" />
        </Link>
      </div>
    </section>
  );
}

function FoodRequestPrompt() {
  return (
    <section className="border-t border-slate-200/70 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-ink"><I18nText k="home.requestPromptTitle" /></p>
          <p className="mt-1 text-xs font-bold leading-5 text-slate-500"><I18nText k="home.requestPromptDescription" /></p>
        </div>
        <a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink active:scale-[0.98]">
          <I18nText k="home.requestPromptCta" />
        </a>
      </div>
    </section>
  );
}

function ExploreAllCard({ total }: { total: number }) {
  return (
    <section className="border-t border-slate-200/80 pt-7">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-ink">
            <I18nText k="home.viewRegisteredCollection" />
          </h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            <I18nText k="home.exploreDescription" params={{ count: total }} />
          </p>
        </div>
        <Link href="/foods" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-sm active:scale-[0.98]">
          <I18nText k="common.search" />
        </Link>
      </div>
    </section>
  );
}
