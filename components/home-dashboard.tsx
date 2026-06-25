import Link from "next/link";
import { AreaOverview } from "@/components/area-overview";
import { HomeActiveFoodCollection, HomeCollectionHero, HomeLimitedCollection, HomeRecentRecords } from "@/components/home-progress-client";
import { I18nText } from "@/components/i18n-text";
import { dedupeFoodsByCanonical } from "@/lib/food-utils";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";
import type { Area, FoodWithRelations } from "@/types/domain";

type HomeDashboardProps = {
  foods: FoodWithRelations[];
  activeCollectionFoods?: FoodWithRelations[];
  areas?: Area[];
  generatedAt?: string | null;
};

export function HomeDashboard({ foods, activeCollectionFoods = foods, areas = [] }: HomeDashboardProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffdf9] pb-32 text-ink">
      <div className="mx-auto flex w-full min-w-0 max-w-[1080px] flex-col gap-10 px-4 pb-4 pt-0 sm:px-6 sm:py-6 lg:px-8">
        <HomeCollectionHero foods={foods} />

        <div className="space-y-12">
          <HomeActiveFoodCollection foods={foods} collectionFoods={activeCollectionFoods} />
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
