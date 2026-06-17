# Codex Goal: UI Refresh Phase 1 — 全体 UI 土台更新

**ファイル:** `docs/codex-goal-ui-refresh-phase-1-v1.md`
**ステータス:** Codex 実装待ち
**設計書:** `docs/app-ui-redesign-v1.md`
**リスクレベル:** 低（CSS クラス変更のみ）

---

## 目的

UNICOLLE 全体の背景色・下部ナビ・カード背景を「白・明るい」に統一する。

変更はすべて Tailwind クラス名の置き換えのみ。ロジック・データ・URL・コンポーネント構造は変更しない。

---

## 禁止事項

- ロジックの変更禁止
- コンポーネントの props / interface 変更禁止
- generated JSON・DB・翻訳ファイルの変更禁止
- deploy / 外部通信 / DB / crawler / generated JSON 生成コマンドは禁止
- grep / git diff / npm run lint / npm run typecheck / npm run build は検証目的で実行可
- Vercel deploy や本番反映コマンドは禁止
- テスト runner を追加で実行する必要がある場合は停止して確認
- i18n 関連ファイルへの変更禁止
- このゴールのスコープ外のファイル変更禁止

---

## 変更 1: body 背景色

**ファイル:** `app/globals.css`

**変更前:**
```css
body {
  background: #f8fafc;
  ...
}
```

**変更後:**
```css
body {
  background: #ffffff;
  ...
}
```

**注意:** `background` プロパティの値のみ変更。他の行は変更しない。

---

## 変更 2: 下部ナビゲーション

**ファイル:** `components/app-header.tsx`

**対象:** モバイル用 `<nav>` タグ。`bg-white/94 backdrop-blur-2xl` を含む要素。

**変更内容:**

1. `bg-white/94` → `bg-white`
2. `backdrop-blur-2xl` を削除
3. 影クラスを変更:
   - 変更前: `shadow-[0_16px_42px_rgba(15,23,42,0.16)]`（または類似）
   - 変更後: `shadow-[0_-1px_0_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.08)]`
4. 非アクティブ項目のテキスト色:
   - `text-slate-500` → `text-slate-400`

**確認手順（変更前）:**
```bash
grep -n "backdrop-blur\|bg-white/94\|bg-white\/94" components/app-header.tsx
```

実際のクラス名を確認してから変更すること。クラスが異なる場合は実際のクラス名を使う。

---

## 変更 3: 主要コンポーネントの半透明背景 → 白

以下のファイルで `bg-white/86`、`bg-white/70`、`bg-white/80` を `bg-white` に置き換える。

**置換スコープの原則:**
- 置換対象は、カード・セクション・コンテナの**通常背景クラスのみ**
- `hover:bg-white/70` / `active:bg-white/70` / `group-hover:bg-white/70` などの状態クラスは**原則変更しない**
- バッジ・アイコン背景・小オーバーレイも**変更しない**
- 判断に迷う場合は変更せず、完了報告の「変更しなかった箇所」に記録する

**Stop条件（以下に該当する場合は停止して報告すること）:**
- `bg-white/xx` が多数ファイルに散らばっており、どこまで変更すべきか判断できない場合
- `hover` / `active` / `group-hover` などの状態クラスとの区別が難しい場合
- コンテナ背景ではなく、バッジ・ラベル・オーバーレイ背景に使われている場合
- `app-header.tsx` / `food-card.tsx` / `store-food-list.tsx` 以外のファイル変更が 5 ファイルを超えそうな場合
- ロジック変更や props 変更が必要になった場合

### 3-1. `components/food-card.tsx`

```bash
grep -n "bg-white/" components/food-card.tsx
```

見つかった `bg-white/{数値}` クラスのうち、カード・コンテナ背景のみ `bg-white` に変更。

### 3-2. `components/store-food-list.tsx`

```bash
grep -n "bg-white/" components/store-food-list.tsx
```

`bg-white/60` 等のカード・コンテナ背景を `bg-white` に変更。

**例外:** `bg-white/92` が `<span>` の半透明オーバーレイ（バッジ・ラベル等）に使われている場合は変更しない。食べたい Flag バッジの `bg-white/92` はそのままにする。

### 3-3. その他のコンポーネント

以下のコマンドで対象を洗い出す:

```bash
grep -rn "bg-white/[0-9]" components/ app/ --include="*.tsx" | grep -v "node_modules"
```

同じ判断基準（コンテナ通常背景 → `bg-white` / 状態クラス・バッジ → そのまま）を適用する。5 ファイルを超える場合は Stop 条件を参照すること。

---

## 変更 4: ring の濃度調整

**ファイル:** `components/food-card.tsx`（他にも存在する場合は同様に対応）

`ring-slate-200/55` → `ring-slate-200/70`

```bash
grep -rn "ring-slate-200/" components/ --include="*.tsx"
```

見つかった箇所を `ring-slate-200/70` に変更。

---

## 検証手順

### 1. ファイル変更の確認

```bash
git diff --stat
```

変更ファイルが以下のみであることを確認:
- `app/globals.css`
- `components/app-header.tsx`
- `components/food-card.tsx`
- `components/store-food-list.tsx`（あれば）
- その他 `bg-white/` を含むコンポーネント（スコープ内のみ）

### 2. 変更内容の確認

```bash
git diff
```

ロジック変更・props 変更・import 追加がないことを確認。

### 3. i18n ファイル無変更の確認

```bash
git diff --stat -- "lib/i18n/**" "data/translations/**" "components/i18n-text.tsx"
```

変更ゼロであること。

### 4. lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること（エラーがゼロであること）。既存の警告が新たに増えていないことを確認する。

---

## 完了報告フォーマット

以下を報告すること:

```
## Phase 1 完了報告

### 変更ファイル一覧
- app/globals.css: body background #f8fafc → #ffffff
- components/app-header.tsx: bg-white/94 backdrop-blur-2xl → bg-white、影調整、text-slate-500 → text-slate-400
- components/food-card.tsx: bg-white/86 → bg-white、ring-slate-200/55 → ring-slate-200/70
- （その他変更したファイル）

### 変更した bg-white/xx の件数
- 合計 X 箇所を bg-white に変更

### 変更しなかった bg-white/xx の件数と理由
- 合計 X 箇所を維持
- （例: store-food-list.tsx L43 bg-white/92 — Flag バッジのオーバーレイのため維持）
- （例: food-card.tsx L77 hover:bg-white/70 — 状態クラスのため維持）

### hover / active / badge / overlay として維持した箇所
- （維持した状態クラス・オーバーレイを列挙）

### npm run lint
成功 / 失敗（失敗の場合は内容を記載）

### npm run typecheck
成功 / 失敗（失敗の場合は内容を記載）

### npm run build
成功 / 失敗（失敗の場合は内容を記載）

### i18n / data/translations / generated JSON 無変更確認
git diff --stat -- "lib/i18n/**" "data/translations/**" の出力: （貼り付け）

### 下部ナビ確認
bg-white/94 backdrop-blur-2xl → bg-white に変更済み: YES / NO

### git commit ハッシュ
xxxxxxx

### git diff --stat 出力
（出力を貼る）
```
