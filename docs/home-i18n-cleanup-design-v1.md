# Design: Home Phase D「ホーム内固定日本語・未i18n箇所整理」v1

**設計日:** 2026-06-17
**対象フェーズ:** Phase D（home-dashboard.tsx + home-progress-client.tsx の残存固定日本語を多言語化）
**前提:** i18n Phase C 承認済み・home-hero-brand-redesign 承認済み

---

## 1. 概要

ホーム画面に残存する固定日本語文字列を多言語化する。

対象は2ファイル:

- `components/home-dashboard.tsx` — Server Component（`"use client"` なし）
- `components/home-progress-client.tsx` — Client Component（`"use client"` あり）

今回は **固定文字列ラベルのみ** を対象とする。Phase C+ スコープ（`formatFoodPrice` / `getSaleUrgencyLabel` の i18n 化）は本フェーズに含めない。

---

## 2. 対象ファイルと Component 種別

| ファイル | 種別 | i18n 方式 |
|---|---|---|
| `components/home-dashboard.tsx` | Server Component | `<I18nText k="..." />` / `<I18nText k="..." params={{...}} />` |
| `components/home-progress-client.tsx` | Client Component | `const { t } = useLocale()` → `{t("...")}` / `{t("...", { count })}` |

**重要:** `home-dashboard.tsx` は Server Component であるため `useLocale()` を直接呼べない。`I18nText` コンポーネント（`components/i18n-text.tsx`）を使う。`I18nText` は `"use client"` 宣言済みで、`params` プロップによる補間をサポートする。

---

## 3. スコープ分類

### 今回対応（Phase D）

`home-dashboard.tsx` と `home-progress-client.tsx` の固定日本語文字列 — 15新規キー + 3既存キー再利用。

### Phase C+（本フェーズ対象外）

以下は今回変更しない。理由: `formatFoodPrice` / `getSaleUrgencyLabel` の置き換えには `useLocale()` の呼び出し構造変更が必要であり、別 Goal として設計する。

| 箇所 | 対応内容 |
|---|---|
| `HomeFoodRailCard` L245: `formatFoodPrice(food)` | `formatPriceI18n(food, locale)` への置き換え |
| `getHomeFoodChip` L449: `getSaleUrgencyLabel(food)` | `getUrgencyLabelI18n(food, t)` への置き換え |
| `getHomeFoodChip` L451: `"限定"` | `t("common.limited")` への置き換え |

### 既存仕様として残す（変更禁止）

| 箇所 | 理由 |
|---|---|
| `food.name`（全所） | 商品名は意図的に日本語固定。`settings.languageDescription` にも明記 |
| `appBrand.name`（HomeCollectionHero） | ブランド名として意図的に固定 |
| `"USJ FOOD COLLECTION"` kicker | 固定英字 kicker として意図的 |
| `collection.title`（period label 等） | 日付・期間文字列は Phase C で対応済み |

---

## 4. 固定日本語文字列インベントリ

### 4-A: `components/home-dashboard.tsx`

| 行 | 関数 | 文字列 | 対応方針 |
|---|---|---|---|
| L27 | `HomeDashboard` | `"エリア一覧"` | 新規キー `home.areasTitle` |
| L29 | `HomeDashboard` | `"全エリア"` | 新規キー `home.areasViewAll` |
| L48 | `StoresEntryCard` | `"店舗から探す"` | 新規キー `home.storesTitle` |
| L49 | `StoresEntryCard` | `"レストランやカートから買えるフードを確認できます。"` | 新規キー `home.storesDescription` |
| L52 | `StoresEntryCard` | `"店舗"` | 既存キー `common.store` 再利用 |
| L64 | `FoodRequestPrompt` | `"掲載されていない商品を見つけた？"` | 新規キー `home.requestPromptTitle` |
| L65 | `FoodRequestPrompt` | `"図鑑を完成させるための情報提供はこちら。"` | 新規キー `home.requestPromptDescription` |
| L68 | `FoodRequestPrompt` | `"情報提供する"` | 新規キー `home.requestPromptCta` |
| L83 | `ExploreAllCard` | `"図鑑に登録された{total}種類を写真で探せます。"` | 新規キー `home.exploreDescription`（`{{count}}` 補間） |
| L86 | `ExploreAllCard` | `"探す"` | 既存キー `common.search` 再利用 |

### 4-B: `components/home-progress-client.tsx`

| 行 | 関数 | 文字列 | 対応方針 |
|---|---|---|---|
| L137 | `HomeActiveFoodCollection` | `"すべて見る"` (desktop link) | 既存キー `common.viewAll` 再利用 |
| L149 | `HomeActiveFoodCollection` | `"すべて見る"` (mobile card) | 既存キー `common.viewAll` 再利用 |
| L150 | `HomeActiveFoodCollection` | `"登録済みコレクションへ"` (mobile card subtitle) | 新規キー `home.toRegisteredCollection` |
| L155 | `HomeActiveFoodCollection` | `"販売中の登録フードはすべて記録済みです。登録済みコレクションから写真を見返せます。"` | 新規キー `home.allCollectedMessage` |
| L156 | `HomeActiveFoodCollection` | `"探す"` (empty state link) | 既存キー `common.search` 再利用 |
| L181 | `HomeLimitedCollection` | `"コンプリート"` (badge) | 新規キー `home.limitedComplete` |
| L181 | `HomeLimitedCollection` | `` `あと ${remaining}品` `` (badge) | 新規キー `home.limitedRemaining`（`{{count}}` 補間） |
| L215 | `HomeRecentRecords` | `"最近の記録"` | 新規キー `home.recentRecordsTitle` |
| L216 | `HomeRecentRecords` | `"色づいたコレクションを見返す。"` | 新規キー `home.recentRecordsDescription` |
| L218 | `HomeRecentRecords` | `"アルバムを見る"` | 新規キー `home.viewAlbum` |

---

## 5. 再利用可能な既存キー（辞書変更不要）

| キー | ja | en | ko | zh-TW |
|---|---|---|---|---|
| `common.viewAll` | すべて見る | View All | 모두 보기 | 查看全部 |
| `common.store` | 店舗 | Store | 매장 | 店鋪 |
| `common.search` | 探す | Search | 찾기 | 搜尋 |

---

## 6. 新規辞書キー（15キー × 4ロケール）

以下を `lib/i18n/dictionaries.ts` の 4ロケール（ja / en / ko / zh-TW）それぞれの `home.*` セクションに追加する。

### `home.areasTitle`

| ロケール | 値 |
|---|---|
| ja | `"エリア一覧"` |
| en | `"Areas"` |
| ko | `"에리어 목록"` |
| zh-TW | `"區域列表"` |

### `home.areasViewAll`

| ロケール | 値 |
|---|---|
| ja | `"全エリア"` |
| en | `"All Areas"` |
| ko | `"전체 에리어"` |
| zh-TW | `"所有區域"` |

### `home.storesTitle`

| ロケール | 値 |
|---|---|
| ja | `"店舗から探す"` |
| en | `"Find by Store"` |
| ko | `"매장에서 찾기"` |
| zh-TW | `"依店鋪尋找"` |

### `home.storesDescription`

| ロケール | 値 |
|---|---|
| ja | `"レストランやカートから買えるフードを確認できます。"` |
| en | `"Check foods available at restaurants and food carts."` |
| ko | `"레스토랑이나 카트에서 살 수 있는 푸드를 확인할 수 있습니다."` |
| zh-TW | `"可以確認在餐廳或餐車購買的餐點。"` |

### `home.requestPromptTitle`

| ロケール | 値 |
|---|---|
| ja | `"掲載されていない商品を見つけた？"` |
| en | `"Found a food that's not listed?"` |
| ko | `"등록되지 않은 상품을 발견하셨나요?"` |
| zh-TW | `"發現沒有刊載的商品？"` |

### `home.requestPromptDescription`

| ロケール | 値 |
|---|---|
| ja | `"図鑑を完成させるための情報提供はこちら。"` |
| en | `"Send us info to help complete the catalog."` |
| ko | `"도감을 완성하기 위한 정보 제공은 이쪽입니다."` |
| zh-TW | `"提供資訊協助完成圖鑑請由此。"` |

### `home.requestPromptCta`

| ロケール | 値 |
|---|---|
| ja | `"情報提供する"` |
| en | `"Send Info"` |
| ko | `"정보 제공하기"` |
| zh-TW | `"提供資訊"` |

### `home.exploreDescription`（`{{count}}` 補間あり）

| ロケール | 値 |
|---|---|
| ja | `"図鑑に登録された{{count}}種類を写真で探せます。"` |
| en | `"Browse {{count}} items registered in the catalog by photo."` |
| ko | `"도감에 등록된 {{count}}종류를 사진으로 찾을 수 있습니다."` |
| zh-TW | `"可以用照片瀏覽圖鑑中登錄的{{count}}種餐點。"` |

### `home.toRegisteredCollection`

| ロケール | 値 |
|---|---|
| ja | `"登録済みコレクションへ"` |
| en | `"Registered Collection"` |
| ko | `"등록된 컬렉션으로"` |
| zh-TW | `"前往已登錄收藏"` |

### `home.allCollectedMessage`

| ロケール | 値 |
|---|---|
| ja | `"販売中の登録フードはすべて記録済みです。登録済みコレクションから写真を見返せます。"` |
| en | `"All registered foods currently on sale have been recorded. Browse your photos in the registered collection."` |
| ko | `"판매 중인 등록 푸드를 모두 기록했습니다. 등록된 컬렉션에서 사진을 다시 볼 수 있습니다."` |
| zh-TW | `"所有販售中的登錄餐點已全部記錄完成。可以在已登錄收藏中回顧照片。"` |

### `home.limitedComplete`

| ロケール | 値 |
|---|---|
| ja | `"コンプリート"` |
| en | `"Complete"` |
| ko | `"컴플리트"` |
| zh-TW | `"完成"` |

### `home.limitedRemaining`（`{{count}}` 補間あり）

| ロケール | 値 |
|---|---|
| ja | `"あと{{count}}品"` |
| en | `"{{count}} left"` |
| ko | `"앞으로 {{count}}개"` |
| zh-TW | `"還有{{count}}品"` |

### `home.recentRecordsTitle`

| ロケール | 値 |
|---|---|
| ja | `"最近の記録"` |
| en | `"Recent Records"` |
| ko | `"최근 기록"` |
| zh-TW | `"最近的記錄"` |

### `home.recentRecordsDescription`

| ロケール | 値 |
|---|---|
| ja | `"色づいたコレクションを見返す。"` |
| en | `"Revisit your colorful collection."` |
| ko | `"색을 입힌 컬렉션을 다시 봅니다."` |
| zh-TW | `"回顧染上色彩的收藏。"` |

### `home.viewAlbum`

| ロケール | 値 |
|---|---|
| ja | `"アルバムを見る"` |
| en | `"View Album"` |
| ko | `"앨범 보기"` |
| zh-TW | `"查看相簿"` |

---

## 7. コンポーネント別変更仕様

### 7-A: `components/home-dashboard.tsx`（Server Component）

`home-dashboard.tsx` は Server Component であるため `useLocale()` を使えない。`<I18nText k="..." />` を使う。`I18nText` は既に `import { I18nText } from "@/components/i18n-text"` でインポート済み。

#### HomeDashboard エリアセクション（L24〜L32）

```tsx
// Before
<h2 className="text-lg font-black text-ink">エリア一覧</h2>
// ...
<Link href="/areas" className="shrink-0 text-xs font-black text-park">全エリア</Link>

// After
<h2 className="text-lg font-black text-ink"><I18nText k="home.areasTitle" /></h2>
// ...
<Link href="/areas" className="shrink-0 text-xs font-black text-park"><I18nText k="home.areasViewAll" /></Link>
```

#### StoresEntryCard（L43〜L57）

```tsx
// Before
<h2 className="text-xl font-black text-ink">店舗から探す</h2>
<p className="mt-1 text-sm font-bold text-slate-500">レストランやカートから買えるフードを確認できます。</p>
// ...
<Link href="/stores" className="...">店舗</Link>

// After
<h2 className="text-xl font-black text-ink"><I18nText k="home.storesTitle" /></h2>
<p className="mt-1 text-sm font-bold text-slate-500"><I18nText k="home.storesDescription" /></p>
// ...
<Link href="/stores" className="..."><I18nText k="common.store" /></Link>
```

#### FoodRequestPrompt（L59〜L73）

```tsx
// Before
<p className="text-sm font-black text-ink">掲載されていない商品を見つけた？</p>
<p className="mt-1 text-xs font-bold leading-5 text-slate-500">図鑑を完成させるための情報提供はこちら。</p>
// ...
<a href={REQUEST_FORM_URL} ...>情報提供する</a>

// After
<p className="text-sm font-black text-ink"><I18nText k="home.requestPromptTitle" /></p>
<p className="mt-1 text-xs font-bold leading-5 text-slate-500"><I18nText k="home.requestPromptDescription" /></p>
// ...
<a href={REQUEST_FORM_URL} ...><I18nText k="home.requestPromptCta" /></a>
```

#### ExploreAllCard（L75〜L91）

```tsx
// Before
<p className="mt-1 text-sm font-bold text-slate-500">図鑑に登録された{total}種類を写真で探せます。</p>
// ...
<Link href="/foods" className="...">探す</Link>

// After
<p className="mt-1 text-sm font-bold text-slate-500">
  <I18nText k="home.exploreDescription" params={{ count: total }} />
</p>
// ...
<Link href="/foods" className="..."><I18nText k="common.search" /></Link>
```

### 7-B: `components/home-progress-client.tsx`（Client Component）

`useLocale()` は既に `const { t } = useLocale()` で呼ばれている各関数内で利用可能。

#### HomeActiveFoodCollection（L124〜L161）

- L137: `"すべて見る"` → `{t("common.viewAll")}`
- L149: `"すべて見る"` → `{t("common.viewAll")}`
- L150: `"登録済みコレクションへ"` → `{t("home.toRegisteredCollection")}`
- L155: 長文 → `{t("home.allCollectedMessage")}`
- L156: `"探す"` → `{t("common.search")}`

```tsx
// Before (L137)
<Link href="/foods" className="hidden shrink-0 text-xs font-black text-park lg:inline">すべて見る</Link>

// After
<Link href="/foods" className="hidden shrink-0 text-xs font-black text-park lg:inline">{t("common.viewAll")}</Link>
```

```tsx
// Before (L145〜L151 mobile card)
<Link href="/foods" className="flex min-h-[300px] ...">
  <span>すべて見る</span>
  <span className="mt-1 text-xs font-bold text-slate-500">登録済みコレクションへ</span>
</Link>

// After
<Link href="/foods" className="flex min-h-[300px] ...">
  <span>{t("common.viewAll")}</span>
  <span className="mt-1 text-xs font-bold text-slate-500">{t("home.toRegisteredCollection")}</span>
</Link>
```

```tsx
// Before (L154〜L157 empty state)
<div className="rounded-2xl bg-[#fffaf5] px-5 py-6 text-sm font-bold leading-7 text-slate-500">
  販売中の登録フードはすべて記録済みです。登録済みコレクションから写真を見返せます。
  <Link href="/foods" className="ml-2 font-black text-park">探す</Link>
</div>

// After
<div className="rounded-2xl bg-[#fffaf5] px-5 py-6 text-sm font-bold leading-7 text-slate-500">
  {t("home.allCollectedMessage")}
  <Link href="/foods" className="ml-2 font-black text-park">{t("common.search")}</Link>
</div>
```

#### HomeLimitedCollection（L163〜L204）

`HomeLimitedCollection` は `const { t } = useLocale()` が L164 に既に存在する。

```tsx
// Before (L181)
{complete ? "コンプリート" : `あと ${remaining}品`}

// After
{complete ? t("home.limitedComplete") : t("home.limitedRemaining", { count: remaining })}
```

#### HomeRecentRecords（L206〜L232）

`HomeRecentRecords` は現在 `useLocale()` を呼んでいない。`const { t } = useLocale()` を追加する必要がある。

```tsx
// Before
export function HomeRecentRecords({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();
  // ...
  <h2 className="text-xl font-black text-ink">最近の記録</h2>
  <p className="mt-1 text-xs font-bold text-slate-500">色づいたコレクションを見返す。</p>
  <Link href="/eaten" className="shrink-0 text-xs font-black text-park">アルバムを見る</Link>

// After
export function HomeRecentRecords({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
  // ...
  <h2 className="text-xl font-black text-ink">{t("home.recentRecordsTitle")}</h2>
  <p className="mt-1 text-xs font-bold text-slate-500">{t("home.recentRecordsDescription")}</p>
  <Link href="/eaten" className="shrink-0 text-xs font-black text-park">{t("home.viewAlbum")}</Link>
```

---

## 8. Server Component 制約サマリー

| 制約 | 対処 |
|---|---|
| `useLocale()` は Server Component で使えない | `<I18nText k="..." />` を使う |
| `params` 補間 | `<I18nText k="home.exploreDescription" params={{ count: total }} />` |
| `I18nText` は既にインポート済み | 追加インポート不要 |
| `home-dashboard.tsx` に `"use client"` を追加しない | Server Component のまま維持 |

---

## 9. 変更ファイルサマリー

### 変更（3ファイル）

| ファイル | 変更内容 |
|---|---|
| `lib/i18n/dictionaries.ts` | 15キー × 4ロケール = 60エントリ追加 |
| `components/home-dashboard.tsx` | 固定日本語10箇所を `<I18nText />` に置換 |
| `components/home-progress-client.tsx` | 固定日本語10箇所を `{t(...)}` に置換、`HomeRecentRecords` に `useLocale()` 追加 |

### 変更しないファイル（すべて保護）

| ファイル | 理由 |
|---|---|
| `lib/food-utils.ts` | Phase C+ 対象、今回スコープ外 |
| `lib/i18n/format-price.ts` | Phase C+ 対象、今回スコープ外 |
| `lib/i18n/sale-label-utils.ts` | Phase C+ 対象、今回スコープ外 |
| `components/home-progress-client.tsx` の `HomeFoodRailCard` / `getHomeFoodChip` | Phase C+ 対象、今回スコープ外 |
| `components/home-progress-client.tsx` の `HomeCollectionHero` | 承認済み home-hero-brand-redesign の保護 |
| `app/page.tsx` | Server Component、今回と無関係 |
| `components/app-header.tsx` | 承認済み bottom-nav / language-switcher の保護 |
| generated JSON / DB / crawler | 絶対変更禁止 |

---

## 10. 禁止事項

- `home-dashboard.tsx` に `"use client"` を追加しない（Server Component として維持）
- `lib/food-utils.ts` を変更しない
- `HomeCollectionHero` を変更しない（`appBrand.name` / kicker / tagline は保護）
- `HomeFoodRailCard` の `formatFoodPrice` を変更しない（Phase C+ スコープ）
- `getHomeFoodChip` を変更しない（Phase C+ スコープ）
- `food.name` を `t()` 経由にしない（商品名は日本語固定仕様）
- 無関係なリファクタ・整形をしない
- generated JSON / DB / crawler を変更しない

---

## 11. 検証方針

### grep 検証（実装後に全件 0件になるべきもの）

```bash
# home-dashboard.tsx 内の固定日本語残存確認
grep -n "エリア一覧\|全エリア\|店舗から探す\|レストランやカート\|掲載されていない\|図鑑を完成\|情報提供する\|種類を写真で" components/home-dashboard.tsx

# home-progress-client.tsx 内の固定日本語残存確認（Phase C+ 対象は除外）
grep -n "すべて見る\|登録済みコレクションへ\|記録済みです\|コンプリート\|あと.*品\|最近の記録\|色づいたコレクション\|アルバムを見る" components/home-progress-client.tsx
```

**期待結果:** すべて 0件

```bash
# home-dashboard.tsx に "use client" が追加されていないこと
grep -n '"use client"' components/home-dashboard.tsx
```

**期待結果:** 0件

```bash
# dictionaries.ts に新規キーが追加されていること（15キー）
grep -n '"home\.areasTitle"\|"home\.areasViewAll"\|"home\.storesTitle"\|"home\.storesDescription"\|"home\.requestPromptTitle"\|"home\.requestPromptDescription"\|"home\.requestPromptCta"\|"home\.exploreDescription"\|"home\.toRegisteredCollection"\|"home\.allCollectedMessage"\|"home\.limitedComplete"\|"home\.limitedRemaining"\|"home\.recentRecordsTitle"\|"home\.recentRecordsDescription"\|"home\.viewAlbum"' lib/i18n/dictionaries.ts | wc -l
```

**期待結果:** 60（15キー × 4ロケール）

```bash
# HomeCollectionHero の appBrand.name が保護されていること
grep -n "appBrand" components/home-progress-client.tsx
```

**期待結果:** 1件（L53 付近 `{appBrand.name}`）

```bash
# food-utils.ts が変更されていないこと
grep -n "formatFoodPrice\|getSaleUrgencyLabel" components/home-progress-client.tsx
```

**期待結果:** 各 1件（HomeFoodRailCard / getHomeFoodChip、Phase C+ 対象として残存）

### lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### スクリーンショット確認

| ファイル名 | 確認内容 |
|---|---|
| `home-i18n-cleanup-v1-ja-390.png` | ja: "エリア一覧" / "全エリア" / "店舗から探す" / "最近の記録" 等が日本語で表示 |
| `home-i18n-cleanup-v1-en-390.png` | en: "Areas" / "All Areas" / "Find by Store" / "Recent Records" 等が英語で表示 |
| `home-i18n-cleanup-v1-ko-390.png` | ko: 各ラベルが韓国語で表示 |
| `home-i18n-cleanup-v1-zh-390.png` | zh-TW: 各ラベルが繁体字で表示 |
| `home-i18n-cleanup-v1-ja-limited.png` | ja: "コンプリート" バッジ / "あとN品" バッジが正常表示 |
| `home-i18n-cleanup-v1-en-limited.png` | en: "Complete" / "N left" バッジが英語で表示 |

---

## 12. Stop and Ask 条件

以下の状況になったら作業を停止してレビュー担当に確認すること。

1. `home-dashboard.tsx` に `"use client"` を追加しなければならない状況になった場合
2. `HomeCollectionHero` を変更しなければならない状況になった場合
3. `lib/food-utils.ts` を変更しなければならない状況になった場合
4. `formatFoodPrice` または `getSaleUrgencyLabel` の置き換えが必要と判断した場合（Phase C+ として次 Goal で対応）
5. `home.exploreDescription` の `{{count}}` 補間が `I18nText` では動作しない場合（実装前に確認）
6. `HomeRecentRecords` に `useLocale()` を追加すると既存の `useFoodLogs()` と競合する場合
7. TypeScript で `TranslationKey` 型エラーが出て、15キーのいずれかが型定義に含まれていない場合（dictionaries.ts への追加後に typecheck が通ることを確認）

---

## 13. 申し送り

1. **Phase C+ 引き継ぎ**: `HomeFoodRailCard` の `formatFoodPrice` → `formatPriceI18n`、`getHomeFoodChip` の `getSaleUrgencyLabel` → `getUrgencyLabelI18n` + `"限定"` → `t("common.limited")` は次フェーズ（home-i18n-phase-c-plus）として別 Goal を設計する
2. **`home-unicole-logo` dead CSS**: `app/globals.css` に未使用定義が残存。次の清掃フェーズで削除可
3. **`lg:text-[1.45rem]` 調整候補**: HomeCollectionHero h1 の desktop サイズを `lg:text-[1.75rem]` に戻す場合は `components/home-progress-client.tsx` L52 の1点修正のみ
