# Codex Goal: UI Refresh Phase 3 — 食べ物画像表示ルール統一

**ファイル:** `docs/codex-goal-ui-refresh-phase-3-v1.md`
**ステータス:** Codex 実装待ち
**設計書:** `docs/app-ui-redesign-v1.md` Section 4, 5
**リスクレベル:** 中（FoodImage 共有コンポーネントへの変更）
**前提:** Phase 1 完了済み。Phase 2 とは独立して実施可能。

---

## 目的

1. `FoodImage` コンポーネントに `variant` prop を追加し、画像表示ポリシーを呼び出し元から制御できるようにする
2. フードカード・フード詳細での画像を「食べ物全体が見える」表示に変更する
3. フードカードの固定高さを廃止し、`aspect-[4/3]` の自然なレイアウトに変更する

---

## 禁止事項

- FoodImage の既存動作（`variant` 未指定時）を変更禁止（後方互換必須）
- ロジック・データ・URL の変更禁止
- i18n ファイルへの変更禁止
- generated JSON・DB・翻訳ファイルの変更禁止
- このゴールのスコープ外のファイル変更禁止

---

## タスク A: FoodImage に variant prop を追加

**ファイル:** `components/food-image.tsx`

### A-1. 実装前の確認

```bash
cat components/food-image.tsx
grep -rn "FoodImage" components/ app/ --include="*.tsx"
```

`FoodImage` の全呼び出し箇所を確認してから変更する。

### A-2. variant 型の定義

```tsx
export type FoodImageVariant = "cover" | "contain" | "card";
```

| variant | 実画像のクラス | プレースホルダーのクラス | 用途 |
|---|---|---|---|
| `"cover"` | `object-cover object-center` | `object-cover object-center` | ホーム rail、recent、店舗リスト等の小サムネ |
| `"contain"` | `object-contain bg-white` | `object-contain p-4` | フードカード、詳細、コレクション棚 |
| `"card"`（デフォルト） | 現状と同じ（`object-cover`） | 現状と同じ（`object-contain p-6`） | 後方互換。`variant` 未指定時はこれを使う |

### A-3. FoodImage の変更

現状の `FoodImage` は `className` prop を受け取る形（または受け取らない形）になっている。実際のコードを確認してから以下の変更を行う。

**変更内容:**

1. `variant` prop を `FoodImageVariant` 型で追加（デフォルト: `"card"`）
2. variant に応じて内部クラスを切り替える

**変更後の型定義（例）:**

```tsx
type Props = {
  food: FoodWithRelations;  // 実際の型名に合わせる
  alt?: string;
  className?: string;
  variant?: FoodImageVariant;
};
```

**内部ロジック（例）:**

```tsx
function getImageClasses(variant: FoodImageVariant, isPlaceholder: boolean): string {
  switch (variant) {
    case "cover":
      return "object-cover object-center";
    case "contain":
      return isPlaceholder ? "object-contain p-4" : "object-contain bg-white";
    case "card":
    default:
      return isPlaceholder ? "object-contain p-6" : "object-cover";
  }
}
```

**注意:** 実際の `food-image.tsx` の実装（`isPlaceholder` の判定ロジック、`<img>` タグの構造等）に合わせて実装すること。上記は概略であり、実際のコードに追従すること。

---

## タスク B: フードカードの画像表示変更

**ファイル:** `components/food-card.tsx`

### B-1. 実装前の確認

```bash
cat components/food-card.tsx
```

現在の固定高さ、画像エリアのクラス、`FoodImage` の呼び出し箇所を確認する。

### B-2. 変更内容

**画像エリア:**

変更前（現状の固定高さ）:
```tsx
<div className="relative h-[252px] overflow-hidden ...">
  <FoodImage food={food} alt={food.name} className="h-full w-full ..." />
```

変更後（aspect-ratio ベース）:
```tsx
<div className="relative aspect-[4/3] overflow-hidden ...">
  <FoodImage food={food} alt={food.name} className="h-full w-full ..." variant="contain" />
```

**カード全体の固定高さ廃止:**

変更前:
```tsx
<article className="... h-[462px] ...">
```

変更後:
```tsx
<article className="... min-h-0 ...">
```

`h-[462px]` を削除し `min-h-0` を追加する（または単純に `h-[462px]` を削除するだけで十分な場合はそうする。実際のレイアウトを確認して判断する）。

### B-3. eaten button の位置確認

フードカード下部の「食べた」ボタンが `absolute` 配置の場合、カード固定高廃止後にレイアウトが崩れる可能性がある。

確認:
```bash
grep -n "eaten\|absolute\|h-\[50px\]\|bottom-" components/food-card.tsx
```

`absolute bottom-0` などのボタン配置がある場合、カード高さ廃止後でもボタンが正しく表示されるよう調整する。

**安全な対処:** eaten button を `absolute` から通常フロー（`flex flex-col` の末尾要素）に変更する。または `sticky bottom-0` にする。

---

## タスク C: フード詳細ページの画像表示変更

**ファイル:** `app/foods/[id]/page.tsx` または `components/food-detail.tsx`

### C-1. 確認

```bash
find app/foods -name "*.tsx" | xargs grep -l "FoodImage"
find components -name "food-detail*"
```

フード詳細ページで `FoodImage` を使っている箇所を特定する。

### C-2. 変更

詳細ページのメイン画像に `variant="contain"` を追加する:

```tsx
<FoodImage food={food} alt={food.name} className="h-full w-full ..." variant="contain" />
```

---

## タスク D: 店舗リスト画像（変更しない）

`components/store-food-list.tsx` の `FoodImage` は `variant` 未指定のまま（デフォルト `"card"` = 現状維持）にする。

Phase 3 では店舗リストの画像は変更しない。

---

## 変更対象ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `components/food-image.tsx` | `variant` prop 追加（後方互換必須）|
| `components/food-card.tsx` | `aspect-[4/3]` 化、`h-[462px]` 廃止、`variant="contain"` 適用 |
| `app/foods/[id]/page.tsx` または food-detail 系 | `variant="contain"` 追加 |

---

## 検証手順

### 1. 後方互換確認

```bash
grep -rn "FoodImage" components/ app/ --include="*.tsx"
```

`variant` prop を指定していない既存の呼び出しがすべて残っていること。後方互換が壊れていないこと。

### 2. food-image.tsx の変更確認

```bash
git diff components/food-image.tsx
```

- `variant` prop が追加されている
- デフォルト値 `"card"` が設定されている
- 既存の `"card"` 動作が変わっていない

### 3. food-card.tsx の変更確認

```bash
git diff components/food-card.tsx
```

- `h-[462px]` が削除されている
- `aspect-[4/3]` が追加されている
- `variant="contain"` が `FoodImage` に渡されている
- eaten button のレイアウトが壊れていない

### 4. TypeScript 型確認

```bash
npx tsc --noEmit 2>&1 | head -30
```

型エラーがないこと（既存のエラーは無視してよい）。

### 5. i18n ファイル無変更確認

```bash
git diff --stat -- "lib/i18n/**" "data/translations/**"
```

変更ゼロであること。

---

## 完了報告フォーマット

```
## Phase 3 完了報告

### タスク A: FoodImage variant prop
- variant 型: FoodImageVariant = "cover" | "contain" | "card"
- デフォルト: "card"（後方互換OK）
- 後方互換: 既存の呼び出し変更なし

### タスク B: food-card.tsx
- h-[462px] 削除: YES
- aspect-[4/3] 追加: YES
- variant="contain" 追加: YES
- eaten button レイアウト: 正常

### タスク C: フード詳細
- 対象ファイル: （特定したファイル名）
- variant="contain" 追加: YES

### タスク D: store-food-list.tsx
- 変更なし: 確認済み

### git commit ハッシュ
xxxxxxx

### TypeScript エラー
なし / あり（内容: ）

### git diff --stat 出力
（貼り付け）
```
