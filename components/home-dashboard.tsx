import Link from "next/link";
import { AreaOverview } from "@/components/area-overview";
import { HomeActiveFoodCollection, HomeAnniversaryProgress, HomeCollectionHero } from "@/components/home-progress-client";
import { dedupeFoodsByCanonical } from "@/lib/food-utils";
import { REQUEST_FORM_URL } from "@/lib/request-form-url";
import type { Area, FoodWithRelations } from "@/types/domain";

type HomeDashboardProps = {
  foods: FoodWithRelations[];
  areas?: Area[];
  generatedAt?: string | null;
};

export function HomeDashboard({ foods, areas = [] }: HomeDashboardProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8f7f4] pb-32 text-ink">
      <div className="mx-auto flex w-full min-w-0 max-w-[1080px] flex-col gap-12 px-4 pb-4 pt-2 sm:gap-16 sm:px-6 sm:py-8 lg:px-8">
        <HomeCollectionHero foods={foods} />

        <section className="space-y-16 sm:space-y-20" aria-label="ホーム">
          <HomeActiveFoodCollection foods={foods} />
          <section className="space-y-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[1.55rem] font-semibold leading-[1.7] tracking-[0.02em] text-[#1b1b1b] sm:text-[1.875rem] sm:leading-[1.8]">エリア</h2>
              </div>
              <Link href="/areas" className="shrink-0 text-sm font-semibold leading-[2] text-[#0057b8]">すべて見る</Link>
            </div>
            <AreaOverview areas={areas} foods={foods} />
          </section>
          <StoresEntryCard />
          <HomeAnniversaryProgress foods={foods} />
          <ExploreAllCard total={dedupeFoodsByCanonical(foods).length} />
          <FoodRequestPrompt />
        </section>
      </div>
    </main>
  );
}

function StoresEntryCard() {
  return (
    <section className="border-t border-[#e6e6e6] pt-8 sm:pt-10">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[1.55rem] font-semibold leading-[1.7] tracking-[0.02em] text-[#1b1b1b] sm:text-[1.875rem] sm:leading-[1.8]">店舗</h2>
          <p className="mt-1 text-base font-medium leading-[2] text-[#64748b]">レストランやカートから、買えるフードを探せます。</p>
        </div>
        <Link href="/stores" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-[#d9dde3] bg-white px-5 text-sm font-semibold text-[#071b3a] transition active:scale-[0.98] md:hover:border-[#0057b8]">
          店舗
        </Link>
      </div>
    </section>
  );
}

function FoodRequestPrompt() {
  return (
    <section className="border-t border-[#e6e6e6] pt-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-[1.8] text-[#1b1b1b]">掲載されていない商品を見つけた？</p>
          <p className="mt-1 text-sm font-medium leading-[2] text-[#64748b]">図鑑を完成させるための情報提供はこちら。</p>
        </div>
        <a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-[#d9dde3] bg-white px-4 text-sm font-semibold text-[#071b3a] transition active:scale-[0.98] md:hover:border-[#0057b8]">
          情報提供する
        </a>
      </div>
    </section>
  );
}

function ExploreAllCard({ total }: { total: number }) {
  return (
    <section className="border-t border-[#e6e6e6] pt-8 sm:pt-10">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[1.55rem] font-semibold leading-[1.7] tracking-[0.02em] text-[#1b1b1b] sm:text-[1.875rem] sm:leading-[1.8]">全商品を見る</h2>
          <p className="mt-1 text-base font-medium leading-[2] text-[#64748b]">図鑑に登録された{total}種類を写真で探せます。</p>
        </div>
        <Link href="/foods" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-[#071b3a] px-5 text-sm font-semibold text-white transition active:scale-[0.98] md:hover:bg-[#0057b8]">
          探す
        </Link>
      </div>
    </section>
  );
}
