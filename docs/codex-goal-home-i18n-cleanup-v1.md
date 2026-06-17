# Codex Goal: Home Phase D「ホーム内固定日本語・未i18n箇所整理」v1

## 概要

ホーム画面に残存する固定日本語文字列を多言語化する。

**変更対象（3ファイル）:**

- `lib/i18n/dictionaries.ts` — 15キー × 4ロケール = 60エントリ追加
- `components/home-dashboard.tsx` — 固定日本語を `<I18nText />` に置換
- `components/home-progress-client.tsx` — 固定日本語を `{t(...)}` に置換、`HomeRecentRecords` に `useLocale()` 追加

**参照設計書:** `docs/home-i18n-cleanup-design-v1.md`

---

## 禁止事項（最優先）

以下は**絶対にやってはいけない**。

- `home-dashboard.tsx` に `"use client"` を追加しない（Server Component として維持）
- `home-dashboard.tsx` で `useLocale()` を呼ばない
- `HomeCollectionHero` を変更しない（`appBrand.name` / "USJ FOOD COLLECTION" / `t("footer.tagline")` を保護）
- `HomeFoodRailCard` の `formatFoodPrice` を変更しない（Phase C+ スコープ）
- `getHomeFoodChip` を変更しない（Phase C+ スコープ）
- `lib/food-utils.ts` を変更しない
- `lib/store-utils.ts` を変更しない
- `lib/constants.ts` を変更しない
- `lib/i18n/format-price.ts` / `lib/i18n/format-date.ts` / `lib/i18n/sale-label-utils.ts` を変更しない
- `components/app-header.tsx` を変更しない
- `app/page.tsx` を変更しない
- `food.name` を `t()` 経由にしない（商品名は日本語固定仕様）
- generated JSON / DB / crawler を変更しない
- 無関係なリファクタ・整形をしない

---

## Git 作業前処理

```bash
git status
```

**未コミット変更がある場合:**
```bash
git add .
git commit -m "backup-before-home-i18n-cleanup"
git push
```

**未コミット変更がない場合:**
```bash
git commit --allow-empty -m "backup-before-home-i18n-cleanup"
git push
```

---

## Step 1: `lib/i18n/dictionaries.ts` に 15キーを追加

4ロケール（ja / en / ko / zh-TW）それぞれの `home.*` セクションに以下を追加する。既存の `home.collectionCount` の直後に挿入するとよい。

### ja ロケールに追加

```ts
"home.areasTitle": "エリア一覧",
"home.areasViewAll": "全エリア",
"home.storesTitle": "店舗から探す",
"home.storesDescription": "レストランやカートから買えるフードを確認できます。",
"home.requestPromptTitle": "掲載されていない商品を見つけた？",
"home.requestPromptDescription": "図鑑を完成させるための情報提供はこちら。",
"home.requestPromptCta": "情報提供する",
"home.exploreDescription": "図鑑に登録された{{count}}種類を写真で探せます。",
"home.toRegisteredCollection": "登録済みコレクションへ",
"home.allCollectedMessage": "販売中の登録フードはすべて記録済みです。登録済みコレクションから写真を見返せます。",
"home.limitedComplete": "コンプリート",
"home.limitedRemaining": "あと{{count}}品",
"home.recentRecordsTitle": "最近の記録",
"home.recentRecordsDescription": "色づいたコレクションを見返す。",
"home.viewAlbum": "アルバムを見る",
```

### en ロケールに追加

```ts
"home.areasTitle": "Areas",
"home.areasViewAll": "All Areas",
"home.storesTitle": "Find by Store",
"home.storesDescription": "Check foods available at restaurants and food carts.",
"home.requestPromptTitle": "Found a food that's not listed?",
"home.requestPromptDescription": "Send us info to help complete the catalog.",
"home.requestPromptCta": "Send Info",
"home.exploreDescription": "Browse {{count}} items registered in the catalog by photo.",
"home.toRegisteredCollection": "Registered Collection",
"home.allCollectedMessage": "All registered foods currently on sale have been recorded. Browse your photos in the registered collection.",
"home.limitedComplete": "Complete",
"home.limitedRemaining": "{{count}} left",
"home.recentRecordsTitle": "Recent Records",
"home.recentRecordsDescription": "Revisit your colorful collection.",
"home.viewAlbum": "View Album",
```

### ko ロケールに追加

```ts
"home.areasTitle": "에리어 목록",
"home.areasViewAll": "전체 에리어",
"home.storesTitle": "매장에서 찾기",
"home.storesDescription": "레스토랑이나 카트에서 살 수 있는 푸드를 확인할 수 있습니다.",
"home.requestPromptTitle": "등록되지 않은 상품을 발견하셨나요?",
"home.requestPromptDescription": "도감을 완성하기 위한 정보 제공은 이쪽입니다.",
"home.requestPromptCta": "정보 제공하기",
"home.exploreDescription": "도감에 등록된 {{count}}종류를 사진으로 찾을 수 있습니다.",
"home.toRegisteredCollection": "등록된 컬렉션으로",
"home.allCollectedMessage": "판매 중인 등록 푸드를 모두 기록했습니다. 등록된 컬렉션에서 사진을 다시 볼 수 있습니다.",
"home.limitedComplete": "컴플리트",
"home.limitedRemaining": "앞으로 {{count}}개",
"home.recentRecordsTitle": "최근 기록",
"home.recentRecordsDescription": "색을 입힌 컬렉션을 다시 봅니다.",
"home.viewAlbum": "앨범 보기",
```

### zh-TW ロケールに追加

```ts
"home.areasTitle": "區域列表",
"home.areasViewAll": "所有區域",
"home.storesTitle": "依店鋪尋找",
"home.storesDescription": "可以確認在餐廳或餐車購買的餐點。",
"home.requestPromptTitle": "發現沒有刊載的商品？",
"home.requestPromptDescription": "提供資訊協助完成圖鑑請由此。",
"home.requestPromptCta": "提供資訊",
"home.exploreDescription": "可以用照片瀏覽圖鑑中登錄的{{count}}種餐點。",
"home.toRegisteredCollection": "前往已登錄收藏",
"home.allCollectedMessage": "所有販售中的登錄餐點已全部記錄完成。可以在已登錄收藏中回顧照片。",
"home.limitedComplete": "完成",
"home.limitedRemaining": "還有{{count}}品",
"home.recentRecordsTitle": "最近的記錄",
"home.recentRecordsDescription": "回顧染上色彩的收藏。",
"home.viewAlbum": "查看相簿",
```

---

## Step 2: `components/home-dashboard.tsx` を変更

`home-dashboard.tsx` は Server Component（`"use client"` なし）。`useLocale()` は使えない。`I18nText` は既にインポート済みなので追加インポート不要。

### HomeDashboard エリアセクション（L24〜L32 付近）

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

### StoresEntryCard（L43〜L57 付近）

```tsx
// Before
<h2 className="text-xl font-black text-ink">店舗から探す</h2>
<p className="mt-1 text-sm font-bold text-slate-500">レストランやカートから買えるフードを確認できます。</p>
// ...
<Link href="/stores" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink active:scale-[0.98]">
  店舗
</Link>

// After
<h2 className="text-xl font-black text-ink"><I18nText k="home.storesTitle" /></h2>
<p className="mt-1 text-sm font-bold text-slate-500"><I18nText k="home.storesDescription" /></p>
// ...
<Link href="/stores" className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-ink active:scale-[0.98]">
  <I18nText k="common.store" />
</Link>
```

### FoodRequestPrompt（L59〜L73 付近）

```tsx
// Before
<p className="text-sm font-black text-ink">掲載されていない商品を見つけた？</p>
<p className="mt-1 text-xs font-bold leading-5 text-slate-500">図鑑を完成させるための情報提供はこちら。</p>
// ...
<a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink active:scale-[0.98]">
  情報提供する
</a>

// After
<p className="text-sm font-black text-ink"><I18nText k="home.requestPromptTitle" /></p>
<p className="mt-1 text-xs font-bold leading-5 text-slate-500"><I18nText k="home.requestPromptDescription" /></p>
// ...
<a href={REQUEST_FORM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-ink active:scale-[0.98]">
  <I18nText k="home.requestPromptCta" />
</a>
```

### ExploreAllCard（L75〜L91 付近）

`total` は Props から渡される数値。`params={{ count: total }}` で補間する。

```tsx
// Before
<p className="mt-1 text-sm font-bold text-slate-500">図鑑に登録された{total}種類を写真で探せます。</p>
// ...
<Link href="/foods" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-sm active:scale-[0.98]">
  探す
</Link>

// After
<p className="mt-1 text-sm font-bold text-slate-500">
  <I18nText k="home.exploreDescription" params={{ count: total }} />
</p>
// ...
<Link href="/foods" className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ink px-5 text-sm font-black text-white shadow-sm active:scale-[0.98]">
  <I18nText k="common.search" />
</Link>
```

---

## Step 3: `components/home-progress-client.tsx` を変更

`home-progress-client.tsx` は Client Component（`"use client"` 済み）。`useLocale()` を使う。

### HomeActiveFoodCollection（L124〜L161 付近）

`const { t } = useLocale()` は L125 に既存。追加不要。

```tsx
// Before (L137)
<Link href="/foods" className="hidden shrink-0 text-xs font-black text-park lg:inline">すべて見る</Link>

// After
<Link href="/foods" className="hidden shrink-0 text-xs font-black text-park lg:inline">{t("common.viewAll")}</Link>
```

```tsx
// Before (mobile card, L145〜L151)
<Link
  href="/foods"
  className="flex min-h-[300px] w-[74vw] max-w-[300px] shrink-0 snap-start flex-col justify-end rounded-[1.25rem] bg-[#fffaf5] p-5 text-sm font-black text-ink ring-1 ring-[#eadcc8] lg:hidden"
>
  <span>すべて見る</span>
  <span className="mt-1 text-xs font-bold text-slate-500">登録済みコレクションへ</span>
</Link>

// After
<Link
  href="/foods"
  className="flex min-h-[300px] w-[74vw] max-w-[300px] shrink-0 snap-start flex-col justify-end rounded-[1.25rem] bg-[#fffaf5] p-5 text-sm font-black text-ink ring-1 ring-[#eadcc8] lg:hidden"
>
  <span>{t("common.viewAll")}</span>
  <span className="mt-1 text-xs font-bold text-slate-500">{t("home.toRegisteredCollection")}</span>
</Link>
```

```tsx
// Before (empty state, L154〜L157)
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

### HomeLimitedCollection（L163〜L204 付近）

`const { t } = useLocale()` は L164 に既存。追加不要。

```tsx
// Before (L181)
{complete ? "コンプリート" : `あと ${remaining}品`}

// After
{complete ? t("home.limitedComplete") : t("home.limitedRemaining", { count: remaining })}
```

### HomeRecentRecords（L206〜L232 付近）

`useLocale()` がまだ呼ばれていないため追加する。

```tsx
// Before
export function HomeRecentRecords({ foods }: { foods: FoodWithRelations[] }) {
  const { logs } = useFoodLogs();

// After
export function HomeRecentRecords({ foods }: { foods: FoodWithRelations[] }) {
  const { t } = useLocale();
  const { logs } = useFoodLogs();
```

```tsx
// Before (L215〜L218)
<h2 className="text-xl font-black text-ink">最近の記録</h2>
<p className="mt-1 text-xs font-bold text-slate-500">色づいたコレクションを見返す。</p>
// ...
<Link href="/eaten" className="shrink-0 text-xs font-black text-park">アルバムを見る</Link>

// After
<h2 className="text-xl font-black text-ink">{t("home.recentRecordsTitle")}</h2>
<p className="mt-1 text-xs font-bold text-slate-500">{t("home.recentRecordsDescription")}</p>
// ...
<Link href="/eaten" className="shrink-0 text-xs font-black text-park">{t("home.viewAlbum")}</Link>
```

---

## Step 4: 変更確認（grep）

```bash
# home-dashboard.tsx 内の固定日本語残存確認（0件が正）
grep -n "エリア一覧\|全エリア\|店舗から探す\|レストランやカート\|掲載されていない\|図鑑を完成\|情報提供する\|種類を写真で" components/home-dashboard.tsx

# home-progress-client.tsx 内の対象固定日本語残存確認（0件が正）
grep -n "すべて見る\|登録済みコレクションへ\|記録済みです\|コンプリート\|あと.*品\|最近の記録\|色づいたコレクション\|アルバムを見る" components/home-progress-client.tsx

# home-dashboard.tsx に "use client" がないこと（0件が正）
grep -n '"use client"' components/home-dashboard.tsx

# dictionaries.ts に新規キーが60件追加されていること（60が正）
grep -n '"home\.areasTitle"\|"home\.areasViewAll"\|"home\.storesTitle"\|"home\.storesDescription"\|"home\.requestPromptTitle"\|"home\.requestPromptDescription"\|"home\.requestPromptCta"\|"home\.exploreDescription"\|"home\.toRegisteredCollection"\|"home\.allCollectedMessage"\|"home\.limitedComplete"\|"home\.limitedRemaining"\|"home\.recentRecordsTitle"\|"home\.recentRecordsDescription"\|"home\.viewAlbum"' lib/i18n/dictionaries.ts | wc -l

# HomeCollectionHero の appBrand が保護されていること（1件が正）
grep -n "appBrand" components/home-progress-client.tsx

# Phase C+ 対象が残存していること（各1件が正）
grep -n "formatFoodPrice\|getSaleUrgencyLabel" components/home-progress-client.tsx
```

**期待結果:**

| grep | 期待 |
|---|---|
| `home-dashboard.tsx` 固定日本語 | 0件 |
| `home-progress-client.tsx` 固定日本語 | 0件 |
| `home-dashboard.tsx` `"use client"` | 0件 |
| `dictionaries.ts` 新規キー count | 60 |
| `appBrand` in `home-progress-client.tsx` | 1件（HomeCollectionHero 保護確認） |
| `formatFoodPrice` / `getSaleUrgencyLabel` | 各1件（Phase C+ 残存確認） |

---

## Step 5: lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。エラーが出た場合は修正してから次へ進む。

TypeScript が `TranslationKey` 型エラーを出す場合、`dictionaries.ts` への追加が不完全な可能性がある。4ロケール全部に同じキーが追加されているか確認すること。

---

## Step 6: スクリーンショット保存

以下のスクリーンショットを `screenshots/` に保存すること。

| ファイル名 | URL | 言語 | 幅 | 確認内容 |
|---|---|---|---|---|
| `home-i18n-cleanup-v1-ja-390.png` | `/` | ja | 390 | エリア一覧 / 店舗から探す / 情報提供する が日本語で表示 |
| `home-i18n-cleanup-v1-en-390.png` | `/` | en | 390 | Areas / Find by Store / Send Info が英語で表示 |
| `home-i18n-cleanup-v1-ko-390.png` | `/` | ko | 390 | 에리어 목록 / 매장에서 찾기 / 정보 제공하기 が韓国語で表示、「。」なし |
| `home-i18n-cleanup-v1-zh-390.png` | `/` | zh-TW | 390 | 區域列表 / 依店鋪尋找 / 提供資訊 が繁体字で表示 |
| `home-i18n-cleanup-v1-ja-limited.png` | `/` | ja | 390 | 期間限定コレクションで「コンプリート」/ 「あとN品」バッジ確認 |
| `home-i18n-cleanup-v1-en-limited.png` | `/` | en | 390 | 期間限定コレクションで「Complete」/ 「N left」バッジ確認 |

追加確認（スクリーンショット不要でも目視確認）:

- ja / en / ko / zh-TW の 768px / 1280px / 1920px でレイアウト崩れなし
- HomeCollectionHero（"USJ FOOD COLLECTION" kicker + "ユニバフードコレクション" h1 + tagline）が各ロケールで維持
- 棚グリッド・コレクション数・残り品数・プログレスバーが正常
- 期間限定コレクションが正常
- bottom-nav アクティブ状態が正常
- language-switcher が正常
- overflow: 0 / clipped: 0 / 横スクロール: 0

---

## Step 7: 動作確認チェックリスト

### home-dashboard.tsx の置換確認

- [ ] ja で「エリア一覧」「全エリア」が表示される
- [ ] en で「Areas」「All Areas」が表示される
- [ ] ja で「店舗から探す」「レストランやカートから〜」が表示される
- [ ] en で「Find by Store」「Check foods available at〜」が表示される
- [ ] ja で「情報提供する」ボタンが表示される
- [ ] en で「Send Info」ボタンが表示される
- [ ] ja で「図鑑に登録されたN種類を写真で探せます。」が表示される（N は実際の件数）
- [ ] en で「Browse N items registered in the catalog by photo.」が表示される
- [ ] ja で「探す」ボタン（ExploreAllCard）が表示される
- [ ] en で「Search」ボタン（ExploreAllCard）が表示される
- [ ] ja で「店舗」ボタン（StoresEntryCard）が表示される
- [ ] en で「Store」ボタン（StoresEntryCard）が表示される

### home-progress-client.tsx の置換確認

- [ ] ja で「すべて見る」リンクが表示される（HomeActiveFoodCollection desktop）
- [ ] en で「View All」リンクが表示される
- [ ] ja で mobile カードの「すべて見る」/「登録済みコレクションへ」が表示される
- [ ] en で「View All」/「Registered Collection」が表示される
- [ ] 空状態: ja で「販売中の登録フードはすべて〜」が表示される
- [ ] 空状態: en で英語文が表示される
- [ ] HomeLimitedCollection: ja で「コンプリート」/「あとN品」バッジが表示される
- [ ] HomeLimitedCollection: en で「Complete」/「N left」バッジが表示される
- [ ] HomeRecentRecords: ja で「最近の記録」/「色づいたコレクションを見返す。」/「アルバムを見る」が表示される
- [ ] HomeRecentRecords: en で「Recent Records」/「Revisit your colorful collection.」/「View Album」が表示される

### 保護確認

- [ ] HomeCollectionHero が変更されていない（"USJ FOOD COLLECTION" / "ユニバフードコレクション" / tagline）
- [ ] `formatFoodPrice` が `HomeFoodRailCard` に残存（Phase C+ 未対応で OK）
- [ ] `getSaleUrgencyLabel` が `getHomeFoodChip` に残存（Phase C+ 未対応で OK）
- [ ] `home-dashboard.tsx` に `"use client"` がない
- [ ] 棚グリッド（食べた ✓ マーク）が正常表示
- [ ] bottom-nav アクティブ状態が正常
- [ ] language-switcher が正常
- [ ] /foods / /areas / /stores / /settings が壊れていない
- [ ] ko の文言に日本語句点「。」が混ざっていない

---

## Stop and Ask Conditions

以下の状況になったら作業を停止してレビュー担当に確認すること。

1. `home-dashboard.tsx` に `"use client"` を追加しなければならない状況になった場合
2. `HomeCollectionHero` を変更しなければならない状況になった場合
3. `lib/food-utils.ts` / `lib/constants.ts` を変更しなければならない状況になった場合
4. `formatFoodPrice` または `getSaleUrgencyLabel` の置き換えが必要と判断した場合
5. `home.exploreDescription` の `params={{ count: total }}` 補間で TypeScript エラーが解消しない場合
6. `HomeRecentRecords` に `useLocale()` を追加すると既存の `useFoodLogs()` 呼び出しと競合する場合
7. `npm run typecheck` で `TranslationKey` 型エラーが出て、原因が特定できない場合
8. `npm run build` が失敗し、原因が今回変更した3ファイル以外にある場合

---

## Git コミット

```bash
git add .
git commit -m "implement-home-i18n-cleanup"
git push
```

---

## 変更ファイル一覧

### 変更（3ファイル）

| ファイル | 変更内容 |
|---|---|
| `lib/i18n/dictionaries.ts` | 15キー × 4ロケール = 60エントリ追加 |
| `components/home-dashboard.tsx` | 固定日本語10箇所を `<I18nText />` に置換 |
| `components/home-progress-client.tsx` | 固定日本語10箇所を `{t(...)}` に置換、`HomeRecentRecords` に `useLocale()` 追加 |

### 変更しないファイル

| ファイル | 理由 |
|---|---|
| `lib/food-utils.ts` | Phase C+ 対象 |
| `lib/i18n/format-price.ts` | Phase C+ 対象 |
| `lib/i18n/sale-label-utils.ts` | Phase C+ 対象 |
| `lib/constants.ts` | 変更不要 |
| `lib/store-utils.ts` | 変更不要 |
| `components/app-header.tsx` | 承認済み構成の保護 |
| `app/page.tsx` | 変更不要 |
| generated JSON / DB / crawler | 絶対変更禁止 |
