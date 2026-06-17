# Codex Goal: ホームヒーローブランド再設計 v1

## 概要

`components/home-progress-client.tsx` の `HomeCollectionHero` 内タイトルブロックのみを変更する。

- h1 を `{appBrand.shortName}`（「ユニコレ」）から `{appBrand.name}`（「ユニバフードコレクション」）に変更
- h1 の上に `USJ FOOD COLLECTION` の小さな英字 kicker を追加
- gold line を h1 両端から kicker 両端に移動
- tagline は既存の `t("footer.tagline")` を維持

**参照設計書:** `docs/home-hero-brand-redesign-v1.md`

---

## 禁止事項（最優先）

以下は**絶対にやってはいけない**。

- `lib/constants.ts` を変更しない
- `lib/i18n/dictionaries.ts` を変更しない（新規辞書キー追加禁止）
- `app/page.tsx` を変更しない
- `components/home-dashboard.tsx` を変更しない
- `components/app-header.tsx` を変更しない
- `lib/store-utils.ts` を変更しない
- `lib/food-utils.ts` を変更しない
- `lib/i18n/format-price.ts` / `lib/i18n/format-date.ts` / `components/area-urgency-label.tsx` を変更しない
- generated JSON / DB / crawler を変更しない
- `HomeCollectionHero` の棚グリッド（`order-2` ブロック）を変更しない
- `HomeCollectionHero` のコレクション数・プログレスバー（`order-3` ブロック）を変更しない
- `HomeActiveFoodCollection` / `HomeLimitedCollection` / `HomeRecentRecords` を変更しない
- `/en` / `/ko` / `/zh-TW` ルートを追加しない
- 無関係なリファクタ・整形をしない

---

## Git 作業前処理

```bash
git status
```

**未コミット変更がある場合:**
```bash
git add .
git commit -m "backup-before-home-hero-brand-redesign"
git push
```

**未コミット変更がない場合:**
```bash
git commit --allow-empty -m "backup-before-home-hero-brand-redesign"
git push
```

---

## 実装前確認

```bash
# home-unicole-logo の参照箇所を確認する（docs/ / node_modules / .next 除外）
grep -rn "home-unicole-logo" components app lib --include="*.tsx" --include="*.ts" --include="*.css"

# 現在の shortName 使用箇所を確認する
grep -n "appBrand.shortName" components/home-progress-client.tsx

# 現在の name 使用箇所を確認する（0件のはず）
grep -n "appBrand.name" components/home-progress-client.tsx
```

- `components/home-progress-client.tsx` 以外に `home-unicole-logo` の実使用がなければ OK
- globals.css 等にクラス定義だけが残っている場合はブロッカーにしない（削除可）
- `components/` または `app/` 内の別 React コンポーネントで `className` として実使用されている場合のみ停止して確認すること

---

## Step 1: HomeCollectionHero タイトルブロックを変更

`components/home-progress-client.tsx` の `HomeCollectionHero` 内、タイトルブロック（`order-1` div）のみを変更する。

### Before（L44〜L55 付近）

```tsx
<div className="order-1 space-y-1.5 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
  <div className="flex items-center justify-center gap-3 lg:justify-start">
    <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
    <h1
      className="home-unicole-logo select-none text-[1.85rem] font-black leading-none tracking-[0.04em] text-[#071b3a] sm:text-[2rem] lg:text-[2.15rem]"
    >
      {appBrand.shortName}
    </h1>
    <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
  </div>
  <p className="text-[13px] font-bold leading-6 text-slate-500">{t("footer.tagline")}</p>
</div>
```

### After

```tsx
<div className="order-1 space-y-2 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
  {/* kicker: ブランド識別子（全ロケール共通の固定英字） */}
  <div className="flex items-center justify-center gap-2.5 lg:justify-start">
    <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
    <p className="select-none text-[10.5px] font-black tracking-[0.14em] text-[#8a5b16] sm:text-[11px] lg:text-[11.5px]">
      USJ FOOD COLLECTION
    </p>
    <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
  </div>
  {/* main title: 正式アプリ名（全ロケール共通の固定日本語） */}
  <h1 className="select-none text-[1.4rem] font-black leading-[1.2] tracking-[0.02em] text-[#071b3a] sm:text-[1.6rem] lg:text-[1.75rem]">
    {appBrand.name}
  </h1>
  {/* tagline: ロケール別表示（既存キー） */}
  <p className="text-[12px] font-bold leading-6 text-slate-500 sm:text-[13px]">{t("footer.tagline")}</p>
</div>
```

### 変更のポイント

| 変更前 | 変更後 |
|---|---|
| `{appBrand.shortName}` = "ユニコレ" | `{appBrand.name}` = "ユニバフードコレクション" |
| gold line が h1 の両端 | gold line が kicker 両端に移動 |
| kicker なし | "USJ FOOD COLLECTION" を kicker として追加 |
| h1: `text-[1.85rem] ... lg:text-[2.15rem]` | h1: `text-[1.4rem] sm:text-[1.6rem] lg:text-[1.75rem]` |
| `space-y-1.5` | `space-y-2`（3要素に合わせて調整） |
| `home-unicole-logo` クラス | 削除（実装前確認で参照なしを確認してから削除） |

---

## Step 2: 変更確認（grep）

```bash
# appBrand.shortName が HomeCollectionHero から消えていること
grep -n "appBrand.shortName" components/home-progress-client.tsx

# appBrand.name が HomeCollectionHero で使われていること
grep -n "appBrand.name" components/home-progress-client.tsx

# 辞書に home.hero 系の新規キーが追加されていないこと
grep -n '"home\.hero' lib/i18n/dictionaries.ts

# home-unicole-logo の残存確認（docs/ / node_modules / .next 除外）
grep -rn "home-unicole-logo" components app lib --include="*.tsx" --include="*.ts" --include="*.css"
```

**期待結果:**

- `appBrand.shortName` in `home-progress-client.tsx` → `HomeCollectionHero` 内では 0件
- `appBrand.name` in `home-progress-client.tsx` → 1件以上
- `"home\.hero` in `dictionaries.ts` → 0件

---

## Step 3: lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。エラーが出た場合は修正してから次へ進む。

---

## Step 4: スクリーンショット保存

以下のスクリーンショットを `screenshots/` に保存すること。

| ファイル名 | 確認内容 |
|---|---|
| `home-hero-brand-redesign-v1-ja-375.png` | ja設定 375px: h1 が1行に収まっていること |
| `home-hero-brand-redesign-v1-ja-390.png` | ja設定 390px: kicker + h1 + tagline の3要素が上品に表示 |
| `home-hero-brand-redesign-v1-en-390.png` | en設定 390px: kicker・h1 は固定日本語/英語のまま、tagline が英語 |
| `home-hero-brand-redesign-v1-ko-390.png` | ko設定 390px: kicker・h1 は固定のまま、tagline が韓国語 |
| `home-hero-brand-redesign-v1-zh-390.png` | zh-TW設定 390px: kicker・h1 は固定のまま、tagline が繁体字 |
| `home-hero-brand-redesign-v1-ja-1280.png` | ja設定 1280px desktop: 左カラムでタイトルが1行に収まっていること |

---

## Step 5: 動作確認チェックリスト

### タイトル表示

- [ ] ja設定で `USJ FOOD COLLECTION` が gold line 両端付きで表示される
- [ ] ja設定で `ユニバフードコレクション` が h1 として表示される
- [ ] en設定でも `USJ FOOD COLLECTION` が固定表示（変わらない）
- [ ] en設定でも `ユニバフードコレクション` が固定表示（変わらない）
- [ ] ko / zh-TW でも同様に固定表示
- [ ] tagline が ja: `食べた記録が、そのままコレクションになる。` で表示される
- [ ] tagline が en: `Your food log becomes a collection.` で表示される
- [ ] tagline が ko: 韓国語で表示される
- [ ] tagline が zh-TW: 繁体字で表示される

### レイアウト

- [ ] h1 が 390px で 1行に収まる
- [ ] h1 が 375px で 1行に収まる（または最大2行で崩れない）
- [ ] desktop（1280px）で左カラム内にタイトルが収まる
- [ ] gold line が kicker 両端に表示される（h1 の横にない）

### 既存機能保護

- [ ] 棚グリッド（食べた ✓ マーク）が正常表示
- [ ] コレクション数・残り品数・プログレスバーが正常
- [ ] 棚なし状態（未記録時）の `collection.firstBite` 表示が正常
- [ ] `今集められるフード` 大判レールが正常
- [ ] 期間限定コレクションが正常
- [ ] `最近の記録` セクションが正常（記録があれば）
- [ ] bottom-nav アクティブ状態が正常
- [ ] language-switcher が正常
- [ ] /foods / /areas / /stores / /settings が壊れていない
- [ ] overflow: 0
- [ ] clipped: 0
- [ ] 横スクロール: 0

---

## Stop and Ask Conditions

以下の状況になったら作業を停止してレビュー担当に確認すること。

1. `lib/constants.ts` の変更が必要と判断した場合
2. `lib/i18n/dictionaries.ts` に新規キーの追加が必要と判断した場合
3. `home-unicole-logo` が `components/` または `app/` 内の別 React コンポーネントで `className` として実使用されており、削除判断が必要になった場合
4. `HomeCollectionHero` の棚グリッド・統計ブロックを変更しなければならない状況になった場合
5. `components/home-dashboard.tsx` / `components/app-header.tsx` に手を入れる必要が生じた場合
6. h1 が 390px で 1行に収まらず、文字サイズ以外の構造変更が必要になった場合
7. "USJ FOOD COLLECTION" を `t()` 経由にしようとした場合（固定英字文字列のため不要）

---

## Git コミット

```bash
git add .
git commit -m "implement-home-hero-brand-redesign"
git push
```

---

## 変更ファイル一覧

### 変更（1ファイルのみ）

| ファイル | 変更内容 |
|---|---|
| `components/home-progress-client.tsx` | `HomeCollectionHero` タイトルブロックのみ（約8行削除・約12行追加） |

### 変更しないファイル

| ファイル | 理由 |
|---|---|
| `lib/constants.ts` | `appBrand.name` は変更不要（すでに "ユニバフードコレクション"）|
| `lib/i18n/dictionaries.ts` | 新規キー追加不要（固定文字列 + 既存 `footer.tagline` で完結）|
| `app/page.tsx` | Server Component、今回と無関係 |
| `components/home-dashboard.tsx` | 棚・レール・期間限定コレクション保護 |
| `components/app-header.tsx` | bottom-nav / language-switcher 承認済み |
| その他すべて | Phase A〜C 承認済み構成の保護 |
