# Codex Goal: i18n 店舗名表示反映（B3）— /stores・/stores/[id]

## 目的

`data/translations/store-names.json` に追加済みの店舗名翻訳を、`/stores` と `/stores/[id]` の表示に反映する。

`getShopNameI18n(store.id, locale, store.name)` 経由で店舗名を表示する。翻訳がない場合は日本語名 fallback。

**商品名は今回変更しない。UI の店舗名表示のみが対象。**

---

## 作業開始前

```bash
git status
```

未コミット変更がある場合:
```bash
git add .
git commit -m "backup-before-i18n-store-name-display"
git push
```

未コミット変更がない場合:
```bash
git commit --allow-empty -m "backup-before-i18n-store-name-display"
git push
```

---

## 実装前確認（必ず実行すること）

```bash
grep -n "store\.name\|shop\.name" components/stores-overview.tsx
grep -n "store\.name\|shop\.name" app/stores/\\[id\\]/page.tsx
grep -n "getShopNameI18n" lib/i18n/name-translations.ts
grep -rn "StoreNameClient" components/ app/
```

確認目的:
- `stores-overview.tsx` での `store.name` 使用箇所の行番号を確認する
- `app/stores/[id]/page.tsx` での `store.name` 使用箇所の行番号を確認する
- `getShopNameI18n` のシグネチャが `(shopId: string, locale: Locale, fallback: string): string` であることを確認する
- `StoreNameClient` がまだ存在しないことを確認する

### ⚠️ ID対応確認（実装前に必ず実施すること）

`store-names.json` は `shops.generated.json` の42件を `shop.id` キーで作成している。
一方、`/stores` には63件のストアカードが表示されることがある。
`StoreWithFoods.id` が `store-names.json` のキーと対応しているかを確認すること。

```bash
grep -rn "type StoreWithFoods\|interface StoreWithFoods" types lib components app --include="*.ts" --include="*.tsx"
grep -n "id:\|shopId\|aliases\|sourceShop\|originalShopId" lib/store-utils.ts
grep -n "buildStoresFromFoods\|resolveStoreDisplayIds\|findStoreById" lib/store-utils.ts app/stores
```

確認項目:

- `StoreWithFoods.id` が `shop.id`（`shop-XXXXXXX` 形式）と同一か
- `StoreWithFoods` に `shopId` / `sourceShopId` / `originalShopId` / `aliases` 等、翻訳キーとして使うべき別フィールドがあるか
- `/stores` に表示される総ストアカード数と `store-names.json` の42件の関係
- 翻訳対象にできる店舗数（`store.id` が `store-names.json` に存在する件数）
- fallback になる店舗数（`store.id` が `store-names.json` に存在しない件数）

必要なら、`buildStoresFromFoods` が返す stores の `id` と `name` を一覧化し、`store-names.json` のキーと照合すること。

---

## 実装対象ファイル

| ファイル | 操作 |
|---|---|
| `components/store-name-client.tsx` | **新規作成** |
| `components/stores-overview.tsx` | **変更（店舗名表示のみ）** |
| `app/stores/[id]/page.tsx` | **変更（店舗名 h1 のみ）** |

---

## 実装内容

### 1. `components/store-name-client.tsx`（新規作成）

`app/stores/[id]/page.tsx` は Server Component のため `useLocale()` を直接呼べない。
`I18nText` と同じ Client Component island パターンで実装する。

```tsx
"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import { getShopNameI18n } from "@/lib/i18n/name-translations";

export function StoreNameClient({ shopId, fallback }: { shopId: string; fallback: string }) {
  const { locale } = useLocale();
  return <>{getShopNameI18n(shopId, locale, fallback)}</>;
}
```

**条件:**
- `"use client"` 必須
- `locale === "ja"` の場合は `fallback`（日本語名）がそのまま返される（`getShopNameI18n` の動作）
- `locale !== "ja"` で翻訳がない場合も `fallback` が返される（安全）

---

### ⚠️ getShopNameI18n に渡す ID の選択

`getShopNameI18n` の第1引数は、**必ず `store-names.json` のキーと一致する ID を使うこと**。

上記の実装前確認の結果に応じて、以下のいずれかを選択する:

1. **`store.id` が `store-names.json` のキーと一致する場合**:
   ```ts
   getShopNameI18n(store.id, locale, store.name)
   ```

2. **`store.id` が表示用 / URL 用 ID で、別に `shop.id` / `shopId` / `sourceShopId` 等が存在する場合**:
   ```ts
   getShopNameI18n(store.shopId /* 等、実際のフィールド名 */, locale, store.name)
   ```

3. **翻訳キーとして使える ID が存在しない場合**:
   実装を停止してレビュー担当に報告すること（後述の Stop and Ask Conditions 参照）。

絶対にやってはいけないこと:
- `lib/store-utils.ts` を変更して翻訳用 ID を追加する
- `store-names.json` のキーを `/stores` の表示 ID に合わせて変更する
- 日本語店舗名を翻訳キーにする
- URL 用 ID を翻訳名で変更する
- fallback が大量発生している状態を黙って先に進む

---

### 2. `components/stores-overview.tsx`（変更）

**現状の該当部分を確認してから変更すること。行番号は実行時に確認した値を使うこと。**

#### 変更 a: import 追加

既存の import 群に追加:
```tsx
import { getShopNameI18n } from "@/lib/i18n/name-translations";
import type { Locale } from "@/lib/i18n/locales";
```

#### 変更 b: `StoresOverview` 内で `locale` を取得

```tsx
// 変更前（現状）:
const { t } = useLocale();

// 変更後:
const { t, locale } = useLocale();
```

#### 変更 c: `StoreRow` の呼び出しに `locale` を渡す

```tsx
// 変更前（現状）:
<StoreRow key={store.id} store={store} representativeFood={pickRepresentativeFood(store)} />

// 変更後:
<StoreRow key={store.id} store={store} representativeFood={pickRepresentativeFood(store)} locale={locale} />
```

#### 変更 d: `StoreRow` 関数のシグネチャに `locale` を追加

```tsx
// 変更前（現状）:
function StoreRow({ store, representativeFood }: { store: StoreWithFoods; representativeFood?: FoodWithRelations }) {
  const badge = getStoreBadge(store);
  const summary = getStoreSummary(store, representativeFood);

// 変更後:
function StoreRow({ store, representativeFood, locale }: { store: StoreWithFoods; representativeFood?: FoodWithRelations; locale: Locale }) {
  const badge = getStoreBadge(store);
  const summary = getStoreSummary(store, representativeFood);
```

#### 変更 e: `StoreRow` 内の `{store.name}` を翻訳呼び出しに変更

`<h3>` の中の `{store.name}` を `getShopNameI18n` に変更する（実行前 grep で行番号確認）:

```tsx
// 変更前（現状）:
<h3 className="line-clamp-2 text-[0.98rem] font-black leading-[1.35] text-ink [overflow-wrap:anywhere] sm:text-[1.05rem]">
  {store.name}
</h3>

// 変更後:
<h3 className="line-clamp-2 text-[0.98rem] font-black leading-[1.35] text-ink [overflow-wrap:anywhere] sm:text-[1.05rem]">
  {getShopNameI18n(store.id, locale, store.name)}
</h3>
```

**注意:**
- `className` は一切変更しない
- `store.name` の参照は他に `alt={`${store.name}の代表商品`}` があるが、これは `alt` 属性（アクセシビリティ用）であり今回対象外
- `getStoreSummary` / `getStoreBadge` の呼び出しは変更しない

---

### 3. `app/stores/[id]/page.tsx`（変更）

#### 変更 a: import 追加

```tsx
import { StoreNameClient } from "@/components/store-name-client";
```

#### 変更 b: `<h1>` の `{store.name}` を `StoreNameClient` に変更

`<h1>` タグ内の `{store.name}` を差し替える（実行前 grep で行番号確認）:

```tsx
// 変更前（現状）:
<h1 className="text-3xl font-black leading-tight tracking-tight text-ink md:text-4xl">{store.name}</h1>

// 変更後:
<h1 className="text-3xl font-black leading-tight tracking-tight text-ink md:text-4xl">
  <StoreNameClient shopId={store.id} fallback={store.name} />
</h1>
```

**注意:**
- `className` は一切変更しない
- `store.areaName`（L51、L84 相当）は今回変更しない（エリア名は Phase B で対応済みだが、詳細ページでの反映は今回スコープ外）
- `storeSummary`（`getStoreSummary` の戻り値）は変更しない
- `StoreInfoItem` の `body={store.areaName}` は変更しない
- `StoreFoodList` は変更しない
- `getStoreTypeLabel` の出力は変更しない

---

## Stop and Ask Conditions

以下の状況が発生した場合は、**実装を停止してレビュー担当に報告すること**。

- `/stores` の `store.id` が `store-names.json` の42件キーと一致しない場合
- `/stores` が63件以上で、`store-names.json` 42件だけでは大半がfallbackになる場合
- `StoreWithFoods` に翻訳キーとして使える `shop.id` 相当の ID フィールドが存在しない場合
- `getShopNameI18n` に渡すべき ID が `store.id` なのか別フィールドなのか判断できない場合
- 店舗ID衝突修正 v1.1 の ID 生成ロジック（`buildStoresFromFoods` / `resolveStoreDisplayIds`）に手を入れる必要が出た場合
- `store-names.json` のキー変更が必要だと判断した場合

---

## 禁止事項

- `data/translations/store-names.json` を変更しない
- `data/translations/food-names.json` を変更しない
- 商品名を翻訳しない（`food.name` は変更しない）
- `lib/store-utils.ts` を変更しない
- `lib/food-utils.ts` を変更しない
- `lib/constants.ts` を変更しない
- `lib/i18n/dictionaries.ts` に店舗名を追加しない
- `lib/i18n/name-translations.ts` を変更しない
- `components/area-shop-list.tsx` を変更しない
- `components/store-food-list.tsx` を変更しない
- `components/home-dashboard.tsx` を変更しない
- `components/home-progress-client.tsx` を変更しない
- generated JSON を変更しない
- DB / crawler を変更しない
- URL 構造を変更しない（`/stores/[store.id]` の `store.id` はそのまま）
- localStorage schema を変更しない
- `food.id` / `shop.id` を変更しない
- 店舗ID衝突修正 v1.1 に関連する `buildStoresFromFoods` / `findStoreById` を変更しない
- 大規模リファクタ禁止
- 無関係な整形禁止

---

## 検証

### ビルド確認

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### カバレッジ確認（変化なしを確認）

```bash
npx ts-node scripts/check-translation-coverage.ts
```

期待出力（B2 から変化なし）:
```
=== Food Translation Coverage ===
total:        294
translated:   0
missing:      294
verified:     0
needs_review: 0
orphan:       0

=== Store Translation Coverage ===
total:        42
translated:   42
missing:      0
verified:     19
needs_review: 23
orphan:       0
```

### 表示確認

#### /stores（店舗一覧）

| ロケール | 確認内容 |
|---|---|
| ja（390px） | 店舗名が日本語のまま（例: キノピオ・カフェ） |
| en（390px） | 店舗名が英語（例: Kinopio's Café） |
| ko（390px） | 店舗名が韓国語（例: 키노피오 카페） |
| zh-TW（390px） | 店舗名が繁体字（例: 奇諾比奧咖啡廳） |

翻訳数の報告（en ロケールで確認）:
- `/stores` に表示される総店舗数
- 翻訳表示になった店舗数
- fallback で日本語表示のまま残った店舗数
- fallback がある場合、その理由（ID 不一致 / 翻訳 seed なし 等）

以下の既知店舗が翻訳表示されていることを確認すること:

| 日本語名 | en 期待値 |
|---|---|
| キノピオ・カフェ | Kinopio's Café |
| アミティ・アイスクリーム | Amity Ice Cream |
| 三本の箒 | Three Broomsticks |
| SAIDO | SAIDO |

#### /stores/[id]（店舗詳細）

| ロケール | 確認内容 |
|---|---|
| ja | `<h1>` が日本語店舗名（例: キノピオ・カフェ） |
| en | `<h1>` が英語店舗名（例: Kinopio's Café） |
| ko | `<h1>` が韓国語店舗名 |
| zh-TW | `<h1>` が繁体字店舗名 |

#### 商品名（全ロケールで変化なしを確認）

| ページ | 確認内容 |
|---|---|
| `/stores/[id]` 内の食べ物一覧 | 商品名が全ロケールで日本語のまま |
| `/foods` | 商品名が全ロケールで日本語のまま |

#### 既存機能保護確認

| 確認項目 | 確認方法 |
|---|---|
| `/` ホームが壊れていない | Home Phase D / C+ 維持確認 |
| `/stores` 店舗一覧が崩れていない | 各幅（390 / 430 / 768 / 1280 / 1920）で確認 |
| `/stores/[id]` 詳細が崩れていない | 各幅で確認 |
| `/foods` が壊れていない | i18n Phase B / C 維持確認 |
| `/settings` が壊れていない | |
| 店舗ID衝突修正 v1.1 | `lib/store-utils.ts` 未変更確認 |
| 店舗詳細内の食べ物一覧（StoreFoodList）| foods がリスト表示されていること |
| 店舗URLが変わっていない | `/stores/[store.id]` の store.id は hash 形式 |
| overflow 0 / clipped 0 / 横スクロールなし | 各ページ各幅で確認 |

---

## スクリーンショット保存

以下のスクリーンショットを保存すること:

```
screenshots/i18n-store-name-display-v1-stores-ja-390.png
screenshots/i18n-store-name-display-v1-stores-en-390.png
screenshots/i18n-store-name-display-v1-stores-ko-390.png
screenshots/i18n-store-name-display-v1-stores-zh-390.png
screenshots/i18n-store-name-display-v1-store-detail-en-390.png
screenshots/i18n-store-name-display-v1-store-detail-ko-390.png
```

---

## 作業完了後

```bash
git add .
git commit -m "implement-i18n-store-name-display"
git push
```

---

## Codex CLI 確認画面が出た場合

必ず **「Yes, and don't ask again」** を選択すること。

確認質問禁止。途中停止禁止。

---

## 完了報告に含めること

1. 作成・変更したファイル一覧（パス）
2. ID 対応確認の結果（`store.id` が `store-names.json` のキーと一致するか、翻訳に使った ID フィールド名）
3. `npm run lint` / `typecheck` / `build` の結果
4. `npx ts-node scripts/check-translation-coverage.ts` の実際の出力（全行）
5. `/stores` に表示された総店舗数 / 翻訳表示件数 / fallback 件数
6. 既知4店舗（キノピオ・カフェ / アミティ・アイスクリーム / 三本の箒 / SAIDO）の翻訳確認
7. `/stores/[id]` で en / ko の `<h1>` 翻訳確認結果
8. 商品名が全ロケールで日本語のままであることの確認
9. 各確認ページの overflow / clipped 結果
10. commit hash
