# app-internationalization-data-design-v1

設計日: 2026-06-16
設計者: Claude（プロダクト責任者・UXデザイナー・UIデザイナー）
対象: データ多言語化・言語切替UI・価格表示・下部ナビ改善

---

## 1. Objective

i18n Phase 2A〜2D-D で完了済みのUI固定文言多言語化（ja/en/ko/zh-TW）を、**商品名・店舗名・エリア名・カテゴリ名・価格表示・日付・ユーザー記録メモ・generated JSON由来データ**へ拡張する。

あわせて、現在 `/settings` 画面のみにある言語切替UIをヘッダーに追加し、下部ナビのアクティブ状態不在・背景暗転問題を改善する。

**最重要制約:**
- 日本円（¥）を必ず残す
- 商品名・店舗名は人間確認済み翻訳のみ表示（機械翻訳自動適用禁止）
- generated JSON を編集しない
- DB・crawler・store-utils.ts を変更しない
- 店舗ID衝突修正 v1.1 を壊さない

---

## 2. Current State

### 完了済み
- `lib/i18n/dictionaries.ts`: ja/en/ko/zh-TW の全UI固定文言（nav・footer・settings・foods・stores・areas・eaten・foodDetail 等 230+ キー）を収録済み
- `components/language-switcher.tsx`: `/settings` 専用の4言語切替カード
- `components/app-header.tsx`: デスクトップヘッダー + モバイル下部ナビ（両者に言語切替なし）
- `lib/i18n/locales.ts`: `supportedLocales = ["ja", "en", "ko", "zh-TW"]`、`localeStorageKey = "unicolle-locale"`
- `settings.languageDescription`: 「商品名・店舗名・エリア名は現地で見つけやすいよう日本語のまま表示します」と明示（今後変更予定）

### 未対応
- `lib/constants.ts` の `categoryLabels`・`shopTypeLabels`・`diningTypeLabels` が日本語固定
- 商品名・店舗名・エリア名は全言語で日本語のまま
- 価格は `¥` 表示のみ（換算なし）
- 日付表示はロケール非対応（固定フォーマット）
- 下部ナビにアクティブ状態表示なし（全項目が同色の `text-slate-600`）
- ヘッダーに言語切替ボタンなし

---

## 3. Translation Scope

| 対象 | 翻訳方針 | 優先度 |
|---|---|---|
| UI固定文言 | 完了済み | — |
| エリア名 | 公式英語名あり → 辞書に追加 | 高（小規模・安定） |
| カテゴリ名・ジャンル名 | 辞書キー化（全4言語） | 高（有限・固定） |
| 店舗名 | 公式英語名優先・別翻訳ファイル管理 | 中（変動あり） |
| 商品名 | 別翻訳ファイル管理・公式優先 | 中（量多・未確認多） |
| 価格表示 | JPY正本 + 補助通貨（静的レート） | 中 |
| 日付表示 | Intl.DateTimeFormat でロケール対応 | 中 |
| ユーザーメモ | 翻訳対象外（原文保持） | 低 |

---

## 4. Data Translation Policy

### 正本言語: `ja`
- すべての名称・表記の正本は日本語（generated JSON の `name` フィールド）
- 翻訳データは別ファイルで管理し、generated JSON を一切編集しない

### fallback チェーン
```
locale (en/ko/zh-TW)
  → 翻訳ファイルに該当IDのエントリがあれば翻訳名を表示
  → なければ ja（generated JSON の name）をそのまま表示
  → ja も空であれば "—" を表示
```

### 翻訳未確認時の表示
- 翻訳が存在しない商品名・店舗名は **日本語をそのまま表示**する
- 「未翻訳」「[Translation pending]」などの接頭辞は**付けない**
- 理由: 現地（USJ）で日本語表記のみのケースが多く、日本語をそのまま使えば現地で発見しやすい

### 翻訳の責任範囲
- 公式USJサイト（ja/en）からの公式表記: **確定表記として採用**
- 人間が確認・登録した翻訳: **採用**
- 機械翻訳・AI自動生成: **不採用**（管理UIでの確認プロセスを経るまで）

---

## 5. Product Name Translation Plan

### ファイル設計

新規ファイル: `scripts/output/translations/food-names.json`

```json
{
  "food-62sv4l": {
    "en": "Super Star Anniversary Plate ~Mushroom Lasagna & Fried Chicken~",
    "ko": null,
    "zh-TW": null,
    "sources": {
      "en": "official"
    },
    "verified": true,
    "verifiedAt": "2026-06-16"
  },
  "food-xxxxx": {
    "en": null,
    "ko": null,
    "zh-TW": null,
    "sources": {},
    "verified": false
  }
}
```

**フィールド仕様:**

| フィールド | 型 | 説明 |
|---|---|---|
| `en` / `ko` / `zh-TW` | `string \| null` | 翻訳名。null = 未翻訳（jaにfallback） |
| `sources[locale]` | `"official" \| "human"` | 翻訳の出典 |
| `verified` | `boolean` | 人間確認済みか |
| `verifiedAt` | `string \| undefined` | 確認日 |

### ルックアップ実装（表示層のみ）

新規関数: `lib/food-translations.ts`

```ts
import type { Locale } from "@/lib/i18n/locales";
import foodNamesRaw from "@/scripts/output/translations/food-names.json";

type FoodTranslation = {
  en?: string | null;
  ko?: string | null;
  "zh-TW"?: string | null;
};

const foodNames = foodNamesRaw as Record<string, FoodTranslation>;

export function getFoodName(foodId: string, jaName: string, locale: Locale): string {
  if (locale === "ja") return jaName;
  const entry = foodNames[foodId];
  const translated = entry?.[locale];
  return translated ?? jaName; // fallback to ja
}
```

### 初期対応方針
- Phase 1 実装時: ファイルは空オブジェクト `{}` から開始
- 全商品は日本語表示（既存と変わらない）
- 翻訳エントリは個別に追加・確認するデータ作業として後続フェーズで対応
- 公式USJサイト英語版から取得できる商品名から優先的に追加

### UI崩れ対策
- 商品カード: `line-clamp-2` で2行折り返しを保証（既存）
- 詳細ページH1: `leading-tight` + `text-3xl md:text-4xl`（既存）
- 英語名・韓国語名が長くなる場合は `break-words` を確認
- 追加対応: 翻訳名が日本語名より著しく長い場合の折り返し耐性を確認してからリリース

---

## 6. Store Name Translation Plan

### ファイル設計

新規ファイル: `scripts/output/translations/store-names.json`

インデックスキー: `${cleanName}|${areaName}`（`buildStoreIdentityKey` と同じ正規化ロジック）

```json
{
  "ホッグズ・ヘッド|ウィザーディング・ワールド・オブ・ハリー・ポッター": {
    "en": "Hog's Head",
    "ko": null,
    "zh-TW": null,
    "sources": { "en": "official" },
    "verified": true
  },
  "三本の箒|ウィザーディング・ワールド・オブ・ハリー・ポッター": {
    "en": "Three Broomsticks",
    "ko": null,
    "zh-TW": null,
    "sources": { "en": "official" },
    "verified": true
  },
  "キノピオ・カフェ|スーパー・ニンテンドー・ワールド": {
    "en": "Kinopio's Cafe",
    "ko": null,
    "zh-TW": null,
    "sources": { "en": "official" },
    "verified": true
  }
}
```

### 重要: 店舗ID衝突修正との整合性

- インデックスキーは店舗名+エリア名の正規化済み文字列（`buildStoreIdentityKey` 由来）を使う
- 店舗ID（`shop-1tt48e8` 等）は使わない（ID変動リスクがあるため）
- `buildStoresFromFoods` のコアロジックを一切変更しない
- URL slug（`store.id`）は変更しない

### ルックアップ実装

```ts
// lib/store-translations.ts
export function getStoreName(store: { name: string; areaName: string }, locale: Locale): string {
  if (locale === "ja") return store.name;
  const key = buildStoreNameKey(store.name, store.areaName);
  const translated = storeNames[key]?.[locale];
  return translated ?? store.name; // fallback to ja
}
```

### 優先翻訳リスト（Phase 1 に入れる公式英語名）

| 日本語名 | 英語（公式） |
|---|---|
| ホッグズ・ヘッド | Hog's Head |
| 三本の箒 | Three Broomsticks |
| キノピオ・カフェ | Kinopio's Cafe |
| メルズ・ドライブイン | Mel's Drive-In |
| ハピネス・カフェ | Happiness Cafe |
| ミニオン・ハッピー・キッチン | Minion Happy Kitchen |

韓国語・繁体字は公式ソースがある場合のみ追加。ない場合はfallback（日本語）。

---

## 7. Area Name Translation Plan

### 実装方式: 辞書キーに直接追加

エリア名は**10エリア固定・安定**なので、`translations/` ファイルではなく `dictionaries.ts` の `area.name.*` キーとして4言語すべてに追加する。

### 追加キー案

```ts
// dictionaries.ts に追加するキー
"area.name.スーパー・ニンテンドー・ワールド": {
  ja: "スーパー・ニンテンドー・ワールド",
  en: "Super Nintendo World",
  ko: "슈퍼 닌텐도 월드",
  "zh-TW": "超級任天堂世界"
},
"area.name.ウィザーディング・ワールド・オブ・ハリー・ポッター": {
  ja: "ウィザーディング・ワールド・オブ・ハリー・ポッター",
  en: "The Wizarding World of Harry Potter",
  ko: "위저딩 월드 오브 해리 포터",
  "zh-TW": "哈利波特魔法世界"
},
// ... 他エリアも同様
```

### ルックアップ実装

```ts
// lib/area-translations.ts
export function getAreaName(jaName: string, t: TranslationFn): string {
  const key = `area.name.${jaName}` as TranslationKey;
  const translated = t(key);
  // t() がキーをそのまま返す（未定義時）場合は jaName にfallback
  return translated !== key ? translated : jaName;
}
```

### エリア名テーブル（全10エリア、公式英語名）

| 日本語 | 英語 | 韓国語 | 繁体字 |
|---|---|---|---|
| スーパー・ニンテンドー・ワールド | Super Nintendo World | 슈퍼 닌텐도 월드 | 超級任天堂世界 |
| ウィザーディング・ワールド・オブ・ハリー・ポッター | The Wizarding World of Harry Potter | 위저딩 월드 오브 해리 포터 | 哈利波特魔法世界 |
| ミニオン・パーク | Minion Park | 미니언 파크 | 小小兵樂園 |
| ユニバーサル・ワンダーランド | Universal Wonderland | 유니버설 원더랜드 | 環球奇蹟 |
| ハリウッド・エリア | Hollywood Area | 할리우드 에리어 | 好萊塢區 |
| ニューヨーク・エリア | New York Area | 뉴욕 에리어 | 紐約區 |
| サンフランシスコ・エリア | San Francisco Area | 샌프란시스코 에리어 | 舊金山區 |
| ジュラシック・パーク | Jurassic Park | 쥬라기 파크 | 侏羅紀公園 |
| アミティ・ビレッジ | Amity Village | 어미티 빌리지 | 艾米堤村 |
| ウォーターワールド | WaterWorld | 水世界 | 水世界 |

URLおよびarea.id（`area-apf4z5` 等）は変更しない。エリア名は表示のみに使用。

---

## 8. Category / Genre Translation Plan

### 実装方式: `categoryLabels` を辞書キー化

`lib/constants.ts` の `categoryLabels` は現在日本語固定。これを `dictionaries.ts` に移行し、`t("category.churro")` 形式で取得する。

### 追加キー（全4言語）

```ts
"category.churro":   { ja: "チュリトス",     en: "Churro",        ko: "추로스",       "zh-TW": "吉拿棒" },
"category.popcorn":  { ja: "ポップコーン",    en: "Popcorn",       ko: "팝콘",         "zh-TW": "爆米花" },
"category.drink":    { ja: "ドリンク",       en: "Drink",         ko: "음료",         "zh-TW": "飲料" },
"category.dessert":  { ja: "スイーツ",       en: "Dessert",       ko: "디저트",        "zh-TW": "甜點" },
"category.burger":   { ja: "バーガー",       en: "Burger",        ko: "버거",         "zh-TW": "漢堡" },
"category.pizza":    { ja: "ピザ",          en: "Pizza",         ko: "피자",         "zh-TW": "披薩" },
"category.chicken":  { ja: "チキン・肉系",    en: "Chicken & Meat", ko: "치킨·육류",    "zh-TW": "炸雞・肉類" },
"category.rice":     { ja: "ライス・カレー",   en: "Rice & Curry",  ko: "라이스·카레",   "zh-TW": "飯・咖哩" },
"category.noodle":   { ja: "麺・パスタ",      en: "Noodle & Pasta", ko: "면·파스타",    "zh-TW": "麵・義大利麵" },
"category.snack":    { ja: "スナック",       en: "Snack",         ko: "스낵",         "zh-TW": "點心" },
"category.kids":     { ja: "キッズ",        en: "Kids",          ko: "키즈",         "zh-TW": "兒童" },
"category.seasonal": { ja: "季節限定",       en: "Seasonal",      ko: "계절 한정",     "zh-TW": "季節限定" },
"category.set":      { ja: "セットメニュー",   en: "Set Menu",      ko: "세트 메뉴",    "zh-TW": "套餐" },
"category.unknown":  { ja: "カテゴリ確認中",  en: "Category TBC",  ko: "카테고리 확인 중", "zh-TW": "類別確認中" },
```

同様に `shopType.*`、`diningType.*` も追加する。

### 影響範囲
- `constants.ts` の `categoryLabels` を参照しているコードは `t("category." + food.category)` 形式に変更が必要
- food.category の値（"churro" 等）は**変更しない**
- `/foods` のフィルターUIも同じキーで翻訳される

---

## 9. Price and Currency Display Plan

### 基本方針
1. **日本円（¥）を正本として必ず表示**
2. ko/zh-TW 設定時は補助通貨を括弧内に追加表示（概算）
3. en 設定時は ¥ のみ（ドル換算は変動が大きく誤解リスク高）
4. 外部API不使用、静的レートで管理
5. 概算表示であることを明示

### 表示フォーマット

| ロケール | ¥1,200 の場合 | 価格未確認の場合 |
|---|---|---|
| ja | ¥1,200 | 価格未確認 |
| en | ¥1,200 | Price not confirmed |
| ko | ¥1,200（약 ₩11,000） | 가격 미확인 |
| zh-TW | ¥1,200（約 NT$250） | 價格未確認 |

### 静的レートの管理

新規ファイル: `lib/currency-rates.ts`

```ts
// 静的為替レート（概算）
// 更新日: 2026-06-16
// 目安: 四半期ごとに見直す
// 免責: あくまで参考値。実際のレートは変動します。

export const currencyRates = {
  KRW: 9.0,   // 1 JPY = 9.0 KRW
  TWD: 0.21,  // 1 JPY = 0.21 TWD
  updatedAt: "2026-06-16"
} as const;

export function convertToKRW(jpy: number): number {
  return Math.round(jpy * currencyRates.KRW / 100) * 100; // 100ウォン単位で丸め
}

export function convertToTWD(jpy: number): number {
  return Math.round(jpy * currencyRates.TWD); // 1NT$単位で丸め
}
```

### 価格表示コンポーネント設計

```tsx
// components/price-display.tsx
export function PriceDisplay({ price, locale }: { price: number | null; locale: Locale }) {
  if (!price) return <span>{t("foods.priceUnknown")}</span>;

  const primary = `¥${price.toLocaleString("ja-JP")}`;

  if (locale === "ko") {
    const krw = convertToKRW(price);
    return <span>{primary}<span className="text-xs font-bold text-slate-400 ml-1">（약 ₩{krw.toLocaleString("ko-KR")}）</span></span>;
  }
  if (locale === "zh-TW") {
    const twd = convertToTWD(price);
    return <span>{primary}<span className="text-xs font-bold text-slate-400 ml-1">（約 NT${twd}）</span></span>;
  }
  return <span>{primary}</span>;
}
```

### 補助通貨の表示スタイル
- フォントサイズ: `text-xs`（主価格より小さく）
- 色: `text-slate-400`（控えめ）
- 主価格と同行に表示（改行なし）
- ツールチップ or footerに「補助通貨は参考値」を明記

### 価格未確認・priceMin/priceMax の扱い
- `price` が null かつ `priceMin`/`priceMax` がある → `¥${priceMin}〜¥${priceMax}` で表示（既存ロジック維持）
- 両方 null → `t("foods.priceUnknown")`
- 補助通貨はrange表示の場合も最大値から換算

### 免責表示
- 価格の変動リスクについて `/about` ページに記載（詳細ページに毎回出すと煩雑）
- KRW/TWD の supplemental display に `"概算"` / `"약"` / `"約"` を必ず接頭

---

## 10. Date Display Plan

### 実装方式: `Intl.DateTimeFormat`

```ts
// lib/format-date.ts
import type { Locale } from "@/lib/i18n/locales";

const localeIntlMap: Record<Locale, string> = {
  ja: "ja-JP",
  en: "en-US",
  ko: "ko-KR",
  "zh-TW": "zh-TW"
};

export function formatDate(dateStr: string | null | undefined, locale: Locale): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(localeIntlMap[locale], {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  } catch {
    return dateStr;
  }
}
```

### ロケール別フォーマット例（`2026-03-09`）

| ロケール | 表示例 |
|---|---|
| ja | 2026年3月9日 |
| en | March 9, 2026 |
| ko | 2026년 3월 9일 |
| zh-TW | 2026年3月9日 |

### 日付未確認・未定の表示
- 日付が null → `t("foodDetail.dateUnknown")` または `t("foodDetail.dateUndecided")`（既存キー）
- 日付フォーマット自体はデータを変更しない（ISO8601 文字列のまま）

### 期間ラベル（salePeriodLabel）
- `food.salePeriodLabel` は日本語文字列（例: "3月9日〜"）
- Phase 1 では翻訳しない（ja 固定で表示、他言語では日付フィールドの formatted date で代替）
- Phase 2 で別途対応検討

---

## 11. User Memo Policy

### 方針: 原文保持・自動翻訳なし

ユーザーが入力した食べた記録のメモは**一切翻訳しない**。

**理由:**
1. メモはユーザーが自分のために書いた主観的なテキスト。言語は問わない
2. 自動翻訳で意図と異なる内容になるリスクが高い（食レポ・感想など）
3. ユーザーが普段書いている言語でそのまま読み返すのが自然

**表示方針:**
- メモテキストはロケールに関わらず原文のまま表示
- メモのラベル（「メモ」「Note」等）はi18nキーで多言語対応
- `lang` 属性は `document.documentElement.lang`（UIのロケール）を維持し、個別テキストへの属性付与なし

**将来の拡張（今回は実装しない）:**
- 「この記録を翻訳する」ボタン: ユーザーが能動的に押した場合のみ外部翻訳APIを呼ぶ
- 言語自動検出してUIに言語名を表示する機能

---

## 12. Generated JSON / Crawler Policy

### 基本方針: 翻訳ファイルを分離・独立管理

| ファイル | 管理者 | 変更可否 |
|---|---|---|
| `scripts/output/foods.generated.json` | crawler（自動生成） | **変更禁止** |
| `scripts/output/translations/food-names.json` | 人間（手動） | ✅変更可 |
| `scripts/output/translations/store-names.json` | 人間（手動） | ✅変更可 |

### 翻訳ファイルの置き場所と理由

`scripts/output/translations/` に置く理由:
- `scripts/output/` は既存のgenerated JSONと同階層で管理者が扱いやすい
- `public/` に置くと翻訳ファイルが外部から直接取得可能になる（不要なデータ公開）
- `lib/` に置くとbundleサイズに影響する可能性がある（量が増えた場合）
- Next.js の `import` でJSONを静的インポートできるため、サーバー側でのルックアップが可能

### 翻訳ファイルのスキーマ（再掲）

```json
// scripts/output/translations/food-names.json
{
  "<food.id>": {
    "en": "<string | null>",
    "ko": "<string | null>",
    "zh-TW": "<string | null>",
    "sources": { "<locale>": "official | human" },
    "verified": "<boolean>",
    "verifiedAt": "<ISO date | undefined>"
  }
}
```

### crawler との共存

- crawlerは `foods.generated.json` のみを更新する
- `translations/food-names.json` はcrawlerがタッチしない
- 新商品がcrawlerで追加されても翻訳ファイルには影響しない（その商品はjaにfallback）
- 商品IDが変わった場合（これは発生しないはず）は翻訳エントリも手動で更新

### データ監査UI（今回は設計のみ）

将来的に管理画面（`/admin`）に翻訳管理UIを追加できる設計:
- 未翻訳商品一覧
- 翻訳候補の提示（公式サイトURLから人間が確認）
- 確認済みにチェックを入れるUI
- 今回のフェーズでは設計のみ、実装なし

---

## 13. Language Switcher UI Plan

### 現状の問題
- 言語切替が `/settings` の深い場所にしかない
- 外国語ユーザー（en/ko/zh-TW）がアプリを開いた際にすぐ言語を変えられない
- 設定画面のURLを知らなければ辿り着けない

### 設計方針

**デスクトップ（md以上）:** ヘッダー右端に言語切替ピルを追加

**モバイル（md未満）:** フローティング言語バッジをヘッダー相当位置に追加

### デスクトップ ヘッダー

現在の `app-header.tsx`:
```tsx
<nav className="flex items-center gap-1">
  {navItems.map(...)} // ← ナビリンク5個
</nav>
```

変更後:
```tsx
<div className="flex items-center gap-3">
  <nav className="flex items-center gap-1">
    {navItems.map(...)}
  </nav>
  <HeaderLanguageSwitcher /> {/* ← 追加 */}
</div>
```

`HeaderLanguageSwitcher` の見た目:
```
Language: JP ▼
```
- ロケールラベル: `{ ja: "JP", en: "EN", ko: "KO", "zh-TW": "TW" }`（短縮形）
- クリックでドロップダウン（4言語）
- 選択すると `setLocale` を呼び localStorage を更新
- スタイル: `text-sm font-black text-slate-500 hover:text-park`、シンプルなテキストボタン

### モバイル

現在、モバイルには固定ヘッダーが存在しない（下部ナビのみ）。

方針: **ページコンテンツ上部の右端**に小さな言語バッジを配置（ページごとではなく `RootLayout` の `main` 直下に挿入）

```tsx
// app/layout.tsx の main 内
<main className="...">
  <div className="flex justify-end md:hidden">
    <MobileLanguageSwitcher />  {/* ← 追加 */}
  </div>
  {children}
</main>
```

`MobileLanguageSwitcher` の見た目:
```
🌐 JP
```
- `Globe2` アイコン（16px）+ 現在のロケール短縮名（`JP`/`EN`/`KO`/`TW`）
- クリックでシートまたはドロップダウン（4言語）
- スタイル: `inline-flex items-center gap-1 text-xs font-black text-slate-400 border border-slate-200 rounded-full px-2 py-1`
- 右端配置（`justify-end`）
- ページコンテンツと被らないように `mb-2` でスペース確保

### settings.languageDescription の更新

現在: 「商品名・店舗名・エリア名は現地で見つけやすいよう日本語のまま表示します」

変更後（Phase 1 実装後）: 「表示言語を選べます。商品名・店舗名・エリア名は公式表記のある場合のみ翻訳して表示します。」

### 初回表示の言語決定

現在の `LocaleProvider` の動作を確認し、以下のロジックを推奨:
1. localStorage `unicolle-locale` がある → 採用
2. ない → `navigator.language` から推定（`ko` → ko、`zh-TW` → zh-TW 等）
3. 推定できない → `ja`

`document.documentElement.lang` は `setLocale` 時に更新する（アクセシビリティ・SEO）。

---

## 14. Bottom Navigation Visibility Fix Plan

### 問題の診断

現在の下部ナビ（`app-header.tsx`）:
```tsx
<nav className="fixed inset-x-4 bottom-[...] z-50 grid grid-cols-5 rounded-[1.55rem] border border-white/80 bg-white/86 p-1 shadow-[...] backdrop-blur-2xl md:hidden">
  {navItems.map((item) => (
    <Link className="... text-slate-600 ..." />
  ))}
</nav>
```

**2つの問題:**

**問題①: アクティブ状態がない**
- 全5項目が同色 `text-slate-600`（#475569）
- 現在地がどこか分からない
- ユーザーには「全部グレーで死んでいる」ように見える（=「暗転」の正体）
- これが最大の視認性問題

**問題②: 背景の半透明とblurの組み合わせ**
- `bg-white/86`（白86%不透明）+ `backdrop-blur-2xl`
- ホームのネイビー背景（`#071b3a`）がblur越しに透けると、白に暗色が混じりナビ全体がくすむ
- `border border-white/80` も完全な白でないため際立ち不足

### 修正方針

**Fix ①: アクティブ状態の追加（必須）**

`usePathname()` で現在ルートを取得し、一致するnavItemをハイライト。

```tsx
const pathname = usePathname();
const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

className={`... ${isActive
  ? "text-park bg-mint" // アクティブ: park色のテキスト + mint背景
  : "text-slate-500 hover:bg-white/70"
}`}
```

デザイン詳細:
- アクティブ: `text-park`（#228855相当）+ `bg-mint`（薄いグリーン）
- 非アクティブ: `text-slate-500`（現在の `text-slate-600` より少し明るく）
- 遷移: `transition-colors duration-150`

**Fix ②: 背景の不透明度強化**

`bg-white/86` → `bg-white/94`（暗い背景コンテンツが透けにくくなる）

**Fix ③: ボーダーの強化**

`border border-white/80` → `border border-slate-200/60`（白より微妙なグレーでナビの輪郭を強調）

**Fix ④: アイコンサイズ微調整**

現在 `size={19}`。アクティブ時のみ `text-park` に変化するため視認性は自動的に向上する。追加の変更不要。

### 修正後の完成形イメージ

```
[ 🏠 ホーム ] [ 🔍 探す ] [✔ 食べた] [ 🌍エリア] [ 🏪 店舗 ]
                                ↑
                        現在地: mint背景 + park色テキスト
```

### Safe Area / iOS Safari / PWA 対応

- `bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]` は維持（iOS Home Indicator 対応）
- `inset-x-4` は維持（左右4px余白でナビが浮いて見える設計）
- PWAでは `env(safe-area-inset-bottom)` が大きくなることがある → 現設計で対応済み

### ホームv1.2の世界観との整合

ホームは `bg-[#071b3a]`（ネイビー）のヒーローセクションから始まる。
- `bg-white/94` + `border-slate-200/60` の下部ナビは、ネイビー背景の上でより明確に白く浮き上がる
- `shadow-[0_16px_42px_rgba(15,23,42,0.16)]` の影は維持（高級感）
- `backdrop-blur-2xl` は維持（ガラスモーフィズムの質感）

---

## 15. Recommended Implementation Phases

### Phase A: 下部ナビ + ヘッダー言語切替（即時実施推奨）

影響範囲: `app-header.tsx` のみ。データ・翻訳ファイルなし。

- 下部ナビにアクティブ状態追加（`usePathname` + `text-park bg-mint`）
- 下部ナビ背景を `bg-white/94` に変更
- デスクトップヘッダーに `HeaderLanguageSwitcher` 追加
- モバイルレイアウトに `MobileLanguageSwitcher` 追加

### Phase B: エリア名 + カテゴリ名多言語化（辞書追加）

影響範囲: `dictionaries.ts` + 関連コンポーネントの `t()` 呼び出し変更。

- `area.name.*` キー追加（全10エリア × 4言語）
- `category.*` / `shopType.*` / `diningType.*` キー追加
- `lib/constants.ts` の hardcoded 日本語ラベルを `t()` 呼び出しに変更

### Phase C: 日付・価格表示の多言語化

影響範囲: `lib/format-date.ts` 新規、`lib/currency-rates.ts` 新規、price 表示コンポーネント変更。

- `formatDate()` 実装
- `PriceDisplay` コンポーネント実装（KRW/TWD 補助表示付き）
- 既存の price 表示箇所（`food-card.tsx`・`food-detail.tsx`・`store-food-list.tsx` 等）を差し替え

### Phase D: 店舗名・商品名翻訳（ファイル新規 + ルックアップ実装）

影響範囲: `translations/` ファイル新規 + `lib/food-translations.ts` + `lib/store-translations.ts`。

- 翻訳ファイルのスキーマ確定・空ファイル作成
- ルックアップ関数実装
- 優先翻訳リスト（公式英語名）の手動入力
- 表示コンポーネントで `getFoodName` / `getStoreName` を使用

---

## 16. Risks

| リスク | 影響 | 対策 |
|---|---|---|
| 翻訳ファイルが大きくなりbundleサイズが増える | パフォーマンス | `scripts/output/translations/` からの静的importは問題なし。量が増えた場合はAPI化を検討 |
| 商品ID変更時に翻訳エントリが孤立 | データ不整合 | foodId は安定しているため低リスク。新規食品は自動fallback（ja表示） |
| 静的レートが大幅にずれた場合 | UX（金額感が実態と乖離） | `"약"` / `"約"` の接頭詞で概算であることを明示。quarterly review を運用ルールに |
| モバイルの言語切替UIがコンテンツと重なる | UX | `mb-2` でスペース確保。ページ最上部に配置し下部ナビとの干渉なし |
| settings.languageDescription の文言変更後に実態と乖離 | 信頼性 | Phase D完了と同時に文言を更新する |
| エリア名翻訳がUSJ公式と異なる | 信頼性 | 公式サイト（usj.co.jp/en）で確認してからdictionariesに追加 |

---

## 17. Stop and Ask Conditions

Codex は以下の条件に当たった場合、実装を止めてレビュー担当に確認すること。

1. `foods.generated.json` または `scripts/output/*.generated.json` を編集しようとした場合
2. `lib/store-utils.ts` の `buildStoresFromFoods` / `resolveStoreDisplayIds` を変更しようとした場合
3. `categoryLabels` を削除しようとした場合（既存コードが参照している可能性あり）
4. 翻訳ファイルに機械翻訳・AI生成コンテンツを自動挿入しようとした場合
5. 価格を JPY から他通貨に**置き換え**（補助ではなく主表示を変更）しようとした場合
6. `document.documentElement.lang` を変更しないまま完了報告した場合
7. 下部ナビのアイテム数（5個）を変更しようとした場合

---

## 18. Verification Plan

### Phase A 検証（下部ナビ + 言語切替UI）

- [ ] `/` アクセス時に下部ナビの「ホーム」が `text-park bg-mint` でハイライトされる
- [ ] `/foods` アクセス時に「探す」がハイライト
- [ ] `/eaten` / `/areas` / `/stores` も同様
- [ ] デスクトップヘッダーに `Language: JP ▼` が表示される
- [ ] クリック → EN に変えると UI テキストが英語に変わる
- [ ] リロード後も言語設定が維持される（localStorage）
- [ ] モバイル（390px）で言語バッジがコンテンツと重ならない
- [ ] ホームv1.2 のネイビー背景上で下部ナビが白く明瞭に見える

### Phase B 検証（エリア名 + カテゴリ名）

- [ ] en設定で `/areas` 一覧のエリア名が英語になる（例: "Super Nintendo World"）
- [ ] ko設定で `/foods` のカテゴリフィルターが韓国語になる
- [ ] ja設定で既存と変わらず日本語表示
- [ ] 翻訳なしエリアが存在する場合は日本語にfallback

### Phase C 検証（日付・価格）

- [ ] en設定で foodDetail の日付が "March 9, 2026" 形式になる
- [ ] ko設定で価格が `¥1,200（약 ₩11,000）` 形式になる
- [ ] zh-TW設定で `¥1,200（約 NT$252）` 形式になる
- [ ] 価格未確認商品で "Price not confirmed" / "가격 미확인" が表示される
- [ ] priceMin/priceMax の range 表示が崩れない

### Phase D 検証（商品名・店舗名）

- [ ] en設定で翻訳済み商品は英語名が表示される
- [ ] en設定で翻訳未済み商品は日本語名が表示される（fallback）
- [ ] 店舗詳細 H1 が en設定で "Hog's Head" になる（翻訳済みの場合）
- [ ] `/stores/shop-1tt48e8-restaurant-122iqw` の URL は変わらない

---

## 19. Recommended Next /goal Direction

### 優先実施: Phase A（下部ナビ + 言語切替UI）

理由:
1. データ変更が一切なく最もリスクが低い
2. 下部ナビのアクティブ状態はUX上の欠落として最も目に見える問題
3. ヘッダーへの言語切替追加で外国語ユーザーのオンボーディングが改善
4. 実装量が少なく検証が容易

**Phase A の /goal ファイル名:** `codex-goal-bottom-nav-and-language-switcher-v1.md`

### Phase B〜D の優先度

- Phase B（エリア名・カテゴリ名）: A完了後すぐに実施可能。辞書追加のみで影響範囲が明確
- Phase C（日付・価格）: 独立実装可能。KRW/TWD の正確なレートを設計者が事前確認してからCodexに渡す
- Phase D（商品名・店舗名）: 翻訳ファイル新規作成が伴うため、スキーマを設計者がレビューしてからCodexに渡す

### 各Phaseの /goal 作成タイミング

今回はすべての /goal をまだ作らない。  
Phase A 設計レビュー完了後に `codex-goal-bottom-nav-and-language-switcher-v1.md` を作成する。
