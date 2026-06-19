# Codex Goal: UNICOLE デザインカラーシステム Phase 1

**対象ドキュメント:** `docs/unicole-design-color-system-v1.md`  
**フェーズ:** Phase 1 — 濃紺ボタン全廃・進捗バー修正・トークン追加  
**作成日:** 2026-06-19

---

## ミッション概要

UNICOLEの全体カラーを改善する。現在のプライマリCTAボタンはすべて濃紺（`bg-ink` = `#071b3a`）で統一されており、重く・AIっぽい印象になっている。これらをUSJブルー（`bg-park` = `#0057b8`）に変える。あわせて誤って赤色を使っている進捗バーを修正し、カラートークンを2件追加する。

**合計7ファイルの変更。設計書の通りに実装し、それ以外は変えない。**

---

## 禁止事項

- コード変更は下記「変更対象」7ファイルのみ。それ以外は触れない。
- `text-ink` は文字色として正しいので変えない
- `bg-berry` はバッジ（限定・終売）に使われているものは変えない（completion-meter.tsx のプログレスバーのみ修正）
- `data/translations` 変更禁止
- generated JSON 変更禁止
- DB / crawler 変更禁止
- URL構造変更禁止
- コンポーネントの構造・props・ロジックは変えない（クラス文字列のみ変更）
- 新しいコンポーネントを作成しない
- `app-header.tsx` は変えない（ナビ現状維持）
- ヘッダー・下部ナビのクラスは変えない
- Homeカルーセル(`home-progress-client.tsx`)は変えない
- `food-card.tsx`の画像コンテナ・カード構造は変えない

---

## 変更対象ファイルと変更内容

### 1. `tailwind.config.ts`

`colors` に `cream` と `sand` を追加する。他の行は変えない。

**変更前:**
```typescript
colors: {
  ink: "#071b3a",
  park: "#0057b8",
  berry: "#c8102e",
  sun: "#fdbb30",
  mint: "#e8f2ff"
},
```

**変更後:**
```typescript
colors: {
  ink: "#071b3a",
  park: "#0057b8",
  berry: "#c8102e",
  sun: "#fdbb30",
  mint: "#e8f2ff",
  cream: "#fffaf5",
  sand: "#e7dccb"
},
```

---

### 2. `app/globals.css`

`body` の `color` 値を `#071b3a`（ink と一致）に変える。他の行は変えない。

**変更前:**
```css
body {
  margin: 0;
  background: #ffffff;
  color: #18212f;
  ...
}
```

**変更後:**
```css
body {
  margin: 0;
  background: #ffffff;
  color: #071b3a;
  ...
}
```

---

### 3. `components/food-card.tsx`

未食べ状態の「食べた」ボタンの `bg-ink` を `bg-park` に変える。  
食べた後のボタン（`bg-park`）はすでに正しいので変えない。  
ボタン以外の行は変えない。

対象行（現在 L79–83 付近）:

```typescript
className={`inline-flex h-8 items-center justify-center rounded-full text-[11px] font-black transition active:scale-95 ${
  eaten ? "bg-park text-white" : "bg-ink text-white"
}`}
```

**変更後:**
```typescript
className={`inline-flex h-8 items-center justify-center rounded-full text-[11px] font-black transition active:scale-95 ${
  eaten ? "bg-park text-white" : "bg-park text-white"
}`}
```

**注意:** 三項演算子は維持する。eaten/uneaten のクラスが最終的に同一でも構造は保持する。  
または三項演算子を単純化して:
```typescript
className="inline-flex h-8 items-center justify-center rounded-full text-[11px] font-black bg-park text-white transition active:scale-95"
```
どちらでもよいが、`eaten` によるテキスト内容の分岐（`t("foodCard.eatenDone")` / `t("foodCard.markEaten")`）は必ず維持すること。

---

### 4. `components/food-detail.tsx`

未食べ状態の「食べた」ボタンの `bg-ink` を `bg-park` に変える。  
食べた後の `bg-park` はすでに正しいので変えない。  
ボタン以外の行は変えない。

対象行（現在 L142 付近）:

**変更前:**
```typescript
className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-black shadow-sm active:scale-[0.98] ${eaten ? "bg-park text-white" : "bg-ink text-white"}`}
```

**変更後:**
```typescript
className={`inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-black shadow-sm active:scale-[0.98] ${eaten ? "bg-park text-white" : "bg-park text-white"}`}
```

または三項演算子を単純化:
```typescript
className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-black shadow-sm bg-park text-white active:scale-[0.98]"
```

どちらでもよいが、ボタン内のテキスト分岐（`eaten ? t("foodCard.eatenDone") : t("foodCard.markEaten")`）は必ず維持すること。

---

### 5. `components/app-footer.tsx`

「食品を探す」CTAボタンの `bg-ink` を `bg-park` に変える。

対象行（現在 L24 付近）:

**変更前:**
```typescript
<Link href="/foods" className="rounded-full bg-ink px-4 py-2 text-xs font-black text-white active:scale-95">
```

**変更後:**
```typescript
<Link href="/foods" className="rounded-full bg-park px-4 py-2 text-xs font-black text-white active:scale-95">
```

---

### 6. `components/food-grid.tsx`

「もっと見る」ボタンの `bg-ink` を `bg-park` に変える。

対象行（現在 L344 付近）:

**変更前:**
```typescript
className="mx-auto block min-h-12 rounded-lg bg-ink px-6 text-sm font-black text-white"
```

**変更後:**
```typescript
className="mx-auto block min-h-12 rounded-lg bg-park px-6 text-sm font-black text-white"
```

---

### 7. `components/completion-meter.tsx`

進捗バーの `bg-berry`（赤）を `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]`（blue→gold グラデ）に変える。  
他の行は変えない。

対象行（現在 L26 付近）:

**変更前:**
```typescript
<div className="h-full rounded-full bg-berry" style={{ width: `${rate}%` }} />
```

**変更後:**
```typescript
<div className="h-full rounded-full bg-[linear-gradient(90deg,#0057b8,#fdbb30)]" style={{ width: `${rate}%` }} />
```

---

## 実装手順

```
Step 1: tailwind.config.ts を開き、cream と sand トークンを追加する
Step 2: app/globals.css を開き、body の color を #071b3a に変更する
Step 3: components/food-card.tsx を開き、ボタンの bg-ink → bg-park を変更する
Step 4: components/food-detail.tsx を開き、ボタンの bg-ink → bg-park を変更する
Step 5: components/app-footer.tsx を開き、CTAボタンの bg-ink → bg-park を変更する
Step 6: components/food-grid.tsx を開き、「もっと見る」ボタンの bg-ink → bg-park を変更する
Step 7: components/completion-meter.tsx を開き、進捗バーの bg-berry → グラデに変更する
Step 8: git diff --staged で変更がこの7ファイルのみであることを確認する
Step 9: npm run lint を実行し、成功を確認する
Step 10: npm run typecheck を実行し、成功を確認する
Step 11: npm run build を実行し、成功を確認する
Step 12: npm run coverage を実行し、Food/Store Coverage が期待値から変化していないことを確認する
Step 13: git add -p でファイルを個別確認しながらステージ（git add . は禁止）
Step 14: git commit -m "feat: apply USJ blue color system phase 1" でコミットする
Step 15: git push origin main を実行する
Step 16: git status --short が clean であることを確認する
Step 17: 完了報告を行う
```

---

## Coverage 期待値（変化なし）

### Food Translation Coverage
- total: 294
- translated: 77
- missing: 217
- verified: 6
- needs_review: 69
- orphan: 0

### Store Translation Coverage
- generated_total: 42
- translated: 42
- missing: 0
- display_total: 99
- display_translated: 52
- display_missing: 47
- display_seed: 14
- verified: 23
- needs_review: 33
- orphan: 0

---

## 完了報告フォーマット

以下をすべて報告すること:

1. commit hash
2. commit message
3. 変更ファイル一覧（7件の全ファイル名）
4. tailwind.config.ts の変更内容（追加したトークン名と値）
5. app/globals.css の変更内容（変更前後のcolor値）
6. food-card.tsx の変更内容（変更前後のクラス）
7. food-detail.tsx の変更内容（変更前後のクラス）
8. app-footer.tsx の変更内容（変更前後のクラス）
9. food-grid.tsx の変更内容（変更前後のクラス）
10. completion-meter.tsx の変更内容（変更前後のクラス）
11. npm run lint の結果
12. npm run typecheck の結果
13. npm run build の結果
14. npm run coverage の結果
15. Food Coverage: total / translated / missing / orphan
16. Store Coverage: generated_total / translated / display_total / display_translated
17. git status --short の結果
18. 変更した箇所以外で意図せず変わった箇所があれば報告

---

## Stop and Ask 条件

以下のいずれかに該当する場合は、実装を止めてユーザーに確認すること:

1. **7ファイル以外に変更が発生しようとしている** — 止めて報告する
2. **`text-ink` を削除・変更しようとしている** — 文字色としては正しいので変えない
3. **`bg-berry` をバッジ（food-card.tsx, food-detail.tsx, food-grid.tsx）から削除しようとしている** — バッジ用途は正しいので変えない
4. **app-header.tsx に変更が発生しようとしている** — 止めて報告する
5. **home-progress-client.tsx に変更が発生しようとしている** — 止めて報告する
6. **eaten-experience.tsx に変更が発生しようとしている** — Phase 2以降なので今回は触らない
7. **npm run lint / typecheck / build のいずれかが失敗した** — 止めて原因を報告する
8. **npm run coverage で Coverage 値が期待値から変化した** — 止めて報告する
9. **git add . を実行しようとしている** — 禁止。git add -p で個別確認すること
10. **データファイル（data/translations, foods.generated.json 等）に変更が発生した** — 即座に止めて報告する
