import Image from "next/image";
import Link from "next/link";
import { Camera, Image as ImageIcon, Share2, WifiOff } from "lucide-react";
import { appBrand, unofficialNotice } from "@/lib/constants";
import type { Food, FoodCollection } from "@/types/domain";

const appStoreUrl = "https://apps.apple.com/app/id6789612515";

function formatPrice(food: Food) {
  if (typeof food.price === "number") return `¥${food.price.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number" && typeof food.priceMax === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜¥${food.priceMax.toLocaleString("ja-JP")}`;
  if (typeof food.priceMin === "number") return `¥${food.priceMin.toLocaleString("ja-JP")}〜`;
  return "価格確認中";
}

function getFoodImageUrl(food: Food) {
  const imageUrl = food.imageUrl || (food as Food & { representativeImageUrl?: string; image_url?: string; representative_image_url?: string }).representativeImageUrl || (food as Food & { representativeImageUrl?: string; image_url?: string; representative_image_url?: string }).image_url || (food as Food & { representativeImageUrl?: string; image_url?: string; representative_image_url?: string }).representative_image_url;
  return typeof imageUrl === "string" && imageUrl.length > 0 ? imageUrl : null;
}

function pickFoods(foods: Food[]) {
  return foods.filter((food) => getFoodImageUrl(food) && food.name).slice(0, 6);
}

export function PublicMarketingHome({ foods, collections }: { foods: Food[]; collections: FoodCollection[] }) {
  const examples = pickFoods(foods);
  const featuredCollection = collections.find((collection) => collection.isFeatured) ?? collections[0];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-14 pb-16">
      <section className="grid items-center gap-8 pt-4 md:grid-cols-[1.05fr_0.95fr] md:pt-8">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-sun/50 bg-white px-4 py-2 text-xs font-black text-park shadow-sm">
            個人の食べた記録を、写真つきコレクションに。
          </div>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-black leading-tight tracking-normal text-ink sm:text-5xl lg:text-6xl">
              {appBrand.shortName}
              <span className="block text-park">USJフード記録アプリ</span>
            </h1>
            <p className="max-w-2xl text-base font-bold leading-8 text-slate-600 sm:text-lg">
              気になるフードを探して、食べた日・写真・評価・メモ・金額をiPhoneに保存。アルバムのように集めながら、次に食べたいものも残せます。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={appStoreUrl} className="rounded-full bg-park px-6 py-3 text-sm font-black text-white shadow-lg shadow-park/20 transition active:scale-95">
              App Storeで見る
            </a>
            <Link href="/request" className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-ink transition hover:border-park active:scale-95">
              情報提供・お問い合わせ
            </Link>
          </div>
          <p className="text-xs font-bold leading-5 text-slate-500">{unofficialNotice}</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-[0_22px_70px_rgba(7,27,58,0.16)]">
          <div className="rounded-[1.55rem] bg-[#fffaf5] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-park">食べた記録</p>
                <p className="text-2xl font-black text-ink">写真アルバム</p>
              </div>
              <span className="rounded-full bg-sun/70 px-3 py-1 text-xs font-black text-ink">端末内保存</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {examples.slice(0, 6).map((food) => (
                <div key={food.id} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                  <Image src={getFoodImageUrl(food)!} alt="" width={260} height={260} className="h-full w-full object-cover" sizes="(max-width: 768px) 30vw, 160px" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <feature.icon className="mb-4 h-8 w-8 text-park" aria-hidden />
            <h2 className="text-lg font-black text-ink">{feature.title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{feature.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[2rem] bg-park p-6 text-white shadow-[0_20px_60px_rgba(7,27,58,0.2)] sm:p-8">
        <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-black text-sun">アプリ限定機能</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Webではなく、iPhoneの中に残すフード図鑑。</h2>
            <p className="mt-4 text-sm font-bold leading-7 text-white/78">
              写真付き記録、ウィジェット、ショートカット、共有カード、オフライン閲覧はiOSアプリで利用できます。写真は運営者へ送信されず、端末内に保存されます。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {iosOnly.map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4 text-sm font-black text-white ring-1 ring-white/15">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-park">フード例</p>
          <h2 className="mt-2 text-2xl font-black text-ink">写真を見ながら、気になるフードを探せます。</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {examples.slice(0, 4).map((food) => (
              <div key={food.id} className="flex min-w-0 gap-3 rounded-2xl border border-slate-100 bg-[#fffaf5] p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  <Image src={getFoodImageUrl(food)!} alt="" width={160} height={160} className="h-full w-full object-cover" sizes="80px" />
                </div>
                <div className="min-w-0 pt-1">
                  <p className="line-clamp-2 text-sm font-black leading-5 text-ink">{food.name}</p>
                  <p className="mt-1 text-sm font-black text-park">{formatPrice(food)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black text-park">期間限定</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{featuredCollection?.name ?? "期間限定イベント"}</h2>
          <p className="mt-3 text-sm font-bold leading-7 text-slate-600">
            アプリ内では、公開中の期間限定イベントや対象フードを確認できます。開催期間や販売状況は変更される場合があります。
          </p>
          <Link href="/request" className="mt-5 inline-flex rounded-full bg-park px-5 py-3 text-sm font-black text-white">
            掲載内容を知らせる
          </Link>
        </div>
      </section>
    </div>
  );
}

const features = [
  { title: "写真付き記録", description: "食べた日、写真、評価、メモ、金額、店舗を自分用に保存できます。", icon: Camera },
  { title: "アルバム", description: "食べたフードが写真グリッドでたまり、エリア別にも振り返れます。", icon: ImageIcon },
  { title: "共有", description: "記録から共有カードを作り、iOS標準共有画面で送れます。", icon: Share2 },
  { title: "オフライン", description: "保存済みの商品情報と記録は、通信がない時も確認できます。", icon: WifiOff }
] as const;

const iosOnly = ["写真は端末内に保存", "ホーム画面ウィジェット", "ショートカット対応", "触覚フィードバック", "iPad表示対応", "非公式表記つき共有カード"] as const;
