# Design Review: B1+B7「商品名・店舗名多言語化 土台構築」v1

**レビュー対象 commit:** 7092bc7 (`implement-i18n-name-translation-foundation`)
**バックアップ commit:** be27cc8
**レビュー日:** 2026-06-17
**判定:** ✅ **承認**

---

## 検証対象

| ファイル | 検証方法 |
|---|---|
| `data/translations/food-names.json` | 実読取 |
| `data/translations/store-names.json` | 実読取 |
| `lib/i18n/name-translations.ts` | 実読取 |
| `scripts/check-translation-coverage.ts` | 実読取 |
| `tsconfig.json` | `@/*` パス・`resolveJsonModule` 実確認 |
| `scripts/output/foods.generated.json` | 先頭構造・`foods` キー・件数確認 |
| `scripts/output/shops.generated.json` | 先頭構造（flat array）確認 |
| `lib/i18n/locales.ts` | `Locale` 型定義確認 |

---

## 1. スコープ遵守 ✅

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| `food-names.json` が `{}` のみ | ✅ | L1: `{}` — 翻訳 seed なし |
| `store-names.json` が `{}` のみ | ✅ | L1: `{}` — 翻訳 seed なし |
| 機械翻訳を追加していない | ✅ | |
| `scripts/output/` を変更していない | ✅ | `foods.generated.json` / `shops.generated.json` は読み取りのみ |
| DB / crawler 未変更 | ✅ | |
| URL 構造未変更 | ✅ | |
| localStorage schema 未変更 | ✅ | |
| `food.id` / `shop.id` 未変更 | ✅ | |
| `types/domain.ts` 未変更 | ✅ | |
| `lib/food-utils.ts` 未変更 | ✅ | |
| `lib/store-utils.ts` 未変更 | ✅ | |
| `lib/constants.ts` 未変更 | ✅ | |
| `lib/i18n/dictionaries.ts` に商品名・店舗名を追加していない | ✅ | |
| 既存 UI コンポーネント未変更 | ✅ | |
| `/foods` `/stores` `/areas` `/eaten` の表示を変更していない | ✅ | Codex 報告・表示確認一致 |
| `tsconfig.json` 未変更 | ✅ | 既存 `@/*` → `./*` + `resolveJsonModule: true` で対応可能と正しく判断 |

---

## 2. ヘルパー実装確認 ✅

実装コード（`lib/i18n/name-translations.ts`）:

```ts
import foodNamesRaw from "@/data/translations/food-names.json";
import storeNamesRaw from "@/data/translations/store-names.json";
import type { Locale } from "@/lib/i18n/locales";

type TranslatedLocale = Exclude<Locale, "ja">;
type NameEntry = Partial<Record<TranslatedLocale, string>>;

const foodNames = foodNamesRaw as Record<string, NameEntry>;
const storeNames = storeNamesRaw as Record<string, NameEntry>;

function getTranslatedName(
  source: Record<string, NameEntry>,
  id: string,
  locale: Locale,
  fallback: string
): string {
  if (locale === "ja") return fallback;
  const translated = source[id]?.[locale];
  return translated && translated.trim().length > 0 ? translated : fallback;
}

export function getFoodNameI18n(foodId: string, locale: Locale, fallback: string): string {
  return getTranslatedName(foodNames, foodId, locale, fallback);
}

export function getShopNameI18n(shopId: string, locale: Locale, fallback: string): string {
  return getTranslatedName(storeNames, shopId, locale, fallback);
}
```

| 確認項目 | 判定 | 詳細 |
|---|---|---|
| `locale === "ja"` → 必ず fallback を返す | ✅ | L17: `if (locale === "ja") return fallback;` |
| エントリ不在 → fallback を返す | ✅ | `source[id]?.[locale]` が `undefined` → falsy → fallback |
| エントリあり・対象 locale なし → fallback を返す | ✅ | 同上 |
| 空文字列 `""` → fallback を返す | ✅ | 設計仕様の `?? fallback` より安全。`translated.trim().length > 0` で空文字を排除 |
| `Locale` 型を `@/lib/i18n/locales` から import | ✅ | L3。`"ja" | "en" | "ko" | "zh-TW"` の union 型 |
| `TranslatedLocale = Exclude<Locale, "ja">` | ✅ | L5。型安全 |
| `NameEntry` が `Partial<Record<TranslatedLocale, string>>` | ✅ | L6。ja キーが型レベルで存在しない |
| JSON import が `@/` エイリアスで通る | ✅ | `tsconfig.json` の `@/*` → `./*` + `resolveJsonModule: true` で解決 |
| `getFoodNameI18n` / `getShopNameI18n` が個別 export | ✅ | L22, L26 |
| 内部実装が `getTranslatedName` に集約されている | ✅ | DRY。将来の変更が一箇所 |

**設計仕様との差分（ポジティブな改善）:**
- 設計: `?? fallback`（nullish coalescing のみ）
- 実装: `translated && translated.trim().length > 0 ? translated : fallback`
- 評価: ✅ 空文字も fallback に倒す。安全性が高い

---

## 3. 監査スクリプト確認 ✅

### generated JSON 構造との整合

| ファイル | 実際の構造 | スクリプトの扱い | 判定 |
|---|---|---|---|
| `foods.generated.json` | `{ generatedAt, summary, foods: [...] }` — オブジェクトラッパー | `collectionKey = "foods"` → `raw["foods"]` で配列取得 | ✅ |
| `shops.generated.json` | `[{...}]` — flat array | `collectionKey = undefined` → `raw` をそのまま配列として使用 | ✅ |

`total: 294` の内訳: `foods.generated.json` の `foods` 配列の全件数と一致。`approved: 235` ではなく全 294 件を対象にしている（翻訳カバレッジは全商品で管理するのが正しい）✅

### カウント定義確認

| カウント | 実装 | 定義適合 | 判定 |
|---|---|---|---|
| `total` | `generatedIds.length` | generated JSON 側の総件数 | ✅ |
| `translated` | `hasAnyTranslation(translations[id])` で en/ko/zh-TW のいずれかがある件数 | ✅ |
| `missing` | `!hasAnyTranslation` の件数 | generated 側にあるが翻訳なし | ✅ |
| `verified` | `_status === "verified"` のエントリ数 | ✅ |
| `needs_review` | `_status === "needs_review"` のエントリ数 | ✅ |
| `orphan` | `Object.keys(translations).filter(id => !generatedIdSet.has(id)).length` | 翻訳側にあるが generated 側にないID | ✅ |

### 読み取り専用確認

- `readJson` が `fs.readFileSync` のみ → 書き込み操作なし ✅
- `readGeneratedIds` / `readTranslations` が読み取りのみ ✅
- `countCoverage` がカウント計算のみ ✅
- `printCoverage` が `console.log` のみ ✅
- ファイルへの書き込み一切なし ✅

### 初期空 JSON の出力確認

```
Food Translation Coverage
total: 294 / translated: 0 / missing: 294 / verified: 0 / needs_review: 0 / orphan: 0

Store Translation Coverage
total: 42 / translated: 0 / missing: 42 / verified: 0 / needs_review: 0 / orphan: 0
```

- `total = missing` → 翻訳 seed ゼロの初期状態として正しい ✅
- `orphan = 0` → 翻訳 JSON が空のため当然 ✅
- Codex 報告の数値と一致 ✅

---

## 4. 軽微な実装の注意点（承認に影響しない）

### `countCoverage` 内の dead code

```ts
Object.entries(translations).forEach(([id, entry]) => {
  if (entry._status === "verified") verified += 1;
  if (entry._status === "needs_review") needs_review += 1;
  if (!generatedIdSet.has(id)) return;  // ← ここ以降に処理なし
});
```

L76 の `return` は、それ以降にループ本体の処理がないため dead statement。意図は「orphan エントリのループを早期終了する」だが、`verified` / `needs_review` のカウントは L74〜L75 で既に行われているため、orphan エントリのステータスも `verified` / `needs_review` のカウントに含まれる。

**動作への影響:** 現在は翻訳 JSON が空なので無関係。将来的に翻訳を追加した場合、orphan エントリの `_status` も `verified` / `needs_review` にカウントされる（例: orphan 1件が `verified` → `verified` が 1 増える）。これは管理上許容可能な動作。修正が必要な場合は次回対象フェーズで対応可。

---

## 5. Fallback 動作確認 ✅

| 呼び出し | 期待値 | 実績 |
|---|---|---|
| `getFoodNameI18n("missing-id", "en", "テスト商品")` | `"テスト商品"` | ✅ |
| `getFoodNameI18n("missing-id", "ja", "テスト商品")` | `"テスト商品"` | ✅ |
| `getShopNameI18n("missing-id", "en", "テスト店舗")` | `"テスト店舗"` | ✅ |
| `getShopNameI18n("missing-id", "ja", "テスト店舗")` | `"テスト店舗"` | ✅ |

---

## 6. ビルド確認 ✅

| 確認 | 結果 |
|---|---|
| `npm run lint` | ✅ 成功 |
| `npm run typecheck` | ✅ 成功 |
| `npm run build` | ✅ 成功 |
| `npx ts-node scripts/check-translation-coverage.ts` | ✅ 成功（tsx はIPC制限により失敗、ts-node で代替） |

---

## 7. 表示・既存機能保護確認 ✅

| 確認項目 | 判定 |
|---|---|
| `/` 表示変更なし | ✅ |
| `/foods` 表示変更なし・商品名は日本語のまま | ✅ |
| `/stores` 表示変更なし・店舗名は日本語のまま | ✅ |
| `/settings` 表示変更なし | ✅ |
| i18n Phase B（エリア名・カテゴリ名） | ✅ 未変更 |
| i18n Phase C（価格・販売ラベル） | ✅ 未変更 |
| Home Phase D（ホーム固定ラベル） | ✅ 未変更 |
| Home Phase C+（ホーム価格・販売ラベル） | ✅ 未変更 |
| 店舗ID衝突修正 v1.1（`lib/store-utils.ts`）| ✅ 未変更 |
| generated JSON / DB / crawler | ✅ 未変更 |
| overflow 0 / clipped 0 / 横スクロールなし | ✅ Codex 報告一致 |

---

## 判定

**承認**

スコープ遵守・fallback 安全性・JSON 読み取り専用・ビルド成功のすべてにおいて要件を満たしている。

設計仕様の `?? fallback` より安全な `trim().length > 0` チェックを採用した点はポジティブな改善。`foods.generated.json` のラッパー構造（`{ foods: [...] }`）を正しく処理している点は特に良い判断。

---

## 申し送り

1. **次フェーズ（B2）**: `store-names.json` に 42 件の店舗名翻訳を seed する。公式 URL スラッグから英語名を取得し `"en"` のみ `provisional` として追加するのが安全な出発点
2. **`countCoverage` の dead code（L76 `return`）**: 機能影響なし。B7 の修正フェーズ or 監査スクリプト更新時に合わせて修正してよい
3. **`txs` 実行制限**: Codex sandbox の IPC 制限で `npx tsx` が失敗。`ts-node` で代替可能。CI 環境での実行方法として `ts-node` を採用する
4. **`total: 294` の扱い**: `approved: 235` ではなく全 294 件を翻訳追跡対象とする現在の設計は正しい（廃番前の商品も翻訳管理対象として残す）
