# Codex Goal: i18n Phase B — エリア名・カテゴリ名多言語化

## 目的

ユニコレの Phase B 多言語化を実装する。

`lib/constants.ts` にハードコードされたカテゴリ名・店舗種別・飲食タイプ、および DB から取得するエリア名を、既存の `lib/i18n/dictionaries.ts` + `useLocale()` 基盤に統合する。EN / KO / zh-TW ユーザーが各自の言語でフィルタ・ジャンル進捗・エリア表示を閲覧できるようにする。

設計書: `docs/i18n-phase-b-area-category-design-v1.md`

---

## Git 運用

### 作業開始前

```bash
git status
```

- **未コミット変更がある場合**:
  ```bash
  git add .
  git commit -m "backup-before-i18n-phase-b-area-category"
  git push
  ```
- **未コミット変更がない場合**:
  ```bash
  git commit --allow-empty -m "backup-before-i18n-phase-b-area-category"
  git push
  ```

### 作業完了後

```bash
git add .
git commit -m "implement-i18n-phase-b-area-category"
git push
```

Codex CLI 確認画面が出た場合は必ず **「Yes, and don't ask again」** を選択すること。確認質問禁止。途中停止禁止。

---

## 実装手順

以下の順番で実装すること。順番を変えると TypeScript エラーが出やすいため厳守。

---

### Step 1: `lib/i18n/dictionaries.ts` に翻訳エントリを追加

既存の `ja` / `en` / `ko` / `zh-TW` の4ロケールそれぞれに、以下のキーと値を追加する。**既存エントリは一切変更しない**。ただし `settings.languageDescription` のみ後述の通り更新する。

追加キー合計: **36キー × 4ロケール = 144エントリ**

#### 追加キー一覧

**nav.label（1キー）**

| ロケール | 値 |
|---|---|
| ja | `メインナビゲーション` |
| en | `Main navigation` |
| ko | `메인 내비게이션` |
| zh-TW | `主要導覽` |

**カテゴリラベル（14キー）**

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `category.churro` | チュリトス | Churros | 추리토스 | 吉拿棒 |
| `category.popcorn` | ポップコーン | Popcorn | 팝콘 | 爆米花 |
| `category.drink` | ドリンク | Drink | 음료 | 飲料 |
| `category.dessert` | スイーツ | Sweets | 스위츠 | 甜點 |
| `category.burger` | バーガー | Burger | 버거 | 漢堡 |
| `category.pizza` | ピザ | Pizza | 피자 | 披薩 |
| `category.chicken` | チキン・肉系 | Chicken & Meat | 치킨・육류 | 炸雞・肉類 |
| `category.rice` | ライス・カレー | Rice & Curry | 라이스・카레 | 米飯・咖哩 |
| `category.noodle` | 麺・パスタ | Noodle & Pasta | 면・파스타 | 麵・義大利麵 |
| `category.snack` | スナック | Snack | 스낵 | 點心 |
| `category.kids` | キッズ | Kids | 키즈 | 兒童 |
| `category.seasonal` | 季節限定 | Seasonal | 계절 한정 | 季節限定 |
| `category.set` | セットメニュー | Set Menu | 세트메뉴 | 套餐 |
| `category.unknown` | カテゴリ確認中 | Category Checking | 카테고리 확인 중 | 類別確認中 |

**店舗種別ラベル（4キー）**

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `shopType.restaurant` | レストラン | Restaurant | 레스토랑 | 餐廳 |
| `shopType.cart` | フードカート | Food Cart | 푸드 카트 | 餐車 |
| `shopType.wagon` | ワゴン | Wagon | 왜건 | 推車 |
| `shopType.unknown` | 未分類 | Uncategorized | 미분류 | 未分類 |

**飲食タイプラベル（5キー）**

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `diningType.takeout` | テイクアウト | Takeout | 테이크아웃 | 外帶 |
| `diningType.eat_in` | 店内飲食 | Eat In | 매장 내 식사 | 內用 |
| `diningType.both` | 店内・持ち歩き | Dine In & Takeout | 매장・테이크아웃 | 內用・外帶 |
| `diningType.food_cart` | カート販売 | Cart Sales | 카트 판매 | 餐車販售 |
| `diningType.unknown` | 不明 | Unknown | 불명 | 不明 |

**販売場所件数ラベル（2キー）**

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `area.salesLocationCount` | {{count}}か所 | {{count}} locations | {{count}}곳 | {{count}}處 |
| `area.remainingSalesLocations` | あと{{count}}か所 | {{count}} more locations | {{count}}곳 더 보기 | 還有{{count}}處 |

**エリア名（10キー）**

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `area.name.super-nintendo-world` | スーパー・ニンテンドー・ワールド | Super Nintendo World | 슈퍼 닌텐도 월드 | 超級任天堂世界 |
| `area.name.wizarding-world` | ウィザーディング・ワールド・オブ・ハリー・ポッター | The Wizarding World of Harry Potter | 위저딩 월드 오브 해리 포터 | 哈利波特魔法世界 |
| `area.name.minion-park` | ミニオン・パーク | Minion Park | 미니언 파크 | 小小兵樂園 |
| `area.name.universal-wonderland` | ユニバーサル・ワンダーランド | Universal Wonderland | 유니버설 원더랜드 | 環球奇蹟樂園 |
| `area.name.hollywood` | ハリウッド・エリア | Hollywood Area | 할리우드 에리어 | 好萊塢區 |
| `area.name.new-york` | ニューヨーク・エリア | New York Area | 뉴욕 에리어 | 紐約區 |
| `area.name.san-francisco` | サンフランシスコ・エリア | San Francisco Area | 샌프란시스코 에리어 | 舊金山區 |
| `area.name.jurassic-park` | ジュラシック・パーク | Jurassic Park | 쥬라기 파크 | 侏羅紀公園 |
| `area.name.amity-village` | アミティ・ビレッジ | Amity Village | 에미티 빌리지 | 海濱小鎮 |
| `area.name.waterworld` | ウォーターワールド | WaterWorld | 워터월드 | 水世界 |

#### `settings.languageDescription` の更新（既存キーの値変更）

エリア名が翻訳対象に加わったため、以下の値を上書きする。

| ロケール | 変更後の値 |
|---|---|
| ja | `表示言語を選べます。商品名・店舗名は現地で見つけやすいよう日本語のまま表示します。` |
| en | `Choose the display language. Food and store names stay in Japanese so they are easier to find in the park.` |
| ko | `표시 언어를 선택할 수 있습니다. 푸드명, 매장명은 현장에서 찾기 쉽도록 일본어로 표시됩니다.` |
| zh-TW | `可以選擇顯示語言。餐點名、店鋪名會保留日文，方便在園區內查找。` |

---

### Step 2: `lib/i18n/area-name.ts` を新規作成

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";

const areaNameKeyMap: Record<string, TranslationKey> = {
  "スーパー・ニンテンドー・ワールド": "area.name.super-nintendo-world",
  "ウィザーディング・ワールド・オブ・ハリー・ポッター": "area.name.wizarding-world",
  "ミニオン・パーク": "area.name.minion-park",
  "ユニバーサル・ワンダーランド": "area.name.universal-wonderland",
  "ハリウッド・エリア": "area.name.hollywood",
  "ニューヨーク・エリア": "area.name.new-york",
  "サンフランシスコ・エリア": "area.name.san-francisco",
  "ジュラシック・パーク": "area.name.jurassic-park",
  "アミティ・ビレッジ": "area.name.amity-village",
  "ウォーターワールド": "area.name.waterworld",
};

function normalizeAreaName(name: string): string {
  return (name ?? "")
    .replace(/[™®]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function tAreaName(
  name: string,
  t: (key: TranslationKey) => string
): string {
  const key = areaNameKeyMap[normalizeAreaName(name)];
  return key ? t(key) : name;
}
```

---

### Step 3: `components/area-shop-list.tsx` を新規作成

`app/areas/[id]/page.tsx` 内の `AreaShopList` コンポーネントと `ShopRow` コンポーネントを、`"use client"` の独立ファイルに移動する。`useLocale()` を使って店舗種別・件数表示を翻訳する。

**重要**: `shopTypeLabels` は import しない。店舗種別は必ず `t("shopType."+x)` で表示すること。

```tsx
"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { I18nText } from "@/components/i18n-text";
import type { ShopType } from "@/types/domain";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

// shopTypeLabels は import しない

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
        <p className="text-xs font-black text-slate-500">
          {t("area.salesLocationCount", { count: shops.length })}
        </p>
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
              <I18nText k="area.viewAllSalesLocations" />
              {t("area.remainingSalesLocations", { count: hidden.length })}
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
      <span className="min-w-0 truncate text-sm font-black text-[#071b3a]">{shop.name}</span>
      <span className="shrink-0 text-xs font-bold text-slate-500">{typeLabel}</span>
    </>
  );
  const className = "flex min-h-12 items-center justify-between gap-4 border-b border-[#eadcc8]/80 py-3";
  if (shop.href) {
    return (
      <Link href={shop.href} className={`${className} transition hover:text-park`}>
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}
```

---

### Step 4: `app/areas/[id]/page.tsx` を更新

`AreaShopList` / `ShopRow` を `components/area-shop-list.tsx` から import するよう変更し、ファイル内のそれらの定義と `shopTypeLabels` の import を削除する。`AreaShopRow` 型も同ファイルから import する。

**変更内容**:

1. 削除: `import { shopTypeLabels } from "@/lib/constants";`
2. 追加: `import { AreaShopList, type AreaShopRow } from "@/components/area-shop-list";`
3. 削除: ファイル末尾の `type AreaShopRow`, `function AreaShopList`, `function ShopRow` の定義全体
4. それ以外（`buildAreaShopRows`, `buildStoreIdentityKey` などの関数群）は変更しない

---

### Step 5: `components/app-header.tsx` を更新

L75 の `aria-label` を修正する。

```tsx
// Before
<nav
  aria-label={t("nav.home")}
  ...
>

// After
<nav
  aria-label={t("nav.label")}
  ...
>
```

変更箇所: L75 の `"nav.home"` → `"nav.label"` のみ。それ以外は一切変更しない。

---

### Step 6: `components/food-detail.tsx` を更新

#### 6-1. import 追加

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";
```

#### 6-2. カテゴリ表示の置換（L116, L229）

```tsx
// Before
{categoryLabels[food.category]}

// After
{t(`category.${food.category}` as TranslationKey)}
```

#### 6-3. 飲食タイプ表示の置換（L57付近）

**重要**: 既存の `inferDiningLabel(food)` は日本語文字列を直接返す場合がある。EN / KO / zh-TW でも日本語が残るため、日本語固定の fallback は禁止。以下のいずれかで対応する。

**案A（推奨）: `inferDiningLabel` を `inferDiningType` に改修**

`inferDiningLabel` のロジックを参照し、日本語ラベルの代わりに `DiningType` 内部キーを返す `inferDiningType` 関数を新設する（food-detail.tsx 内のローカル関数として定義）。

```ts
// food-detail.tsx 内でローカル定義
function inferDiningType(food: FoodWithRelations): DiningType {
  if (food.shop.type === "cart" || food.shop.type === "wagon") return "food_cart";
  // 既存の inferDiningLabel のロジックを参照しつつ DiningType を返す
  return "unknown";
}

// After
const diningLabel = food.diningType && food.diningType !== "unknown"
  ? t(`diningType.${food.diningType}` as TranslationKey)
  : t(`diningType.${inferDiningType(food)}` as TranslationKey);
```

**案B（最小実装）: unknown にフォールバック**

`inferDiningLabel` の改修が困難な場合は `t("diningType.unknown")` にフォールバックする。日本語文字列を直接返す fallback は禁止。

```ts
// After（案B）
const diningLabel = food.diningType && food.diningType !== "unknown"
  ? t(`diningType.${food.diningType}` as TranslationKey)
  : t("diningType.unknown");
```

実装者は既存の `inferDiningLabel` の実装を確認し、案A が適用可能であれば案A を選ぶこと。いずれにせよ、日本語固定文字列を直接返す fallback は使用しない。

#### 6-4. 店舗種別表示の置換（L192付近）

```tsx
// Before
<span className="shrink-0 text-[11px] font-black text-slate-400">
  {shopTypeLabels[location.shopType]}
</span>

// After
<span className="shrink-0 text-[11px] font-black text-slate-400">
  {t(`shopType.${location.shopType}` as TranslationKey)}
</span>
```

#### 6-5. 不要になった import の削除

`categoryLabels`, `diningTypeLabels`, `shopTypeLabels` が `food-detail.tsx` で不要になった場合は import から削除する。ただし他の箇所で使われている場合は残す。

---

### Step 7: `components/food-grid.tsx` を更新

#### 7-1. import 追加

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { tAreaName } from "@/lib/i18n/area-name";
```

#### 7-2. カテゴリフィルタ（L216-219付近）

```tsx
// Before
{Object.entries(categoryLabels).map(([value, label]) => (
  <option key={value} value={value}>
    {label}
  </option>
))}

// After
{(Object.keys(categoryLabels) as FoodCategory[]).map((value) => (
  <option key={value} value={value}>
    {t(`category.${value}` as TranslationKey)}
  </option>
))}
```

#### 7-3. 店舗種別フィルタ（L240-243付近）

```tsx
// Before
{Object.entries(shopTypeLabels).map(([value, label]) => (
  <option key={value} value={value}>
    {label}
  </option>
))}

// After
{(Object.keys(shopTypeLabels) as ShopType[]).map((value) => (
  <option key={value} value={value}>
    {t(`shopType.${value}` as TranslationKey)}
  </option>
))}
```

#### 7-4. 飲食タイプフィルタ（L248-251付近）

```tsx
// Before
{Object.entries(diningTypeLabels).map(([value, label]) => (
  <option key={value} value={value}>
    {label}
  </option>
))}

// After
{(Object.keys(diningTypeLabels) as DiningType[]).map((value) => (
  <option key={value} value={value}>
    {t(`diningType.${value}` as TranslationKey)}
  </option>
))}
```

#### 7-5. エリア名フィルタ（L225-226付近）

```tsx
// Before
<option key={area.id} value={area.id}>
  {area.name}
</option>

// After
<option key={area.id} value={area.id}>
  {tAreaName(area.name, t)}
</option>
```

#### 7-6. 検索テキスト生成（L377付近）

`categoryLabels[food.category]` を使っている検索インデックス生成箇所:

```ts
// Before
categoryLabels[food.category],

// After
t(`category.${food.category}` as TranslationKey),
```

---

### Step 8: `components/recommendation-rail.tsx` を更新

```tsx
// Before（L54付近）
<span className="truncate text-[11px] font-black text-slate-400">
  {categoryLabels[food.category]}
</span>

// After
<span className="truncate text-[11px] font-black text-slate-400">
  {t(`category.${food.category}` as TranslationKey)}
</span>
```

import に `TranslationKey` を追加する。`categoryLabels` の import が不要になった場合は削除する。

---

### Step 9: `components/eaten-genre-progress.tsx` を更新

#### 9-1. import 追加

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";
```

#### 9-2. `calculateGenreProgress` 関数のイテレーション変更（L83-84付近）

グループキーには内部カテゴリキー（`FoodCategory`）を使い、表示ラベルは `t()` で取得する。

```ts
// Before
return (Object.entries(categoryLabels) as Array<[FoodCategory, string]>)
  .map(([category, label]) => {
    // ...
    return {
      id: category,
      label,
      // ...
    };
  })

// After
return (Object.keys(categoryLabels) as FoodCategory[])
  .map((category) => {
    const label = t(`category.${category}` as TranslationKey);
    // ...（以下の計算ロジックは変更しない）
    return {
      id: category,
      label,
      // ...
    };
  })
```

`calculateGenreProgress` を呼び出している箇所に `t` を渡す必要があるため、関数シグネチャを変更する:

```ts
// Before
function calculateGenreProgress(foods: FoodWithRelations[], eatenKeys: Set<string>): GenreProgress[]

// After
function calculateGenreProgress(
  foods: FoodWithRelations[],
  eatenKeys: Set<string>,
  t: (key: TranslationKey) => string
): GenreProgress[]
```

呼び出し元に `t` を渡す（`const { t } = useLocale()` はすでにある）。

---

### Step 10: `components/eaten-experience.tsx` を更新

#### 10-1. import 追加

```ts
import type { TranslationKey } from "@/lib/i18n/dictionaries";
import { tAreaName } from "@/lib/i18n/area-name";
```

#### 10-2. カテゴリフィルタ options（L217-220付近）

```tsx
// Before
{(Object.entries(categoryLabels) as Array<[FoodCategory, string]>).map(([category, label]) => (
  <option key={category} value={category}>{label}</option>
))}

// After
{(Object.keys(categoryLabels) as FoodCategory[]).map((category) => (
  <option key={category} value={category}>
    {t(`category.${category}` as TranslationKey)}
  </option>
))}
```

#### 10-3. genre モードのグループキー修正（L354-360付近）

**重要**: グループキーは内部カテゴリキー（`food.category`）のままにし、表示タイトルは `t()` で取得する。

```ts
// Before
if (mode === "genre") {
  const groups = new Map<string, EatenAlbumRecord[]>();
  for (const record of records) {
    const label = categoryLabels[record.food.category] ?? "カテゴリ確認中";
    groups.set(label, [...(groups.get(label) ?? []), record]);
  }
  return Array.from(groups.entries())
    .map(([label, items]) => ({ id: `genre-${label}`, title: label, records: items.slice(0, 4), total: items.length }))
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title, "ja"))
    .slice(0, 8);
}

// After
if (mode === "genre") {
  const groups = new Map<FoodCategory, EatenAlbumRecord[]>();
  for (const record of records) {
    const key = record.food.category;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return Array.from(groups.entries())
    .map(([key, items]) => ({
      id: `genre-${key}`,
      title: t(`category.${key}` as TranslationKey),
      records: items.slice(0, 4),
      total: items.length
    }))
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title))
    .slice(0, 8);
}
```

#### 10-4. エリア名表示の翻訳

エリア別アルバムモードや eaten-genre のエリア名表示箇所で `area.name` を `tAreaName(name, t)` に変更する。ただし `area.name` を内部グループキーとして使っている箇所は変更しない（表示のみ対象）。

---

### Step 11: `components/area-overview.tsx` を更新

#### 11-1. import 追加

```ts
import { tAreaName } from "@/lib/i18n/area-name";
```

#### 11-2. エリア名表示（L49付近）

```tsx
// Before
<h2 className="line-clamp-2 text-xl font-black leading-tight">{area.name}</h2>

// After
<h2 className="line-clamp-2 text-xl font-black leading-tight">{tAreaName(area.name, t)}</h2>
```

---

## 変更対象ファイル一覧

| ファイル | 変更種別 |
|---|---|
| `lib/i18n/dictionaries.ts` | 既存ファイル更新（144エントリ追加 + 4エントリ値更新） |
| `lib/i18n/area-name.ts` | **新規作成** |
| `components/area-shop-list.tsx` | **新規作成** |
| `components/app-header.tsx` | 既存ファイル更新（1行のみ） |
| `components/food-detail.tsx` | 既存ファイル更新 |
| `components/food-grid.tsx` | 既存ファイル更新 |
| `components/recommendation-rail.tsx` | 既存ファイル更新 |
| `components/eaten-experience.tsx` | 既存ファイル更新 |
| `components/eaten-genre-progress.tsx` | 既存ファイル更新 |
| `components/area-overview.tsx` | 既存ファイル更新 |
| `app/areas/[id]/page.tsx` | 既存ファイル更新（import 変更 + 定義削除のみ） |

---

## 絶対に変更してはいけないファイル

| ファイル | 理由 |
|---|---|
| `lib/constants.ts` | `categoryLabels` 等を削除しない。他コードが依存している。 |
| `lib/store-utils.ts` | Phase B スコープ外 |
| `lib/i18n/use-locale.tsx` | 変更不要 |
| `lib/i18n/locales.ts` | 変更不要 |
| `types/domain.ts` | 内部キー変更禁止 |
| `app/stores/[id]/page.tsx` | Phase B スコープ外 |
| `app/shops/page.tsx` | Server Component、Phase B スコープ外 |
| `scripts/output/` 以下すべて | generated JSON、変更禁止 |
| `/en`, `/ko`, `/zh-TW` ルート | 新設禁止 |
| DB / crawler | 変更禁止 |

---

## 禁止事項

- 商品名・店舗名の翻訳
- 価格表示の変更
- 日付表示の変更
- generated JSON の編集
- DB・crawler の変更
- URL 構造の変更（`/areas/[id]`, `/stores/[id]` 等）
- `lib/store-utils.ts` の変更
- `lib/constants.ts` の `categoryLabels` / `shopTypeLabels` / `diningTypeLabels` の削除
- `/en` `/ko` `/zh-TW` ルートの追加
- 無関係な整形・リファクタ
- Stop and Ask（確認質問禁止・途中停止禁止）

---

## 検証

### ビルド検証

```bash
npm run lint
npm run typecheck
npm run build
```

3つすべてがエラーなしで完了すること。

### grep 検証

```bash
# categoryLabels[ が components/ と app/ に残っていないこと
# 例外: lib/constants.ts と app/shops/page.tsx (スコープ外) のみ許容
grep -rn "categoryLabels\[" components/ app/ --include="*.tsx"

# shopTypeLabels[ が components/ と app/ に残っていないこと
# 例外: app/shops/page.tsx (スコープ外) のみ許容
# area-shop-list.tsx も含めて shopTypeLabels[ は使わない（t() を使う）
grep -rn "shopTypeLabels\[" components/ app/ --include="*.tsx"

# area-shop-list.tsx に shopTypeLabels の import が無いこと
grep -n "shopTypeLabels" components/area-shop-list.tsx

# diningTypeLabels[ が components/ と app/ に残っていないこと
grep -rn "diningTypeLabels\[" components/ app/ --include="*.tsx"

# nav.home が app-header の aria-label に残っていないこと
grep -n "nav\.home" components/app-header.tsx

# 日本語固定の「か所」が area-shop-list.tsx に残っていないこと
grep -n "か所" components/area-shop-list.tsx
```

### 本番確認ページ・確認幅

確認ページ: `/` / `/foods` / `/foods/[id]` / `/eaten` / `/areas` / `/areas/[id]` / `/stores` / `/settings`

確認言語: `ja` / `en` / `ko` / `zh-TW`

確認幅: `390` / `430` / `768` / `1280` / `1920`

### 確認項目チェックリスト

```
[ ] /areas でエリア名が各言語に切り替わる
[ ] /foods のカテゴリ・店舗種別・飲食タイプフィルターが各言語に切り替わる
[ ] /foods/[id] のカテゴリ・飲食タイプ・店舗種別表示が各言語に切り替わる
[ ] /eaten のジャンル名が各言語に切り替わる
[ ] /areas/[id] の販売場所リストの店舗種別が各言語に切り替わる
[ ] 下部ナビの aria-label が t("nav.label") になっている
[ ] 商品名は翻訳されていない（日本語のまま）
[ ] 店舗名は翻訳されていない（日本語のまま）
[ ] 価格表示は変わっていない
[ ] 日付表示は変わっていない
[ ] scripts/output/ が変更されていない
[ ] 店舗ID衝突修正 v1.1 が壊れていない（/stores: 63件・0 duplicate）
[ ] bottom-nav-and-language-switcher-v1 が壊れていない
[ ] overflow 0 / clipped 0 / 横スクロールなし（全幅・全ページ）
[ ] /areas/[id] の販売場所件数が ja / en / ko / zh-TW で自然に表示される
[ ] 「か所」「あと◯か所」が日本語固定で残っていない
[ ] diningType unknown fallback が日本語固定になっていない
[ ] area-shop-list.tsx に shopTypeLabels import が無い
```

### スクリーンショット

以下の証跡スクリーンショットを `screenshots/` に保存すること:

- `i18n-phase-b-areas-en-390.png` — `/areas` EN 表示
- `i18n-phase-b-foods-filter-en-390.png` — `/foods` フィルタ EN 表示
- `i18n-phase-b-food-detail-en-390.png` — `/foods/[id]` EN カテゴリ表示
- `i18n-phase-b-eaten-genre-en-390.png` — `/eaten` ジャンル別 EN 表示
- `i18n-phase-b-area-detail-shops-en-390.png` — `/areas/[id]` 販売場所 EN 表示
- `i18n-phase-b-areas-ko-390.png` — `/areas` KO 表示
- `i18n-phase-b-areas-zh-390.png` — `/areas` zh-TW 表示

---

## 完了条件

1. `npm run lint` / `npm run typecheck` / `npm run build` が全てパス
2. grep 検証で修正漏れが0件
3. 上記スクリーンショット全件保存済み
4. `git add . && git commit -m "implement-i18n-phase-b-area-category" && git push` 完了
