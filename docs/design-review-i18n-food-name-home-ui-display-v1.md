# Design Review: B8 follow-up「Homeの商品名翻訳 UI反映漏れ修正」

**対象 commit:** 2fa8f27d426611d97815d3f4a27106d3630b20f5a (fix: display translated food names on home rails)  
**レビュー日:** 2026-06-19  
**レビュー担当:** Claude（設計担当 / レビュー担当）

---

## 判定: 承認

---

## 1. スコープ遵守

| 確認項目 | 結果 |
|---|---|
| 変更ファイルが `components/home-progress-client.tsx` のみ | ✅ |
| `data/translations/food-names.json` 変更なし | ✅ |
| `data/translations/store-names.json` 変更なし | ✅ |
| `scripts/output` 変更なし | ✅ |
| generated JSON / DB / crawler 変更なし | ✅ |
| `package.json` 変更なし | ✅ |
| `scripts/check-translation-coverage.ts` 変更なし | ✅ |
| `/eaten` 側コンポーネント変更なし | ✅ |
| `/foods` 側コンポーネント変更なし | ✅ |

---

## 2. getFoodNameI18n 対応確認

### import

| 確認項目 | 実測 | 結果 |
|---|---|---|
| `getFoodNameI18n` が import されている | L16: `import { getFoodNameI18n } from "@/lib/i18n/name-translations";` | ✅ |
| `useLocale` が import されている | L18: `import { useLocale } from "@/lib/i18n/use-locale";` | ✅ |

### コンポーネント別確認

#### HomeCollectionHero（L35–128）

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `locale` を `useLocale()` から取得 | L36: `const { locale, t } = useLocale();` | ✅ |
| `displayName = getFoodNameI18n(food.id, locale, food.name)` | L99: `const displayName = getFoodNameI18n(food.id, locale, food.name);` | ✅ |
| `aria-label` に `displayName` 適用 | L105: `aria-label={displayName}` | ✅ |
| `FoodImage` の `alt` に `displayName` 適用 | L109: `alt={displayName}` | ✅ |
| `href={'/foods/${food.id}'}` — food.id 変更なし | L103: 確認 | ✅ |

#### HomeFoodRailCard（L245–266）

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `locale` を `useLocale()` から取得 | L246: `const { t, locale } = useLocale();` | ✅ |
| `displayName = getFoodNameI18n(food.id, locale, food.name)` | L248: 確認 | ✅ |
| `FoodImage` の `alt` に `displayName` 適用 | L253: `alt={displayName}` | ✅ |
| 商品名テキストに `displayName` 適用 | L256: `{displayName}` | ✅ |
| `href={'/foods/${food.id}'}` — food.id 変更なし | L251: 確認 | ✅ |

#### HomeLimitedCollection（L169–211）

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `locale` を `useLocale()` から取得 | L170: `const { locale, t } = useLocale();` | ✅ |
| `displayName = getFoodNameI18n(food.id, locale, food.name)` | L193: 確認 | ✅ |
| `FoodImage` の `alt` に `displayName` 適用 | L197: `alt={displayName}` | ✅ |
| 商品名テキストに `displayName` 適用 | L204: `{displayName}` | ✅ |
| `href={'/foods/${food.id}'}` — food.id 変更なし | L195: 確認 | ✅ |

#### HomeRecentRecords（L213–243）

| 確認項目 | 実測（行番号） | 結果 |
|---|---|---|
| `locale` を `useLocale()` から取得 | L214: `const { locale, t } = useLocale();` | ✅ |
| `displayName = getFoodNameI18n(food.id, locale, food.name)` | L230: 確認 | ✅ |
| `FoodImage` の `alt` に `displayName` 適用 | L234: `alt={displayName}` | ✅ |
| 商品名テキストに `displayName` 適用 | L236: `{displayName}` | ✅ |
| `href={'/foods/${food.id}'}` — food.id 変更なし | L232: 確認 | ✅ |

#### HomeActiveFoodCollection（L130–167）

このコンポーネント自体は食品名テキストを直接 render せず、`HomeFoodRailCard` に委譲する設計。`const { t } = useLocale()` のみ（locale 不要）で問題なし。`HomeFoodRailCard` 内で `locale` を取得して翻訳する設計が正しい。✅

---

## 3. ロケール挙動の設計妥当性

`getFoodNameI18n(food.id, locale, food.name)` のシグネチャにより:

| ロケール | 翻訳あり | 翻訳なし |
|---|---|---|
| `ja` | 日本語名（food.name）を返す | 日本語名（food.name）を返す |
| `en` / `ko` / `zh-TW` | 翻訳値を返す | 日本語名（food.name）fallback |

設計書の要件「翻訳がある商品だけ翻訳表示、翻訳がない商品は日本語fallback」と一致。✅

---

## 4. URL / food.id

全 4コンポーネントで `href={'/foods/${food.id}'}` を使用しており、food.id は変更なし。遷移先 URL に影響なし。✅

---

## 5. /eaten 側への副作用なし

`home-progress-client.tsx` は Home ページ専用コンポーネントファイル。`/eaten` は `components/eaten-experience.tsx` が担当しており、今回変更なし。

| 確認項目 | 結果 |
|---|---|
| `/eaten` 5列サムネイル仕様への影響なし | ✅ |
| albumMode タブ復活なし | ✅ |
| 最近食べたものセクション復活なし（eaten ページ内） | ✅ |

---

## 6. Coverage（変化なし）

### Food Translation Coverage

| 項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| total | 294 | 294 | ✅ |
| translated | 77 | 77 | ✅ |
| missing | 217 | 217 | ✅ |
| verified | 6 | 6 | ✅ |
| needs_review | 69 | 69 | ✅ |
| orphan | 0 | 0 | ✅ |

### Store Translation Coverage（変化なし）

| 項目 | 期待値 | 実測値 | 結果 |
|---|---|---|---|
| generated_total | 42 | 42 | ✅ |
| translated | 42 | 42 | ✅ |
| missing | 0 | 0 | ✅ |
| display_total | 99 | 99 | ✅ |
| display_translated | 52 | 52 | ✅ |
| display_missing | 47 | 47 | ✅ |
| display_seed | 14 | 14 | ✅ |
| verified | 23 | 23 | ✅ |
| needs_review | 33 | 33 | ✅ |
| orphan | 0 | 0 | ✅ |

---

## 7. 品質保証

| 確認項目 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npm run coverage` | ✅ 成功・期待値全一致 |
| `git status --short` | ✅ clean |
| main / origin/main 同期済み | ✅ |

---

## 8. 総評

`getFoodNameI18n` の適用が必要な 4コンポーネント（`HomeCollectionHero` / `HomeFoodRailCard` / `HomeLimitedCollection` / `HomeRecentRecords`）すべてで、`locale` の取得・`displayName` の計算・alt / aria-label / テキスト表示への適用が一貫して実装されている。food.id・URL は変更なし。翻訳なし商品の日本語 fallback も `getFoodNameI18n` の第3引数 `food.name` で保証されている。/eaten 側・coverage・lint/typecheck/build すべて問題なし。

---

## 証跡

- `components/home-progress-client.tsx` 全504行読み取り済み
- L16: `getFoodNameI18n` import 確認
- L36: `HomeCollectionHero` — `locale` 取得確認
- L99, L105, L109: `HomeCollectionHero` — `displayName` 適用確認
- L246, L248, L253, L256: `HomeFoodRailCard` — `displayName` 適用確認
- L170, L193, L197, L204: `HomeLimitedCollection` — `displayName` 適用確認
- L214, L230, L234, L236: `HomeRecentRecords` — `displayName` 適用確認
- L131: `HomeActiveFoodCollection` — locale 不要（委譲設計）確認
- 実装 commit: `2fa8f27d426611d97815d3f4a27106d3630b20f5a`
